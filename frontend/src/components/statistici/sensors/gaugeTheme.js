// Segmente și tick-uri pentru Gauge – arată ca în exemplele tale.
export const SEGMENTS = [
    { from: 0,  to: 30, color: "#e74c3c" },  // roșu
    { from: 30, to: 45, color: "#f1c40f" },  // galben
    { from: 45, to: 60, color: "#d6e98b" },  // verde foarte deschis
    { from: 60, to: 80, color: "#20c997" },  // verde-turcoaz
    { from: 80, to: 100, color: "#1e7e34" }, // verde închis
  ];
  
  export const TICKS = [40, 55, 60, 70, 90, 100];
  
  export const angleFor = (pct) => -180 + (pct / 100) * 180;
  export const rad = (deg) => (Math.PI / 180) * deg;
  export const polar = (cx, cy, r, a) => ({
    x: cx + r * Math.cos(rad(a)),
    y: cy + r * Math.sin(rad(a)),
  });
  export const arcPath = (cx, cy, r, a0, a1) => {
    const p0 = polar(cx, cy, r, a0);
    const p1 = polar(cx, cy, r, a1);
    const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
    return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y}`;
  };
  