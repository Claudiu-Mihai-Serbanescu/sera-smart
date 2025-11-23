import React, { useState, useMemo, useEffect } from "react";
import { Modal, Button, ButtonGroup, Spinner, Alert } from "react-bootstrap";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const INTERVALS = [
  { key: "24h", label: "24h" },
  { key: "3d", label: "3 zile" },
  { key: "7d", label: "7 zile" },
  { key: "30d", label: "30 zile" },
  { key: "all", label: "Tot" },
];

const IS_DEV = import.meta.env.DEV;
const API_BASE_RAW = (import.meta.env.VITE_API_BASE || "/backend/api").replace(/\/$/, "");
const API_ROOT = API_BASE_RAW.endsWith("/api") ? API_BASE_RAW : `${API_BASE_RAW}/api`;
const FALLBACK_BOARD_ID = import.meta.env.VITE_BOARD_ID || "e663ac91d3824a2c";

/* ===== Downsample: 1 punct / 15 minute (medie pe bucket) ===== */
const DOWNSAMPLE_MINUTES = 15;
const BUCKET_MS = DOWNSAMPLE_MINUTES * 60 * 1000;
function downsampleToBuckets(pts, stepMs = BUCKET_MS) {
  // pts: [{ ms, v }]
  const map = new Map();
  for (const p of pts) {
    const bucket = Math.floor(p.ms / stepMs) * stepMs;
    const acc = map.get(bucket) || { ms: bucket, sum: 0, count: 0, min: p.v, max: p.v };
    acc.sum += p.v;
    acc.count += 1;
    if (p.v < acc.min) acc.min = p.v;
    if (p.v > acc.max) acc.max = p.v;
    map.set(bucket, acc);
  }
  return [...map.values()].sort((a, b) => a.ms - b.ms).map((a) => ({ ms: a.ms, v: +(a.sum / a.count).toFixed(2), min: a.min, max: a.max }));
}

// map UI -> coloane DB
const ALIAS_TO_DB = {
  temp: "TEMPAER",
  humi_air: "UMDTAER",
  humi_soil1: "UMDTSOL1",
  humi_soil2: "UMDTSOL2",
  humi_soil3: "UMDTSOL3",
  humi_soil4: "UMDTSOL4",
  light: "ILUMINARE",
  water_level: "NIVELAPA",
  air_quality: "CALITAER",
};
const FIELD_WHITELIST = new Set(Object.values(ALIAS_TO_DB));

