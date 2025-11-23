import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Agromi.css";

/* =============== SETĂRI =============== */
/** ordine: întâi încearcă local (dacă ai /dist/api/agromi-proxy.php), apoi remote */
const PROXIES = [
  import.meta.env.VITE_AGROMI_PROXY, // dacă e setat în .env (poate fi absolut sau relativ)
  "/agromi-proxy.php", // rădăcină
  "/api/agromi-proxy.php", // sub /api
  `${location.origin}/agromi-proxy.php`, // absolut same-origin
  `${location.origin}/api/agromi-proxy.php`,
].filter(Boolean);

const AGROMI_LOGO = "/assets/img/agromi-logo-mare.png";

/** culturile fermierului */
const FARMER_CROPS = ["tomate", "castraveti", "salata"];

/** categoriile utilitare */
const UTIL_CATS = ["ingrasaminte", "pesticide", "recipiente", "irigatii"];
const UTIL_LABELS = {
  ingrasaminte: "Îngrășăminte",
  pesticide: "Pesticide",
  recipiente: "Tăvi & Ghivece",
  irigatii: "Irigare",
};

/** aliasuri acceptate de proxy/magazin (încercate în ordine) */
const CAT_ALIASES = {
  tomate: ["rosii", "seminte-rosii", "tomate", "rosii-hibrid"],
  castraveti: ["castraveti", "seminte-castraveti"],
  salata: ["salata", "seminte-salata", "laptuca"],
  ingrasaminte: ["ingrasaminte", "fertilizatori", "fertilizanti"],
  pesticide: ["pesticide", "fungicide", "insecticide"],
  recipiente: ["recipiente", "tavi-rasad", "ghivece"],
  irigatii: ["irigatii", "irigare"],
};

/** limite implicite */
const DEFAULTS = {
  utilTotal: 18,
  seedsPerCrop: 4,
};

/* =============== FETCH HELPERS =============== */
async function callProxy(params, signal) {
  let lastErr;
  for (const base of PROXIES) {
    try {
      const u = new URL(base, location.origin);
      // atașează parametrii corect indiferent dacă base are deja '?' sau nu
      u.search = u.search ? `${u.search.slice(1)}&${params}` : params;

      const r = await fetch(u.toString(), { signal });
      const text = await r.text();
      if (!r.ok) throw new Error(`HTTP ${r.status}${text ? ": " + text.slice(0, 120) : ""}`);

      try {
        return JSON.parse(text);
      } catch {
        throw new Error(`Nu e JSON: ${text.slice(0, 120)}`);
      }
    } catch (e) {
      lastErr = e;
      // încearcă următorul base
    }
  }
  throw lastErr || new Error("Proxy indisponibil");
}

async function fetchCatRaw(cat, per = 8, signal) {
  const qs = new URLSearchParams({ route: "scrape", cat, per_page: String(per) });
  const data = await callProxy(qs.toString(), signal);
  return Array.isArray(data) ? data : data.items || [];
}

async function fetchCatSmart(cat, per = 8, signal) {
  const variants = CAT_ALIASES[cat] || [cat];
  // încearcă aliasuri până când obții 200 cu listă nenulă
  for (const v of variants) {
    try {
      const items = await fetchCatRaw(v, per, signal);
      if (items?.length) return items;
    } catch (e) {
      // 4xx → încearcă următorul; 5xx sau altceva: log & continuă
      if (!/^Error: HTTP 4\d\d/.test(String(e))) {
        console.debug("[agromi] fetchCatSmart err pentru", v, e?.message);
      }
    }
  }
  // ultim fallback: categoria originală
  try {
    return await fetchCatRaw(cat, per, signal);
  } catch {
    return [];
  }
}

async function fetchFromMany(categories, totalLimit, signal) {
  const out = [];
  const perEach = Math.max(2, Math.ceil(totalLimit / categories.length));
  for (const c of categories) {
    if (out.length >= totalLimit) break;
    const batch = await fetchCatSmart(c, perEach, signal);
    for (const p of batch) {
      if (out.length >= totalLimit) break;
      out.push(p);
    }
  }
  return out;
}

