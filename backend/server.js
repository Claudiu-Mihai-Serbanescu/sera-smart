import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import crypto from "crypto";

// conectare MQTT (aici doar importul; handlerul este setat în mqttClient.js)
import mqttClient from "./mqttClient.js";

// DB pentru healthcheck
import pool from "./config/db.js";

// rutele tale
import authRoutes from "./routes/authRoutes.js";
import controlRoutes from "./routes/controlRoutes.js";
import statusRoutes from "./routes/statusRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import sensorDataRoutes from "./routes/sensorDataRoutes.js";
import adviceRoutes from "./routes/adviceRoutes.js";

const app = express();
const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || "127.0.0.1";

app.use("/api/advice", adviceRoutes);
// dacă rulezi în spatele unui proxy (Apache/Nginx)
app.set("trust proxy", 1);

// CORS strict pe domeniile tale
app.use(cors({
  origin: ["https://serty.ro", "https://www.serty.ro"],
  credentials: true,
}));

// parsere
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// sesiuni (ideal setezi SESSION_SECRET în .env)
app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString("hex"),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

// rute simple
app.get("/", (_req, res) => res.send("API is running"));
app.get("/api/test", (_req, res) => res.json({ message: "API test working" }));

// healthcheck DB + MQTT
app.get("/api/health", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    const dbOk = rows?.[0]?.ok === 1;
    const mqttOk = mqttClient.connected === true;
    res.json({
      ok: dbOk && mqttOk,
      db: dbOk,
      mqtt: mqttOk,
      env: process.env.NODE_ENV || "development",
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      db: false,
      mqtt: mqttClient.connected === true,
      error: err.message,
    });
  }
});

// rutele aplicației
app.use("/api/auth", authRoutes);
app.use("/api/control", controlRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/sensors", sensorDataRoutes);

// IMPORTANT: NU mai atașa aici mqttClient.on("message", ...) – e deja în mqttClient.js

// pornește doar pe loopback (Apache face reverse-proxy HTTPS)
app.listen(port, host, () => {
  console.log(`Server running on http://${host}:${port}`);
});
