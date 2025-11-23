import React from "react";

export default function SidebarList({ greenhouses, selectedId, onSelect, onAdd, onDelete }) {
  return (
    <aside className="gh-sidebar">
      <div className="gh-sidebar-head">
        <h3>Sere</h3>
        <button onClick={onAdd}>+ Adaugă</button>
      </div>
      <ul className="gh-list">
        {greenhouses.map((g) => (
          <li key={g.id} className={g.id === selectedId ? "active" : ""}>
            <button className="item" onClick={() => onSelect(g.id)}>
              {g.name}
            </button>
            <button className="del" title="Șterge" onClick={() => onDelete(g.id)}>
              ×
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
