// src/components/SeraPicker.jsx
import { useEffect, useRef, useState } from "react";
import "./SeraPicker.css";

export default function SeraPicker({ options = [], value, onChange, fill = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!open) return;
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]); // <— array constant ca dimensiune

  const current = options.find((o) => o.id === value);

  return (
    <div className={`sera ${fill ? "sera--fill" : ""}`} ref={ref}>
      <button type="button" className={`sera__btn ${open ? "is-open" : ""}`} aria-haspopup="listbox" aria-expanded={open} title={current?.name} onClick={() => setOpen((v) => !v)}>
        <span className="sera__label">{current?.name ?? "Alege seră"}</span>
        <span className="sera__chev" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="sera__menu" role="listbox">
          {options.map((o) => (
            <button
              key={o.id}
              role="option"
              aria-selected={o.id === value}
              className={`sera__item ${o.id === value ? "is-active" : ""}`}
              onClick={() => {
                onChange?.(o.id);
                setOpen(false);
              }}>
              {o.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
