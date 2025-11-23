/**
 * AutoCard.jsx
 * Card UI reutilizabil pentru o automatizare.
 * Props: variant('irrigation'|'lights'|'vent'|'pests'), title, description, statusOn, children.
 * Afișează icon, titlu, badge Activ/Oprit și conținutul transmis.
 */

import React from "react";

const ICON = { irrigation: "💧", lights: "💡", vent: "🌬️", pests: "🐛" };

export default function AutoCard({ variant, title, description, statusOn, children }) {
  return (
    <div className="autos__card" data-variant={variant} data-on={statusOn ? "1" : "0"}>
      <div className="autos__cardHead">
        <span className="autos__icon">{ICON[variant]}</span>
        <span className="autos__title">{title}</span>
        <span className={`autos__badge ${statusOn ? "on" : "off"}`}>{statusOn ? "Activ" : "Oprit"}</span>
      </div>
      <p className="autos__desc">{description}</p>
      <div className="autos__inputs">{children}</div>
    </div>
  );
}
