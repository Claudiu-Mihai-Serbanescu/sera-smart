/**
 * useAutosEngine.js
 * Hook care evaluează periodic senzorii și acționează actuatoarele.
 * – Ventilație cu histerezis; Iluminat pe interval; Udare la oră fixă și după sol (cu cooldown).
 * – Trimite comenzi doar la schimbare (postCommand) și emite "actuator-command" în window.
 */

import { useEffect, useRef } from "react";
import { getSnapshot, postCommand } from "./autosApi";
import { readTempC, readSoilPct, isNowBetween } from "./sensorUtils";

/**
 * Rulează regulat logica de automatizare pentru sera curentă.
 */
export default function useAutosEngine({ seraId, cfg, boardMap, extRoot, actEndpoint, pollMs, hyst }) {
  const engineRef = useRef({
    desired: { pump: null, fan: null, led: null },
    lastRunKey: new Set(),
    soilCooldownUntil: 0,
    timeouts: [],
  });

  // cleanup pe schimbare de seră / unmount
  useEffect(() => {
    return () => {
      engineRef.current.timeouts.forEach(clearTimeout);
      engineRef.current.timeouts = [];
      engineRef.current.desired = { pump: null, fan: null, led: null };
    };
  }, [seraId]);

  const ensureActuator = async (boardId, type, on, actNames) => {
    const key = { irrigation: "pump", ventilation: "fan", lights: "led" }[type];
    const prev = engineRef.current.desired[key];
    if (prev === (on ? 1 : 0)) return; // deja în starea dorită
    await postCommand(extRoot, actEndpoint, boardId, actNames[type], on ? "on" : "off");
    engineRef.current.desired[key] = on ? 1 : 0;
    try {
      window.dispatchEvent(new CustomEvent("actuator-command", { detail: { boardId, actuator: actNames[type], on } }));
    } catch {}
  };

  const startWatering = async (boardId, actNames, minutes) => {
    await ensureActuator(boardId, "irrigation", true, actNames);
    const t = setTimeout(async () => {
      try {
        await ensureActuator(boardId, "irrigation", false, actNames);
      } catch {}
    }, Math.max(1, minutes) * 60 * 1000);
    engineRef.current.timeouts.push(t);
    engineRef.current.soilCooldownUntil = Date.now() + Math.max(1, minutes) * 2 * 60 * 1000;
  };

  const fireKey = (sera, tag, hm) => `${new Date().toISOString().slice(0, 10)}|${hm}|${sera}|${tag}`;

  useEffect(() => {
    const boardCfg = boardMap[seraId];
    const boardId = boardCfg?.id;
    const actNames = boardCfg?.actuators;
    if (!boardId || !actNames) return;

    let stop = false;

    async function tick() {
      if (stop) return;

      let snap = null;
      try {
        snap = await getSnapshot(extRoot, boardId);
      } catch {}

      const tempC = snap ? readTempC(snap) : null;
      const soilPct = snap ? readSoilPct(snap) : null;

      // Ventilație (histerezis)
      if (cfg.ventilation.enabled && tempC != null) {
        const th = cfg.ventilation.thresholdC;
        const wantOn = engineRef.current.desired.fan === 1 ? tempC >= th - (hyst?.tempOffDelta ?? 1) : tempC >= th;
        await ensureActuator(boardId, "ventilation", wantOn, actNames);
      }

      // Iluminat (interval)
      if (cfg.lights.enabled) {
        const wantOn = isNowBetween(cfg.lights.from, cfg.lights.to);
        await ensureActuator(boardId, "lights", wantOn, actNames);
      }

      // Udare la oră fixă (one-shot pe minut)
      if (cfg.irrigation.enabled) {
        for (const hm of cfg.irrigation.times) {
          if (!/^\d{2}:\d{2}$/.test(hm)) continue;
          const now = new Date();
          const h = String(now.getHours()).padStart(2, "0");
          const m = String(now.getMinutes()).padStart(2, "0");
          const sameMinute = `${h}:${m}` === hm;
          const key = fireKey(seraId, "irrigation.time", hm);
          if (sameMinute && !engineRef.current.lastRunKey.has(key)) {
            engineRef.current.lastRunKey.add(key);
            await startWatering(boardId, actNames, cfg.irrigation.durationMin);
          }
          // curăță chei vechi (altă zi)
          if (!sameMinute && engineRef.current.lastRunKey.size > 1000) {
            const today = new Date().toISOString().slice(0, 10);
            engineRef.current.lastRunKey = new Set([...engineRef.current.lastRunKey].filter((k) => k.startsWith(today)));
          }
        }
      }

      // Udare după umiditatea solului
      if (cfg.irrigation.bySoil?.enabled && soilPct != null) {
        const th = cfg.irrigation.bySoil.thresholdPct ?? 40;
        const now = Date.now();
        const cooling = now < engineRef.current.soilCooldownUntil;
        const needWater = soilPct < th;
        if (needWater && !cooling) {
          await startWatering(boardId, actNames, cfg.irrigation.durationMin);
        }
      }
    }

    tick();
    const iv = setInterval(tick, pollMs);
    return () => {
      stop = true;
      clearInterval(iv);
    };
  }, [seraId, cfg, boardMap, extRoot, actEndpoint, pollMs, hyst]);
}
