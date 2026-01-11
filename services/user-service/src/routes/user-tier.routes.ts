import { Router } from 'express';
import { userTierController } from '@controllers/user-tier.controller';

const router = Router();

// 사용자 등급 조회
router.get('/users/:userId', (req, res) => userTierController.getUserTier(req, res));

// 등급 통계 업데이트
router.post('/update-stats', (req, res) => userTierController.updateTierStats(req, res));

// 등급 변경 히스토리
router.get('/users/:userId/history', (req, res) => userTierController.getTierHistory(req, res));

// 수동 등급 변경 (관리자)
router.post('/admin/change-tier', (req, res) => userTierController.changeTierManually(req, res));

// 등급별 통계 (관리자)
router.get('/admin/statistics', (req, res) => userTierController.getTierStatistics(req, res));

export default router;

