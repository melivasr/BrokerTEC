import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import empresaRoutes from './routes/empresaRoutes.js';
import homeTraderRoute from './routes/homeTraderRoute.js';
import portafolioRoutes from './routes/portafolioRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/home-trader', homeTraderRoute);
app.use('/api/portafolio', portafolioRoutes);

export default app;
