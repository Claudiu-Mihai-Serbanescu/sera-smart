/**
 * AutoToggle.jsx
 * Comutator on/off (checkbox stilizat).
 * Props: checked:boolean, onChange(fn), label:string.
 */

import React from "react";

export default function AutoToggle({ checked, onChange, label }) {
  return (
    <label className="autos__toggle">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="autos__toggleSlider" />
      <span className="autos__toggleLabel">{label}</span>
    </label>
  );
}
