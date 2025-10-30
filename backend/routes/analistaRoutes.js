import express from 'express';
const router = express.Router();
import { getTransaccionesEmpresa, getMayorTenedor, getInventarioTesoreria, getHistorialPrecio,
    getEmpresasPorMercado, getHistorialUsuario, getEstadisticasMercado, getEstadisticasEmpresa,
    getMercados
} from '../controllers/analistaController.js';
import { verifyToken, verifyRole } from '../middlewares/authMiddleware.js';

// Proteger rutas de analista: permite tanto Analista como Admin
router.use(verifyToken);
router.use(verifyRole('Analista', 'Admin'));
router.get('/empresa/:id/transacciones', getTransaccionesEmpresa);    
router.get('/empresa/:id/mayor-tenedor', getMayorTenedor);             
router.get('/empresa/:id/inventario-tesoreria', getInventarioTesoreria); 
router.get('/empresa/:id/historial-precio', getHistorialPrecio);    
router.get('/empresas', getEmpresasPorMercado);                     
router.get('/usuario/:alias', getHistorialUsuario); 
router.get('/estadisticas/mercado', getEstadisticasMercado);
router.get('/estadisticas/empresa', getEstadisticasEmpresa); 
router.get('/mercados', getMercados); 

export default router;