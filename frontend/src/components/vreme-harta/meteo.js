// src/pages/vreme-harta/meteo.js
const zile = ["Duminică","Luni","Marți","Miercuri","Joi","Vineri","Sâmbătă"];

export const getEmojiMeteo = (c) =>
  c === 0 ? "☀️"
  : [1,2].includes(c) ? "🌤️"
  : [3,45,48].includes(c) ? "☁️"
  : [51,53,55,61,63,65,80,81,82].includes(c) ? "🌧️"
  : [71,73,75].includes(c) ? "❄️"
  : "🌤️";

export const getNumeZiCuOffset = (o) => {
  const d = new Date();
  d.setDate(d.getDate() + o);
  return zile[d.getDay()];
};

export async function geocodeCity(city) {
  const r = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ro&format=json`
  );
  const d = await r.json();
  if (d?.results?.length) {
    const x = d.results[0];
    return {
      lat: x.latitude,
      lon: x.longitude,
      oras: {
        nume: x.name,
        tara: x.country,
        judet: x.admin1,
        codPostal: x.postcodes?.[0] ?? "—",
      },
    };
  }
  throw new Error("Oraș negăsit");
}

export async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&hourly=temperature_2m,weathercode,relative_humidity_2m,wind_speed_10m,pressure_msl&current=temperature_2m,weathercode,relative_humidity_2m,wind_speed_10m,pressure_msl&timezone=auto&forecast_days=6`;

  const r = await fetch(url);
  const d = await r.json();

  const daily = d.daily.time.map((_, i) => ({
    zi: getNumeZiCuOffset(i),
    date: d.daily.time[i],
    tMax: Math.round(d.daily.temperature_2m_max[i]),
    tMin: Math.round(d.daily.temperature_2m_min[i]),
    icon: getEmojiMeteo(d.daily.weathercode[i]),
  }));

  const now = Date.now();
  const hourly = d.hourly.time
    .map((t, i) => ({
      ts: new Date(t).getTime(),
      time: new Date(t).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" }),
      icon: getEmojiMeteo(d.hourly.weathercode[i]),
      temp: Math.round(d.hourly.temperature_2m[i]),
      hum: d.hourly.relative_humidity_2m[i],
      wind: d.hourly.wind_speed_10m[i],
      press: Math.round(d.hourly.pressure_msl[i]),
    }))
    .filter((x) => x.ts >= now)
    .slice(0, 24);

  const current = {
    temp: Math.round(d.current.temperature_2m),
    icon: getEmojiMeteo(d.current.weathercode),
    hum: d.current.relative_humidity_2m,
    wind: d.current.wind_speed_10m,
    press: Math.round(d.current.pressure_msl),
  };

  return { daily, hourly, current };
}
