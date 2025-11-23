// src/pages/Statistici.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import SensorCard from "../components/statistici/sensors/SensorCard";
import ModalSenzor from "../components/sensor-card/modal-senzor";
import AcumulatoriTab from "../components/statistici/actuators/AcumulatoriTab";
import AutomatizariSimple from "../components/statistici/automations/AutomatizariSimple";
import useWindowWidth from "../hooks/useWindowWidth";
import "./StatisticiPage.css";
import SeraPicker from "../components/SeraPicker";
import useSeraSelection from "../hooks/useSeraSelection";
import { apiLatest as fetchLatest } from "../lib/sensorsApi";

/* ===== Config ===== */
const REFRESH_MS = Math.max(1000, Number(import.meta.env.VITE_REFRESH_MS || 10000));

/* 1 reală + 2 mock (mock-urile sunt suportate în sensorsApi.js) */
const GREENHOUSES = [
  { id: "spanac", name: "Sera Spanac", boardId: "e663ac91d3824a2c" },
  { id: "rosii", name: "Sera Rosii", boardId: "mock:mirror" },
  { id: "ardei", name: "Sera Ardei", boardId: "mock:synthetic" },
];

/* ===== Senzori afișați ===== */
const SENSORS = ["TEMPAER", "UMDTSOL1", "UMDTSOL2", "UMDTSOL3", "UMDTSOL4", "NIVELAPA", "EXCESAPA", "UMDTAER", "ILUMINARE", "CALITAER", "STAREAER"];

/* ===== Helpers ===== */
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const toPct = (v, a, b) => (v == null || Number.isNaN(+v) || a === b ? 0 : Math.round(clamp01((v - a) / (b - a)) * 100));
const fmt = (n, unit = "") =>
  n == null || Number.isNaN(+n)
    ? "—"
    : unit === " lx"
    ? `${Math.round(n)} lx`
    : unit === "%"
    ? `${+(+n).toFixed(2)}%`
    : unit === "°C"
    ? `${+(+n).toFixed(1)}°C`
    : unit === " CA"
    ? `${+(+n).toFixed(0)} CA`
    : `${+(+n).toFixed(2)}${unit}`;

function statusAndHelper(key, v) {
  const n = Number(v);
  switch (key) {
    case "TEMPAER":
      return n >= 28 && n <= 35
        ? { status: "healthy", helper: "Temperatura optimă." }
        : n < 28
        ? { status: "warning", helper: "Prea rece – încălzește/izolează." }
        : { status: "warning", helper: "Prea cald – ventilare/umbrire." };
    case "UMDTAER":
      return n >= 60 && n <= 85
        ? { status: "healthy", helper: "Umiditate bună." }
        : n < 60
        ? { status: "warning", helper: "Aer uscat – umidifică." }
        : { status: "warning", helper: "Prea umed – crește ventilarea." };
    case "UMDTSOL1":
    case "UMDTSOL2":
    case "UMDTSOL3":
    case "UMDTSOL4":
      return n >= 40 && n <= 70
        ? { status: "healthy", helper: "Sol în parametri." }
        : n < 40
        ? { status: "warning", helper: "Sol uscat – udă." }
        : { status: "warning", helper: "Sol prea umed – redu udarea." };
    case "ILUMINARE":
      return n >= 5000 && n <= 20000
        ? { status: "healthy", helper: "Iluminare adecvată." }
        : n < 5000
        ? { status: "warning", helper: "Lumina e slabă." }
        : { status: "warning", helper: "Lumina e prea puternică." };
    case "NIVELAPA":
      return n >= 40 && n <= 90
        ? { status: "healthy", helper: "Nivel potrivit." }
        : n < 40
        ? { status: "warning", helper: "Completează rezervorul." }
        : { status: "warning", helper: "Foarte ridicat – verifică preaplinul." };
    case "CALITAER":
      return n <= 1000
        ? { status: "healthy", helper: "Calitate bună." }
        : n <= 1500
        ? { status: "warning", helper: "Mediu – aerisește periodic." }
        : { status: "danger", helper: "Slab – ventilare continuă." };
    case "STAREAER":
      return String(v).toLowerCase().includes("alert") ? { status: "warning", helper: "Atenție la calitatea aerului." } : { status: "healthy", helper: "Normal" };
    case "EXCESAPA":
      return Number(n) > 0 ? { status: "danger", helper: "Exces de apă detectat." } : { status: "healthy", helper: "Normal" };
    default:
      return { status: "healthy", helper: "" };
  }
}

const DEFS = {
  TEMPAER: { label: "Temperatură aer", unit: "°C", icon: "bi-thermometer" },
  UMDTAER: { label: "Umiditate aer", unit: "%", icon: "bi-droplet" },
  UMDTSOL1: { label: "Umiditate sol 1", unit: "%", icon: "bi-moisture" },
  UMDTSOL2: { label: "Umiditate sol 2", unit: "%", icon: "bi-moisture" },
  UMDTSOL3: { label: "Umiditate sol 3", unit: "%", icon: "bi-moisture" },
  UMDTSOL4: { label: "Umiditate sol 4", unit: "%", icon: "bi-moisture" },
  ILUMINARE: { label: "Iluminare", unit: " lx", icon: "bi-brightness-high" },
  NIVELAPA: { label: "Nivel apă", unit: "%", icon: "bi-droplet-half" },
  EXCESAPA: { label: "Exces apă", unit: "", icon: "bi-exclamation-octagon" },
  CALITAER: { label: "Calitatea aerului", unit: " CA", icon: "bi-wind" },
  STAREAER: { label: "Stare aer", unit: "", icon: "bi-activity" },
};

