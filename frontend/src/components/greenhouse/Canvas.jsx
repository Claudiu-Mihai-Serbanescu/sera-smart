// src/components/greenhouse/Canvas.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { PPM } from "./gh-shared";

/** Desaturează/înluminează o culoare pentru un look mai „soft”. */
function tint(hex, k = 0.35) {
  if (!hex || typeof hex !== "string") return "#cfcfcf";
  const n = hex.replace("#", "");
  const v = (i, len = 2) => parseInt(n.length === 3 ? n[i] + n[i] : n.slice(i, i + len), 16);
  const toH = (x) =>
    Math.max(0, Math.min(255, Math.round(x)))
      .toString(16)
      .padStart(2, "0");
  const r = v(0),
    g = v(2),
    b = v(4);
  const mix = (c) => c + (255 - c) * k;
  return `#${toH(mix(r))}${toH(mix(g))}${toH(mix(b))}`;
}

export default function Canvas({ gh, usage, crops, onUpdate, addSensor, setSensor, deleteSensor }) {
  const zoom = gh.zoom || 1;

  // === mobil vs desktop
  const [isNarrow, setIsNarrow] = useState(typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const cb = (e) => setIsNarrow(e.matches);
    mq.addEventListener?.("change", cb);
    setIsNarrow(mq.matches);
    return () => mq.removeEventListener?.("change", cb);
  }, []);

  // 'horizontal' | 'vertical' | 'auto'  (pe auto -> vertical pe mobil)
  const layoutPref = gh.layoutDir || "auto";
  const isVertical = layoutPref === "vertical" || (layoutPref !== "horizontal" && isNarrow);

  // interacțiuni pan/drag
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draggingPan, setDraggingPan] = useState(false);
  const [isInteractive, setInteractive] = useState(typeof window !== "undefined" ? window.innerWidth >= 768 : false);
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const pressTimers = useRef({});

  // dimensiuni scenă (1m = PPM)
  const { baseW, baseH, pad, innerW, innerH } = useMemo(() => {
    const baseW = Math.max(1, Number(gh.lungime_m)) * PPM;
    const baseH = Math.max(1, Number(gh.latime_m)) * PPM;
    const pad = 12;
    return { baseW, baseH, pad, innerW: baseW - pad * 2, innerH: baseH - pad * 2 };
  }, [gh.lungime_m, gh.latime_m]);

  // raport pentru container (mereu L / l – nu îl inversăm)
  const arW = Math.max(1, +gh.lungime_m || 1);
  const arH = Math.max(1, +gh.latime_m || 1);

  // conversii
  const mToPx = (x_m, y_m) => ({
    x: pad + (Number(x_m) || 0) * PPM,
    y: pad + (Number(y_m) || 0) * PPM,
  });
  const pxToMClamped = (x_px, y_px) => ({
    x_m: +(Math.max(0, Math.min(innerW, x_px - pad)) / PPM).toFixed(2),
    y_m: +(Math.max(0, Math.min(innerH, y_px - pad)) / PPM).toFixed(2),
  });

  // fit + recentrare
  const recenter = () => {
    const target = { x: (baseW * (1 - zoom)) / 2, y: (baseH * (1 - zoom)) / 2 };
    setPan((p) => (Math.abs(p.x - target.x) > 0.5 || Math.abs(p.y - target.y) > 0.5 ? target : p));
  };
  const fitToView = () => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const availW = wrap.clientWidth;
    const availH = wrap.clientHeight;
    const downscale = Math.min(availW / baseW, availH / baseH);
    const targetZoom = Math.min(1, downscale);
    const clamped = Math.max(0.5, Math.min(2, targetZoom));
    onUpdate?.({ zoom: clamped });
    requestAnimationFrame(recenter);
  };

  useEffect(() => {
    const onResize = () => {
      setInteractive(window.innerWidth >= 768);
      fitToView();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []); // eslint-disable-line

  useEffect(() => {
    fitToView();
  }, [baseW, baseH]); // eslint-disable-line

  useEffect(() => {
    recenter();
  }, [zoom]); // eslint-disable-line

  useEffect(() => {
    fitToView();
  }, [isVertical]); // refit când schimbă orientarea

  // ===== segmente straturi =====
  const bandPx = (m) => Math.max(0, Number(m) || 0) * PPM;

  const segments = useMemo(() => {
    // suma grosimi (strat + cărări)
    const totalBase = gh.beds.reduce((acc, b, i) => {
      acc += bandPx(b.size_m);
      if (i < gh.beds.length - 1) acc += bandPx(b.path_m);
      return acc;
    }, 0);

    // pe vertical: SCALĂM să umplem 100% din lățime; pe orizontal: centrat
    const scale = isVertical && totalBase > 0 ? innerW / totalBase : 1;
    const offsetH = !isVertical ? Math.max(0, (innerH - totalBase) / 2) : 0;

    const rtl = true; // ancorare de la dreapta spre stânga pe vertical
    let cursor = isVertical ? 0 : offsetH;

    return gh.beds.map((b, i) => {
      const thickBase = bandPx(b.size_m);
      const gapBase = i < gh.beds.length - 1 ? bandPx(b.path_m) : 0;

      if (isVertical) {
        const w = Math.max(0, Math.min(thickBase * scale, innerW - cursor + 0.001));
        const x = pad + (rtl ? innerW - cursor - w : cursor);
        const y = pad;
        const h = innerH;
        const labelX = x + w / 2;
        const labelY = y + 28;
        cursor += thickBase * scale + gapBase * scale;
        return { x, y, w, h, labelX, labelY, b };
      }

      // orizontal – la fel ca înainte (centrat)
      const h = Math.max(0, Math.min(thickBase, innerH - cursor + 0.001));
      const x = pad;
      const y = pad + cursor;
      const w = innerW;
      const labelX = x + w / 2;
      const labelY = y + Math.min(28, h / 2 + 10);
      cursor += thickBase + gapBase;
      return { x, y, w, h, labelX, labelY, b };
    });
  }, [gh.beds, innerW, innerH, isVertical, pad]);

  // coordonate scene pentru interacțiuni
  const clientToScene = (e) => {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    const loc = pt.matrixTransform(ctm.inverse());
    return { x: (loc.x - pan.x) / zoom, y: (loc.y - pan.y) / zoom };
  };

  // pan pe fundal
  const onBgPointerDown = (e) => {
    if (!isInteractive) return;
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
    const rX = (rect?.width || 1) / baseW;
    const rY = (rect?.height || 1) / baseH;

    setPan({ x: ox + (e.clientX - sx) / rX, y: oy + (e.clientY - sy) / rY });
  };
  const onBgPointerUp = () => setDraggingPan(false);

  // dublu-click adaugă senzor
  const onDoubleClick = (e) => {
    const { x, y } = clientToScene(e);
    const { x_m, y_m } = pxToMClamped(x, y);
    addSensor?.({ x_m, y_m });
  };

  // ștergere senzor
  const confirmDelete = () => window.confirm("Ștergi acest senzor?");
  const askDelete = (id) => {
    if (confirmDelete()) deleteSensor?.(id);
  };

  // drag + long-press + dublu-click + click dreapta
  const onSensorPointerDown = (id) => (e) => {
    if (!isInteractive) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.dataset.dragStartX = e.clientX;
    e.currentTarget.dataset.dragStartY = e.clientY;
    e.currentTarget.dataset.startX = e.currentTarget.dataset.cx;
    e.currentTarget.dataset.startY = e.currentTarget.dataset.cy;

    pressTimers.current[id] = setTimeout(() => {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      askDelete(id);
    }, 650);
  };
  const onSensorPointerMove = (id) => (e) => {
    clearTimeout(pressTimers.current[id]);
    if (!e.currentTarget.hasPointerCapture?.(e.pointerId)) return;

    const sx = +e.currentTarget.dataset.dragStartX;
    const sy = +e.currentTarget.dataset.dragStartY;
    const cx0 = +e.currentTarget.dataset.startX;
    const cy0 = +e.currentTarget.dataset.startY;

    const rect = svgRef.current?.getBoundingClientRect();
    const rX = (rect?.width || 1) / baseW;
    const rY = (rect?.height || 1) / baseH;

    const dxUser = (e.clientX - sx) / (rX * zoom);
    const dyUser = (e.clientY - sy) / (rY * zoom);
    const newX = cx0 + dxUser;
    const newY = cy0 + dyUser;

    const { x_m, y_m } = pxToMClamped(newX, newY);
    setSensor?.(id, { x_m, y_m });
  };
  const onSensorPointerUp = (id) => () => clearTimeout(pressTimers.current[id]);
  const onSensorDoubleClick = (id) => () => askDelete(id);
  const onSensorContextMenu = (id) => (e) => {
    e.preventDefault();
    askDelete(id);
  };

  // rigle
  const lenExact = Math.max(0, Number(gh.lungime_m) || 0);
  const widExact = Math.max(0, Number(gh.latime_m) || 0);

  const xTicks = useMemo(() => {
    if (lenExact <= 0) return [];
    const whole = Math.floor(lenExact);
    const hasFrac = Math.abs(lenExact - whole) > 1e-6;
    const arr = Array.from({ length: whole + 1 }, (_, i) => ({
      v: i,
      x: pad + (i / lenExact) * innerW,
      frac: false,
    }));
    if (hasFrac) arr.push({ v: lenExact, x: pad + innerW, frac: true });
    return arr;
  }, [lenExact, innerW, pad]);

  const yTicks = useMemo(() => {
    if (widExact <= 0) return [];
    const whole = Math.floor(widExact);
    const hasFrac = Math.abs(widExact - whole) > 1e-6;
    const arr = Array.from({ length: whole + 1 }, (_, i) => ({
      v: i,
      y: pad + (i / widExact) * innerH,
      frac: false,
    }));
    if (hasFrac) arr.push({ v: widExact, y: pad + innerH, frac: true });
    return arr;
  }, [widExact, innerH, pad]);

  const fmtTick = (v) => (Number.isInteger(v) ? v : +v.toFixed(1));

  // wrapper: ocupă lățimea containerului, fără spații mari dedesubt
  return (
    <div
      ref={wrapRef}
      className={`gh-canvas-wrap ${usage?.overflow ? "is-overflow" : ""}`}
      aria-label="Hartă seră"
      style={{
        width: "100%",
        aspectRatio: `${arW} / ${arH}`,
        minHeight: "140px",
        height: "auto",
      }}>
      <svg
        ref={svgRef}
        className={["gh-canvas", draggingPan ? "is-grabbing" : ""].join(" ")}
        viewBox={`0 0 ${baseW} ${baseH}`}
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={onBgPointerDown}
        onPointerMove={onBgPointerMove}
        onPointerUp={onBgPointerUp}
        onDoubleClick={onDoubleClick}>
        <defs>
          <pattern id="gh-grid" width={PPM} height={PPM} patternUnits="userSpaceOnUse">
            <path d={`M ${PPM} 0 L 0 0 0 ${PPM}`} fill="none" stroke="#e5e7eb" strokeWidth="1" opacity="0.25" vectorEffect="non-scaling-stroke" />
          </pattern>
        </defs>

        {/* grilă + ramă */}
        <rect x="0" y="0" width={baseW} height={baseH} fill="url(#gh-grid)" />
        <rect x={pad} y={pad} width={innerW} height={innerH} rx={12} className="frame" />

        {/* riglă sus */}
        {xTicks.map((t, idx) => (
          <g key={`xt-${idx}`}>
            <line x1={t.x} y1={pad} x2={t.x} y2={pad + 5} className="ruler-line" />
            <text x={t.x} y={pad - 5} className="ruler-text" textAnchor={t.frac ? "end" : "middle"}>
              {fmtTick(t.v)}
            </text>
          </g>
        ))}

        {/* riglă stânga */}
        {yTicks.map((t, idx) => (
          <g key={`yt-${idx}`}>
            <line x1={pad} y1={t.y} x2={pad + 5} y2={t.y} className="ruler-line" />
            <text x={pad - 6} y={t.y + 3} className="ruler-text" textAnchor="end">
              {fmtTick(t.v)}
            </text>
          </g>
        ))}

        {/* straturi */}
        {segments.map(({ x, y, w, h, labelX, labelY, b }) =>
          w > 0 && h > 0 ? (
            <g key={b.id}>
              <rect x={x} y={y} width={w} height={h} fill={tint(crops[b.crop]?.color, 0.35)} className="bed" rx={0} />
              <text x={labelX} y={labelY} textAnchor="middle" className="bed-crop">
                {crops[b.crop]?.name || b.crop}
              </text>
              <text x={labelX} y={labelY + 18} textAnchor="middle" className="bed-name">
                {b.name}
              </text>
            </g>
          ) : null
        )}

        {/* senzori */}
        <g className="sensors-layer">
          {(gh.sensors || []).map((s) => {
            const { x, y } = mToPx(s.x_m, s.y_m);
            return (
              <g key={s.id} transform={`translate(${x},${y})`}>
                <circle
                  r="8"
                  className="sensor-dot"
                  data-cx={x}
                  data-cy={y}
                  onPointerDown={onSensorPointerDown(s.id)}
                  onPointerMove={onSensorPointerMove(s.id)}
                  onPointerUp={onSensorPointerUp(s.id)}
                  onDoubleClick={onSensorDoubleClick(s.id)}
                  onContextMenu={onSensorContextMenu(s.id)}
                />
                <text y="-12" textAnchor="middle" className="sensor-label">
                  {s.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
