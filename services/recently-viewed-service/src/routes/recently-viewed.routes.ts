import { Router } from 'express';
import { recentlyViewedController } from '@controllers/recently-viewed.controller';

const router = Router();

// 최근 본 상품 추가/업데이트
router.post('/', (req, res) => recentlyViewedController.addRecentlyViewed(req, res));

// 사용자의 최근 본 상품 목록
router.get('/users/:userId', (req, res) => recentlyViewedController.getRecentlyViewed(req, res));

// 특정 상품 삭제
router.delete('/users/:userId/products/:productId', (req, res) => recentlyViewedController.removeItem(req, res));

// 모두 삭제
router.delete('/users/:userId', (req, res) => recentlyViewedController.clearAll(req, res));

// 상품 조회 통계
router.get('/products/:productId/stats', (req, res) => recentlyViewedController.getProductViewStats(req, res));

// 사용자 관심 분석
router.get('/users/:userId/analysis', (req, res) => recentlyViewedController.getUserInterestAnalysis(req, res));

export default router;

