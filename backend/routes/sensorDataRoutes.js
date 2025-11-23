// backend/routes/sensorDataRoutes.js
import express from "express";
import {
  getRawMessages,
  getTempAerHistory,
  getLatest,
  getHistory,
  listBoards,
} from "../controllers/sensorDataController.js";

const router = express.Router();

// endpointurile pe care le apelează frontul
router.get("/latest", getLatest);            // /api/sensors/latest?boardId=...
router.get("/history", getHistory);          // /api/sensors/history?boardId=...&key=TEMPAER&range=7d
router.get("/boards", listBoards);           // /api/sensors/boards

// auxiliere (dacă le folosești)
router.get("/getRawMessages", getRawMessages);
router.get("/getTempAerHistory", getTempAerHistory);

export default router;
