// backend/controllers/sensorDataController.js
import pool from "../config/db.js";

/** GET /api/sensors/latest?boardId=... */
export async function getLatest(req, res) {
  try {
    const boardId = req.query.boardId || req.query.board || "";
    if (!boardId) return res.status(400).json({ error: "Missing boardId" });

    const [rows] = await pool.query(
      `SELECT SBOARDID,TEMPAER,UMDTAER,UMDTSOL1,UMDTSOL2,UMDTSOL3,UMDTSOL4,
              ILUMINARE,NIVELAPA,EXCESAPA,CALITAER,STAREAER,STIMEACQ
         FROM C_SNDATA
        WHERE SBOARDID = ?
        ORDER BY STIMEACQ DESC
        LIMIT 1`,
      [boardId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });

    const r = rows[0];
    // răspuns plat (cum așteaptă frontul)
    res.json({
      boardId: r.SBOARDID,
      TEMPAER: Number(r.TEMPAER),
      UMDTAER: Number(r.UMDTAER),
      UMDTSOL1: Number(r.UMDTSOL1),
      UMDTSOL2: Number(r.UMDTSOL2),
      UMDTSOL3: Number(r.UMDTSOL3),
      UMDTSOL4: Number(r.UMDTSOL4),
      ILUMINARE: Number(r.ILUMINARE),
      NIVELAPA: Number(r.NIVELAPA),
      EXCESAPA: Number(r.EXCESAPA),
      CALITAER: Number(r.CALITAER),
      STAREAER: r.STAREAER,
      STIMEACQ: r.STIMEACQ,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

/** GET /api/sensors/history?boardId=...&key=TEMPAER&range=7d */
export async function getHistory(req, res) {
  try {
    const boardId = req.query.boardId || "";
    const key = req.query.key || "TEMPAER";
    const range = (req.query.range || "7d").toLowerCase();

    if (!boardId) return res.status(400).json({ error: "Missing boardId" });

    const days = range === "24h" ? 1
               : range === "3d"  ? 3
               : range === "7d"  ? 7
               : range === "30d" ? 30
               : 365; // "all"

    const allowed = new Set([
      "TEMPAER","UMDTAER","UMDTSOL1","UMDTSOL2","UMDTSOL3","UMDTSOL4",
      "ILUMINARE","NIVELAPA","EXCESAPA","CALITAER"
    ]);
    if (!allowed.has(key)) return res.status(400).json({ error: "Invalid key" });

    const [rows] = await pool.query(
      `SELECT STIMEACQ, ${key} AS val
         FROM C_SNDATA
        WHERE SBOARDID = ?
          AND STIMEACQ >= (NOW() - INTERVAL ? DAY)
        ORDER BY STIMEACQ ASC`,
      [boardId, days]
    );

    res.json({
      boardId,
      key,
      points: rows.map(r => ({ time: r.STIMEACQ, value: r.val === null ? null : Number(r.val) })),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

/** GET /api/sensors/boards */
export async function listBoards(_req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT SBOARDID AS boardId, MAX(STIMEACQ) AS lastSeen
         FROM C_SNDATA
        GROUP BY SBOARDID
        ORDER BY lastSeen DESC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

/** opționale pentru debug */
export async function getRawMessages(req, res) {
  try {
    const boardId = req.query.boardId || "";
    const [rows] = await pool.query(
      `SELECT * FROM C_SNDATA
        ${boardId ? "WHERE SBOARDID=?" : ""}
        ORDER BY STIMEACQ DESC LIMIT 100`,
      boardId ? [boardId] : []
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
export async function getTempAerHistory(req, res) {
  req.query.key = "TEMPAER";
  return getHistory(req, res);
}
