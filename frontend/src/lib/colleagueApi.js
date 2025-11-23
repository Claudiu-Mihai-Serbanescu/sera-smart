// src/lib/colleagueApi.js
const IS_DEV = import.meta.env.DEV;

/** Construieste URL către endpoint-ul colegilor via proxy-ul TĂU în PROD */
export function buildColleagueUrl(path = "/reports", params = {}) {
  const pathname = path.startsWith("/") ? path.slice(1) : path; // fără slash la început

  const url = IS_DEV
    ? // DEV: mergem prin Vite proxy /ext -> ok
      new URL(`/ext/${pathname}`, window.location.origin)
    : // PROD: NUMAI prin proxy-ul nostru HTTPS
      new URL(`/colleagues.php`, window.location.origin);

  // în PROD colegii folosesc param 'path' distinct
  if (!IS_DEV) url.searchParams.set("path", pathname);

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });
  return url.toString();
}

/** Header-ele:
 * - DEV: nu setăm nimic (le adaugă Vite proxy)
 * - PROD: NU mai trimite token din client; îl adaugă PHP-ul server-side
 */
export function authHeaders() {
  return { Accept: "application/json" };
}

export function rangeToFromTo(rangeKey = "24h") {
  const now = new Date();
  const to = now.toISOString();
  const hours = rangeKey === "24h" ? 24 : rangeKey === "3d" ? 72 : rangeKey === "7d" ? 168 : rangeKey === "30d" ? 720 : 24 * 90;
  const from = new Date(now.getTime() - hours * 3600 * 1000).toISOString();
  return { from, to };
}
