const KEY_ITEMS = "notif.items";

/** citește lista din localStorage */
function read() {
  try {
    const raw = localStorage.getItem(KEY_ITEMS);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** scrie lista + emite evenimente pentru UI (și badge meniu) */
function write(items) {
  try {
    localStorage.setItem(KEY_ITEMS, JSON.stringify(items));
  } catch {}
  const active = items.filter((n) => n.status === "activ").length;
  try {
    localStorage.setItem("notif.count", String(active));
  } catch {}
  // badge
  window.dispatchEvent(new CustomEvent("notif-count", { detail: active }));
  // listă (pt. componente)
  window.dispatchEvent(new CustomEvent("notif-update", { detail: { items, active } }));
}

/** expune API */
export const notificationsStore = {
  getAll() {
    return read();
  },
  /** setează lista completă */
  setAll(items) {
    write(items);
  },
  /** adaugă una */
  add(item) {
    const items = read();
    items.unshift(item);
    write(items);
  },
  /** actualizează după id */
  update(id, patch) {
    const items = read().map((n) => (n.id === id ? { ...n, ...patch } : n));
    write(items);
  },
  /** șterge după id */
  remove(id) {
    const items = read().filter((n) => n.id !== id);
    write(items);
  },
  /** subscribe la schimbări (returnează unsubscribe) */
  subscribe(cb) {
    const handler = (e) => cb(e.detail?.items ?? read());
    window.addEventListener("notif-update", handler);
    // hidratare imediată
    cb(read());
    return () => window.removeEventListener("notif-update", handler);
  },
  /** seed inițial dacă nu există nimic */
  seedIfEmpty(seedArray = []) {
    const cur = read();
    if (!cur || cur.length === 0) {
      write(seedArray);
    }
  },
};
