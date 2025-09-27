import express from 'express';
import { getEmpresas, createEmpresa } from '../controllers/empresaController.js';
const router = express.Router();

router.get('/', getEmpresas);      // GET /api/empresas
router.post('/', createEmpresa);   // POST /api/empresas

export default router;