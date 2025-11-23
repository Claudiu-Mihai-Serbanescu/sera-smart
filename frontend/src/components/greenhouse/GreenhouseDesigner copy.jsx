import React, { useEffect, useMemo, useRef, useState } from "react";
import "./greenhouse.css";

/** 🎨 Paleta de culori implicită */
const DEFAULT_CROPS = {
  rosii: { name: "Roșii", color: "#e74c3c" },
  salata: { name: "Salată", color: "#2ecc71" },
  castr: { name: "Castraveți", color: "#27ae60" },
  gol: { name: "Liber", color: "#bdc3c7", locked: true },
};

const ORIENTARI = ["Nord ↔ Sud", "Est ↕ Vest"];
const PPM = 40; // pixeli pe metru
const uid = () => Math.random().toString(36).slice(2, 9);

/* ---------- localStorage hook ---------- */
function useLocalStorage(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState];
}

/* ---------- model seră nouă ---------- */
function newGreenhouse() {
  return {
    id: uid(),
    name: "Sera nouă",
    latime_m: 6,
    lungime_m: 20,
    orientare: "Nord ↔ Sud",
    layoutDir: "horizontal",
    zoom: 1,
    beds: [
      { id: uid(), name: "Strat #1", crop: "salata", size_m: 3, path_m: 0.2 },
      { id: uid(), name: "Strat #2", crop: "rosii", size_m: 3, path_m: 0.2 },
    ],
    sensors: [], // ⬅️ nou
  };
}

/* ---------- utilizare spațiu ---------- */
function calcUsage(gh) {
  if (!gh || !gh.beds?.length) {
    return {
      available: 0,
      used: 0,
      remaining: 0,
      overflow: false,
      axis: "latime",
    };
  }
  const available = Number(gh.latime_m);
  const sizes = gh.beds.reduce((a, b) => a + (Number(b.size_m) || 0), 0);
  const paths = gh.beds.reduce(
    (a, b, i) => a + (i < gh.beds.length - 1 ? Number(b.path_m) || 0 : 0),
    0
  );
  const used = sizes + paths;
  return {
    available,
    used,
    remaining: available - used,
    overflow: available - used < -1e-6,
    axis: "latime",
  };
}

const sortCrops = (crops) =>
  Object.entries(crops).sort((a, b) => {
    const la = a[1].locked ? 1 : 0;
    const lb = b[1].locked ? 1 : 0;
    return la - lb || a[1].name.localeCompare(b[1].name, "ro");
  });

