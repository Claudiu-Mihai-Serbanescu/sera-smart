import React from "react";
import { sortCrops } from "./gh-shared";

export default function Legend({ crops, addCrop, setCropField, deleteCrop }) {
  const entries = sortCrops(crops);

  return (
    <div className="gh-legend gh-legend--edit">
      {entries.map(([key, val]) => (
        <div key={key} className={`legend-edit-item ${val.locked ? "locked" : ""}`}>
          <input type="color" className="color-input" value={val.color} onChange={(e) => setCropField(key, { color: e.target.value })} title="Culoare" disabled={val.locked} />
          <input className="name-input" value={val.name} onChange={(e) => setCropField(key, { name: e.target.value })} placeholder="Nume cultură" disabled={val.locked} />
          {!val.locked && (
            <button className="del" onClick={() => deleteCrop(key)} title="Șterge">
              ×
            </button>
          )}
        </div>
      ))}
      <button className="legend-add" onClick={addCrop}>
        + Adaugă cultură
      </button>
    </div>
  );
}
