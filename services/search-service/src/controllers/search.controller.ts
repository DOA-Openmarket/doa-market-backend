import { Request, Response } from 'express';
import { SearchService } from '@services/search.service';

const searchService = new SearchService();

export class SearchController {
  async search(req: Request, res: Response): Promise<void> {
    try {
      const { keyword } = req.query;
      const { userId } = req.body;
      const filters = req.body.filters || {};

      if (!keyword) {
        res.status(400).json({ success: false, error: 'Keyword is required' });
        return;
      }

      const results = await searchService.searchProducts(keyword as string, filters);

      await searchService.logSearch(
        userId || null,
        keyword as string,
        results.total,
        filters
      );

      res.json({ success: true, data: results });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getPopularKeywords(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const keywords = await searchService.getPopularKeywords(limit);
      res.json({ success: true, data: keywords });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getUserHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const history = await searchService.getUserSearchHistory(userId, limit);
      res.json({ success: true, data: history });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const searchController = new SearchController();
