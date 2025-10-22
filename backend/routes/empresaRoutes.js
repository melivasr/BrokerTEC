import express from 'express';
const router = express.Router();
import { getEmpresas, createEmpresa, getEmpresaDetalle, comprarAcciones, venderAcciones, marcarFavorita, getFavoritas } from '../controllers/empresaController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';


router.get('/', getEmpresas);      // GET /api/empresas
router.get('/favoritas', verifyToken, getFavoritas); // GET /api/empresas/favoritas
router.get('/:id', getEmpresaDetalle); // GET /api/empresas/:id (detalle)
router.post('/:id/comprar', verifyToken, comprarAcciones); // POST /api/empresas/:id/comprar
router.post('/:id/vender', verifyToken, venderAcciones); // POST /api/empresas/:id/vender
router.post('/:id/favorita', verifyToken, marcarFavorita); // POST /api/empresas/:id/favorita
router.post('/', createEmpresa);   // POST /api/empresas

export default router;