import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import empresaRoutes from './routes/empresaRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use('/api/empresas', empresaRoutes);

export default app;
