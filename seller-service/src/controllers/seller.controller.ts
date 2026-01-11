import { Request, Response, NextFunction } from 'express';
import sellerService, { CreateSellerDto, UpdateSellerDto } from '../services/seller.service';

export class SellerController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, status, search } = req.query;

      const sellers = await sellerService.findAll({
        userId: userId as string,
        status: status as string,
        search: search as string,
      });

      res.json({
        success: true,
        data: sellers,
        total: sellers.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const seller = await sellerService.findById(req.params.id);

      res.json({
        success: true,
        data: seller,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateSellerDto = {
        userId: req.body.userId,
        storeName: req.body.storeName,
        businessNumber: req.body.businessNumber,
        status: req.body.status,
      };

      const seller = await sellerService.create(data);

      res.status(201).json({
        success: true,
        data: seller,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data: UpdateSellerDto = {
        storeName: req.body.storeName,
        businessNumber: req.body.businessNumber,
        status: req.body.status,
      };

      const seller = await sellerService.update(req.params.id, data);

      res.json({
        success: true,
        data: seller,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await sellerService.delete(req.params.id);

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const seller = await sellerService.verify(req.params.id);

      res.json({
        success: true,
        data: seller,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await sellerService.getStats();

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getAttachments(req: Request, res: Response, next: NextFunction) {
    try {
      const attachments = await sellerService.getAttachments(req.params.id);

      res.json({
        success: true,
        data: attachments,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SellerController();
