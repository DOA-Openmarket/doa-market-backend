import { Router } from 'express';
import { pointController } from '@controllers/point.controller';

const router = Router();

// 포인트 적립
router.post('/earn', (req, res) => pointController.earnPoints(req, res));

// 포인트 사용
router.post('/use', (req, res) => pointController.usePoints(req, res));

// 포인트 환불
router.post('/refund', (req, res) => pointController.refundPoints(req, res));

// 사용자 포인트 조회
router.get('/users/:userId', (req, res) => pointController.getUserPoints(req, res));

// 거래 내역 조회
router.get('/users/:userId/transactions', (req, res) => pointController.getTransactions(req, res));

// 만료 예정 포인트 조회
router.get('/users/:userId/expiring', (req, res) => pointController.getExpiringPoints(req, res));

export default router;

