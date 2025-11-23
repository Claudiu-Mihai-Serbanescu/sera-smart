// src/utils/use-sensor-data.js
import { API_ROOT } from "../lib/apiRoot";

/* —— domenii și meta —— */
const RANGES = {
  temp: { minSoft: 10, minGood: 28, maxGood: 35, maxSoft: 45 },
  humi_air: { minSoft: 30, minGood: 60, maxGood: 85, maxSoft: 100 },
  light: { minSoft: 500, minGood: 5000, maxGood: 20000, maxSoft: 120000 },
  water_level: { minSoft: 0, minGood: 40, maxGood: 90, maxSoft: 100 },
  air_quality: { ideal: 1000, warn: 1500, bad: 3000 },
  humi_soil1: { minSoft: 10, minGood: 40, maxGood: 70, maxSoft: 100 },
  humi_soil2: { minSoft: 10, minGood: 40, maxGood: 70, maxSoft: 100 },
  humi_soil3: { minSoft: 10, minGood: 40, maxGood: 70, maxSoft: 100 },
  humi_soil4: { minSoft: 10, minGood: 40, maxGood: 70, maxSoft: 100 },
};

export const META = {
  temp: { label: "Temperatură aer", unit: "°C", icon: "bi-thermometer" },
  humi_air: { label: "Umiditate aer", unit: "%", icon: "bi-droplet" },
  humi_soil1: { label: "Umiditate sol 1", unit: "%", icon: "bi-moisture" },
  humi_soil2: { label: "Umiditate sol 2", unit: "%", icon: "bi-moisture" },
  humi_soil3: { label: "Umiditate sol 3", unit: "%", icon: "bi-moisture" },
  humi_soil4: { label: "Umiditate sol 4", unit: "%", icon: "bi-moisture" },
  light: { label: "Iluminare", unit: " lx", icon: "bi-brightness-high" },
  water_level: { label: "Nivel apă", unit: "%", icon: "bi-droplet-half" },
  air_quality: { label: "Calitatea aerului", unit: "", icon: "bi-wind" },
};

/* —— scor & status —— */
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;

function scoreContinuous(v, { minSoft, minGood, maxGood, maxSoft }) {
  if (!Number.isFinite(v)) return null;
  if (v >= minGood && v <= maxGood) return 100;
  if (v < minGood) return clamp(((v - minSoft) / (minGood - minSoft)) * 100, 0, 100);
  return clamp(((maxSoft - v) / (maxSoft - maxGood)) * 100, 0, 100);
}
function scoreAirQuality(v, { ideal, warn, bad }) {
  if (!Number.isFinite(v)) return null;
  if (v <= ideal) return 100;
  if (v <= warn) return lerp(100, 70, (v - ideal) / (warn - ideal));
  if (v <= bad) return lerp(70, 0, (v - warn) / (bad - warn));
  return 0;
}

export function scoreAndStatusFor(key, val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return { score: null, status: "healthy" };
  const score = key === "air_quality" ? scoreAirQuality(n, RANGES.air_quality) : scoreContinuous(n, RANGES[key] || RANGES.humi_soil1);
  if (score === null) return { score: null, status: "healthy" };
  const status = score >= 85 ? "healthy" : score >= 60 ? "warning" : "danger";
  return { score: Math.round(score), status };
}

export function calculatePlantHealthPercent(data) {
  let s = 0,
    n = 0;
  for (const [k, v] of Object.entries(data || {})) {
    if (!(k in RANGES)) continue;
    const { score } = scoreAndStatusFor(k, v);
    if (score !== null) {
      s += score;
      n++;
    }
  }
  return n ? Math.round(s / n) : 0;
}

/* —— snapshot “cele mai slabe” —— */
export function pickTopSensors(data, limit = 5) {
  const arr = [];
  for (const [k, v] of Object.entries(data || {})) {
    if (!(k in RANGES)) continue;
    const { score, status } = scoreAndStatusFor(k, v);
    if (score === null) continue;
    arr.push({
      key: k,
      value: v,
      deficit: 100 - score,
      status,
      label: META[k]?.label || k,
      unit: META[k]?.unit || "",
      icon: META[k]?.icon || "bi-question-circle",
    });
  }
  return arr.sort((a, b) => b.deficit - a.deficit).slice(0, limit);
}

/* —— 24h medie via history.php (cache 10m, 2 req simultan) —— */
const AVG24H_CACHE = new Map(); // `${boardId}|${key}` -> { ts, avg }
const AVG_TTL_MS = 10 * 60 * 1000;
const PER_REQ_TIMEOUT = 7000;

const ALIAS_TO_DB = {
  temp: "TEMPAER",
  humi_air: "UMDTAER",
  humi_soil1: "UMDTSOL1",
  humi_soil2: "UMDTSOL2",
  humi_soil3: "UMDTSOL3",
  humi_soil4: "UMDTSOL4",
  light: "ILUMINARE",
  water_level: "NIVELAPA",
  air_quality: "CALITAER",
};

const withTimeout = (promise, ms = PER_REQ_TIMEOUT) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });

async function fetchAvg24h(boardId, key) {
  const cacheKey = `${boardId}|${key}`;
  const cached = AVG24H_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < AVG_TTL_MS) return cached.avg;

  const fieldDb = ALIAS_TO_DB[key];
  if (!fieldDb) return null;

  const qs = new URLSearchParams({ boardId, key: fieldDb, range: "24h" });
  const url = `${API_ROOT}/sensors/history.php?${qs}`;

  const res = await withTimeout(fetch(url, { cache: "no-store", credentials: "include" }));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  if (!j.ok) throw new Error(j.error || "Eroare API");
  const points = j.data || [];

  // media scorurilor pe 24h
  let s = 0,
    n = 0;
  for (const p of points) {
    const v = Number(p.val);
    const { score } = scoreAndStatusFor(key, v);
    if (score !== null) {
      s += score;
      n++;
    }
  }
  const avg = n ? s / n : null;
  if (avg !== null) AVG24H_CACHE.set(cacheKey, { ts: Date.now(), avg });
  return avg;
}

async function mapConcurrently(items, fn, max = 2) {
  const out = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(max, items.length) }, async () => {
    while (i < items.length) {
      const k = items[i++];
      out.push(await fn(k));
    }
  });
  await Promise.all(workers);
  return out;
}

/** Top 24h (fallback snapshot): candidați = cei mai slabi din snapshot (max 2× limit) */
export async function pickTopSensors24h(boardId, snapshotData, limit = 5) {
  if (!boardId) return pickTopSensors(snapshotData, limit);
  const candidates = pickTopSensors(snapshotData, Math.max(limit * 2, limit + 2)).map((s) => s.key);
  if (!candidates.length) return pickTopSensors(snapshotData, limit);

  const results = await mapConcurrently(
    candidates,
    async (key) => {
      try {
        const avg = await fetchAvg24h(boardId, key);
        if (avg === null) return null;
        const { status } = scoreAndStatusFor(key, snapshotData[key]);
        return {
          key,
          value: snapshotData[key],
          deficit: 100 - Math.round(avg),
          status,
          label: META[key]?.label || key,
          unit: META[key]?.unit || "",
          icon: META[key]?.icon || "bi-question-circle",
        };
      } catch {
        return null;
      }
    },
    2
  );

  const ok = results
    .filter(Boolean)
    .sort((a, b) => b.deficit - a.deficit)
    .slice(0, limit);
  return ok.length ? ok : pickTopSensors(snapshotData, limit);
}
