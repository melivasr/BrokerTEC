import express from 'express';
const router = express.Router();
import {updateBilletera, getBilletera, createMercado, updateMercado, deleteMercado, getEmpresasAdmin, createEmpresaAdmin,
    updateEmpresa, updateInventario, delistarEmpresa, getHistorialPrecio, cargarPrecioManual, cargarPreciosBatch,     getUsuarios,
    getUsuarioCuentas, getTopWallet, getTopAcciones, habilitarMercado, deshabilitarMercado, deshabilitarUsuario} from '../controllers/adminController.js';
import { verifyToken, verifyRole } from '../middlewares/authMiddleware.js';

// Proteger todas las rutas de admin requiriendo token válido y rol 'Admin'
router.use(verifyToken);
router.use(verifyRole('Admin'));

router.get('/billetera/:id_billetera', getBilletera);
router.put('/billetera/:id_billetera', updateBilletera);

router.post('/mercados', createMercado);
router.put('/mercados/:id', updateMercado);
router.delete('/mercados/:id', deleteMercado);

router.get('/empresas', getEmpresasAdmin);
router.post('/empresas', createEmpresaAdmin);
router.put('/empresas/:id', updateEmpresa);
router.put('/inventario/:id', updateInventario);
router.post('/empresas/:id/delistar', delistarEmpresa);

router.get('/empresas/:id/historial-precio', getHistorialPrecio);
router.post('/empresas/:id/cargar-precio', cargarPrecioManual);
router.post('/precios/batch', cargarPreciosBatch);

router.get('/usuarios', getUsuarios);
router.get('/usuarios/:id/cuentas', getUsuarioCuentas);
router.post('/usuarios/:id/deshabilitar', deshabilitarUsuario);

router.get('/usuarios/top-wallet', getTopWallet);
router.get('/usuarios/top-acciones', getTopAcciones);

router.post('/usuarios/:id/mercados', habilitarMercado);
router.delete('/usuarios/:id/mercados/:idMercado', deshabilitarMercado);

export default router;