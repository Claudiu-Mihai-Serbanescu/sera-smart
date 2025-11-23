// controllers/adviceController.js
// Node 18+ are fetch global
const SENSOR_LABEL = {
    temp: "temperatură aer în solar",
    humi_air: "umiditate relativă a aerului",
    humi_soil1: "umiditate sol zona 1",
    humi_soil2: "umiditate sol zona 2",
    humi_soil3: "umiditate sol zona 3",
    humi_soil4: "umiditate sol zona 4",
    light: "iluminare (lux)",
    water_level: "nivel apă rezervor",
    air_quality: "calitatea aerului (CO₂/VOC)",
  };
  
  function ruleAdvice(sensor, value) {
    const n = Number(value);
    switch (sensor) {
      case "temp":
        if (n >= 28 && n <= 35) return { summary: "Temperatura este în interval optim.", actions: ["Monitorizează stabilitatea temperaturii."] };
        if (n < 28) return { summary: "Temperatura e prea scăzută.", actions: ["Crește încălzirea/izolația.", "Redu curenții de aer.", "Folie termică pe timp de noapte."] };
        return { summary: "Temperatura e prea ridicată.", actions: ["Ventilează activ.", "Umbrește/difuzează lumina.", "Mărește circulația aerului."] };
      case "humi_air":
        if (n >= 60 && n <= 85) return { summary: "Umiditatea aerului este bună.", actions: ["Păstrează ventilarea moderată."] };
        if (n < 60) return { summary: "Aer prea uscat.", actions: ["Umidificare/micro-ceață.", "Redu ventilarea.", "Udă podeaua pentru evaporare."] };
        return { summary: "Aer prea umed.", actions: ["Crește ventilarea.", "Evită supra-udarea.", "Înlătură condensul."] };
      case "light":
        if (n >= 5000 && n <= 20000) return { summary: "Iluminarea este adecvată.", actions: ["Menține programul actual."] };
        if (n < 5000) return { summary: "Lumina este insuficientă.", actions: ["Apropie sursa.", "Mărește durata iluminării."] };
        return { summary: "Lumina este prea puternică.", actions: ["Umbrește/difuzează.", "Ridică sursa."] };
      case "water_level":
        if (n >= 40 && n <= 90) return { summary: "Nivelul de apă este potrivit.", actions: ["Verifică periodic flotor/senzor."] };
        if (n < 40) return { summary: "Rezervor aproape gol.", actions: ["Completează apa.", "Verifică pierderile."] };
        return { summary: "Nivel apă prea ridicat.", actions: ["Verifică preaplinul.", "Calibrează senzorul."] };
      case "air_quality":
        if (n <= 1000) return { summary: "Calitatea aerului este bună.", actions: ["Ventilație de întreținere."] };
        if (n <= 1500) return { summary: "Calitate mediocră.", actions: ["Ventilează periodic.", "Aerisiri în reprize."] };
        return { summary: "Calitate slabă.", actions: ["Ventilație continuă până ~800–1000 ppm.", "Asigură circulația aerului."] };
      case "humi_soil1":
      case "humi_soil2":
      case "humi_soil3":
      case "humi_soil4":
        if (n >= 40 && n <= 70) return { summary: "Umiditatea solului este potrivită.", actions: ["Păstrează programul de irigare."] };
        if (n < 40) return { summary: "Sol prea uscat.", actions: ["Mărește durata/frecvența udării.", "Verifică uniformitatea picurării."] };
        return { summary: "Sol prea umed.", actions: ["Reduce frecvența udărilor.", "Verifică drenajul."] };
      default:
        return { summary: "Ajustează prudent parametrii și monitorizează.", actions: [] };
    }
  }
  
  function buildQuery(sensor, value, crop) {
    const base = SENSOR_LABEL[sensor] || sensor;
    const cropText = crop ? ` ${crop}` : "";
    return `${base}${cropText} ce fac dacă valoarea e ${value} sfaturi seră`;
  }
  
  function normalizeDuck(json) {
    const out = [];
    if (json?.AbstractText && json?.AbstractURL) {
      out.push({ title: json.Heading || "Rezumat", url: json.AbstractURL, snippet: json.AbstractText });
    }
    if (Array.isArray(json?.RelatedTopics)) {
      for (const t of json.RelatedTopics) {
        if (t?.FirstURL && t?.Text) out.push({ title: t.Text.split(" - ")[0], url: t.FirstURL, snippet: t.Text });
        if (Array.isArray(t?.Topics)) {
          for (const tt of t.Topics) {
            if (tt?.FirstURL && tt?.Text) out.push({ title: tt.Text.split(" - ")[0], url: tt.FirstURL, snippet: tt.Text });
          }
        }
      }
    }
    const seen = new Set();
    return out.filter(x => { if (seen.has(x.url)) return false; seen.add(x.url); return true; }).slice(0, 5);
  }
  
  export async function getAdvice(req, res) {
    try {
      const sensor = String(req.query.sensor || "").trim();
      const value  = Number(req.query.value);
      const crop   = (req.query.crop || "").toString().trim();
  
      if (!sensor || Number.isNaN(value)) {
        return res.status(400).json({ error: "Parametri necesari: sensor, value" });
      }
  
      const rules = ruleAdvice(sensor, value);
  
      const q = buildQuery(sensor, value, crop);
      const url = new URL("https://api.duckduckgo.com/");
      url.searchParams.set("q", q);
      url.searchParams.set("format", "json");
      url.searchParams.set("no_html", "1");
      url.searchParams.set("skip_disambig", "1");
  
      const r = await fetch(url.toString());
      const j = await r.json();
      const sources = normalizeDuck(j).slice(0, 3);
  
      res.json({ sensor, value, crop: crop || null, summary: rules.summary, actions: rules.actions, sources });
    } catch (e) {
      console.error("advice(ddg) error:", e);
      res.status(500).json({ error: "Advice service failed" });
    }
  }
  