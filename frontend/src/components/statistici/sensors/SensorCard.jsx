import React from "react";
import Gauge from "./Gauge";
import styles from "./SensorCard.module.css";
import useWindowWidth from "../../../hooks/useWindowWidth";

export default function SensorCard({ icon, label, value, percent = 0, helper, status = "healthy", highlight = false, onClick, ticks = [], unit = "%" }) {
  const ww = useWindowWidth();
  const isMobile = ww <= 640;
  const gaugeSize = isMobile ? 150 : 180;
  const gaugeThickness = isMobile ? 16 : 18;

  // auto-micșorare pentru texte lungi (ex. "116 AQI", "Activă")
  const txt = String(value);
  const len = txt.length;
  const sizeClass = len > 10 ? styles.valXs : len > 7 ? styles.valSm : "";

  const cls = [styles.card, styles[status], highlight ? styles.highlight : ""].filter(Boolean).join(" ");

  return (
    <button className={cls} onClick={onClick} type="button">
      <div className={styles.gaugeWrap}>
        <Gauge percent={percent} status={status} size={gaugeSize} thickness={gaugeThickness} ticks={ticks} showTicks={ticks.length > 0} />
        <div className={styles.valBox}>
          <div className={`${styles.val} ${sizeClass}`}>{value}</div>
        </div>
      </div>

      <div className={styles.meta}>
        <div className={styles.label} title={label}>
          {icon && <i className={`bi ${icon} ${styles.metaIcon}`} />}
          {label}
        </div>
        {helper && <div className={styles.helper}>{helper}</div>}
      </div>
    </button>
  );
}
