import express from "express";
import { getWallet, recargarWallet } from "../controllers/walletController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, getWallet);
router.post("/recargar", verifyToken, recargarWallet);

export default router;