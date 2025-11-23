import { useEffect, useMemo, useRef, useState } from "react";

/* ========= Config ========= */
const API_BASE_RAW = (import.meta.env.VITE_API_BASE || "/backend/api").replace(/\/$/, "");
const API_ROOT = API_BASE_RAW.endsWith("/api") ? API_BASE_RAW : `${API_BASE_RAW}/api`;
const REFRESH_MS_DEFAULT = Math.max(2000, Number(import.meta.env.VITE_REFRESH_MS || 10000));

/* ========= Helpers ========= */
const to01 = (v) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v > 0 ? 1 : 0;
  if (typeof v === "boolean") return v ? 1 : 0;
  const s = String(v).trim().toLowerCase();
  if (["1", "on", "true", "open", "high"].includes(s)) return 1;
  if (["0", "off", "false", "closed", "low"].includes(s)) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? (n > 0 ? 1 : 0) : 0;
};
const onOffText = (v) => (to01(v) ? "Pornit" : "Oprit");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const extractStamp = (snap) => snap?.ATIMEACQ || snap?.STIMEACQ || snap?.TTIMEACQ || null;
const stampAgeSec = (stamp) => (Number.isFinite(Date.parse(stamp)) ? Math.max(0, (Date.now() - Date.parse(stamp)) / 1000) : Infinity);

function pickField(obj, names) {
  const places = [obj, obj?.state, obj?.status, obj?.outputs, obj?.actuators, obj?.data];
  for (const p of places) {
    if (!p || typeof p !== "object") continue;
    for (const name of names) if (name in p) return p[name];
  }
  return undefined;
}

