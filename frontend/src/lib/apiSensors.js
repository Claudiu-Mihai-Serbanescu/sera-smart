// src/lib/apiSensors.js
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const BOARD_ID = import.meta.env.VITE_BOARD_ID || "e663ac91d3824a2c";

// ultimul rând (snapshot)
export async function getLatest() {
  const url = new URL(`${API_BASE}/api/sensors/latest`, window.location.origin);
  url.searchParams.set("boardId", BOARD_ID);
  url.searchParams.set("_", Date.now().toString());
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json(); // ex: {TEMPAER, UMDTAER,..., STIMEACQ}
}

// istoric pentru un câmp (TEMPAER/UMDTAER/etc.)
export async function getHistory(fieldDb, range = "24h") {
  const url = new URL(`${API_BASE}/api/sensors/history`, window.location.origin);
  url.searchParams.set("boardId", BOARD_ID);
  url.searchParams.set("key", fieldDb);     // ex: TEMPAER
  url.searchParams.set("range", range);     // 24h | 3d | 7d | 30d | 90d
  url.searchParams.set("_", Date.now().toString());
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();

  // normalizare la [{t: Date|string, v: number}]
  const raw = Array.isArray(json?.data) ? json.data : [];
  if (!raw.length) return [];
  if ("ts" in raw[0] && "val" in raw[0]) {
    return raw.map(p => ({ t: p.ts, v: Number(p.val) }));
  }
  if ("STIMEACQ" in raw[0]) {
    return raw.map(r => ({ t: r.STIMEACQ, v: Number(r[fieldDb]) }));
  }
  return [];
}

// pachet dublu (pt. grafic Temp vs Umid)
export async function getTempHumHistory(range = "24h") {
  const [t, h] = await Promise.all([
    getHistory("TEMPAER", range),
    getHistory("UMDTAER", range),
  ]);
  // aliniere brută pe index (presupunem aceleași puncte ~)
  const len = Math.min(t.length, h.length);
  return Array.from({ length: len }).map((_, i) => ({
    t: new Date(t[i].t),
    temp: Number(t[i].v),
    hum: Number(h[i].v),
  }));
}
