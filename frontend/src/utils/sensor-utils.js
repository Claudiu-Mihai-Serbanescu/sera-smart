// pragurile le iei din config
import { SENSOR_THRESHOLDS } from "../config/sensor-config";

/**
 * Returnează starea unui senzor pe baza valorii și a tipului:
 * - "danger"  = valoare sub min sau peste overMax (ori peste max)
 * - "warning" = valoare sub warning.min sau peste warning.overMax (ori peste warning.max)
 * - "success" = altfel
 */
export function getSensorStatus(value, type) {
  const cfg = SENSOR_THRESHOLDS[type];
  if (!cfg) return "primary";

  // verifică «danger»
  if (
    (cfg.danger.min !== undefined && value < cfg.danger.min) ||
    (cfg.danger.max !== undefined && value > (cfg.danger.overMax ?? cfg.danger.max))
  ) {
    return "danger";
  }

  // verifică «warning»
  if (
    (cfg.warning.min !== undefined && value < cfg.warning.min) ||
    (cfg.warning.max !== undefined && value > (cfg.warning.overMax ?? cfg.warning.max))
  ) {
    return "warning";
  }

  // dacă nu e nici warning, nici danger => success
  return "success";
}

/**
 * Calculează un scor simplu pentru «sănătatea plantelor» ca funcție a
 * stărilor fiecărui senzor critic. Poți extinde formula după cum vrei.
 */
export function calculatePlantHealth(data) {
  // listează stările principale
  const statuses = [
    getSensorStatus(data.TEMPAER, "temperature"),
    getSensorStatus(data.UMDTAER, "humidity"),
    getSensorStatus(data.ILUMINARE, "light"),
    getSensorStatus(data.CALITAER, "airQuality"),
    getSensorStatus(data.UMDTSOL1, "soilMoisture"),
  ];

  const hasDanger = statuses.includes("danger");
  const hasWarning = statuses.includes("warning");

  // alege textul și clasa
  if (hasDanger) {
    return {
      icon: "bi-heart-pulse",
      label: "Sănătatea Plantelor",
      value: "Scăzută",
      colorClass: "text-danger",
    };
  }
  if (hasWarning) {
    return {
      icon: "bi-heart-pulse",
      label: "Sănătatea Plantelor",
      value: "Mediu",
      colorClass: "text-warning",
    };
  }
  return {
    icon: "bi-heart-pulse",
    label: "Sănătatea Plantelor",
    value: "Bună",
    colorClass: "text-success",
  };
}
