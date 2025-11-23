// src/pages/vreme-harta/SereMap.jsx
import { useMemo } from "react";
import { useGreenhouse } from "../../components/GreenhouseContext";

const PALETTES = {
  rosii: ["#ef4444", "#f87171"],
  roșii: ["#ef4444", "#f87171"],
  castraveti: ["#10b981", "#34d399"],
  castraveți: ["#10b981", "#34d399"],
  ardei: ["#f59e0b", "#fbbf24"],
  spanac: ["#22c55e", "#86efac"],
};

const norm = (s) =>
  (s ?? "")
    .toString()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

export default function SereMap({ sereData = [], selectedSeraId, onSelect }) {
  const { selected, selectSmart } = useGreenhouse();

  // cheile active din context/prop (în componentă, nu sus!)
  const activeIdKey = norm(selected?.id ?? selectedSeraId ?? "");
  const activeNameKey = norm(selected?.name ?? "");

  const { maxL, maxW } = useMemo(
    () => ({
      maxL: Math.max(1, ...sereData.map((s) => Number(s.lungime) || 0)),
      maxW: Math.max(1, ...sereData.map((s) => Number(s.latime) || 0)),
    }),
    [sereData]
  );

  const handleClick = (sera) => {
    // încearcă pe id, apoi pe nume (acoperă ambele seturi de date)
    selectSmart?.(sera.id);
    selectSmart?.(sera.nume);
    onSelect?.(sera.id);
  };

  return (
    <div className="map-shell">
      <div className="map-canvas">
        <div className="gh-list">
          {sereData.map((sera) => {
            const widthPct = (Number(sera.lungime) / maxL) * 100;
            const hPx = 28 + (Number(sera.latime) / maxW) * 5;
            const pal = PALETTES[sera.cultura] || PALETTES[norm(sera.cultura)] || ["#9ca3af", "#d1d5db"];

            const itemIdKey = norm(sera.id);
            const itemNameKey = norm(sera.nume);

            // activ dacă se potrivește după id SAU nume
            const selectedHere =
              (!!activeIdKey && (itemIdKey === activeIdKey || itemNameKey === activeIdKey)) || (!!activeNameKey && (itemNameKey === activeNameKey || itemIdKey === activeNameKey));

            return (
              <button
                key={sera.id ?? itemNameKey}
                type="button"
                className={`gh-item ${selectedHere ? "is-active" : ""}`}
                data-selected={selectedHere ? "true" : "false"}
                aria-pressed={!!selectedHere}
                data-debug={`aid:${activeIdKey}|an:${activeNameKey}|sid:${itemIdKey}|sn:${itemNameKey}`}
                style={{
                  width: `${widthPct}%`,
                  height: `${hPx}px`,
                  "--gh-color": pal[0],
                  cursor: "pointer",
                }}
                onClick={() => handleClick(sera)}
                title={`${sera.nume} • ${sera.cultura} • ${sera.suprafata ?? Math.round((Number(sera.lungime) || 0) * (Number(sera.latime) || 0))} m²`}>
                <span className="gh-dot" />
                <span className="gh-name">{sera.nume}</span>
                <span className="gh-meta">
                  {sera.cultura} · {sera.suprafata ?? Math.round((Number(sera.lungime) || 0) * (Number(sera.latime) || 0))} m²
                </span>
              </button>
            );
          })}
        </div>
        <div className="map-overlay-grid" aria-hidden style={{ pointerEvents: "none" }} />
      </div>
    </div>
  );
}
