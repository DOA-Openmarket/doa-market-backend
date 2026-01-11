import { Router } from 'express';
import { searchController } from '@controllers/search.controller';

const router = Router();

router.get('/', searchController.search.bind(searchController));
router.get('/popular', searchController.getPopularKeywords.bind(searchController));
router.get('/history/:userId', searchController.getUserHistory.bind(searchController));

export default router;
