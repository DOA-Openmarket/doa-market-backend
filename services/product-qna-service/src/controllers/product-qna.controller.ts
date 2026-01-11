import { Request, Response } from 'express';
import { ProductQnAService } from '@services/product-qna.service';
import { QnAStatus } from '@models/ProductQnA';
import logger from '@utils/logger';

const productQnAService = new ProductQnAService();

export class ProductQnAController {
  // 상품 문의 작성
  async createQnA(req: Request, res: Response): Promise<void> {
    try {
      const qna = await productQnAService.createQnA(req.body);

      res.status(201).json({
        success: true,
        data: qna,
      });
    } catch (error: any) {
      logger.error('Error creating QnA:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create QnA',
      });
    }
  }

  // 문의 조회
  async getQnA(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.query.userId as string | undefined;

      const qna = await productQnAService.getQnA(id, userId);

      if (!qna) {
        res.status(404).json({
          success: false,
          error: 'QnA not found',
        });
        return;
      }

      res.json({
        success: true,
        data: qna,
      });
    } catch (error: any) {
      logger.error('Error getting QnA:', error);
      res.status(error.message === 'Access denied to secret question' ? 403 : 500).json({
        success: false,
        error: error.message || 'Failed to get QnA',
      });
    }
  }

  // 상품별 문의 목록
  async getProductQnAs(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const userId = req.query.userId as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await productQnAService.getProductQnAs(productId, userId, page, limit);

      res.json({
        success: true,
        data: result.qnas,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error: any) {
      logger.error('Error getting product QnAs:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get product QnAs',
      });
    }
  }

  // 사용자별 문의 목록
  async getUserQnAs(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await productQnAService.getUserQnAs(userId, page, limit);

      res.json({
        success: true,
        data: result.qnas,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error: any) {
      logger.error('Error getting user QnAs:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get user QnAs',
      });
    }
  }

  // 판매자별 문의 목록
  async getSellerQnAs(req: Request, res: Response): Promise<void> {
    try {
      const { sellerId } = req.params;
      const status = req.query.status as QnAStatus | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await productQnAService.getSellerQnAs(sellerId, status, page, limit);

      res.json({
        success: true,
        data: result.qnas,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error: any) {
      logger.error('Error getting seller QnAs:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get seller QnAs',
      });
    }
  }

  // 답변 작성
  async answerQnA(req: Request, res: Response): Promise<void> {
    try {
      const qna = await productQnAService.answerQnA(req.body);

      res.json({
        success: true,
        data: qna,
      });
    } catch (error: any) {
      logger.error('Error answering QnA:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to answer QnA',
      });
    }
  }

  // 답변 수정
  async updateAnswer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { answer, answerImages } = req.body;

      const qna = await productQnAService.updateAnswer(id, answer, answerImages);

      res.json({
        success: true,
        data: qna,
      });
    } catch (error: any) {
      logger.error('Error updating answer:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update answer',
      });
    }
  }

  // 문의 삭제
  async deleteQnA(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      await productQnAService.deleteQnA(id, userId);

      res.json({
        success: true,
        message: 'QnA deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting QnA:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete QnA',
      });
    }
  }

  // 도움이 됐어요 추가
  async addHelpful(req: Request, res: Response): Promise<void> {
    try {
      const { qnaId, userId } = req.body;
      await productQnAService.addHelpful(qnaId, userId);

      res.json({
        success: true,
        message: 'Marked as helpful',
      });
    } catch (error: any) {
      logger.error('Error adding helpful:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to add helpful',
      });
    }
  }

  // 도움이 됐어요 취소
  async removeHelpful(req: Request, res: Response): Promise<void> {
    try {
      const { qnaId, userId } = req.body;
      await productQnAService.removeHelpful(qnaId, userId);

      res.json({
        success: true,
        message: 'Helpful removed',
      });
    } catch (error: any) {
      logger.error('Error removing helpful:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to remove helpful',
      });
    }
  }

  // 통계 조회
  async getQnAStats(req: Request, res: Response): Promise<void> {
    try {
      const productId = req.query.productId as string | undefined;
      const stats = await productQnAService.getQnAStats(productId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Error getting QnA stats:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get QnA stats',
      });
    }
  }
}

export const productQnAController = new ProductQnAController();

