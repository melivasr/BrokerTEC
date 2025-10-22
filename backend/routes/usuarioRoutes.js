import express from "express";
import { getLastAccess, liquidarTodo } from "../controllers/usuarioController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/last-access", verifyToken, getLastAccess);
router.post("/liquidar-todo", verifyToken, liquidarTodo);

export default router;