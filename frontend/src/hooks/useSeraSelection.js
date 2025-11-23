import { useEffect, useState } from "react";

export default function useSeraSelection(defaultId, key = "gh.selected") {
  const [id, setId] = useState(() => {
    try {
      return localStorage.getItem(key) || defaultId;
    } catch {
      return defaultId;
    }
  });
  useEffect(() => {
    try {
      if (id != null) localStorage.setItem(key, id);
    } catch {}
  }, [id, key]);
  return [id, setId];
}
