import { Request, Response } from 'express';
import { OrderService } from '@services/order.service';
import logger from '@utils/logger';

const orderService = new OrderService();

export class PartnerOrderController {
  /**
   * Get partner orders with filtering and pagination
   */
  async getPartnerOrders(req: Request, res: Response): Promise<void> {
    try {
      const { sellerId } = req.query;

      if (!sellerId) {
        res.status(400).json({
          success: false,
          error: 'sellerId is required',
        });
        return;
      }

      const params = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        status: req.query.status as any,
        paymentStatus: req.query.paymentStatus as any,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const result = await orderService.getOrdersBySeller(sellerId as string, params);

      res.json({
        success: true,
        data: result.orders,
        pagination: {
          page: params.page,
          limit: params.limit,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error: any) {
      logger.error('Error getting partner orders:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get orders',
      });
    }
  }

  /**
   * Get order counts by status for a partner
   */
  async getOrderCounts(req: Request, res: Response): Promise<void> {
    try {
      const { sellerId } = req.query;

      if (!sellerId) {
        res.status(400).json({
          success: false,
          error: 'sellerId is required',
        });
        return;
      }

      const counts = await orderService.getOrderCountsBySeller(sellerId as string);

      res.json({
        success: true,
        data: {
          counts: {
            pending: counts.pending || 0,
            confirmed: counts.confirmed || 0,
            processing: counts.processing || 0,
            shipped: counts.shipped || 0,
            delivered: counts.delivered || 0,
            cancelled: counts.cancelled || 0,
            total: counts.total || 0,
          },
        },
      });
    } catch (error: any) {
      logger.error('Error getting order counts:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get order counts',
      });
    }
  }

  /**
   * Update order status (partner-only endpoint)
   */
  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const { status, reason } = req.body;

      if (!status) {
        res.status(400).json({
          success: false,
          error: 'Status is required',
        });
        return;
      }

      // Verify order exists and belongs to this seller
      const order = await orderService.getOrder(orderId);
      if (!order) {
        res.status(404).json({
          success: false,
          error: 'Order not found',
        });
        return;
      }

      // Update order status
      const updatedOrder = await orderService.updateOrderStatus(orderId, status, reason);

      res.json({
        success: true,
        data: updatedOrder,
      });
    } catch (error: any) {
      logger.error('Error updating order status:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update order status',
      });
    }
  }
}

export const partnerOrderController = new PartnerOrderController();
