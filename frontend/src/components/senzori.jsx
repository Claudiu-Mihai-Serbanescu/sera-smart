// src/pages/senzori.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import SensorCard from "../components/sensor-card";
import ModalSenzor from "../components/sensor-card/modal-senzor";
import { META, calculatePlantHealthPercent, pickTopSensors, pickTopSensors24h } from "../utils/use-sensor-data";
import { useWindowSize } from "../hooks/use-window-size";
import styles from "../components/sensor-card/styles.module.css";
import { useGreenhouse } from "../components/GreenhouseContext";
import { apiLatest } from "../lib/sensorsApi";
const REFRESH_MS = Math.max(1000, Number(import.meta.env.VITE_REFRESH_MS || 10000));
/* helpers UI */
function getAdvice(key, v) {
  if (v === undefined || v === null || Number.isNaN(Number(v))) return "";
  const n = Number(v);
  switch (key) {
    case "temp":
      if (n >= 28 && n <= 35) return "Temperatura e în intervalul optim.";
      if (n < 28) return "Prea rece: crește încălzirea sau izolația; redu curenții de aer.";
      return "Prea cald: pornește ventilarea/umbrește; crește circulația aerului.";
    case "humi_air":
      if (n >= 60 && n <= 85) return "Umiditatea aerului e bună.";
      if (n < 60) return "Aerul e uscat: adaugă umidificare sau micșorează ventilarea.";
      return "Prea umed: crește ventilarea și evită supra-udarea.";
    case "light":
      if (n >= 5000 && n <= 20000) return "Iluminarea e adecvată.";
      if (n < 5000) return "Lumina e slabă: apropie sursa sau crește durata.";
      return "Lumina e prea puternică: folosește umbrire/difuzie.";
    case "water_level":
      if (n >= 40 && n <= 90) return "Rezervorul are nivel potrivit.";
      if (n < 40) return "Rezervor scăzut: completează apa.";
      return "Nivel foarte ridicat: verifică preaplinul/senzorul.";
    case "air_quality":
      if (n <= 1000) return "Calitatea aerului e bună.";
      if (n <= 1500) return "Ventilează periodic pentru a îmbunătăți calitatea aerului.";
      return "Calitate slabă: pornește ventilarea continuă și verifică circulația aerului.";
    case "humi_soil1":
    case "humi_soil2":
    case "humi_soil3":
    case "humi_soil4":
      if (n >= 40 && n <= 70) return "Solul e udat corect.";
      if (n < 40) return "Sol uscat: programează udare sau mărește durata.";
      return "Sol prea umed: reduce frecvența udărilor și verifică drenajul.";
    default:
      return "";
  }
}
function fmtValue(val, unit = "") {
  if (val === undefined || val === null || val === "") return "—";
  const n = Number(val);
  return Number.isFinite(n) ? `${n}${unit}` : `${val}${unit}`;
}
function normalizeLatest(row = {}) {
  const luxRaw = Number(row.ILUMINARE);
  const luxClamped = Number.isFinite(luxRaw) ? Math.min(Math.max(luxRaw, 1), 130000) : undefined;
  return {
    temp: row.TEMPAER,
    humi_air: row.UMDTAER,
    humi_soil1: row.UMDTSOL1,
    humi_soil2: row.UMDTSOL2,
    humi_soil3: row.UMDTSOL3,
    humi_soil4: row.UMDTSOL4,
    light: luxClamped,
    water_level: row.NIVELAPA,
    air_quality: row.CALITAER,
  };
}

