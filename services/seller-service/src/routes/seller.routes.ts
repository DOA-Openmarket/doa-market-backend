import { Router } from 'express';
import { sellerController } from '@controllers/seller.controller';

const router = Router();

// GET /api/v1/sellers - Get all sellers (with filters and pagination)
router.get('/', sellerController.getAllSellers.bind(sellerController));

// GET /api/v1/sellers/:sellerId - Get seller by ID
router.get('/:sellerId', sellerController.getSeller.bind(sellerController));

// GET /api/v1/sellers/user/:userId - Get seller by user ID
router.get('/user/:userId', sellerController.getSellerByUserId.bind(sellerController));

// POST /api/v1/sellers - Create new seller
router.post('/', sellerController.createSeller.bind(sellerController));

// PUT /api/v1/sellers/:sellerId - Update seller
router.put('/:sellerId', sellerController.updateSeller.bind(sellerController));

// POST /api/v1/sellers/:sellerId/approve - Approve seller (admin)
router.post('/:sellerId/approve', sellerController.approveSeller.bind(sellerController));

// POST /api/v1/sellers/:sellerId/reject - Reject seller (admin)
router.post('/:sellerId/reject', sellerController.rejectSeller.bind(sellerController));

// POST /api/v1/sellers/:sellerId/suspend - Suspend seller (admin)
router.post('/:sellerId/suspend', sellerController.suspendSeller.bind(sellerController));

// POST /api/v1/sellers/:sellerId/activate - Activate seller (admin)
router.post('/:sellerId/activate', sellerController.activateSeller.bind(sellerController));

// PATCH /api/v1/sellers/:sellerId/stats - Update seller statistics
router.patch('/:sellerId/stats', sellerController.updateSellerStats.bind(sellerController));

// DELETE /api/v1/sellers/:sellerId - Delete seller
router.delete('/:sellerId', sellerController.deleteSeller.bind(sellerController));

export default router;
