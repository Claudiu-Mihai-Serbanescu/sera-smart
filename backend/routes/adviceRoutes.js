// routes/adviceRoutes.js
import { Router } from "express";
import { getAdvice } from "../controllers/adviceController.js";
const router = Router();

router.get("/", getAdvice); // /api/advice?sensor=temp&value=14.6
export default router;