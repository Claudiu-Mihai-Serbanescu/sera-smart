// Definiții, conversii în procente, status și helperi – totul într-un singur loc.

export const SENSOR_DEFS = {
    TEMPAER: {
      key: "TEMPAER",
      label: "Temperatură",
      icon: "bi-thermometer-half",
      unit: "°C",
      // repere pe arc (valorile reale de unitate, nu %)
      ticks: [10, 20, 30, 40],
      format: (v) => `${v.toFixed(1)}°C`,
      toPercent: (v) => clamp((Number(v) / 40) * 100, 0, 100), // 0–40°C
      status: (v) =>
        v < 18 || v > 32 ? "danger" : v < 22 || v > 28 ? "warning" : "healthy",
      helper: (v) => (v < 22 ? "Prea rece" : v > 28 ? "Prea cald" : "Optim"),
      demoMinMax: [10, 36],
    },
    UMDTAER: {
      key: "UMDTAER",
      label: "Umiditate aer",
      icon: "bi-droplet",
      unit: "%",
      // repere pe arc în 0..100 (le poți pune [0,25,50,75,100] dacă preferi)
      ticks: [40, 55, 60, 70, 90, 100],
      format: (v) => `${Math.round(v)}%`,
      toPercent: (v) => clamp(Number(v), 0, 100),
      status: (v) =>
        v < 35 || v > 85 ? "danger" : v < 45 || v > 75 ? "warning" : "healthy",
      helper: (v) => (v < 45 ? "Uscat" : v > 75 ? "Foarte umed" : "Bun"),
      demoMinMax: [20, 95],
    },
    UMDTSOL1: {
      key: "UMDTSOL1",
      label: "Umiditate sol",
      icon: "bi-water",
      unit: "%",
      ticks: [0, 25, 40, 60, 80, 100],
      format: (v) => `${Math.round(v)}%`,
      toPercent: (v) => clamp(Number(v), 0, 100),
      status: (v) => (v < 25 ? "danger" : v < 40 ? "warning" : "healthy"),
      helper: (v) => (v < 25 ? "Irigare necesară" : v < 40 ? "Aproape scăzut" : "Ok"),
      demoMinMax: [10, 80],
    },
    ILUMINARE: {
      key: "ILUMINARE",
      label: "Luminozitate",
      icon: "bi-brightness-high",
      unit: "L",
      ticks: [200, 400, 800, 1200],
      format: (v) => `${Math.round(v)} L`,
      toPercent: (v) => clamp((Number(v) / 1200) * 100, 0, 100), // 0–1200 lux
      status: (v) => (v < 150 ? "warning" : "healthy"),
      helper: (v) => (v < 150 ? "Lumina scăzută" : "Bun"),
      demoMinMax: [0, 1200],
    },
    CALITAER: {
      key: "CALITAER",
      label: "Calitate aer",
      icon: "bi-cloud-haze2",
      unit: "CA",
      ticks: [50, 100, 150, 200],
      format: (v) => `${Math.round(v)} CA`,
      // mai bun AQI => procent mai mare pe gauge
      toPercent: (v) => clamp(100 - (Number(v) / 200) * 100, 0, 100),
      status: (v) => (v > 120 ? "danger" : v > 80 ? "warning" : "healthy"),
      helper: (v) => (v > 100 ? "Calitate slabă" : "Acceptabil/Bun"),
      demoMinMax: [10, 180],
    },
    TESTFAN: {
      key: "TESTFAN",
      label: "Ventilație",
      icon: "bi-fan",
      unit: "",
      ticks: [], // fără repere utile
      format: (v) => (Number(v) === 1 ? "Activă" : "Inactivă"),
      toPercent: (v) => (Number(v) === 1 ? 100 : 30),
      status: (v) => (Number(v) === 1 ? "healthy" : "warning"),
      helper: (v) => (Number(v) === 1 ? "Ventilație activă" : "Ventilație oprită"),
      demoMinMax: [0, 1],
    },
  };
  
  export function computeHealthPercent(snapshot) {
    const parts = [
      SENSOR_DEFS.TEMPAER.toPercent(snapshot.TEMPAER),
      SENSOR_DEFS.UMDTAER.toPercent(snapshot.UMDTAER),
      SENSOR_DEFS.UMDTSOL1.toPercent(snapshot.UMDTSOL1),
      SENSOR_DEFS.CALITAER.toPercent(snapshot.CALITAER),
      SENSOR_DEFS.ILUMINARE.toPercent(snapshot.ILUMINARE) * 0.7,
    ];
    const sum = parts.reduce((a, b) => a + b, 0);
    return Math.round(sum / parts.length);
  }
  
  export function computeCardFromSnapshot(snap) {
    const health = computeHealthPercent(snap);
    const healthStatus =
      health >= 80 ? "healthy" : health >= 50 ? "warning" : "danger";
  
    // card-ul mare „Sănătatea plantelor”
    const base = [
      {
        key: "HEALTH",
        icon: "bi-heart-pulse",
        label: "Sănătate",
        value: `${health}%`,
        percent: health,
        helper:
          health >= 80
            ? "Condiții excelente"
            : health >= 50
            ? "Ok, dar monitorizează"
            : "Parametri critici",
        status: healthStatus,
        highlight: true,
        unit: "%",                 // <— nou
        ticks: [40, 55, 60, 70, 90, 100], // <— reperele vizuale clasice
      },
    ];
  
    // restul senzorilor din snapshot, pe baza definițiilor
    const others = Object.keys(SENSOR_DEFS).map((k) => {
      const def = SENSOR_DEFS[k];
      const raw = snap[k];
      return {
        key: def.key,
        icon: def.icon,
        label: def.label,
        value: def.format(Number(raw)),
        percent: def.toPercent(Number(raw)),
        helper: def.helper(Number(raw)),
        status: def.status(Number(raw)),
        unit: def.unit,        // <— nou
        ticks: def.ticks || [],// <— nou
      };
    });
  
    return [...base, ...others];
  }
  
  // ========= Istoric pentru modal (mock) =========
  export function makeHistoryForSensor(key, span) {
    // span: '24h' | '3d' | '7d' | '30d' | 'all'
    // Returnează un array de { t: ISO/string, v: number }
    const def = SENSOR_DEFS[key];
    if (!def) return [];
  
    const spans = {
      "24h": { points: 24, stepMs: 60 * 60 * 1000 },
      "3d": { points: 72, stepMs: 60 * 60 * 1000 },
      "7d": { points: 7 * 24, stepMs: 60 * 60 * 1000 },
      "30d": { points: 30, stepMs: 24 * 60 * 60 * 1000 },
      all: { points: 60, stepMs: 24 * 60 * 60 * 1000 },
    };
    const cfg = spans[span] || spans["24h"];
  
    const [min, max] = def.demoMinMax || [0, 100];
    const now = Date.now();
    const data = [];
    let cur = (min + max) / 2;
  
    for (let i = cfg.points - 1; i >= 0; i--) {
      const t = new Date(now - i * cfg.stepMs);
      // mică variație random
      cur = clamp(
        cur + (Math.random() * (max - min) * 0.04 - (max - min) * 0.02),
        min,
        max
      );
      data.push({ t, v: +cur.toFixed(2) });
    }
    return data;
  }
  
  // utils
  export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  