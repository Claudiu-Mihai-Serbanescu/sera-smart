import express from "express";
import { sendActuatorCommand } from "../controllers/controlController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";


const router = express.Router();

router.post("/", authenticateToken, sendActuatorCommand);
export default router;

