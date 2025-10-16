import express from "express";
import { getHomeTraderData } from "../controllers/homeTraderController.js";
const router = express.Router();

// GET /api/home-trader/:id
router.get("/:id", getHomeTraderData);

export default router;
