import { Request, Response } from 'express';
import { SellerService } from '@services/seller.service';
import logger from '@utils/logger';

const sellerService = new SellerService();

export class SellerController {
  async createSeller(req: Request, res: Response): Promise<void> {
    try {
      const seller = await sellerService.createSeller(req.body);

      res.status(201).json({
        success: true,
        data: seller,
      });
    } catch (error: any) {
      logger.error('Error creating seller:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create seller',
      });
    }
  }

  async getSeller(req: Request, res: Response): Promise<void> {
    try {
      const { sellerId } = req.params;
      const seller = await sellerService.getSeller(sellerId);

      if (!seller) {
        res.status(404).json({
          success: false,
          error: 'Seller not found',
        });
        return;
      }

      res.json({
        success: true,
        data: seller,
      });
    } catch (error: any) {
      logger.error('Error getting seller:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get seller',
      });
    }
  }

  async getSellerByUserId(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const seller = await sellerService.getSellerByUserId(userId);

      if (!seller) {
        res.status(404).json({
          success: false,
          error: 'Seller not found',
        });
        return;
      }

      res.json({
        success: true,
        data: seller,
      });
    } catch (error: any) {
      logger.error('Error getting seller by user:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get seller',
      });
    }
  }

  async updateSeller(req: Request, res: Response): Promise<void> {
    try {
      const { sellerId } = req.params;
      const seller = await sellerService.updateSeller(sellerId, req.body);

      res.json({
        success: true,
        data: seller,
      });
    } catch (error: any) {
      logger.error('Error updating seller:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update seller',
      });
    }
  }

  async approveSeller(req: Request, res: Response): Promise<void> {
    try {
      const { sellerId } = req.params;
      const { approvedBy } = req.body;

      if (!approvedBy) {
        res.status(400).json({
          success: false,
          error: 'approvedBy is required',
        });
        return;
      }

      const seller = await sellerService.approveSeller(sellerId, approvedBy);

      res.json({
        success: true,
        data: seller,
      });
    } catch (error: any) {
      logger.error('Error approving seller:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to approve seller',
      });
    }
  }

  async rejectSeller(req: Request, res: Response): Promise<void> {
    try {
      const { sellerId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({
          success: false,
          error: 'Rejection reason is required',
        });
        return;
      }

      const seller = await sellerService.rejectSeller(sellerId, reason);

      res.json({
        success: true,
        data: seller,
      });
    } catch (error: any) {
      logger.error('Error rejecting seller:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to reject seller',
      });
    }
  }

  async suspendSeller(req: Request, res: Response): Promise<void> {
    try {
      const { sellerId } = req.params;
      const seller = await sellerService.suspendSeller(sellerId);

      res.json({
        success: true,
        data: seller,
      });
    } catch (error: any) {
      logger.error('Error suspending seller:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to suspend seller',
      });
    }
  }

  async activateSeller(req: Request, res: Response): Promise<void> {
    try {
      const { sellerId } = req.params;
      const seller = await sellerService.activateSeller(sellerId);

      res.json({
        success: true,
        data: seller,
      });
    } catch (error: any) {
      logger.error('Error activating seller:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to activate seller',
      });
    }
  }

  async getAllSellers(req: Request, res: Response): Promise<void> {
    try {
      const params = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        status: req.query.status as any,
        type: req.query.type as any,
        search: req.query.search as string,
      };

      const result = await sellerService.getAllSellers(params);

      res.json({
        success: true,
        data: result.sellers,
        pagination: {
          page: params.page,
          limit: params.limit,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error: any) {
      logger.error('Error getting sellers:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get sellers',
      });
    }
  }

  async updateSellerStats(req: Request, res: Response): Promise<void> {
    try {
      const { sellerId } = req.params;
      const seller = await sellerService.updateSellerStats(sellerId, req.body);

      res.json({
        success: true,
        data: seller,
      });
    } catch (error: any) {
      logger.error('Error updating seller stats:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update seller stats',
      });
    }
  }

  async deleteSeller(req: Request, res: Response): Promise<void> {
    try {
      const { sellerId } = req.params;
      await sellerService.deleteSeller(sellerId);

      res.json({
        success: true,
        message: 'Seller deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting seller:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete seller',
      });
    }
  }
}

export const sellerController = new SellerController();
