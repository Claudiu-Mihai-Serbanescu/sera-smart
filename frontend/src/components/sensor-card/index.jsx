// src/components/sensor-card/index.jsx
import React from "react";
import styles from "./styles.module.css";
import { useAdvice } from "../../hooks/use-advice";

export default function SensorCard({
  icon,
  label,
  value,
  helper,
  status,
  highlight,
  onClick,
  // pentru AI
  _sensorKey,
  _sensorVal,
  _crop,
}) {
  // clase
  const cls = [styles.card, highlight ? styles.highlightBg : "", styles[status]]
    .filter(Boolean)
    .join(" ");

  // text AI (dacă avem cheia + valoarea senzorului)
  const aiText = _sensorKey ? useAdvice(_sensorKey, _sensorVal, _crop) : "";
  const helperText = aiText || helper || "";

  return (
    <div className={cls} onClick={onClick}>
      <div className={styles.header}>
        <i className={`bi ${icon} ${styles.icon}`} />
        <div className={styles.arrow}>
          <i className="bi bi-arrow-up-right" />
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.value}>{value}</div>
        <div className={styles.label}>{label}</div>
        <div className={styles.helper}>{helperText}</div>
      </div>
    </div>
  );
}
