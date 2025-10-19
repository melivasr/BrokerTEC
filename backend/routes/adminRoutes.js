// adminRoutes.js
import express from 'express';
const router = express.Router();
import {getMercados, createMercado, updateMercado, deleteMercado, getEmpresasAdmin, createEmpresaAdmin,
    updateEmpresa, delistarEmpresa} from '../controllers/adminController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

router.use(verifyToken);
router.get('/mercados', getMercados);
router.post('/mercados', createMercado);
router.put('/mercados/:id', updateMercado);
router.delete('/mercados/:id', deleteMercado);
router.get('/empresas', getEmpresasAdmin);
router.post('/empresas', createEmpresaAdmin);
router.put('/empresas/:id', updateEmpresa);
router.post('/empresas/:id/delistar', delistarEmpresa);

export default router;