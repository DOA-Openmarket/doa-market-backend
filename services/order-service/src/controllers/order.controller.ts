import { Request, Response } from 'express';
import { OrderService } from '@services/order.service';
import logger from '@utils/logger';

const orderService = new OrderService();

export class OrderController {
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const order = await orderService.createOrder(req.body);

      res.status(201).json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      logger.error('Error creating order:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create order',
      });
    }
  }

  async getOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const order = await orderService.getOrder(orderId);

      if (!order) {
        res.status(404).json({
          success: false,
          error: 'Order not found',
        });
        return;
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      logger.error('Error getting order:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get order',
      });
    }
  }

  async getOrdersByUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const params = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        status: req.query.status as any,
        paymentStatus: req.query.paymentStatus as any,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const result = await orderService.getOrdersByUser(userId, params);

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
      logger.error('Error getting user orders:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get orders',
      });
    }
  }

  async getOrdersBySeller(req: Request, res: Response): Promise<void> {
    try {
      const { sellerId } = req.params;
      const params = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        status: req.query.status as any,
        paymentStatus: req.query.paymentStatus as any,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const result = await orderService.getOrdersBySeller(sellerId, params);

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
      logger.error('Error getting seller orders:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get orders',
      });
    }
  }

  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const order = await orderService.updateOrderStatus(orderId, req.body);

      res.json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      logger.error('Error updating order status:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update order status',
      });
    }
  }

  async updatePaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const { paymentStatus, transactionId } = req.body;

      if (!paymentStatus) {
        res.status(400).json({
          success: false,
          error: 'Payment status is required',
        });
        return;
      }

      const order = await orderService.updatePaymentStatus(
        orderId,
        paymentStatus,
        transactionId
      );

      res.json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      logger.error('Error updating payment status:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update payment status',
      });
    }
  }

  async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({
          success: false,
          error: 'Cancel reason is required',
        });
        return;
      }

      const order = await orderService.cancelOrder(orderId, reason);

      res.json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      logger.error('Error cancelling order:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to cancel order',
      });
    }
  }

  async deleteOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      await orderService.deleteOrder(orderId);

      res.json({
        success: true,
        message: 'Order deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting order:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete order',
      });
    }
  }
}

export const orderController = new OrderController();
