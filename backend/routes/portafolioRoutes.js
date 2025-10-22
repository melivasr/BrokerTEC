import express from 'express';
import { getPortafolio } from '../controllers/portafolioController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, getPortafolio);

export default router;