/* =============== PREȚURI =============== */
function formatLei(num) {
  if (num == null || Number.isNaN(num)) return "";
  return new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num) + " lei";
}
function parsePrice(raw) {
  if (!raw) return { type: "none" };
  const s = String(raw)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const nums = [...s.matchAll(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))\s*lei/gi)]
    .map((m) => m[1])
    .map((v) => Number(v.replace(/\./g, "").replace(",", ".")))
    .filter((n) => !Number.isNaN(n));
  const hasIntervalCue = /interval|până la|–|—|-/.test(s.toLowerCase());
  const hasSaleCue = /inițial|curent|reducere|promo/i.test(s);

  if (nums.length >= 2 && hasIntervalCue) {
    const min = Math.min(...nums),
      max = Math.max(...nums);
    return { type: "range", min, max };
  }
  if (nums.length >= 2 && hasSaleCue) {
    const regular = nums[0],
      sale = nums[nums.length - 1];
    if (sale < regular) return { type: "sale", regular, sale };
  }
  if (nums.length >= 2) {
    const min = Math.min(...nums),
      max = Math.max(...nums);
    if (min !== max) return { type: "range", min, max };
    return { type: "single", price: min };
  }
  if (nums.length === 1) return { type: "single", price: nums[0] };
  return { type: "none" };
}

/* =============== IMAGINI =============== */
function normalizeAgromiImg(url = "") {
  try {
    const u = new URL(url, window.location.href);
    u.pathname = u.pathname.replace(/-\d+x\d+(?=\.(jpg|jpeg|png|webp)$)/i, "").replace(/-scaled(?=\.(jpg|jpeg|png|webp)$)/i, "");
    return u.toString();
  } catch {
    return url.replace(/-\d+x\d+(?=\.(jpg|jpeg|png|webp)(\?|$))/i, "").replace(/-scaled(?=\.(jpg|jpeg|png|webp)(\?|$))/i, "");
  }
}
function looksSizedVariant(url = "") {
  return /-\d+x\d+(?=\.(jpg|jpeg|png|webp)(\?|$))|-scaled(?=\.(jpg|jpeg|png|webp)(\?|$))/i.test(url);
}

/* =============== UI: PriceBadge =============== */
function PriceBadge({ raw }) {
  const p = parsePrice(raw);
  if (p.type === "sale") {
    return (
      <div className="ag-price">
        <span className="ag-price-new">{formatLei(p.sale)}</span>
        <span className="ag-price-old">{formatLei(p.regular)}</span>
      </div>
    );
  }
  if (p.type === "range") {
    return (
      <div className="ag-price">
        <span className="ag-price-range">
          {formatLei(p.min)} <span className="ag-dash">–</span> {formatLei(p.max)}
        </span>
      </div>
    );
  }
  if (p.type === "single") {
    return (
      <div className="ag-price">
        <span className="ag-price-single">{formatLei(p.price)}</span>
      </div>
    );
  }
  return <div className="ag-price ag-price-missing">Preț la cerere</div>;
}

/* =============== UI: ProductCard =============== */
function ProductCard({ p }) {
  const placeholder = "/assets/img/placeholder.png";
  const initialImg = useMemo(() => (looksSizedVariant(p?.image) ? normalizeAgromiImg(p.image) : p?.image || placeholder), [p?.image]);
  const [imgSrc, setImgSrc] = useState(initialImg);
  const triedNormalized = useRef(looksSizedVariant(p?.image));
  const triedPlaceholder = useRef(false);

  const handleImgError = () => {
    if (!triedNormalized.current && p?.image) {
      triedNormalized.current = true;
      setImgSrc(normalizeAgromiImg(p.image));
      return;
    }
    if (!triedPlaceholder.current) {
      triedPlaceholder.current = true;
      setImgSrc(placeholder);
    }
  };

  const name = p?.name || "Produs";

  return (
    <article className="ag-card" aria-label={`Produs: ${name}`}>
      <div className="ag-imgwrap">
        <img src={imgSrc} alt={name} loading="lazy" onError={handleImgError} referrerPolicy="no-referrer" />
      </div>
      <div className="ag-body">
        <h3 className="ag-title" title={name}>
          {name}
        </h3>
        <PriceBadge raw={p?.price} />
        <a className="ag-btn" href={p?.permalink || "#"} target="_blank" rel="noopener noreferrer nofollow">
          Comandă
        </a>
      </div>
    </article>
  );
}

