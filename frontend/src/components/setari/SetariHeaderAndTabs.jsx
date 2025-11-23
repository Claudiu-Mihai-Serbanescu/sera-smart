// src/components/setari/SetariHeaderAndTabs.jsx
import React from "react";
import { Badge } from "react-bootstrap";
import "./Setari.css";

export default function SetariHeaderAndTabs({ role, activeSection, setActiveSection, err, saveOk, AlertComp }) {
  const isAdmin = role === "admin";

  // Doar aranjarea butoanelor (design-ul rămâne identic)
  const tabs = [
    { key: "notifications", label: "Notificări", icon: "bi-bell-fill" },
    { key: "personal", label: "Date Personale", icon: "bi-person-fill" },
    { key: "contract", label: "Contract", icon: "bi-file-earmark-text-fill" },
    { key: "farm", label: "Date Fermă", icon: "bi-house-fill" },
    { key: "system", label: "Sistem", icon: "bi-sliders" },
  ];

  return (
    <>
      {err}
      {saveOk}

      <div className="section-tabs mb-4">
        {tabs.map((t) => (
          <button key={t.key} className={`tab-btn ${activeSection === t.key ? "active" : ""}`} onClick={() => setActiveSection(t.key)}>
            <i className={`bi ${t.icon} me-2`}></i> {t.label}
          </button>
        ))}
      </div>
    </>
  );
}
