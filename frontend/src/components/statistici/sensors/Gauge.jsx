// src/components/sensors/Gauge.jsx
import React, { useMemo } from "react";
import { SEGMENTS, angleFor, arcPath, polar } from "./gaugeTheme";

/* triunghi pentru ac */
function trianglePath(cx, cy, rTip, rBase, angDeg, widthDeg) {
  const tip = polar(cx, cy, rTip, angDeg);
  const b1 = polar(cx, cy, rBase, angDeg - widthDeg / 2);
  const b2 = polar(cx, cy, rBase, angDeg + widthDeg / 2);
  return `M ${b1.x} ${b1.y} L ${tip.x} ${tip.y} L ${b2.x} ${b2.y} Z`;
}

/* culoare pentru tick-ul numeric (după segmentul în care cade) */
function colorForTick(v, segments) {
  const s = segments.find((seg) => v >= seg.from && v <= seg.to);
  return s?.color ?? "#64748b";
}

/* mapare valori ticks -> procente 0..100 (dacă vin în altă scară) */
function toPct(value, ticks) {
  const arr = [...ticks].sort((a, b) => a - b);
  const min = arr[0],
    max = arr[arr.length - 1];
  if (max === min) return 0;
  return ((value - min) / (max - min)) * 100;
}

export default function Gauge({
  percent = 0, // 0..100
  size = 140,
  thickness = 16,
  status = "healthy", // doar pt. glow
  ticks = [], // ex: [40,55,60,70,90,100] sau orice scară
  showTicks = true,
  segments = SEGMENTS,
  showCenter = false, // la noi valoarea vine din card, deci fals
  centerText,
}) {
  const cx = size / 2,
    cy = size / 2;
  const r = size / 2 - 1;

  /* ====== INEL pe segmente, capete drepte + mic gap ====== */
  const GAP_DEG = 1.2;
  const ring = useMemo(
    () =>
      segments.map((s, i) => {
        const a0 = angleFor(s.from) + GAP_DEG / 3;
        const a1 = angleFor(s.to) - GAP_DEG / 3;
        return (
          <path
            key={i}
            d={arcPath(cx, cy, r, a0, a1)}
            stroke={s.color}
            strokeWidth={thickness}
            strokeLinecap="butt"
            strokeLinejoin="miter"
            fill="none"
          />
        );
      }),
    [segments, cx, cy, r, thickness]
  );

  /* ====== DISC ALB + umbră ====== */
  const faceR = r - thickness - 6;
  const glow =
    status === "healthy"
      ? "0 0 20px rgba(25,135,84,.20)"
      : status === "warning"
      ? "0 0 20px rgba(255,193,7,.22)"
      : "0 0 22px rgba(220,53,69,.26)";

  /* ====== SĂGEATĂ ascuțită ====== */
  const pointer = useMemo(() => {
    const pct = Math.max(0, Math.min(100, percent));
    const ang = angleFor(pct);
    const widthDeg = 16;
    const rTip = r + thickness / 2 - 1; // vârful intră puțin în inel
    const rBase = faceR - 2; // baza pe discul alb
    return (
      <path
        d={trianglePath(cx, cy, rTip, rBase, ang, widthDeg)}
        fill="#1f2937"
      />
    );
  }, [percent, cx, cy, r, thickness, faceR]);

  /* ====== TICKS (cifre) ====== */
  const ticksRaw = ticks?.length ? ticks : segments.map((s) => s.to);
  const ticksToUse = Array.from(new Set(ticksRaw)); // unicizează
  const tickFont = Math.max(8, Math.min(18, Math.round(size * 0.1)));
  const outerR = r + thickness / 2;
  const TICK_GAP = 12; // distanța față de inel
  const tickRadius = outerR + TICK_GAP;

  /* ====== viewBox cu pad sus/stânga/dreapta ca să nu taie cifrele ====== */
  const topPad = TICK_GAP + thickness / 2 + 6;
  const sidePad = Math.max(10, Math.round(tickFont * 0.7));
  const vbWidth = size + sidePad * 2;
  const vbHeight = size * 0.62 + topPad;

  return (
    <svg
      width="100%"
      height={vbHeight}
      viewBox={`-${sidePad} -${topPad} ${vbWidth} ${vbHeight}`}
      style={{ overflow: "visible", filter: `drop-shadow(${glow})` }}
      aria-hidden="true"
    >
      {/* inelul colorat */}
      {ring}

      {/* discul alb sub săgeată */}
      <defs>
        <filter id="gFaceShadow" x="-40%" y="-60%" width="200%" height="200%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.28" />
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.18" />
        </filter>
      </defs>
      <circle
        cx={cx}
        cy={cy}
        r={faceR}
        fill="#fff"
        filter="url(#gFaceShadow)"
      />

      {/* săgeata */}
      {pointer}

      {/* (opțional) număr în centru */}
      {showCenter && (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontWeight: 800,
            fill: "#0f172a",
            fontSize: Math.round(size * 0.28),
          }}
        >
          {centerText ?? Math.round(percent)}
        </text>
      )}

      {/* cifre pe exteriorul barei colorate */}
      {showTicks &&
        ticksToUse.length > 0 &&
        ticksToUse.map((t) => {
          // „împingem” capetele cu ~1.8% ca să nu atingă marginea
          const pctClamped = Math.max(
            1.8,
            Math.min(98.2, toPct(t, ticksToUse))
          );
          const a = angleFor(pctClamped);
          const p = polar(cx, cy, tickRadius, a);
          const col = colorForTick(t, segments);
          return (
            <text
              key={String(t)}
              x={p.x}
              y={p.y}
              fontSize={tickFont}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontWeight: 700, fill: col }}
            >
              {t}
            </text>
          );
        })}
    </svg>
  );
}