/* =============== Pagina =============== */
export default function Agromi({ utilLimit = DEFAULTS.utilTotal, seedsPerCrop = DEFAULTS.seedsPerCrop, crops = FARMER_CROPS }) {
  /* ——— UTILITARE ——— */
  const [selectedUtil, setSelectedUtil] = useState("toate");
  const [util, setUtil] = useState({ data: [], loading: true, error: null });

  useEffect(() => {
    const ctrl = new AbortController();
    setUtil({ data: [], loading: true, error: null });
    (async () => {
      if (selectedUtil === "toate") {
        const items = await fetchFromMany(UTIL_CATS, utilLimit, ctrl.signal);
        setUtil({ data: items, loading: false, error: null });
      } else {
        const items = await fetchCatSmart(selectedUtil, utilLimit, ctrl.signal);
        setUtil({ data: items, loading: false, error: null });
      }
    })().catch((e) => setUtil({ data: [], loading: false, error: e.message }));
    return () => ctrl.abort();
  }, [selectedUtil, utilLimit]);

  /* ——— SEMINȚE ——— */
  const [seedsMap, setSeedsMap] = useState({});
  const [seedsLoading, setSeedsLoading] = useState(true);
  const [seedsError, setSeedsError] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState("toate");

  useEffect(() => {
    const ctrl = new AbortController();
    setSeedsLoading(true);
    setSeedsError(null);
    (async () => {
      const map = {};
      const all = [];
      for (const crop of crops) {
        const items = await fetchCatSmart(crop, seedsPerCrop, ctrl.signal);
        map[crop] = items;
        all.push(...items);
      }
      map["toate"] = all;
      setSeedsMap(map);
      setSeedsLoading(false);
    })().catch((e) => {
      setSeedsMap({});
      setSeedsError(e.message);
      setSeedsLoading(false);
    });
    return () => ctrl.abort();
  }, [crops, seedsPerCrop]);

  const utilTitle = "Recomandări utilitare";
  const seedsTitle = "Recomandări pentru culturile tale";
  const seedsToShow = seedsMap[selectedCrop] || [];

  return (
    <div className="ag-wrap">
      {/* ====== HEADER CU LOGO ====== */}
      <header className="ag-hero">
        <div className="ag-hero-left">
          <img className="ag-logo" src={AGROMI_LOGO} alt="Agromi" />
          <div className="ag-hero-copy">
            <strong>Partener Agromi</strong>
            <span className="ag-hero-sub">recomandări și produse utile pentru fermă</span>
          </div>
        </div>
        <a className="ag-hero-cta" href="https://agromi.ro/magazin/" target="_blank" rel="noopener noreferrer">
          Deschide magazinul
        </a>
      </header>

      {/* ====== UTILITARE ====== */}
      <div className="ag-section">
        <div className="ag-panel">
          <div className="ag-section-head ag-row">
            <div className="ag-left">
              <h2 className="ag-h2 ag-h2--accent">{utilTitle}</h2>
              <div className="ag-pills">
                <button className={`ag-pill ${selectedUtil === "toate" ? "is-active" : ""}`} onClick={() => setSelectedUtil("toate")}>
                  toate
                </button>
                {UTIL_CATS.map((c) => (
                  <button key={c} className={`ag-pill ${selectedUtil === c ? "is-active" : ""}`} onClick={() => setSelectedUtil(c)}>
                    {UTIL_LABELS[c] || c}
                  </button>
                ))}
              </div>
            </div>
            <div className="ag-right">
              <a className="ag-morebtn ag-morebtn--ghost" href="https://agromi.ro/magazin/" target="_blank" rel="noopener noreferrer">
                Vezi toate produsele →
              </a>
            </div>
          </div>

          {util.loading ? (
            <div className="ag-skel">Se încarcă recomandările…</div>
          ) : util.error ? (
            <div className="ag-err">Nu s-au putut încărca produsele utilitare: {util.error}</div>
          ) : (
            <div className="ag-grid ag-nine">
              {util.data.map((p, idx) => (
                <ProductCard key={`${p.permalink || p.name}-${idx}`} p={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ====== SEMINȚE ====== */}
      <div className="ag-section">
        <div className="ag-panel">
          <div className="ag-section-head ag-row">
            <div className="ag-left">
              <h2 className="ag-h2 ag-h2--accent">{seedsTitle}</h2>
              <div className="ag-pills">
                <button className={`ag-pill ${selectedCrop === "toate" ? "is-active" : ""}`} onClick={() => setSelectedCrop("toate")}>
                  toate
                </button>
                {crops.map((c) => (
                  <button key={c} className={`ag-pill ${selectedCrop === c ? "is-active" : ""}`} onClick={() => setSelectedCrop(c)}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="ag-right">
              <a className="ag-morebtn" href="https://agromi.ro/categorie-produs/seminte-de-legume/" target="_blank" rel="noopener noreferrer">
                Vezi toate semințele →
              </a>
            </div>
          </div>

          {seedsLoading ? (
            <div className="ag-skel">Se încarcă semințele recomandate…</div>
          ) : seedsError ? (
            <div className="ag-err">Nu s-au putut încărca semințele: {seedsError}</div>
          ) : (
            <div className="ag-grid ag-six">
              {seedsToShow.map((p, idx) => (
                <ProductCard key={`${p.permalink || p.name}-${idx}`} p={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