function hoursForRange(key) {
  switch (key) {
    case "24h":
      return 24;
    case "3d":
      return 72;
    case "7d":
      return 168;
    case "30d":
      return 720;
    case "all":
      return 24 * 90;
    default:
      return 24;
  }
}
function formatHourLabel(date, range) {
  if (range === "24h" || range === "3d") {
    return date.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleString("ro-RO", { day: "2-digit", month: "short", hour: "2-digit" });
}

async function tryFetchJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Răspuns non-JSON: ${text.slice(0, 200)}`);
  }
}

/** Citește istoricul din API-ul tău; include &key=<FIELD> și &range=. Fără step la request. */
async function fetchHistoryPayload(boardId, key, rangeKey) {
  // backend/api/sensors/history.php există ca fișier – îl apelăm explicit
  const u = new URL(`${API_ROOT}/sensors/history.php`, window.location.origin);
  u.searchParams.set("boardId", boardId);
  u.searchParams.set("key", key);
  if (rangeKey) u.searchParams.set("range", rangeKey);
  if (IS_DEV) u.searchParams.set("uid", "1"); // trece ACL în dev (vede ca X-User-Id)
  return tryFetchJson(u.toString());
}

export default function ModalSenzor({ senzor, onClose, boardId: propBoardId }) {
  const [interval, setInterval] = useState("24h");
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  if (!senzor) return null;

  const boardId = propBoardId || FALLBACK_BOARD_ID;
  const fieldDb = ALIAS_TO_DB[senzor.key] || (FIELD_WHITELIST.has(senzor.key) ? senzor.key : null);
  const strokeColor = senzor.status === "healthy" ? "#198754" : senzor.status === "warning" ? "#ffc107" : "#dc3545";
  const historyRange = useMemo(() => (interval === "all" ? "all" : interval), [interval]);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!fieldDb) {
        setSeries(null);
        setLoading(false);
        setErr("Acest senzor nu are serie numerică în DB.");
        return;
      }
      if (!boardId) {
        setSeries(null);
        setLoading(false);
        setErr("Lipsește boardId.");
        return;
      }

      setLoading(true);
      setErr(null);

      try {
        const payload = await fetchHistoryPayload(boardId, fieldDb, historyRange);

        // Acceptă cât mai multe forme:
        // a) { [KEY]: [{value,timestamp}], ... }
        // b) { points:[{value,timestamp}, ...] }
        // c) { data:[ { STIMEACQ, KEY, ... }, ... ] }
        // d) [ { STIMEACQ, KEY, ... }, ... ]
        let raw = [];
        const dict = payload && !Array.isArray(payload) ? payload.data || payload.rows || payload.reports || payload : null;

        if (dict && Array.isArray(dict[fieldDb])) {
          raw = dict[fieldDb]; // [{ value, timestamp }]
        } else if (dict && Array.isArray(dict.points)) {
          raw = dict.points; // [{ value, timestamp }]
        } else if (Array.isArray(payload)) {
          raw = payload; // [ { STIMEACQ, KEY, ... } ]
        } else if (Array.isArray(payload?.data)) {
          raw = payload.data; // { data: [ ... ] }
        }

        const now = Date.now();
        const fromMs = now - hoursForRange(historyRange) * 3600 * 1000;

        const pts = raw
          .map((r) => {
            // Tolerăm diverse denumiri
            const ts = r.timestamp ?? r.ts ?? r.STIMEACQ ?? r.time ?? r.date ?? r.bucket ?? r.windowStart ?? r.start;
            const val = r.value ?? r[fieldDb] ?? r.v ?? r.val ?? r.avg ?? r.mean;
            const ms = ts ? Date.parse(String(ts).replace(" ", "T")) : NaN;
            const v = Number(val);
            return { ms, v };
          })
          .filter((p) => Number.isFinite(p.ms) && Number.isFinite(p.v))
          .sort((a, b) => a.ms - b.ms)
          .filter((p) => (historyRange === "all" ? true : p.ms >= fromMs && p.ms <= now));

        // Downsample client-side la 15 minute
        const bucketed = downsampleToBuckets(pts, BUCKET_MS);

        const data = bucketed.map((p) => ({
          label: formatHourLabel(new Date(p.ms), historyRange),
          value: p.v,
        }));

        if (!alive) return;
        setSeries(data);
      } catch (e) {
        if (!alive) return;
        console.error("[modal] eroare:", e?.message);
        setErr(e?.message || "Nu s-au putut încărca datele.");
        setSeries([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [boardId, fieldDb, historyRange]);

  return (
    <Modal show onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{senzor.label || senzor.key}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <span style={{ fontSize: "2.5rem", fontWeight: 600, color: strokeColor }}>{senzor.value ?? "—"}</span>
          <div style={{ color: "#666", marginTop: 4 }}>{senzor.helper}</div>
        </div>

        <ButtonGroup className="mb-3">
          {INTERVALS.map((opt) => (
            <Button key={opt.key} variant={interval === opt.key ? "primary" : "outline-secondary"} onClick={() => setInterval(opt.key)}>
              {opt.label}
            </Button>
          ))}
        </ButtonGroup>

        {loading && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Spinner size="sm" /> Se încarcă seria…
          </div>
        )}
        {err && <Alert variant="danger">Eroare: {err}</Alert>}

        {!loading && !err && series && series.length > 0 && (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={series} margin={{ left: -20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" minTickGap={24} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" dot={false} stroke="#0d6efd" isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {!loading && !err && (!series || series.length === 0) && <div style={{ color: "#555" }}>Nu există date pentru intervalul selectat.</div>}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Închide
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
