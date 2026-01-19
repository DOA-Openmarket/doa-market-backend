import { Router } from 'express';
import { searchProducts, autocomplete } from '../config/opensearch.config';
import { logger } from '../utils/logger';

const router = Router();

router.get('/products', async (req, res) => {
  try {
    const {
      q = '',
      page = '1',
      size = '20',
      categoryId,
      minPrice,
      maxPrice,
      sortBy = 'relevance',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const sizeNum = parseInt(size as string, 10);

    if (pageNum < 1 || sizeNum < 1 || sizeNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pagination parameters',
      });
    }

    const result = await searchProducts(q as string, {
      from: (pageNum - 1) * sizeNum,
      size: sizeNum,
      categoryId: categoryId as string,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      sortBy: sortBy as any,
    });

    res.json({
      success: true,
      data: {
        products: result.products,
        pagination: {
          page: pageNum,
          size: sizeNum,
          total: result.total,
          totalPages: Math.ceil(result.total / sizeNum),
        },
      },
    });
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
    });
  }
});

router.get('/autocomplete', async (req, res) => {
  try {
    const { q, limit = '10' } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter required',
      });
    }

    const limitNum = parseInt(limit as string, 10);
    if (limitNum < 1 || limitNum > 20) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit parameter',
      });
    }

    const suggestions = await autocomplete(q, limitNum);

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    logger.error('Autocomplete error:', error);
    res.status(500).json({
      success: false,
      error: 'Autocomplete failed',
    });
  }
});

// 인기 검색어 조회
router.get('/popular', async (req, res) => {
  try {
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    if (limitNum < 1 || limitNum > 50) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit parameter',
      });
    }

    // TODO: 실제 인기 검색어 집계 로직 구현 (Redis 또는 OpenSearch aggregation 사용)
    // 현재는 임시 데이터 반환
    const popularKeywords = [
      { keyword: '노트북', rank: 1, searchCount: 1250 },
      { keyword: '무선이어폰', rank: 2, searchCount: 980 },
      { keyword: '스마트워치', rank: 3, searchCount: 850 },
      { keyword: '게이밍마우스', rank: 4, searchCount: 720 },
      { keyword: '키보드', rank: 5, searchCount: 650 },
      { keyword: '모니터', rank: 6, searchCount: 580 },
      { keyword: '외장하드', rank: 7, searchCount: 520 },
      { keyword: 'USB', rank: 8, searchCount: 490 },
      { keyword: '마우스패드', rank: 9, searchCount: 450 },
      { keyword: '충전기', rank: 10, searchCount: 420 },
    ].slice(0, limitNum);

    res.json({
      success: true,
      data: popularKeywords,
    });
  } catch (error) {
    logger.error('Popular keywords error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get popular keywords',
    });
  }
});

// 검색 기록 조회 (사용자별)
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = '20' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    if (limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit parameter',
      });
    }

    // TODO: 실제 검색 기록 조회 로직 구현 (Redis 또는 Database 사용)
    // 현재는 빈 배열 반환
    const searchHistory: any[] = [];

    res.json({
      success: true,
      data: searchHistory,
    });
  } catch (error) {
    logger.error('Search history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get search history',
    });
  }
});

export default router;