/* ===== Componentă pagină ===== */
export default function StatisticiPage() {
  // implicit: SENZORI activ
  const [activeTab, setActiveTab] = useState("sensors");
  const [ghId, setGhId] = useSeraSelection(GREENHOUSES[0].id);
  const currentBoardId = GREENHOUSES.find((g) => g.id === ghId)?.boardId || GREENHOUSES[0].boardId;

  const [snap, setSnap] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const reqRef = useRef(0);
  const ww = useWindowWidth();

  useEffect(() => {
    if (!GREENHOUSES.some((g) => g.id === ghId)) {
      setGhId(GREENHOUSES[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ghId]);

  // refresh live din API-ul tău (cu mock-uri suportate)
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const my = ++reqRef.current;
      try {
        const j = await fetchLatest(currentBoardId);
        if (alive && my === reqRef.current) {
          setSnap(j);
          setError(null);
        }
      } catch (e) {
        if (alive && my === reqRef.current) {
          setSnap(null);
          setError(String(e?.message || e));
        }
      }
    };
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [currentBoardId]);

  const cards = useMemo(() => {
    if (!snap) return [];
    const out = [];
    for (const key of SENSORS) {
      if (!(key in snap)) continue;
      const raw = snap[key];
      if (raw == null || (typeof raw === "string" && raw.trim() === "")) continue;

      const meta = DEFS[key] || { label: key, unit: "", icon: "bi-question-circle" };
      let percent = 0;
      if (key === "TEMPAER") percent = toPct(raw, 10, 40);
      else if (key === "UMDTAER") percent = toPct(raw, 40, 100);
      else if (key === "ILUMINARE") percent = toPct(raw, 200, 1200);
      else if (key === "CALITAER") percent = 100 - toPct(raw, 0, 2000);
      else if (key.startsWith("UMDTSOL")) percent = toPct(raw, 0, 100);
      else if (key === "NIVELAPA") percent = toPct(raw, 0, 100);
      else if (key === "EXCESAPA") percent = Number(raw) ? 100 : 0;
      else if (key === "STAREAER") percent = String(raw).toUpperCase() === "ALERT" ? 30 : 80;

      const { status, helper } = statusAndHelper(key, raw);
      out.push({
        key,
        icon: meta.icon,
        label: meta.label,
        value: key === "EXCESAPA" ? (Number(raw) ? "Da" : "Nu") : fmt(raw, meta.unit || ""),
        percent,
        helper,
        status,
        unit: meta.unit || "",
      });
    }
    return out;
  }, [snap]);

  const gridStyle = useMemo(
    () =>
      ww <= 640
        ? { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }
        : ww <= 900
        ? { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }
        : ww <= 1280
        ? { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }
        : { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 },
    [ww]
  );

  const panelClass = `tabPanel tabPanel--${activeTab}`;

  return (
    <section className="statsWrap">
      <div className="statsBox">
        {/* Header: Sera + taburi (ordine: SENZORI, ACCU, AUTOS) */}
        <div className="statsBoxHeader">
          <SeraPicker options={GREENHOUSES} value={ghId} onChange={setGhId} fill />

          <button className={`tabPill sensorsTab ${activeTab === "sensors" ? "active" : ""}`} onClick={() => setActiveTab("sensors")} type="button">
            <i className="bi bi-activity me-1" /> Senzori
          </button>

          <button className={`tabPill accuTab ${activeTab === "accu" ? "active" : ""}`} onClick={() => setActiveTab("accu")} type="button">
            <i className="bi bi-battery-half me-1" /> Acumulatori
          </button>

          <button className={`tabPill autosTab ${activeTab === "autos" ? "active" : ""}`} onClick={() => setActiveTab("autos")} type="button">
            <i className="bi bi-sliders me-1" /> Automatizări
          </button>
        </div>

        {/* Conținut taburi */}
        <div className={`statsBoxBody ${panelClass}`}>
          {activeTab === "sensors" &&
            (!snap ? (
              <div style={{ padding: 16, textAlign: "center" }}>{error || "Se încarcă…"}</div>
            ) : (
              <div style={gridStyle}>
                {cards.map(({ key: sensorKey, ...rest }) => (
                  <SensorCard
                    key={sensorKey}
                    {...rest}
                    onClick={() =>
                      setSelected({
                        key: sensorKey,
                        label: DEFS[sensorKey]?.label || sensorKey,
                        icon: DEFS[sensorKey]?.icon || "bi-question-circle",
                        value: rest.value,
                        helper: rest.helper,
                        status: rest.status,
                      })
                    }
                  />
                ))}
              </div>
            ))}

          {activeTab === "accu" && <AcumulatoriTab boardId={currentBoardId} />}

          {activeTab === "autos" && <AutomatizariSimple seraId={ghId} sereList={GREENHOUSES.map((g) => ({ id: g.id, name: g.name }))} />}
        </div>
      </div>

      {/* Modal grafice (are deja downsample 15m) */}
      {selected && <ModalSenzor senzor={selected} boardId={currentBoardId} onClose={() => setSelected(null)} />}
    </section>
  );
}
