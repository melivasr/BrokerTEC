import express from "express";
import { login, register, updateUser, deleteUser, changePassword } from "../controllers/authController.js";
const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.post("/:id/change-password", changePassword);

export default router;
