import express from "express";
import { getLatestSensorData } from "../controllers/statusController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";



const router = express.Router();

router.get("/", authenticateToken, getLatestSensorData);

export default router;



