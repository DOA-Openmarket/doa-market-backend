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

export default router;

