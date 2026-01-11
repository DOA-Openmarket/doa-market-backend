import { Request, Response, NextFunction } from 'express';
import inquiryService from '../services/inquiry.service';

export class InquiryController {
  /**
   * 문의 목록 조회
   * GET /api/v1/users/:userId/inquiries
   */
  async getInquiries(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as 'pending' | 'answered' | undefined;

      let result;
      if (status) {
        result = await inquiryService.getInquiriesByStatus(userId, status, page, limit);
      } else {
        result = await inquiryService.getInquiries(userId, page, limit);
      }

      res.json({
        success: true,
        data: result.inquiries,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 문의 상세 조회
   * GET /api/v1/users/:userId/inquiries/:inquiryId
   */
  async getInquiry(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, inquiryId } = req.params;
      const inquiry = await inquiryService.getInquiry(userId, inquiryId);

      res.json({
        success: true,
        data: inquiry,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 문의 작성
   * POST /api/v1/users/:userId/inquiries
   */
  async createInquiry(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { title, content, category, imageUrls } = req.body;

      if (!title || title.length < 5) {
        return res.status(400).json({
          success: false,
          message: '제목은 최소 5자 이상이어야 합니다',
        });
      }

      if (!content || content.length < 20) {
        return res.status(400).json({
          success: false,
          message: '내용은 최소 20자 이상이어야 합니다',
        });
      }

      if (!category) {
        return res.status(400).json({
          success: false,
          message: '문의 유형을 선택해주세요',
        });
      }

      const inquiry = await inquiryService.createInquiry(userId, {
        title,
        content,
        category,
        imageUrls,
      });

      res.status(201).json({
        success: true,
        data: inquiry,
        message: '문의가 등록되었습니다',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new InquiryController();
