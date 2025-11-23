// utilsothers/parseSensorPayload.js
import pool from "../config/db.js";

const num  = (v) => (v === null || v === undefined || v === "" ? null : Number(v));
const int  = (v) => (v === null || v === undefined || v === "" ? null : parseInt(v, 10));
const strz = (v) => (v === null || v === undefined ? null : String(v));

export async function handleMQTTMessage(topic, message) {
  const ingestTopic = process.env.MQTT_TOPIC_IN || "greenhouse/ingest";

  // Doar aceste topicuri ne interesează aici
  const isIngest = topic === ingestTopic || topic.startsWith(`${ingestTopic}/`);
  const isSmart  = topic === "smart/led";

  // === smart/led (lăsat pentru compatibilitate)
  if (isSmart) {
    try {
      const data = JSON.parse(message.toString());
      console.log("smart/led:", data);
    } catch (e) {
      console.error("smart/led parse error:", e.message);
    }
    return;
  }

  // === greenhouse/ingest[/<boardId>]
  if (!isIngest) return;

  try {
    const payload = JSON.parse(message.toString());

    // boardId din payload sau din topic (suportă greenhouse/ingest/<boardId>)
    const boardId =
      payload.boardId ||
      (topic.startsWith(`${ingestTopic}/`) ? topic.slice(ingestTopic.length + 1) : null) ||
      payload.BOARD_ID || null;

    if (!boardId) {
      console.warn("Ingest: missing boardId. Topic:", topic);
      return;
    }

    // Acceptăm chei UI (TEMP_AER) și DB (TEMPAER)
    const sRaw = payload.sensors   || payload.sensor   || {};
    const aRaw = payload.actuators || payload.actuator || {};
    const tRaw = payload.technical || payload.tech     || {};

    const s = {
      TEMPAER:   num(sRaw.TEMPAER    ?? sRaw.TEMP_AER),
      UMDTAER:   num(sRaw.UMDTAER    ?? sRaw.UMDT_AER),
      UMDTSOL1:  num(sRaw.UMDTSOL1   ?? sRaw.UMDT_SOL1),
      UMDTSOL2:  num(sRaw.UMDTSOL2   ?? sRaw.UMDT_SOL2),
      UMDTSOL3:  num(sRaw.UMDTSOL3   ?? sRaw.UMDT_SOL3),
      UMDTSOL4:  num(sRaw.UMDTSOL4   ?? sRaw.UMDT_SOL4),
      ILUMINARE: int(sRaw.ILUMINARE  ?? sRaw.ILUM_NAT),
      NIVELAPA:  num(sRaw.NIVELAPA   ?? sRaw.NIVEL_APA),
      EXCESAPA:  int(sRaw.EXCESAPA   ?? sRaw.EXCES_APA),
      CALITAER:  num(sRaw.CALITAER   ?? sRaw.CALIT_AER),
      STAREAER:  strz(sRaw.STAREAER  ?? sRaw.CALIT_STA),
    };

    const a = {
      TESTLED: int(aRaw.TESTLED),
      TESTFAN: int(aRaw.TESTFAN),
      TESTSRV: int(aRaw.TESTSRV),
      TESTPMP: int(aRaw.TESTPMP),
    };

    const t = {
      UNQHWMAC: strz(tRaw.UNQHWMAC),
      TBOARDIP: strz(tRaw.TBOARDIP),
      SYSUPTIME: int(tRaw.SYSUPTIME),
      TEMPINT:   num(tRaw.TEMPINT),
      FREEMEM:   int(tRaw.FREEMEM),
    };

    // INSERT C_SNDATA
    await pool.query(
      `INSERT INTO C_SNDATA
       (SBOARDID, TEMPAER, UMDTAER, UMDTSOL1, UMDTSOL2, UMDTSOL3, UMDTSOL4,
        ILUMINARE, NIVELAPA, EXCESAPA, CALITAER, STAREAER, STIMEACQ)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?, NOW())`,
      [
        boardId, s.TEMPAER, s.UMDTAER, s.UMDTSOL1, s.UMDTSOL2, s.UMDTSOL3, s.UMDTSOL4,
        s.ILUMINARE, s.NIVELAPA, s.EXCESAPA, s.CALITAER, s.STAREAER,
      ]
    );

    // INSERT C_ACTUATOR
    await pool.query(
      `INSERT INTO C_ACTUATOR
       (ABOARDID, TESTLED, TESTFAN, TESTSRV, TESTPMP, ATIMEACQ)
       VALUES (?,?,?,?,?, NOW())`,
      [boardId, a.TESTLED, a.TESTFAN, a.TESTSRV, a.TESTPMP]
    );

    // INSERT C_TECHDATA
    await pool.query(
      `INSERT INTO C_TECHDATA
       (TBOARDID, UNQHWMAC, TBOARDIP, SYSUPTIME, TEMPINT, FREEMEM, TSTAMP)
       VALUES (?,?,?,?,?,?, NOW())`,
      [boardId, t.UNQHWMAC, t.TBOARDIP, t.SYSUPTIME, t.TEMPINT, t.FREEMEM]
    );

    console.log("✅ MQTT ingest OK for", boardId);
    return { ok: true, boardId };
  } catch (err) {
    console.error("❌ Error processing sensor payload:", err.message);
  }
}
