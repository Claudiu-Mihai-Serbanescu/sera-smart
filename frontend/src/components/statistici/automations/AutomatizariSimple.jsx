/**
 * AutomatizariSimple.jsx
 * Ecranul principal pentru automatizări.
 * – Afișează cardurile: Udare, Iluminat, Aerisire, Dăunători.
 * – Ține configurația pe seră (persistă în localStorage) + helper patch(path,val).
 * – Pornește logica prin useAutosEngine(...).
 * – Folosește AutoCard și AutoToggle pentru UI.
 */

import React, { useEffect, useMemo, useState } from "react";
import "./automatizari-simple.css";

import AutoCard from "./AutoCard";
import AutoToggle from "./AutoToggle";
import useAutosEngine from "./useAutosEngine";
import { clamp } from "./sensorUtils";

/* ========== Sere & implicite ========== */
const SERE_FALLBACK = [
  { id: "spanac", name: "Sera Spanac" },
  { id: "rosii", name: "Sera Roșii" },
  { id: "ardei", name: "Sera Ardei" },
];

function defaultsFor(seraId) {
  switch (seraId) {
    case "rosii":
      return {
        irrigation: { enabled: false, times: ["06:30", "19:30"], durationMin: 6, bySoil: { enabled: true, thresholdPct: 40 } },
        ventilation: { enabled: true, thresholdC: 30 },
        lights: { enabled: false, from: "17:00", to: "21:00" },
        pests: { enabled: true },
      };
    case "ardei":
      return {
        irrigation: { enabled: false, times: ["07:00", "20:00"], durationMin: 5, bySoil: { enabled: true, thresholdPct: 38 } },
        ventilation: { enabled: true, thresholdC: 31 },
        lights: { enabled: false, from: "18:00", to: "22:00" },
        pests: { enabled: true },
      };
    default: // spanac
      return {
        irrigation: { enabled: false, times: ["07:00", "19:00"], durationMin: 5, bySoil: { enabled: true, thresholdPct: 35 } },
        ventilation: { enabled: true, thresholdC: 29 },
        lights: { enabled: false, from: "17:30", to: "20:30" },
        pests: { enabled: true },
      };
  }
}

/* ========== Persistență locală ========== */
const LS_KEY = (seraId) => `autos.simple.${seraId}`;
const loadState = (seraId) => {
  try {
    const s = localStorage.getItem(LS_KEY(seraId));
    return s ? JSON.parse(s) : defaultsFor(seraId);
  } catch {
    return defaultsFor(seraId);
  }
};
const saveState = (seraId, state) => {
  try {
    localStorage.setItem(LS_KEY(seraId), JSON.stringify(state));
  } catch {}
  // broadcast pentru dashboard / alte componente din același tab
  try {
    window.dispatchEvent(new CustomEvent("autos-cfg-changed", { detail: { seraId, cfg: state } }));
  } catch {}
};

/* ========== Config motor & mapping ========== */
const POLL_MS = Math.max(5000, Number(import.meta.env.VITE_AUTOS_POLL_MS || 10000));
const HYST = { tempOffDelta: 1, soilOffDelta: 3 };

const BOARD_MAP_DEFAULT = {
  spanac: {
    id: import.meta.env.VITE_BOARD_ID || "e663ac91d3824a2c",
    actuators: { irrigation: "pmp", ventilation: "fan", lights: "led" },
  },
  rosii: {
    id: import.meta.env.VITE_ROSII_ID || null,
    actuators: { irrigation: "pmp", ventilation: "fan", lights: "led" },
  },
  ardei: {
    id: import.meta.env.VITE_ARDEI_ID || null,
    actuators: { irrigation: "pmp", ventilation: "fan", lights: "led" },
  },
};

