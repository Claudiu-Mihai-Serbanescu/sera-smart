// src/hooks/use-sensor-data.js
import { useState, useEffect } from "react";
import { getColleagueSensors } from "../api/colleagues";

export const useSensorData = (identifier, { refreshInterval = Number(import.meta.env.VITE_REFRESH_MS || 10000) } = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!identifier) return;
    let alive = true;
    let iv;

    const fetchSensorData = async () => {
      setLoading(true);
      try {
        const json = await getColleagueSensors(identifier); // proxy /ext + token din Vite proxy
        if (alive) {
          setData(json?.data ?? json);
          setError(null);
        }
      } catch (e) {
        if (alive) setError(String(e?.message || e));
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchSensorData();
    iv = setInterval(fetchSensorData, Math.max(1000, Number(refreshInterval)));

    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [identifier, refreshInterval]);

  return { data, loading, error };
};
