// src/lib/sensorsApi.js
const IS_DEV = import.meta.env.DEV;
export const REFRESH_MS = Math.max(1000, Number(import.meta.env.VITE_REFRESH_MS || 10000));

// Permitem override prin .env (VITE_API_BASE=/api). Fallback /api.
const API_BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/$/, "");

/** Construiește URL-ul către API-ul TĂU, nu către colegi. */
function buildUrlSensors(boardId) {
  // Dev sau Prod: chemăm mereu endpointul tău /api/sensors/latest
  const u = new URL(`${API_BASE}/sensors/latest`, window.location.origin);
  u.searchParams.set("boardId", boardId);
  // cache-buster
  u.searchParams.set("_", Date.now());
  return { url: u.toString(), headers: { Accept: "application/json" } };
}

async function fetchJSON(url, init) {
  const res = await fetch(url, { cache: "no-store", ...init });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Nu e JSON: ${text.slice(0, 200)}`);
  }
}

export async function apiLatestRaw(boardId) {
  const { url, headers } = buildUrlSensors(boardId);
  const j = await fetchJSON(url, { headers });
  // suportă atât {data:{...}} cât și {...} direct
  return j?.data ?? j;
}

// --- mock-uri (opțional) ---
const REAL_BOARD = "e663ac91d3824a2c";
const MOCKS = {
  "mock:mirror": { type: "mirror", src: REAL_BOARD, noise: 0.06 },
  "mock:synthetic": { type: "synthetic" },
};
const perturb = (n, p = 0.05) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return n;
  const amp = Math.max(1, Math.abs(x)) * p;
  return +(x + (Math.random() * 2 - 1) * amp).toFixed(2);
};
const noisify = (snap, p = 0.05) => {
  const out = { ...snap };
  ["TEMPAER", "UMDTAER", "UMDTSOL1", "UMDTSOL2", "UMDTSOL3", "UMDTSOL4", "ILUMINARE", "NIVELAPA", "CALITAER"].forEach((k) => {
    if (k in out) out[k] = perturb(out[k], p);
  });
  return out;
};
const syntheticSnapshot = (ts = Date.now()) => {
  const t = ts / 1000;
  const sin = (a, b, c = 0) => a + b * Math.sin(t / 600 + c);
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const hour = new Date(ts).getHours();
  const daylight = ((Math.sin((hour / 24) * 2 * Math.PI - Math.PI / 2) + 1) / 2) * 22000 + 300;
  return {
    TEMPAER: +clamp(sin(26, 6), 18, 38).toFixed(1),
    UMDTAER: +clamp(sin(70, 12, 1), 40, 95).toFixed(0),
    UMDTSOL1: +clamp(sin(55, 10, 0.3), 25, 90).toFixed(0),
    UMDTSOL2: +clamp(sin(50, 12, 0.9), 25, 90).toFixed(0),
    UMDTSOL3: +clamp(sin(52, 11, 1.5), 25, 90).toFixed(0),
    UMDTSOL4: +clamp(sin(48, 9, 2.2), 25, 90).toFixed(0),
    NIVELAPA: +clamp(80 - (t % 3600) / 60, 30, 90).toFixed(0),
    ILUMINARE: +clamp(daylight, 200, 25000).toFixed(0),
    CALITAER: +clamp(600 + 500 * Math.sin(t / 300) + 300 * Math.random(), 400, 2000).toFixed(0),
    STAREAER: Math.random() < 0.05 ? "ALERT" : "OK",
    EXCESAPA: 0,
  };
};

export async function apiLatest(boardId) {
  const cfg = MOCKS[boardId];
  if (!cfg) return apiLatestRaw(boardId);
  if (cfg.type === "mirror") return noisify(await apiLatestRaw(cfg.src), cfg.noise ?? 0.06);
  return syntheticSnapshot(Date.now());
}
