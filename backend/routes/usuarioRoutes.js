import express from "express";
import { getLastAccessSeguridad, registrarAccesoSeguridad, liquidarTodo } from "../controllers/usuarioController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/last-access-seguridad", verifyToken, getLastAccessSeguridad);
router.post("/registrar-acceso-seguridad", verifyToken, registrarAccesoSeguridad);
router.post("/liquidar-todo", verifyToken, liquidarTodo);

export default router;