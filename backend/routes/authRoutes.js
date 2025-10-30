import express from "express";
import { login, register, updateUser, deleteUser, changePassword, verifyUserStatus } from "../controllers/authController.js";
import { verifyToken, verifyUserEnabled } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.get("/:id/verify-status", verifyToken, verifyUserStatus);
router.put("/:id", verifyToken, verifyUserEnabled, updateUser);
router.delete("/:id", verifyToken, verifyUserEnabled, deleteUser);
router.post("/:id/change-password", verifyToken, verifyUserEnabled, changePassword);

export default router;
