import { Router } from 'express';
import { adminController } from '@controllers/admin.controller';

const router = Router();

router.post('/logs', adminController.logAction.bind(adminController));
router.get('/logs', adminController.getLogs.bind(adminController));
router.get('/stats', adminController.getSystemStats.bind(adminController));

export default router;