/* ===================== Pagina ===================== */
export default function GreenhouseDesigner() {
  const [crops, setCrops] = useLocalStorage("gh-crops", DEFAULT_CROPS);
  const [greenhouses, setGreenhouses] = useLocalStorage("gh-list", [
    newGreenhouse(),
  ]);
  const [selectedId, setSelectedId] = useLocalStorage(
    "gh-selected",
    greenhouses[0]?.id
  );

  useEffect(() => {
    if (!greenhouses.find((g) => g.id === selectedId) && greenhouses.length) {
      setSelectedId(greenhouses[0].id);
    }
  }, [greenhouses, selectedId, setSelectedId]);

  const gh = useMemo(
    () => greenhouses.find((g) => g.id === selectedId),
    [greenhouses, selectedId]
  );
  const usage = useMemo(() => calcUsage(gh), [gh]);

  /* ---- Crop actions ---- */
  const deleteCrop = (cropKey) => {
    if (crops[cropKey]?.locked) return;
    const next = { ...crops };
    delete next[cropKey];
    setCrops(next);
    setGreenhouses((prev) =>
      prev.map((g) => ({
        ...g,
        beds: g.beds.map((b) =>
          b.crop === cropKey ? { ...b, crop: "gol" } : b
        ),
      }))
    );
  };
  const addCrop = () => {
    const id = "crop_" + uid();
    setCrops((prev) => ({
      ...prev,
      [id]: { name: "Nouă cultură", color: "#6ee7b7" },
    }));
  };
  const setCropField = (key, patch) =>
    setCrops((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  /* ---- Greenhouse actions ---- */
  const updateGh = (patch) =>
    setGreenhouses((prev) =>
      prev.map((g) => (g.id === gh.id ? { ...gh, ...patch } : g))
    );
  const addGreenhouse = () => {
    const created = newGreenhouse();
    setGreenhouses((prev) => [created, ...prev]);
    setSelectedId(created.id);
  };
  const deleteGreenhouse = (id) =>
    setGreenhouses((prev) => prev.filter((g) => g.id !== id));

  /* ---- Beds ---- */
  const addBed = () =>
    updateGh({
      beds: gh.beds.concat({
        id: uid(),
        name: `Strat #${gh.beds.length + 1}`,
        crop: "gol",
        size_m: 1.0,
        path_m: 0.4,
      }),
    });
  const removeBed = (id) =>
    updateGh({ beds: gh.beds.filter((b) => b.id !== id) });
  const setBed = (id, patch) =>
    updateGh({
      beds: gh.beds.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    });

  const addSensor = (pos) => {
    const created = {
      id: uid(),
      name: `Senzor #${(gh.sensors?.length || 0) + 1}`,
      x_m: pos?.x_m ?? Number((gh.lungime_m / 2).toFixed(2)),
      y_m: pos?.y_m ?? Number((gh.latime_m / 2).toFixed(2)),
    };
    updateGh({ sensors: [...(gh.sensors || []), created] });
    return created.id; // ← avem id-ul noului senzor
  };
  const setSensor = (id, patch) =>
    updateGh({
      sensors: (gh.sensors || []).map((s) =>
        s.id === id ? { ...s, ...patch } : s
      ),
    });

  const deleteSensor = (id) =>
    updateGh({ sensors: (gh.sensors || []).filter((s) => s.id !== id) });

  if (!gh) {
    return (
      <div className="gh-layout">
        <SidebarList
          greenhouses={greenhouses}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdd={addGreenhouse}
          onDelete={deleteGreenhouse}
        />
        <div className="gh-empty">Nu există nicio seră. Adaugă una nouă.</div>
      </div>
    );
  }

  return (
    <div className="gh-page">
      <GreenhouseHeader
        greenhouses={greenhouses}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAdd={addGreenhouse}
        onDelete={deleteGreenhouse}
      />

      <div className="gh-main">
        <div className="gh-canvas-col">
          <div className="gh-editor">
            <div className="gh-toolbar">
              <button
                aria-label="Micșorează zoom"
                onClick={() =>
                  updateGh({ zoom: Math.max(0.5, (gh.zoom || 1) - 0.1) })
                }
              >
                −
              </button>
              <span className="zoom">{Math.round((gh.zoom || 1) * 100)}%</span>
              <button
                aria-label="Mărește zoom"
                onClick={() =>
                  updateGh({ zoom: Math.min(2, (gh.zoom || 1) + 0.1) })
                }
              >
                ＋
              </button>
            </div>

            <Canvas
              gh={gh}
              usage={usage}
              crops={crops}
              onUpdate={updateGh}
              addSensor={addSensor}
              setSensor={setSensor}
              deleteSensor={deleteSensor}
            />
            <Legend crops={crops} />
          </div>
        </div>

        <div className="gh-props-col">
          <PropertiesPanel
            gh={gh}
            usage={usage}
            crops={crops}
            onChange={updateGh}
            addBed={addBed}
            removeBed={removeBed}
            setBed={setBed}
            addCrop={addCrop}
            setCropField={setCropField}
            deleteCrop={deleteCrop}
            /* 👇 nou: manager senzori */
            addSensor={addSensor}
            setSensor={setSensor}
            deleteSensor={deleteSensor}
          />
        </div>
      </div>
    </div>
  );
}

/* ===================== Canvas ===================== */
function Canvas({
  gh,
  usage,
  crops,
  onUpdate,
  addSensor,
  setSensor,
  deleteSensor,
}) {
  const zoom = gh.zoom || 1;
  const isVertical = gh.layoutDir === "vertical";

  // interacțiuni canvas
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draggingPan, setDraggingPan] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [dragSensorId, setDragSensorId] = useState(null);

  const [isInteractive, setInteractive] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : false
  );
  const wrapRef = useRef(null);
  const svgRef = useRef(null);

  // Centrează conținutul (cu zoom-ul curent) în viewport-ul SVG
  const recenter = () => {
    // centrare perfectă în coordonate SVG, indiferent de mărimea wrapper-ului
    const target = {
      x: (baseW * (1 - zoom)) / 2,
      y: (baseH * (1 - zoom)) / 2,
    };
    setPan((p) =>
      Math.abs(p.x - target.x) > 0.5 || Math.abs(p.y - target.y) > 0.5
        ? target
        : p
    );
  };

  // Potrivește conținutul la viewport, apoi centrează
  const fitToView = () => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    // spațiul disponibil în container (scădem înălțimea uneltelor locale)
    const tools = wrap.querySelector(".gh-canvas-tools");
    const toolsH = tools ? tools.offsetHeight : 44;
    const availW = wrap.clientWidth;
    const availH = Math.max(0, wrap.clientHeight - toolsH);

    // cât trebuie micșorat ca să încapă toată scena (fără a trece peste 100%)
    const downscale = Math.min(availW / baseW, availH / baseH);
    const targetZoom = Math.min(1, downscale); // nu trece peste 100%
    const clamped = Math.max(0.5, Math.min(2, targetZoom)); // respectă limitele app-ului

    onUpdate?.({ zoom: clamped });
    requestAnimationFrame(recenter);
  };
  useEffect(() => {
    const onResize = () => setInteractive(window.innerWidth >= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const dims = useMemo(() => {
    const baseW = Math.max(1, Number(gh.lungime_m)) * PPM;
    const baseH = Math.max(1, Number(gh.latime_m)) * PPM;
    const INNER_PAD = 5;
    return {
      baseW,
      baseH,
      pad: INNER_PAD,
      innerW: baseW - INNER_PAD * 2,
      innerH: baseH - INNER_PAD * 2,
    };
  }, [gh.lungime_m, gh.latime_m]);

  const bandPx = (m) => Math.max(0, Number(m) || 0) * PPM;

  const segments = useMemo(() => {
    const { innerW, innerH, pad } = dims;
    const usedPx = gh.beds.reduce((acc, b, i) => {
      acc += bandPx(b.size_m);
      if (i < gh.beds.length - 1) acc += bandPx(b.path_m);
      return acc;
    }, 0);
    const axisSpan = isVertical ? innerW : innerH;
    const offset = Math.max(0, (axisSpan - usedPx) / 2);

    let cursor = offset;
    return gh.beds.map((b, i) => {
      const thick = bandPx(b.size_m);
      const gap = i < gh.beds.length - 1 ? bandPx(b.path_m) : 0;

      if (isVertical) {
        const w = Math.max(0, Math.min(thick, innerW - cursor + 0.001));
        const x = dims.pad + cursor;
        const y = dims.pad;
        const h = innerH;
        const labelX = x + w / 2;
        const labelY = y + 24;
        cursor += thick + gap;
        return { x, y, w, h, labelX, labelY, b };
      } else {
        const h = Math.max(0, Math.min(thick, innerH - cursor + 0.001));
        const x = dims.pad;
        const y = dims.pad + cursor;
        const w = innerW;
        const labelX = x + w / 2;
        const labelY = y + 24;
        cursor += thick + gap;
        return { x, y, w, h, labelX, labelY, b };
      }
    });
  }, [gh.beds, dims, isVertical]);

  const { baseW, baseH, pad, innerW, innerH } = dims;
  useEffect(() => {
    recenter();
  }, [zoom, baseW, baseH]);
  // util: conversii m <-> px (sistemul nostru: x pe lungime, y pe lățime)
  const mToPx = (x_m, y_m) => ({
    x: pad + (Number(x_m) || 0) * PPM,
    y: pad + (Number(y_m) || 0) * PPM,
  });
  const pxToM = (x_px, y_px) => ({
    x_m: +(Math.max(0, Math.min(innerW, x_px - pad)) / PPM).toFixed(2),
    y_m: +(Math.max(0, Math.min(innerH, y_px - pad)) / PPM).toFixed(2),
  });

  // pan (numai pe desktop/tablet)
  const onBgPointerDown = (e) => {
    if (!isInteractive || placing) return;
    setDraggingPan(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.dataset.panStartX = e.clientX;
    e.currentTarget.dataset.panStartY = e.clientY;
    e.currentTarget.dataset.panOrigX = pan.x;
    e.currentTarget.dataset.panOrigY = pan.y;
  };
  const onBgPointerMove = (e) => {
    if (!draggingPan) return;
    const sx = +e.currentTarget.dataset.panStartX;
    const sy = +e.currentTarget.dataset.panStartY;
    const ox = +e.currentTarget.dataset.panOrigX;
    const oy = +e.currentTarget.dataset.panOrigY;

    const rect = svgRef.current?.getBoundingClientRect();
    const rX = (rect?.width || 1) / baseW; // px per unit (X)
    const rY = (rect?.height || 1) / baseH; // px per unit (Y)

    setPan({
      x: ox + (e.clientX - sx) / rX,
      y: oy + (e.clientY - sy) / rY,
    });
  };
  const onBgPointerUp = (e) => {
    setDraggingPan(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // click pentru adăugare senzor (în modul „Plasează senzori”)
  const onCanvasClick = (e) => {
    if (!placing) return;

    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    const loc = pt.matrixTransform(ctm.inverse());

    const x = (loc.x - pan.x) / zoom;
    const y = (loc.y - pan.y) / zoom;
    const { x_m, y_m } = pxToM(x, y);

    // adaugă direct în poziția apăsată
    addSensor({ x_m, y_m });
  };

  // drag senzori
  const onSensorPointerDown = (id) => (e) => {
    if (!isInteractive) return;
    setDragSensorId(id);
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.dataset.dragStartX = e.clientX;
    e.currentTarget.dataset.dragStartY = e.clientY;
    e.currentTarget.dataset.startX = e.currentTarget.dataset.cx;
    e.currentTarget.dataset.startY = e.currentTarget.dataset.cy;
  };
  const onSensorPointerMove = (id) => (e) => {
    if (dragSensorId !== id) return;

    const sx = +e.currentTarget.dataset.dragStartX;
    const sy = +e.currentTarget.dataset.dragStartY;
    const cx0 = +e.currentTarget.dataset.startX; // în unități SVG
    const cy0 = +e.currentTarget.dataset.startY;

    const rect = svgRef.current?.getBoundingClientRect();
    const rX = (rect?.width || 1) / baseW; // px per unit
    const rY = (rect?.height || 1) / baseH;

    // Δuser = Δpx / (px-per-unit * zoom)
    const dxUser = (e.clientX - sx) / (rX * zoom);
    const dyUser = (e.clientY - sy) / (rY * zoom);

    const newX = cx0 + dxUser;
    const newY = cy0 + dyUser;

    const { x_m, y_m } = pxToM(newX, newY);
    setSensor(id, { x_m, y_m });
  };

  const onSensorPointerUp = (e) => {
    setDragSensorId(null);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div
      ref={wrapRef}
      className={`gh-canvas-wrap ${usage?.overflow ? "is-overflow" : ""}`}
    >
      {/* mini-toolbar locală pentru canvas */}
      <div className="gh-canvas-tools">
        <button
          className={`btn ${placing ? "btn-success" : ""}`}
          onClick={() => setPlacing((v) => !v)}
          title="Plasează senzori pe hartă"
        >
          📍 Plasează senzori
        </button>
        <button className="btn" onClick={recenter}>
          Re-centrează
        </button>
        <button className="btn hide-sm" onClick={fitToView}>
          Potrivește
        </button>
      </div>

      <svg
        ref={svgRef}
        className="gh-canvas"
        viewBox={`0 0 ${baseW} ${baseH}`}
        style={{ width: "100%", height: "auto" }}
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={onBgPointerDown}
        onPointerMove={onBgPointerMove}
        onPointerUp={onBgPointerUp}
        onClick={onCanvasClick}
      >
        {/* grilă performantă */}
        <defs>
          <pattern
            id="gh-grid"
            width={PPM}
            height={PPM}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${PPM} 0 L 0 0 0 ${PPM}`}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {/* tot conținutul „scenei” intră în acest <g> cu pan+zoom */}
        <g transform={`matrix(${zoom},0,0,${zoom},${pan.x},${pan.y})`}>
          <rect x="0" y="0" width={baseW} height={baseH} fill="url(#gh-grid)" />

          {/* rama serei */}
          <rect
            x={pad}
            y={pad}
            width={innerW}
            height={innerH}
            rx={8}
            className="frame"
          />

          {/* straturi */}
          {segments.map(({ x, y, w, h, labelX, labelY, b }) =>
            w > 0 && h > 0 ? (
              <g key={b.id}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill={crops[b.crop]?.color || "#ccc"}
                  className="bed"
                  rx={8}
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  className="bed-label"
                >
                  {b.name}
                </text>
              </g>
            ) : null
          )}

          {/* senzori */}
          <g className="sensors-layer">
            {(gh.sensors || []).map((s) => {
              const { x, y } = mToPx(s.x_m, s.y_m);
              // poziția pe grupul cu pan -> salvăm în data-* pt drag
              const cx = x,
                cy = y;
              return (
                <g key={s.id} transform={`translate(${cx},${cy})`}>
                  <circle
                    r="8"
                    className={`sensor-dot ${
                      dragSensorId === s.id ? "drag" : ""
                    }`}
                    data-cx={cx}
                    data-cy={cy}
                    onPointerDown={onSensorPointerDown(s.id)}
                    onPointerMove={onSensorPointerMove(s.id)}
                    onPointerUp={onSensorPointerUp}
                  />
                  <text y="-12" textAnchor="middle" className="sensor-label">
                    {s.name}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
}

/* ===================== Sidebar list ===================== */
function SidebarList({ greenhouses, selectedId, onSelect, onAdd, onDelete }) {
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
            <button
              className="del"
              title="Șterge"
              onClick={() => onDelete(g.id)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/* ===================== Properties Panel ===================== */
function PropertiesPanel({
  gh,
  usage,
  crops,
  onChange,
  addBed,
  removeBed,
  setBed,
  addCrop,
  setCropField,
  deleteCrop,
  addSensor,
  setSensor,
  deleteSensor, // ⬅️ nou
}) {
  const cropEntries = sortCrops(crops);

  return (
    <aside className="gh-props">
      <label>Nume seră</label>
      <input
        value={gh.name}
        onChange={(e) => onChange({ name: e.target.value })}
      />

      <div className="row">
        <div>
          <label>Lățime (m)</label>
          <input
            type="number"
            step="0.1"
            value={gh.latime_m}
            onChange={(e) =>
              onChange({ latime_m: Number(e.target.value || 0) })
            }
          />
        </div>
        <div>
          <label>Lungime (m)</label>
          <input
            type="number"
            step="0.1"
            value={gh.lungime_m}
            onChange={(e) =>
              onChange({ lungime_m: Number(e.target.value || 0) })
            }
          />
        </div>
      </div>

      <label>Orientare</label>
      <select
        value={gh.orientare}
        onChange={(e) => onChange({ orientare: e.target.value })}
      >
        {ORIENTARI.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      <label>Direcție straturi</label>
      <select
        value={gh.layoutDir}
        onChange={(e) => onChange({ layoutDir: e.target.value })}
      >
        <option value="vertical">Verticale (benzi pe lungime)</option>
        <option value="horizontal">Orizontale (benzi pe lățime)</option>
      </select>

      {/* Indicator spațiu */}
      <div className={`usage ${usage?.overflow ? "bad" : ""}`}>
        <div className="row">
          <span>
            Disponibil pe lățime: <b>{usage.available} m</b>
          </span>
          <span>
            Folosit: <b>{usage.used.toFixed(2)} m</b>
          </span>
          {usage.overflow ? (
            <span className="warn">
              Depășești cu {Math.abs(usage.remaining).toFixed(2)} m
            </span>
          ) : (
            <span>
              Rămas: <b>{usage.remaining.toFixed(2)} m</b>
            </span>
          )}
        </div>
        <div className="bar">
          <div
            style={{
              width: `${Math.min(
                100,
                (usage.used / Math.max(usage.available, 0.0001)) * 100
              )}%`,
            }}
          />
        </div>
      </div>

      {/* Straturi */}
      <div className="split">
        <h4>Straturi</h4>
        <button onClick={addBed}>+ Adaugă strat</button>
      </div>

      <div className="beds">
        {gh.beds.map((b) => (
          <div key={b.id} className="bed-row">
            <input
              className="bed-name"
              value={b.name}
              onChange={(e) => setBed(b.id, { name: e.target.value })}
            />
            <select
              className="bed-crop"
              value={b.crop}
              onChange={(e) => setBed(b.id, { crop: e.target.value })}
            >
              {cropEntries.map(([k, v]) => (
                <option key={k} value={k}>
                  {v.name}
                </option>
              ))}
            </select>

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

            <button className="del" onClick={() => removeBed(b.id)}>
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Manager culturi */}
      <hr className="gh-sep" />
      <div className="split">
        <h4>Senzori</h4>
        <button onClick={addSensor}>+ Adaugă senzor</button>
      </div>

      <div className="beds">
        {(gh.sensors || []).map((s) => (
          <div key={s.id} className="bed-row">
            <input
              className="bed-name"
              value={s.name}
              onChange={(e) => setSensor(s.id, { name: e.target.value })}
            />
            <div className="bed-size">
              <input
                type="number"
                step="0.1"
                value={s.x_m}
                onChange={(e) =>
                  setSensor(s.id, { x_m: Number(e.target.value || 0) })
                }
              />
              <span>x (m)</span>
            </div>
            <div className="bed-path">
              <input
                type="number"
                step="0.1"
                value={s.y_m}
                onChange={(e) =>
                  setSensor(s.id, { y_m: Number(e.target.value || 0) })
                }
              />
              <span>y (m)</span>
            </div>
            <button className="del" onClick={() => deleteSensor(s.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}

/* ===================== Legend ===================== */
function Legend({ crops }) {
  const cropEntries = sortCrops(crops);
  return (
    <div className="gh-legend">
      {cropEntries.map(([key, val]) => (
        <span key={key} className="legend-item">
          <i style={{ background: val.color }} /> {val.name}
        </span>
      ))}
    </div>
  );
}

/* ===================== Header ===================== */
function GreenhouseHeader({
  greenhouses,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
}) {
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
        <span className="gh-logo">B</span>
        <h1>Harta serelor — Editor</h1>
      </div>

      <div className="gh-header-actions" ref={ref}>
        <button
          className="btn btn-success hide-sm"
          onClick={onAdd}
          aria-label="Adaugă seră"
        >
          + Adaugă
        </button>

        <button
          className="btn btn-success dd-trigger"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          title={current?.name}
          type="button"
        >
          <span className="dd-current" aria-live="polite">
            {current?.name ?? "Alege seră"}
          </span>
        </button>

        {open && (
          <div className="dd-menu" role="listbox" tabIndex={-1}>
            <div className="dd-list">
              {greenhouses.length === 0 && (
                <div className="dd-empty">Nu ai sere încă.</div>
              )}
              {greenhouses.map((g) => (
                <div
                  key={g.id}
                  className={`dd-item ${g.id === selectedId ? "active" : ""}`}
                  role="option"
                  aria-selected={g.id === selectedId}
                >
                  <button className="dd-label" onClick={() => choose(g.id)}>
                    {g.name}
                  </button>
                  <button
                    className="dd-del"
                    title="Șterge"
                    onClick={() => onDelete(g.id)}
                    aria-label={`Șterge ${g.name}`}
                  >
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
                }}
              >
                + Adaugă seră nouă
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
