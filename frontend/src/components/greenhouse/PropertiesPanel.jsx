// src/components/greenhouse/PropertiesPanel.jsx
import React from "react";
import { sortCrops } from "./gh-shared";

export default function PropertiesPanel({ gh, usage, crops, onChange, addBed, removeBed, setBed }) {
  const cropEntries = sortCrops(crops);

  // ------- Helpers -------
  const cropMeta = (all, key) => {
    const v = all?.[key];
    if (!v) return { name: key, days: null };
    const days = Number(v.days_to_harvest ?? v.harvestDays ?? v.days ?? v.harvest_days ?? 0);
    return {
      name: v.name || key,
      days: Number.isFinite(days) && days > 0 ? days : null,
    };
  };

  const parseToDate = (s) => {
    if (!s) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
      const [a, b, y] = s.split("/").map(Number);
      const dd = a > 12 ? a : b;
      const mm = a > 12 ? b : a;
      return new Date(y, mm - 1, dd);
    }
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(s)) {
      const [d, m, y] = s.split(".").map(Number);
      return new Date(y, m - 1, d);
    }
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const toISO = (d) => (d ? [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-") : "");

  const fmtRO = (d) => (d ? d.toLocaleDateString("ro-RO") : "");

  const getHarvestDate = (plantDateStr, days) => {
    if (!plantDateStr || !days) return { iso: "", pretty: "" };
    const d = parseToDate(plantDateStr);
    if (!d) return { iso: "", pretty: "" };
    const h = new Date(d.getFullYear(), d.getMonth(), d.getDate() + Number(days));
    return { iso: toISO(h), pretty: fmtRO(h) };
  };

  const bedAreaM2 = (b, gh) => {
    const L = Number(gh?.lungime_m || 0);
    return Number((Number(b.size_m || 0) * L).toFixed(2));
  };

  // ------- UI -------
  return (
    <aside className="gh-props gh-props-bar">
      <div className="props-grid">
        {/* COL 1 — seră */}
        <div className="col col-left usage">
          <label>Nume seră</label>
          <input value={gh.name} onChange={(e) => onChange({ name: e.target.value })} />

          <div className="row-two">
            <div>
              <label>Lățime (m)</label>
              <input type="number" step="0.1" value={gh.latime_m} onChange={(e) => onChange({ latime_m: Number(e.target.value || 0) })} />
            </div>
            <div>
              <label>Lungime (m)</label>
              <input type="number" step="0.1" value={gh.lungime_m} onChange={(e) => onChange({ lungime_m: Number(e.target.value || 0) })} />
            </div>
          </div>
        </div>

        {/* COL 2 — straturi */}
        <div className="col col-middle">
          <div className="split">
            <h4>Straturi</h4>
            <button onClick={addBed}>+ Adaugă strat</button>
          </div>

          <div className="beds">
            {gh.beds.map((b, idx) => {
              const meta = cropMeta(crops, b.crop);
              const daysForBed = Number(b.harvest_days ?? meta.days) || null;
              const harvest = getHarvestDate(b.plant_date, daysForBed);
              const area = bedAreaM2(b, gh);

              return (
                <details key={b.id} className="bed-acc">
                  {/* header acordeon: doar „Strat #N” + caret */}
                  <summary className="bed-acc__head">
                    <span className="bed-acc__title">Strat #{idx + 1}</span>
                    <i className="bed-acc__caret" aria-hidden />
                  </summary>

                  {/* cardul cu câmpuri */}
                  <div className="bed-row bed-card">
                    {/* Nume/Cultură — etichete */}
                    <div className="bed-labels bed-labels-nc two">
                      <label>Nume strat</label>
                      <label>Tip cultură</label>
                    </div>

                    {/* Nume strat */}
                    <input className="bed-name" value={b.name} onChange={(e) => setBed(b.id, { name: e.target.value })} placeholder="Nume strat" />

                    {/* Tip cultură */}
                    <select className="bed-crop" value={b.crop} onChange={(e) => setBed(b.id, { crop: e.target.value })} title={meta.name || "Cultură"}>
                      {cropEntries.map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.name}
                        </option>
                      ))}
                    </select>

                    {/* Lățime strat */}
                    <div className="bed-size">
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={b.size_m}
                        onChange={(e) =>
                          setBed(b.id, {
                            size_m: Math.max(0.1, Number(e.target.value || 0)),
                          })
                        }
                      />
                      <span>m</span>
                    </div>

                    {/* Lățime cărare */}
                    <div className="bed-path">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={b.path_m}
                        onChange={(e) =>
                          setBed(b.id, {
                            path_m: Math.max(0, Number(e.target.value || 0)),
                          })
                        }
                      />
                      <span>m</span>
                    </div>

                    {/* Plantare/Recoltare — etichete */}
                    <div className="bed-labels bed-labels-ph two">
                      <label>Data plantare</label>
                      <label>Data recoltare</label>
                    </div>

                    {/* Data plantare */}
                    <div className="bed-plant">
                      <input
                        type="date"
                        value={toISO(parseToDate(b.plant_date))}
                        onChange={(e) =>
                          setBed(b.id, {
                            plant_date: e.target.value || null,
                          })
                        }
                        title="Data plantare"
                      />
                    </div>

                    {/* Data recoltare (calculată) */}
                    <div className="bed-harvest">
                      <input type="text" value={harvest.pretty || "—"} readOnly title={daysForBed ? `~${daysForBed} zile` : "Setează zilele până la recoltă"} />
                    </div>

                    {/* Zile estimative — etichetă + input */}
                    <div className="bed-labels bed-label-days one">
                      <label>Zile estimative până la recoltare</label>
                    </div>
                    <div className="bed-days">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={b.harvest_days ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setBed(b.id, {
                            harvest_days: v === "" ? null : Math.max(1, Number(v)),
                          });
                        }}
                        placeholder={meta.days ? String(meta.days) : "zile"}
                        title="Zile până la recoltă"
                      />
                    </div>

                    <div className="bed-area">
                      <span>{area.toFixed(2)} m²</span>
                    </div>

                    {/* Ștergere strat */}
                    <button className="del" onClick={() => removeBed(b.id)}>
                      ×
                    </button>
                  </div>
                </details>
              );
            })}
          </div>
        </div>

        {/* COL 3 — sumar lățime */}
        <div className="col col-right">
          <div className={`usage ${usage?.overflow ? "bad" : ""}`}>
            <div className="row">
              <span>
                Disponibil pe lățime: <b>{usage.available} m</b>
              </span>
              <span>
                Folosit: <b>{usage.used.toFixed(2)} m</b>
              </span>
              {usage.overflow ? (
                <span className="warn">Depășești cu {Math.abs(usage.remaining).toFixed(2)} m</span>
              ) : (
                <span>
                  Rămas: <b>{usage.remaining.toFixed(2)} m</b>
                </span>
              )}
            </div>
            <div className="bar">
              <div
                style={{
                  width: `${Math.min(100, (usage.used / Math.max(usage.available, 0.0001)) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
