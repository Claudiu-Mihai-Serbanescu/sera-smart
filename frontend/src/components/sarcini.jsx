// src/components/Sarcini.jsx
/**
 * Sarcini.jsx
 * Card dashboard cu:
 *  - „Automatizări rapide” (icon + nume + toggle; 1/row; sincronizat cu Automatizări)
 *  - progres + „Sarcini îndeplinite” deasupra listei
 *  - lista de sarcini (demo)
 */
import React, { useEffect, useState } from "react";
import "./sarcini.css";

/* ==== Config comună cu Automatizări (cheia din LS) ==== */
const LS_KEY = (seraId) => `autos.simple.${seraId}`;

/* ==== fallback minim (dacă nu există config salvat) ==== */
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
function loadCfg(seraId) {
  try {
    const s = localStorage.getItem(LS_KEY(seraId));
    return s ? JSON.parse(s) : defaultsFor(seraId);
  } catch {
    return defaultsFor(seraId);
  }
}
function saveCfg(seraId, cfg) {
  try {
    localStorage.setItem(LS_KEY(seraId), JSON.stringify(cfg));
    window.dispatchEvent(new CustomEvent("autos-cfg-changed", { detail: { seraId, cfg } }));
  } catch {}
}

/* ==== Componenta principală ==== */
export default function Sarcini({ seraId = "spanac" }) {
  // --- QUICK TOGGLES (sincron cu pagina Automatizări)
  const [cfg, setCfg] = useState(() => loadCfg(seraId));

  // sync cu modificări din alte tab-uri / pagini
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === LS_KEY(seraId) && e.newValue) {
        try {
          setCfg(JSON.parse(e.newValue));
        } catch {}
      }
    };
    const onCustom = (e) => {
      if (e.detail?.seraId === seraId && e.detail?.cfg) setCfg(e.detail.cfg);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("autos-cfg-changed", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("autos-cfg-changed", onCustom);
    };
  }, [seraId]);

  const setQuick = (path, value) => {
    setCfg((prev) => {
      const next = structuredClone(prev);
      const keys = path.split(".");
      let t = next;
      keys.slice(0, -1).forEach((k) => (t = t[k]));
      t[keys[keys.length - 1]] = value;
      saveCfg(seraId, next);
      return next;
    });
  };

  // --- TASKS demo
  const baseTasks = [
    { id: 1, title: "Irigare finalizată", description: "Udarea completă a plantelor în zona A", time: "07:30 AM", isCompleted: true },
    { id: 2, title: "Ventilație activată", description: "Activare ventilație automată pentru 30 min", time: "08:00 AM", isCompleted: true },
    { id: 3, title: "Fertilizare sol", description: "Aplicare fertilizator organic, 50g / plantă", time: "08:45 AM", isCompleted: true },
    { id: 4, title: "Monitorizare dăunători", description: "Verificare vizuală și înregistrare în aplicație", time: "09:15 AM", isCompleted: false },
    { id: 5, title: "Deschidere laterală solar", description: "Deschidere automată laturi solare pentru aerisire", time: "10:00 AM", isCompleted: false },
  ];
  const extraTasks = Array.from({ length: 3 }, (_, i) => {
    const idx = i + 1;
    const hour = 10 + Math.floor(idx / 2);
    const minute = idx % 2 === 0 ? "30" : "00";
    const ampm = hour < 12 ? "AM" : "PM";
    const hour12 = ((hour - 1) % 12) + 1;
    return {
      id: baseTasks.length + idx,
      title: `Rulare automatizare #${idx}`,
      description: idx % 3 === 0 ? "Verificare senzori și loguri" : "Irigare sector B timp 3 minute",
      time: `${String(hour12).padStart(2, "0")}:${minute} ${ampm}`,
      isCompleted: idx % 4 === 0,
    };
  });
  const tasks = [...baseTasks, ...extraTasks];

  const completed = tasks.filter((t) => t.isCompleted).length;
  const total = tasks.length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="sarcini-container">
      {/* === Automatizări rapide (titlu + 1/row) === */}

      {/* === Automatizări – panou alb încadrat === */}
      <div className="autos-panel">
        <h3 className="qa-title">Automatizări</h3>

        <div className="autos-grid">
          <div className="qa-item">
            <div className="qa-left">
              <span className="qa-icon" aria-hidden>
                💧
              </span>
              <span className="qa-name">Udare</span>
            </div>
            <label className="qa-toggle">
              <input type="checkbox" checked={!!cfg.irrigation?.enabled} onChange={(e) => setQuick("irrigation.enabled", e.target.checked)} aria-label="Comută Udare ora fixă" />
              <span className="qa-slider" />
            </label>
          </div>

          <div className="qa-item">
            <div className="qa-left">
              <span className="qa-icon" aria-hidden>
                📷
              </span>
              <span className="qa-name">Cameră</span>
            </div>
            <label className="qa-toggle">
              <input type="checkbox" checked={!!cfg.pests?.enabled} onChange={(e) => setQuick("pests.enabled", e.target.checked)} aria-label="Comută Cameră" />
              <span className="qa-slider" />
            </label>
          </div>

          <div className="qa-item">
            <div className="qa-left">
              <span className="qa-icon" aria-hidden>
                🌬️
              </span>
              <span className="qa-name">Aerisire</span>
            </div>
            <label className="qa-toggle">
              <input
                type="checkbox"
                checked={!!cfg.ventilation?.enabled}
                onChange={(e) => setQuick("ventilation.enabled", e.target.checked)}
                aria-label="Comută Aerisire automată"
              />
              <span className="qa-slider" />
            </label>
          </div>

          <div className="qa-item">
            <div className="qa-left">
              <span className="qa-icon" aria-hidden>
                💡
              </span>
              <span className="qa-name">Iluminat</span>
            </div>
            <label className="qa-toggle">
              <input type="checkbox" checked={!!cfg.lights?.enabled} onChange={(e) => setQuick("lights.enabled", e.target.checked)} aria-label="Comută Iluminat" />
              <span className="qa-slider" />
            </label>
          </div>
        </div>
      </div>
      <div className="sarcini-header">
        <h3>Sarcini realizate</h3>
      </div>

      {/* === Progres === */}
      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      {/* === Subheader deasupra listei === */}
      <div className="tasks-subheader">
        <div className="tasks-metrics">
          <span className="progress-percentage">{pct}%</span>
          <span className="progress-count">
            <strong>
              {completed}/{total}
            </strong>
          </span>
        </div>
      </div>

      {/* === Lista cu scroll intern === */}
      <div className="task-list">
        {tasks.map((task) => (
          <div key={task.id} className="task-card">
            <div className="task-content">
              <strong className="task-title">{task.title}</strong>
              <p className="task-description">{task.description}</p>
              <small className="task-time">{task.time}</small>
            </div>
            <div className="task-icon">
              {task.isCompleted ? <i className="bi bi-check-circle-fill text-success fs-5" /> : <i className="bi bi-circle fs-5" style={{ color: "#cccccc" }} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
