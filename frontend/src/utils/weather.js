// src/utils/weather.js

const zile = [
    "Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"
  ];
  
  export function getEmojiMeteo(cod) {
    if (cod === 0) return "☀️";
    if ([1, 2].includes(cod)) return "🌤️";
    if ([3, 45, 48].includes(cod)) return "☁️";
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(cod)) return "🌧️";
    if ([71, 73, 75].includes(cod)) return "❄️";
    return "❓";
  }
  
  function getNumeZiCuOffset(offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return zile[d.getDay()];
  }
  
  export async function geocodeCity(city) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      city
    )}&count=1&language=ro&format=json`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.results?.length) {
      const r = data.results[0];
      return { latitude: r.latitude, longitude: r.longitude };
    }
    throw new Error("Oraș negăsit");
  }
  
  export async function fetchWeather(lat, lon) {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&daily=temperature_2m_max,temperature_2m_min,weathercode` +
      `&hourly=temperature_2m,weathercode,relative_humidity_2m,wind_speed_10m,pressure_msl` +
      `&current=temperature_2m,weathercode,relative_humidity_2m,wind_speed_10m,pressure_msl` +
      `&timezone=auto&forecast_days=6`;
    const resp = await fetch(url);
    const data = await resp.json();
  
    const daily = data.daily.time.map((t, i) => ({
      date: t,
      zi: getNumeZiCuOffset(i),
      tMax: Math.round(data.daily.temperature_2m_max[i]),
      tMin: Math.round(data.daily.temperature_2m_min[i]),
      icon: getEmojiMeteo(data.daily.weathercode[i]),
    }));
  
    const now = Date.now();
    const hourly = data.hourly.time
      .map((t, i) => ({
        ts: new Date(t).getTime(),
        time: new Date(t).toLocaleTimeString("ro-RO", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        icon: getEmojiMeteo(data.hourly.weathercode[i]),
        temp: Math.round(data.hourly.temperature_2m[i]),
        hum: data.hourly.relative_humidity_2m[i],
        wind: data.hourly.wind_speed_10m[i],
        press: Math.round(data.hourly.pressure_msl[i]),
      }))
      .filter((x) => x.ts >= now)
      .slice(0, 24);
  
    const current = {
      temp: Math.round(data.current.temperature_2m),
      icon: getEmojiMeteo(data.current.weathercode),
      hum: data.current.relative_humidity_2m,
      wind: data.current.wind_speed_10m,
      press: Math.round(data.current.pressure_msl),
    };
  
    return { daily, hourly, current };
  }
  