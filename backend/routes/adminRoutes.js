import express from 'express';
const router = express.Router();
import {getMercados, createMercado, updateMercado, deleteMercado, getEmpresasAdmin, createEmpresaAdmin,
    updateEmpresa, delistarEmpresa, getHistorialPrecio, cargarPrecioManual, cargarPreciosBatch,     getUsuarios,
    getUsuarioCuentas, deshabilitarUsuario, getTopWallet, getTopAcciones, createUsuario,
    updateUsuarioAdmin} from '../controllers/adminController.js';
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

router.get('/empresas/:id/historial-precio', getHistorialPrecio);
router.post('/empresas/:id/cargar-precio', cargarPrecioManual);
router.post('/precios/batch', cargarPreciosBatch);

router.get('/usuarios', getUsuarios);
router.get('/usuarios/:id/cuentas', getUsuarioCuentas);
router.post('/usuarios', createUsuario);
router.put('/usuarios/:id', updateUsuarioAdmin);
router.post('/usuarios/:id/deshabilitar', deshabilitarUsuario);
router.get('/usuarios/top-wallet', getTopWallet);
router.get('/usuarios/top-acciones', getTopAcciones);
export default router;