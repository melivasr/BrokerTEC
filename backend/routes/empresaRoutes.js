import express from 'express';
const router = express.Router();
import { getEmpresas, createEmpresa, getEmpresaDetalle, comprarAcciones, venderAcciones } from '../controllers/empresaController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';


router.get('/', getEmpresas);      // GET /api/empresas
router.get('/:id', getEmpresaDetalle); // GET /api/empresas/:id (detalle)
router.post('/:id/comprar', verifyToken, comprarAcciones); // POST /api/empresas/:id/comprar
router.post('/:id/vender', verifyToken, venderAcciones); // POST /api/empresas/:id/vender
router.post('/', createEmpresa);   // POST /api/empresas

export default router;