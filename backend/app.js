import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import traderRoutes from './routes/traderRoutes.js';
import analistaRoutes from './routes/analistaRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/auth", authRoutes);
app.use('/api/trader', traderRoutes);     // Todas las rutas del trader bajo /api/trader/*
app.use('/api/analista', analistaRoutes);
app.use('/api/admin', adminRoutes);

export default app;