/* ========== Componenta principală ========== */
export default function AutomatizariSimple({ seraId: controlledId, sereList, boardMap = BOARD_MAP_DEFAULT }) {
  const list = (sereList && sereList.length ? sereList : SERE_FALLBACK).map((s) => ({ id: s.id, name: s.name }));
  const [internalId] = useState(list[0]?.id);
  const seraId = controlledId ?? internalId;

  const [cfg, setCfg] = useState(() => loadState(seraId));
  const seraName = useMemo(() => list.find((s) => s.id === seraId)?.name || "", [list, seraId]);

  useEffect(() => setCfg(loadState(seraId)), [seraId]);
  useEffect(() => {
    if (seraId) saveState(seraId, cfg);
  }, [seraId, cfg]);
  useEffect(() => {
    const onCfg = (e) => {
      if (e.detail?.seraId === seraId) setCfg(e.detail.cfg);
    };
    window.addEventListener("autos-cfg-changed", onCfg);
    return () => window.removeEventListener("autos-cfg-changed", onCfg);
  }, [seraId]);

  // mică migrare istorică
  useEffect(() => {
    const MIGR_KEY = "autos.simple.migr.offTimeDefault.v1";
    try {
      if (localStorage.getItem(MIGR_KEY)) return;
      setCfg((prev) => {
        if (prev?.irrigation?.enabled && prev?.irrigation?.bySoil?.enabled) {
          const next = structuredClone(prev);
          next.irrigation.enabled = false;
          return next;
        }
        return prev;
      });
      localStorage.setItem(MIGR_KEY, "done");
    } catch {}
  }, []);

  // rulează engine-ul (logică de automatizare) – useAutosEngine trebuie să folosească colleagueApi.
  useAutosEngine({
    seraId,
    cfg,
    boardMap,
    pollMs: POLL_MS,
    hyst: HYST,
  });

  // helper de patch pe config
  const patch = (path, value) =>
    setCfg((prev) => {
      const next = structuredClone(prev);
      const keys = path.split(".");
      let t = next;
      keys.slice(0, -1).forEach((k) => (t = t[k]));
      t[keys[keys.length - 1]] = value;
      return next;
    });

  const irrigationOn = cfg.irrigation.enabled || cfg.irrigation.bySoil?.enabled;

  return (
    <div className="autos">
      {/* Topbar doar text, aliniat stânga */}
      <div className="autos__topbar">
        <span className="autos__hint">
          Automatizări pentru <b>{seraName || "—"}</b>
        </span>
      </div>

      {/* GRID */}
      <div className="autos__grid">
        {/* 1) Udare automată */}
        <AutoCard variant="irrigation" title="Udare automată" description="Uda la orele alese și/sau când solul e prea uscat." statusOn={Boolean(irrigationOn)}>
          <div className="autos__row">
            <AutoToggle
              checked={cfg.irrigation.enabled}
              onChange={(v) => patch("irrigation.enabled", v)}
              label={cfg.irrigation.enabled ? "Udare ora fixă: Pornită" : "Udare ora fixă: Oprită"}
            />
          </div>

          <div className="autos__row autos__row--4">
            <div className="autos__field">
              <label>Ora 1</label>
              <input type="time" value={cfg.irrigation.times[0]} onChange={(e) => patch("irrigation.times", [e.target.value, cfg.irrigation.times[1]])} />
            </div>
            <div className="autos__field">
              <label>Ora 2</label>
              <input type="time" value={cfg.irrigation.times[1]} onChange={(e) => patch("irrigation.times", [cfg.irrigation.times[0], e.target.value])} />
            </div>
            <div className="autos__field">
              <label>Durată</label>
              <div className="autos__inline">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={cfg.irrigation.durationMin}
                  onChange={(e) => patch("irrigation.durationMin", clamp(Number(e.target.value) || 1, 1, 30))}
                />
                <span>min</span>
              </div>
            </div>
          </div>

          <div className="autos__row autos__row--soil">
            <AutoToggle
              checked={!!cfg.irrigation.bySoil?.enabled}
              onChange={(v) => patch("irrigation.bySoil.enabled", v)}
              label={cfg.irrigation.bySoil?.enabled ? "Umid sol: Activ" : "Umid sol: Inactiv"}
            />
            <div className="autos__field autos__field--small">
              <label>Prag umiditate</label>
              <div className="autos__inline">
                <input
                  type="number"
                  min={10}
                  max={90}
                  disabled={!cfg.irrigation.bySoil?.enabled}
                  value={cfg.irrigation.bySoil?.thresholdPct ?? 40}
                  onChange={(e) => patch("irrigation.bySoil.thresholdPct", clamp(Number(e.target.value) || 10, 10, 90))}
                />
                <span>%</span>
              </div>
            </div>
            <input
              className="autos__range"
              type="range"
              min={10}
              max={90}
              step={1}
              disabled={!cfg.irrigation.bySoil?.enabled}
              value={cfg.irrigation.bySoil?.thresholdPct ?? 40}
              onChange={(e) => patch("irrigation.bySoil.thresholdPct", Number(e.target.value))}
            />
          </div>
        </AutoCard>

        {/* 2) Iluminat */}
        <AutoCard variant="lights" title="Iluminat complementar" description="Aprinde luminile în intervalul ales." statusOn={cfg.lights.enabled}>
          <div className="autos__row">
            <AutoToggle checked={cfg.lights.enabled} onChange={(v) => patch("lights.enabled", v)} label={cfg.lights.enabled ? "Pornit" : "Oprit"} />
          </div>
          <div className="autos__row autos__row--2">
            <div className="autos__field">
              <label>De la</label>
              <input type="time" value={cfg.lights.from} disabled={!cfg.lights.enabled} onChange={(e) => patch("lights.from", e.target.value)} />
            </div>
            <div className="autos__field">
              <label>Până la</label>
              <input type="time" value={cfg.lights.to} disabled={!cfg.lights.enabled} onChange={(e) => patch("lights.to", e.target.value)} />
            </div>
          </div>
        </AutoCard>

        {/* 3) Aerisire */}
        <AutoCard variant="vent" title="Aerisire automată" description="Pornește ventilarea peste prag." statusOn={cfg.ventilation.enabled}>
          <div className="autos__row">
            <AutoToggle checked={cfg.ventilation.enabled} onChange={(v) => patch("ventilation.enabled", v)} label={cfg.ventilation.enabled ? "Pornită" : "Oprită"} />
          </div>
          <div className="autos__row autos__row--1">
            <div className="autos__field">
              <label>Prag temperatură</label>
              <div className="autos__inline">
                <input
                  type="number"
                  min={20}
                  max={45}
                  value={cfg.ventilation.thresholdC}
                  onChange={(e) => patch("ventilation.thresholdC", clamp(Number(e.target.value) || 20, 20, 45))}
                />
                <span>°C</span>
              </div>
            </div>
          </div>
        </AutoCard>

        {/* 4) Dăunători — doar UI */}
        <AutoCard variant="pests" title="Monitorizare dăunători" description="Alerte la semne din imagini/senzori." statusOn={cfg.pests.enabled}>
          <div className="autos__row">
            <AutoToggle checked={cfg.pests.enabled} onChange={(v) => patch("pests.enabled", v)} label={cfg.pests.enabled ? "Pornită" : "Oprită"} />
          </div>
        </AutoCard>
      </div>
    </div>
  );
}