async function fetchJSON(url, init) {
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      Accept: init?.method === "POST" ? "*/*" : "application/json",
      ...(init?.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 240)}`);
  try {
    return JSON.parse(text);
  } catch {
    return { ok: true, text };
  }
}

/* ========= Componenta ========= */
export default function AcumulatoriTab({
  boardId = import.meta.env.VITE_BOARD_ID || "e663ac91d3824a2c",
  refreshMs = REFRESH_MS_DEFAULT,
  actuators = [
    { key: "TESTLED", label: "LED", icon: "💡" },
    { key: "TESTFAN", label: "Ventilator", icon: "🌀" },
    { key: "TESTSRV", label: "Servo", icon: "⚙️" },
    { key: "TESTPMP", label: "Pompă", icon: "🌊" },
  ],
  readAliases = {
    TESTLED: ["TESTLED", "led", "LED", "testled", "act_led"],
    TESTFAN: ["TESTFAN", "fan", "FAN", "testfan", "act_fan"],
    TESTSRV: ["TESTSRV", "srv", "servo", "SRV", "SERVO", "testsrv", "act_srv", "act_servo"],
    TESTPMP: ["TESTPMP", "pmp", "pump", "PMP", "PUMP", "testpmp", "act_pmp", "act_pump"],
  },
}) {
  const [snap, setSnap] = useState(null);
  const [error, setError] = useState(null);
  const [busyKey, setBusyKey] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const aliveRef = useRef(true);
  const timerRef = useRef(null);
  const locksRef = useRef({}); // optimistic UI până confirmă snapshotul

  /* ===== API-ul TĂU ===== */
  const getSnapshot = async () => {
    const u = new URL(`${API_ROOT}/actuators/latest.php`, window.location.origin);
    u.searchParams.set("boardId", boardId);
    const j = await fetchJSON(u.toString());
    return j?.data ?? j;
  };

  const postCommand = async (key, want01) => {
    const url = `${API_ROOT}/actuators/command.php`;
    // încercăm JSON, cu fallback form-url-encoded
    const attempts = [
      {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId, key, value: want01 }),
      },
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ boardId, key, value: String(want01) }).toString(),
      },
    ];
    let lastStatus = 0,
      lastText = "";
    for (const a of attempts) {
      try {
        const res = await fetch(url, { method: "POST", ...a, cache: "no-store" });
        lastStatus = res.status;
        lastText = await res.text();
        if (res.ok) return true;
        if (res.status >= 500) break;
      } catch (e) {
        lastText = String(e?.message || e);
      }
    }
    throw new Error(`Comanda a eșuat (HTTP ${lastStatus || "400"}): ${lastText.slice(0, 180)}`);
  };

  const waitForConfirmation = async (key, want, cmdAtMs, maxMs = 20000) => {
    const t0 = Date.now();
    let last = null;
    while (Date.now() - t0 < maxMs) {
      const s = await getSnapshot();
      last = s;
      const nowVal = to01(pickField(s, readAliases[key] || [key]));
      const stmp = extractStamp(s);
      if (nowVal === want && (!stmp || Date.parse(stmp) >= cmdAtMs)) {
        return { confirmed: true, snap: s };
      }
      await sleep(700);
    }
    return { confirmed: false, snap: last };
  };

  /* ===== lifecycle ===== */
  const load = async (fromBtn = false) => {
    try {
      if (fromBtn) setIsRefreshing(true);
      const s = await getSnapshot();

      // curăță lock-uri expirate
      const locks = locksRef.current;
      for (const [k, lk] of Object.entries(locks)) {
        if (lk && Date.now() > lk.untilMs) delete locks[k];
      }

      setSnap(s);
      setError(null);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      if (fromBtn) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    aliveRef.current = true;
    load();
    timerRef.current = setInterval(load, refreshMs);
    return () => {
      aliveRef.current = false;
      clearInterval(timerRef.current);
    };
  }, [boardId, refreshMs]);

  const states = useMemo(() => {
    const map = {};
    const locks = locksRef.current;
    for (const a of actuators) {
      let raw = snap?.[a.key];
      if (raw === undefined) raw = pickField(snap, readAliases[a.key] || [a.key]);
      let val = to01(raw);
      const lk = locks[a.key];
      if (lk) {
        // optimistic până vine snapshot nou
        val = lk.want;
      }
      map[a.key] = val;
    }
    return map;
  }, [snap, actuators, readAliases]);

  async function send(key, wantOn) {
    setBusyKey(key);
    setError(null);
    const want = wantOn ? 1 : 0;
    const cmdAtMs = Date.now();
    locksRef.current[key] = { want, cmdAtMs, untilMs: cmdAtMs + 20000 };

    try {
      await postCommand(key, want);
      const { confirmed, snap: finalSnap } = await waitForConfirmation(key, want, cmdAtMs, 20000);
      if (finalSnap) setSnap(finalSnap);
      if (!confirmed) {
        // dacă nu a confirmat în timp, renunțăm la lock și lăsăm refresh-ul să repare UI
        delete locksRef.current[key];
      }
    } catch (e) {
      delete locksRef.current[key];
      setError(String(e?.message || e));
    } finally {
      setBusyKey(null);
    }
  }

  /* ===== UI ===== */
  const styles = {
    wrap: {},
    errBox: { background: "#ffe6e6", color: "#7a0612", padding: 10, borderRadius: 8, marginBottom: 12 },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 },
    card: { background: "#1f2937", color: "white", borderRadius: 14, padding: 16, boxShadow: "0 6px 18px rgba(0,0,0,.15)" },
    cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
    cardTitle: { fontSize: 22, display: "flex", alignItems: "center", gap: 8 },
    badge: (on) => ({ background: on ? "#16a34a" : "#9ca3af", color: "white", padding: "4px 10px", borderRadius: 999, fontSize: 12, letterSpacing: 0.3 }),
    btnRow: { display: "flex", gap: 10 },
    btn: (bg) => ({ flex: 1, padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: bg, color: "white", fontWeight: 600 }),
    btnGhost: { padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white", cursor: "pointer" },
    refreshRow: { marginTop: 16, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
    lastRef: { fontSize: 12, opacity: 0.7 },
    staleWarn: { fontSize: 12, color: "#b45309", background: "#fffbeb", padding: "6px 10px", borderRadius: 8, border: "1px solid #f59e0b" },
  };

  return (
    <div style={styles.wrap}>
      {error && (
        <div style={styles.errBox}>
          <strong>Eroare:</strong> {error}
        </div>
      )}

      <div style={styles.grid}>
        {actuators.map((a) => {
          const on = states[a.key] === 1;
          const isSending = busyKey === a.key;

          return (
            <div key={a.key} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>
                  <span style={{ marginRight: 0 }}>{a.icon}</span>
                  {a.label}
                </div>
                <div style={styles.badge(on)}>{onOffText(on)}</div>
              </div>

              <div style={styles.btnRow}>
                <button
                  disabled={isSending || on}
                  onClick={() => send(a.key, true)}
                  style={{ ...styles.btn("#10b981"), opacity: isSending || on ? 0.6 : 1, cursor: isSending || on ? "not-allowed" : "pointer" }}>
                  {isSending ? "…" : "ON"}
                </button>
                <button
                  disabled={isSending || !on}
                  onClick={() => send(a.key, false)}
                  style={{ ...styles.btn("#ef4444"), opacity: isSending || !on ? 0.6 : 1, cursor: isSending || !on ? "not-allowed" : "pointer" }}>
                  {isSending ? "…" : "OFF"}
                </button>
              </div>
            </div>
          );
        })}
        <div style={styles.cardHeader}>
          <div style={styles.cardTitle}>
            <span>💡</span> Veioza Calculator (MQTT)
          </div>
        </div>

        <div style={styles.btnRow}>
          <button
            onClick={async () => {
              try {
                const res = await fetch(`${API_ROOT}/mqtt_toggle.php`, { method: "POST" });
                const data = await res.json();
                console.log("MQTT toggle:", data);
              } catch (e) {
                console.error("Eroare MQTT toggle:", e);
              }
            }}
            style={styles.btn("#3b82f6")}>
            Toggle
          </button>
        </div>
      </div>

      <div style={styles.refreshRow}>
        <button onClick={() => load(true)} style={styles.btnGhost} disabled={isRefreshing}>
          {isRefreshing ? "Se încarcă…" : "Reîmprospătează"}
        </button>
        <div style={styles.lastRef}>
          Ultimul refresh: <code>{extractStamp(snap) || "—"}</code>
        </div>
        {(() => {
          const stamp = extractStamp(snap);
          const staleSec = stampAgeSec(stamp);
          if (!snap || staleSec <= 90) return null;
          return (
            <div style={styles.staleWarn}>
              Atenție: date mai vechi de {Math.round(staleSec)}s (ultimul snapshot: <code>{stamp}</code>).
            </div>
          );
        })()}
      </div>
    </div>
  );
}
