import { useEffect, useState } from "react";

/** 🎨 Paleta de culori implicită */
export const DEFAULT_CROPS = {
  rosii: { name: "Roșii", color: "#e74c3c" },
  salata: { name: "Salată", color: "#2ecc71" },
  castr: { name: "Castraveți", color: "#27ae60" },
  gol: { name: "Liber", color: "#bdc3c7", locked: true },
};

export const ORIENTARI = ["Nord ↔ Sud", "Est ↕ Vest"];
export const PPM = 40; // pixeli pe metru
export const uid = () => Math.random().toString(36).slice(2, 9);

/* ---------- localStorage hook ---------- */
export function useLocalStorage(key, initialValue) {
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
export function newGreenhouse() {
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
    sensors: [],
  };
}

/* ---------- utilizare spațiu ---------- */
export function calcUsage(gh) {
  if (!gh || !gh.beds?.length) {
    return { available: 0, used: 0, remaining: 0, overflow: false, axis: "latime" };
  }
  const available = Number(gh.latime_m);
  const sizes = gh.beds.reduce((a, b) => a + (Number(b.size_m) || 0), 0);
  const paths = gh.beds.reduce((a, b, i) => a + (i < gh.beds.length - 1 ? Number(b.path_m) || 0 : 0), 0);
  const used = sizes + paths;
  return {
    available,
    used,
    remaining: available - used,
    overflow: available - used < -1e-6,
    axis: "latime",
  };
}

export const sortCrops = (crops) =>
  Object.entries(crops).sort((a, b) => {
    const la = a[1].locked ? 1 : 0;
    const lb = b[1].locked ? 1 : 0;
    return la - lb || a[1].name.localeCompare(b[1].name, "ro");
  });
