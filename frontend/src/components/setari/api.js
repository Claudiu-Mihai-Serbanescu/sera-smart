// src/components/setari/api.js
// conform .env
// VITE_API_URL=https://serty.ro/backend
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export async function apiFetch(path, options = {}) {
  if (!API_BASE) console.warn("[Setari] VITE_API_URL NU e setat!");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    credentials: "include",
    ...options,
  });

  const text = await res.text();
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    raw = text;
  }

  if (!res.ok) {
    let msg =
      (raw && typeof raw === "object" && (raw.message || raw.error)) ||
      (typeof raw === "string"
        ? raw
            .replace(/<[^>]*>/g, "")
            .trim()
            .slice(0, 300)
        : "") ||
      `${res.status} ${res.statusText}`;

    if (res.status >= 500) {
      msg = `Eroare server (${res.status}). Încearcă din nou.`;
    }
    throw new Error(msg);
  }

  return raw;
}

export function nested(obj, path, def = undefined) {
  return (
    String(path)
      .split(".")
      .reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj) ?? def
  );
}

export function pickAny(obj, paths, def = "") {
  for (const p of paths) {
    const v = nested(obj, p);
    if (v !== undefined && v !== null) return v;
  }
  return def;
}

export function unwrap(obj) {
  if (!obj || typeof obj !== "object") return obj;
  return obj.data || obj.result || obj.payload || obj.user || obj.settings || obj;
}
