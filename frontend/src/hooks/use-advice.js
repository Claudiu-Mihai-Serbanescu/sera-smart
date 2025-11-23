// src/hooks/use-advice.js
import { useEffect, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const cache = new Map();

export function useAdvice(sensorKey, value, crop) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (value === undefined || value === null) return;

    const rounded = Math.round(Number(value) * 10) / 10;
    const key = `${sensorKey}:${rounded}:${crop || ""}`;

    if (cache.has(key)) {
      setText(cache.get(key));
      return;
    }

    let alive = true;
    (async () => {
      try {
        const url = new URL(`${API_BASE}/api/advice`, window.location.origin);
        url.searchParams.set("sensor", sensorKey);
        url.searchParams.set("value", String(rounded));
        if (crop) url.searchParams.set("crop", crop);

        const res = await fetch(url.toString(), { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const json = await res.json();

        const summary = json?.summary || "";
        const actions = Array.isArray(json?.actions)
          ? json.actions.slice(0, 2).join(" • ")
          : "";
        const final = [summary, actions].filter(Boolean).join(" ");

        if (alive) {
          cache.set(key, final);
          setText(final);
        }
      } catch {
        if (alive) setText("");
      }
    })();

    return () => {
      alive = false;
    };
  }, [sensorKey, value, crop]);

  return text;
}
