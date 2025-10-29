import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';

// Controllers (centralized trader controller)
import {
	getWallet,
	recargarWallet,
	getLastAccessSeguridad,
	registrarAccesoSeguridad,
	liquidarTodo,
	getPortafolio,
	getEmpresas,
	getEmpresaDetalle,
	comprarAcciones,
	venderAcciones,
	marcarFavorita,
	getFavoritas,
	getHomeTraderData
} from '../controllers/traderController.js';

const router = express.Router();

// Todas las rutas aquí usan verifyToken excepto las específicamente marcadas
router.use(verifyToken);

// Wallet routes
router.get("/wallet", getWallet);
router.post("/wallet/recargar", recargarWallet);

// Seguridad y liquidación
router.get("/seguridad/last-access", getLastAccessSeguridad);
router.post("/seguridad/registrar-acceso", registrarAccesoSeguridad);
router.post("/seguridad/liquidar-todo", liquidarTodo);

// Portafolio
router.get('/portafolio', getPortafolio);

// Empresas y operaciones
router.get('/empresas', getEmpresas);      // No requiere auth
router.get('/empresas/favoritas', getFavoritas);
router.get('/empresas/:id', getEmpresaDetalle); // No requiere auth
router.post('/empresas/:id/comprar', comprarAcciones);
router.post('/empresas/:id/vender', venderAcciones);
router.post('/empresas/:id/favorita', marcarFavorita);

// Home Trader data
router.get("/home/:id", getHomeTraderData);

export default router;