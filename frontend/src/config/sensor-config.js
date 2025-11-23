// pragurile pentru fiecare tip de senzor
export const SENSOR_THRESHOLDS = {
  soilMoisture: {
    danger: { min: 0, max: 30, overMax: 85 },
    warning: { min: 30, max: 40, overMax: 75 },
    optimal: { min: 40, max: 75 },
  },
  temperature: {
    danger: { min: 0, max: 15, overMax: 35 },
    warning: { min: 15, max: 18, overMax: 30 },
    optimal: { min: 18, max: 30 },
  },
  light: {
    danger: { min: 0, max: 200 },
    warning: { min: 200, max: 400 },
    optimal: { min: 400, max: Infinity },
  },
  airHumidity: {
    danger: { min: 0, max: 30 },
    warning: { min: 30, max: 40 },
    optimal: { min: 40, max: 100 },
  },
  ph: {
    danger: { min: 0, max: 4, overMax: 9 },
    warning: { min: 5, max: 6, overMax: 8 },
    optimal: { min: 6, max: 8 },
  },
  wind: {
    danger: { min: 8, max: Infinity },
    warning: { min: 5, max: 8 },
    optimal: { min: 0, max: 5 },
  },
};
export const MOBILE_BREAKPOINT = 600;
