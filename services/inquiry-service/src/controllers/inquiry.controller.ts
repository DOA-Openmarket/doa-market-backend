import { Request, Response } from 'express';
import { InquiryService } from '@services/inquiry.service';
import { InquiryStatus, InquiryType, InquiryPriority } from '@models/Inquiry';
import logger from '@utils/logger';

const inquiryService = new InquiryService();

export class InquiryController {
  // 문의 생성
  async createInquiry(req: Request, res: Response): Promise<void> {
    try {
      const inquiry = await inquiryService.createInquiry(req.body);

      res.status(201).json({
        success: true,
        data: inquiry,
      });
    } catch (error: any) {
      logger.error('Error creating inquiry:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create inquiry',
      });
    }
  }

  // 문의 조회
  async getInquiry(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const includeResponses = req.query.includeResponses !== 'false';

      const inquiry = await inquiryService.getInquiry(id, includeResponses);

      if (!inquiry) {
        res.status(404).json({
          success: false,
          error: 'Inquiry not found',
        });
        return;
      }

      res.json({
        success: true,
        data: inquiry,
      });
    } catch (error: any) {
      logger.error('Error getting inquiry:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get inquiry',
      });
    }
  }

  // 사용자 문의 목록 조회
  async getUserInquiries(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await inquiryService.getUserInquiries(userId, page, limit);

      res.json({
        success: true,
        data: result.inquiries,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error: any) {
      logger.error('Error getting user inquiries:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get user inquiries',
      });
    }
  }

  // 모든 문의 목록 조회 (관리자용)
  async getAllInquiries(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters: any = {};
      if (req.query.status) filters.status = req.query.status as InquiryStatus;
      if (req.query.type) filters.type = req.query.type as InquiryType;
      if (req.query.priority) filters.priority = req.query.priority as InquiryPriority;
      if (req.query.assignedTo) filters.assignedTo = req.query.assignedTo as string;

      const result = await inquiryService.getAllInquiries(filters, page, limit);

      res.json({
        success: true,
        data: result.inquiries,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error: any) {
      logger.error('Error getting all inquiries:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get all inquiries',
      });
    }
  }

  // 문의 업데이트
  async updateInquiry(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const inquiry = await inquiryService.updateInquiry(id, req.body);

      res.json({
        success: true,
        data: inquiry,
      });
    } catch (error: any) {
      logger.error('Error updating inquiry:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update inquiry',
      });
    }
  }

  // 답변 추가
  async addResponse(req: Request, res: Response): Promise<void> {
    try {
      const response = await inquiryService.addResponse(req.body);

      res.status(201).json({
        success: true,
        data: response,
      });
    } catch (error: any) {
      logger.error('Error adding response:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to add response',
      });
    }
  }

  // 문의 삭제
  async deleteInquiry(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      await inquiryService.deleteInquiry(id, userId);

      res.json({
        success: true,
        message: 'Inquiry deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting inquiry:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete inquiry',
      });
    }
  }

  // 문의 통계 조회 (관리자용)
  async getInquiryStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await inquiryService.getInquiryStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Error getting inquiry stats:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get inquiry stats',
      });
    }
  }
}

export const inquiryController = new InquiryController();

