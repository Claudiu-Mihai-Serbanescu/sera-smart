/**
 * sensorUtils.js
 * Utilitare senzori & timp:
 * - clamp(n,a,b): limitează un număr în [a,b]
 * - toNum(v): parsează numeric (acceptă „,” ca separator)
 * - pickField(obj,names): caută un câmp în snapshot (data/state/status/sensors/inputs)
 * - readTempC(snap): extrage temperatura °C (aliasuri multiple, clamp [-40,100])
 * - readSoilPct(snap): extrage umiditatea solului % (acceptă 0..1 → 0..100)
 * - isNowBetween(from,to): verifică dacă HH:MM e în interval (suport peste miezul nopții)
 */

export const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

export const toNum = (v) => {
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : Number(v);
  return Number.isFinite(n) ? n : null;
};

export function pickField(obj, names) {
  const places = [obj, obj?.data, obj?.state, obj?.status, obj?.sensors, obj?.inputs];
  for (const p of places) {
    if (!p || typeof p !== "object") continue;
    for (const name of names) {
      if (name in p) return p[name];
    }
  }
  return undefined;
}

export function readTempC(snap) {
  const raw = pickField(snap, ["TEMP", "temperature", "temp", "T", "DHT_temp", "DHT22_temp", "dht.temp"]);
  const v = toNum(raw);
  return v == null ? null : clamp(v, -40, 100);
}

export function readSoilPct(snap) {
  const raw = pickField(snap, ["SOIL_PCT", "soil_pct", "soil", "umiditate_sol", "soilMoisture"]);
  const v = toNum(raw);
  if (v == null) return null;
  return v <= 1 ? clamp(Math.round(v * 100), 0, 100) : clamp(Math.round(v), 0, 100);
}

export function isNowBetween(from, to) {
  if (!from || !to) return false;
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  const f = fh * 60 + fm;
  const t = th * 60 + tm;
  const now = new Date();
  const n = now.getHours() * 60 + now.getMinutes();
  return f <= t ? n >= f && n < t : n >= f || n < t; // suport intervale peste miezul nopții
}
