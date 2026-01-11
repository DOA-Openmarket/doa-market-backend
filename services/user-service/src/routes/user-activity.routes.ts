import { Router } from 'express';
import { userActivityController } from '@controllers/user-activity.controller';

const router = Router();

// 활동 기록
router.post('/log', (req, res) => userActivityController.logActivity(req, res));

// 사용자 활동 내역
router.get('/users/:userId', (req, res) => userActivityController.getUserActivities(req, res));

// 사용자 통계
router.get('/users/:userId/statistics', (req, res) => userActivityController.getUserStatistics(req, res));

// 통계 업데이트
router.post('/statistics/update', (req, res) => userActivityController.updateStatistics(req, res));

// 기간별 활동 통계
router.get('/users/:userId/stats-by-period', (req, res) => userActivityController.getActivityStatsByPeriod(req, res));

// 최근 활동 요약
router.get('/users/:userId/recent-summary', (req, res) => userActivityController.getRecentActivitySummary(req, res));

// 활동 내역 삭제
router.delete('/users/:userId', (req, res) => userActivityController.deleteUserActivities(req, res));

export default router;

