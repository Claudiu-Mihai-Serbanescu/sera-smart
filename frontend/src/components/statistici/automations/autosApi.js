/**
 * autosApi.js
 * Wrapper pentru apeluri API.
 * – fetchJSON(url, init)
 * – getSnapshot(extRoot, boardId)  → GET /sensors
 * – postCommand(extRoot, actEndpoint, boardId, actuator, value)  → POST /command
 */

export async function fetchJSON(url, init) {
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      Accept: init?.method === "POST" ? "*/*" : "application/json",
      "Content-Type": init?.method === "POST" ? "application/json" : undefined,
      ...(init?.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  const isJSON = /application\/json/i.test(res.headers.get("content-type") || "");
  return isJSON ? JSON.parse(text) : { ok: true, text };
}

export async function getSnapshot(extRoot, boardId) {
  const url = `${extRoot}/sensors?identifier=${encodeURIComponent(boardId)}&_=${Date.now()}`;
  const j = await fetchJSON(url);
  return j?.data ?? j;
}

export async function postCommand(extRoot, actEndpoint, boardId, actuator, value) {
  const url = `${extRoot}${actEndpoint}?identifier=${encodeURIComponent(boardId)}`;
  await fetchJSON(url, { method: "POST", body: JSON.stringify({ deviceId: boardId, actuator, value }) });
}