export default function Senzori({ boardId: boardIdProp }) {
  const { width } = useWindowSize();
  const { boardId: ctxBoardId } = useGreenhouse();
  const boardId = boardIdProp || ctxBoardId || import.meta.env.VITE_BOARD_ID || "";

  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [top, setTop] = useState([]);
  const reqCounter = useRef(0);

  // fetch live
  useEffect(() => {
    if (!boardId) return;
    let intervalId;
    const fetchLatest = async () => {
      const myReq = ++reqCounter.current;
      setLoading(true);
      setError(null);
      try {
        const payload = await apiLatest(boardId);
        if (myReq === reqCounter.current) setRow(payload);
      } catch (e) {
        if (myReq === reqCounter.current) setError(String(e?.message || e));
      } finally {
        if (myReq === reqCounter.current) setLoading(false);
      }
    };
    fetchLatest();
    intervalId = setInterval(fetchLatest, REFRESH_MS);
    return () => clearInterval(intervalId);
  }, [boardId]);

  // derivate
  const normalized = useMemo(() => normalizeLatest(row || {}), [row]);
  const wanted = width > 600 ? 5 : 3;
  const healthPct = useMemo(() => (row ? calculatePlantHealthPercent(normalized) : 0), [row, normalized]);
  const healthHelper =
    healthPct >= 95
      ? "Plantele sunt în cele mai bune condiții."
      : healthPct >= 80
      ? "În general e bine; câteva valori pot fi optimizate."
      : healthPct >= 60
      ? "Mai multe valori sunt în afara intervalelor recomandate."
      : "Condiții slabe – vezi problemele principale de mai jos.";

  const snapshotTop = useMemo(() => pickTopSensors(normalized, wanted), [normalized, wanted]);

  // 1) afișează instant snapshot
  useEffect(() => {
    setTop(snapshotTop);
  }, [snapshotTop]);

  // 2) încarcă 24h după paint (concurență mică + cache + timeout în util)
  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        const ranked24h = await pickTopSensors24h(boardId, normalized, wanted);
        if (alive && ranked24h?.length) setTop(ranked24h);
      } catch {}
    };
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(run, { timeout: 1200 });
      return () => {
        alive = false;
        window.cancelIdleCallback?.(id);
      };
    } else {
      const id = setTimeout(run, 0);
      return () => {
        alive = false;
        clearTimeout(id);
      };
    }
  }, [boardId, wanted]); // nu re-porni la fiecare tick live

  // UI states
  const noBoard = !boardId;
  const showLoading = boardId && loading && !row;
  const showNoData = boardId && !loading && !row;

  let content = null;
  if (noBoard) {
    content = (
      <div style={{ padding: 20, textAlign: "center" }}>
        Lipsă <code>boardId</code> (selectează o seră sau setează <code>VITE_BOARD_ID</code>).
      </div>
    );
  } else if (showLoading) {
    content = <div style={{ padding: 20, textAlign: "center" }}>Se încarcă…</div>;
  } else if (showNoData) {
    content = <div style={{ padding: 20, textAlign: "center" }}>{error ? `Eroare: ${error}` : "Nu există date."}</div>;
  } else {
    const cards = [
      {
        key: "health",
        icon: "bi-heart-pulse",
        label: "Sănătatea plantelor",
        value: `${healthPct}%`,
        helper: healthHelper,
        status: healthPct >= 85 ? "healthy" : healthPct >= 60 ? "warning" : "danger",
        highlight: true,
      },
      ...top.map((s) => {
        const meta = META[s.key] || { label: s.key, unit: "", icon: "bi-question-circle" };
        const val = normalized[s.key];
        return {
          key: s.key,
          icon: meta.icon,
          label: meta.label,
          value: fmtValue(val, meta.unit),
          helper: getAdvice(s.key, val),
          status: s.status || "healthy",
          highlight: false,
        };
      }),
    ];

    content = (
      <>
        {error && <div style={{ padding: "8px 12px", marginBottom: 10, textAlign: "center", color: "#b00020" }}>{error}</div>}
        <div className={styles.grid}>
          {cards.map(({ key, ...rest }) => (
            <SensorCard key={key} {...rest} onClick={key === "health" ? undefined : () => setSelected({ key, ...rest })} />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      {content}
      {selected && <ModalSenzor senzor={selected} boardId={boardId} onClose={() => setSelected(null)} />}
    </>
  );
}
