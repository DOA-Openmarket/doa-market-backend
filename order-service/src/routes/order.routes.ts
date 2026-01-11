import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Order from '../models/order.model';
import { eventBus } from '../index';
import { EventType } from '../events';
import { logger } from '../utils/logger';
import { OrderSaga } from '../saga/orderSaga';

const router = Router();

// Track active sagas
const activeSagas = new Map<string, OrderSaga>();

router.get('/', async (req, res) => {
  try {
    const orders = await Order.findAll();
    res.json({ success: true, data: orders });
  } catch (error: any) {
    logger.error('Error fetching orders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error: any) {
    logger.error('Error fetching order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { userId, items, totalAmount, shippingAddress } = req.body;

    // Generate UUID for order
    const orderId = uuidv4();

    // Create order
    const order = await Order.create({
      id: orderId,
      userId,
      sellerId: items[0]?.sellerId || null,
      totalAmount,
      orderNumber: `ORD-${Date.now()}`,
      status: 'pending',
      paymentStatus: 'pending',
    });

    logger.info(`Order created: ${order.id}`);

    // Publish ORDER_CREATED event
    await eventBus.publish(EventType.ORDER_CREATED, {
      orderId: order.id,
      userId: order.userId,
      items: items || [],
      totalAmount: order.totalAmount,
      shippingAddress: shippingAddress || {
        name: 'Default',
        phone: '000-0000-0000',
        address: 'Default Address',
        city: 'Seoul',
        postalCode: '00000',
      },
    });

    logger.info(`ORDER_CREATED event published for order: ${order.id}`);

    // DISABLED: Start Saga orchestration (재고 서비스가 없어서 일시 비활성화)
    // const saga = new OrderSaga(order.id, eventBus);
    // activeSagas.set(order.id, saga);

    // // Run saga asynchronously (don't block response)
    // saga.start().then(() => {
    //   logger.info(`Saga completed successfully for order: ${order.id}`);
    //   activeSagas.delete(order.id);
    // }).catch((error) => {
    //   logger.error(`Saga failed for order: ${order.id}`, error);
    //   activeSagas.delete(order.id);
    // });

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created. Processing payment and inventory reservation...',
    });
  } catch (error: any) {
    logger.error('Error creating order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get saga status
router.get('/:id/saga-status', async (req, res) => {
  try {
    const { id } = req.params;
    const saga = activeSagas.get(id);

    if (!saga) {
      return res.json({
        success: true,
        data: { orderId: id, status: 'completed_or_not_found' },
      });
    }

    res.json({
      success: true,
      data: {
        orderId: id,
        status: saga.getState(),
      },
    });
  } catch (error: any) {
    logger.error('Error getting saga status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    order.status = status;
    await order.save();

    logger.info(`Order ${id} status updated to: ${status}`);

    // Publish event based on status change
    if (status === 'confirmed') {
      await eventBus.publish(EventType.ORDER_CONFIRMED, {
        orderId: order.id,
        userId: order.userId,
        paymentId: 'payment-id', // Should come from payment service
      });
    } else if (status === 'cancelled') {
      await eventBus.publish(EventType.ORDER_CANCELLED, {
        orderId: order.id,
        userId: order.userId,
        reason: req.body.reason || 'User cancelled',
      });
    }

    res.json({ success: true, data: order });
  } catch (error: any) {
    logger.error('Error updating order status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 주문 취소
 * POST /api/v1/orders/:orderId/cancel
 */
router.post('/:orderId/cancel', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId, reason } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: '취소할 수 없는 주문 상태입니다',
      });
    }

    // Update order status
    order.status = 'cancelled';
    await order.save();

    logger.info(`Order ${orderId} cancelled. Reason: ${reason}`);

    // Publish cancellation event
    await eventBus.publish(EventType.ORDER_CANCELLED, {
      orderId: order.id,
      userId: userId || order.userId,
      reason: reason || '사용자 요청',
    });

    res.json({
      success: true,
      data: order,
      message: '주문이 취소되었습니다',
    });
  } catch (error: any) {
    logger.error('Error cancelling order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 반품 신청
 * POST /api/v1/orders/:orderId/return
 */
router.post('/:orderId/return', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId, reason, imageUrls } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Check if order can be returned
    if (!['delivered', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: '반품 신청할 수 없는 주문 상태입니다',
      });
    }

    // Update order status to return requested
    order.status = 'return_requested';
    await order.save();

    logger.info(`Return requested for order ${orderId}. Reason: ${reason}`);

    res.json({
      success: true,
      data: order,
      message: '반품 신청이 완료되었습니다',
    });
  } catch (error: any) {
    logger.error('Error requesting return:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 교환 신청
 * POST /api/v1/orders/:orderId/exchange
 */
router.post('/:orderId/exchange', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId, reason, imageUrls } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Check if order can be exchanged
    if (!['delivered', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: '교환 신청할 수 없는 주문 상태입니다',
      });
    }

    // Update order status to exchange requested
    order.status = 'exchange_requested';
    await order.save();

    logger.info(`Exchange requested for order ${orderId}. Reason: ${reason}`);

    res.json({
      success: true,
      data: order,
      message: '교환 신청이 완료되었습니다',
    });
  } catch (error: any) {
    logger.error('Error requesting exchange:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

