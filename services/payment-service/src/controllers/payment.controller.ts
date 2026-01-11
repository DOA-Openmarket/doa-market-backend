import { Request, Response } from 'express';
import { PaymentService } from '@services/payment.service';
import logger from '@utils/logger';

const paymentService = new PaymentService();

export class PaymentController {
  async createPayment(req: Request, res: Response): Promise<void> {
    try {
      const payment = await paymentService.createPayment(req.body);
      res.status(201).json({ success: true, data: payment });
    } catch (error: any) {
      logger.error('Error creating payment:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async processPayment(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;
      const payment = await paymentService.processPayment(paymentId);
      res.json({ success: true, data: payment });
    } catch (error: any) {
      logger.error('Error processing payment:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getPayment(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;
      const payment = await paymentService.getPayment(paymentId);
      if (!payment) {
        res.status(404).json({ success: false, error: 'Payment not found' });
        return;
      }
      res.json({ success: true, data: payment });
    } catch (error: any) {
      logger.error('Error getting payment:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getPaymentByOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const payment = await paymentService.getPaymentByOrder(orderId);
      if (!payment) {
        res.status(404).json({ success: false, error: 'Payment not found' });
        return;
      }
      res.json({ success: true, data: payment });
    } catch (error: any) {
      logger.error('Error getting payment by order:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async cancelPayment(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;
      const { reason } = req.body;
      if (!reason) {
        res.status(400).json({ success: false, error: 'Cancel reason is required' });
        return;
      }
      const payment = await paymentService.cancelPayment(paymentId, reason);
      res.json({ success: true, data: payment });
    } catch (error: any) {
      logger.error('Error cancelling payment:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async refundPayment(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;
      const { amount, reason } = req.body;
      if (!amount || !reason) {
        res.status(400).json({ success: false, error: 'Amount and reason are required' });
        return;
      }
      const payment = await paymentService.refundPayment(paymentId, amount, reason);
      res.json({ success: true, data: payment });
    } catch (error: any) {
      logger.error('Error refunding payment:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async preparePayment(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, userId, amount, productName, method } = req.body;
      if (!orderId || !userId || !amount || !productName) {
        res.status(400).json({
          success: false,
          error: 'OrderId, userId, amount, and productName are required'
        });
        return;
      }
      const paymentData = await paymentService.preparePayment({
        orderId,
        userId,
        amount,
        productName,
        method,
      });
      res.status(201).json({ success: true, data: paymentData });
    } catch (error: any) {
      logger.error('Error preparing payment:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async completePayment(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;
      const { transactionId, status, cardNumber, cardType, cardIssuer, pgResponse } = req.body;
      if (!transactionId || !status) {
        res.status(400).json({
          success: false,
          error: 'TransactionId and status are required'
        });
        return;
      }
      const payment = await paymentService.completePayment(paymentId, {
        transactionId,
        status,
        cardNumber,
        cardType,
        cardIssuer,
        pgResponse,
      });
      res.json({ success: true, data: payment });
    } catch (error: any) {
      logger.error('Error completing payment:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const paymentController = new PaymentController();
