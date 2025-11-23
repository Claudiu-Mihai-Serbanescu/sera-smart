import React from "react";

export default function GreenhouseHeader({ greenhouses, selectedId, onSelect, onAdd, onDelete }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const current = greenhouses.find((g) => g.id === selectedId);

  React.useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const choose = (id) => {
    onSelect(id);
    setOpen(false);
  };

  return (
    <header className="gh-header">
      <div className="gh-brand">
        <h1>Editor sere </h1>
      </div>

      <div className="gh-header-actions" ref={ref}>
        <button className="btn btn-success hide-sm" onClick={onAdd} aria-label="Adaugă seră">
          + Adaugă
        </button>

        <button className="btn btn-success dd-trigger" onClick={() => setOpen((v) => !v)} aria-haspopup="listbox" aria-expanded={open} title={current?.name} type="button">
          <span className="dd-current" aria-live="polite">
            {current?.name ?? "Alege seră"}
          </span>
        </button>

        {open && (
          <div className="dd-menu" role="listbox" tabIndex={-1}>
            <div className="dd-list">
              {greenhouses.length === 0 && <div className="dd-empty">Nu ai sere încă.</div>}
              {greenhouses.map((g) => (
                <div key={g.id} className={`dd-item ${g.id === selectedId ? "active" : ""}`} role="option" aria-selected={g.id === selectedId}>
                  <button className="dd-label" onClick={() => choose(g.id)}>
                    {g.name}
                  </button>
                  <button className="dd-del" title="Șterge" onClick={() => onDelete(g.id)} aria-label={`Șterge ${g.name}`}>
                    ×
                  </button>
                </div>
              ))}
              <div className="dd-sep" />
              <button
                className="dd-add"
                onClick={() => {
                  setOpen(false);
                  onAdd();
                }}>
                + Adaugă seră nouă
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
