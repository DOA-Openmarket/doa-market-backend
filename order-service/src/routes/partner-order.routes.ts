import { Router } from 'express';
import { Op } from 'sequelize';
import Order from '../models/order.model';
import OrderItem from '../models/order-item.model';
import { logger } from '../utils/logger';

const router = Router();

// DB status (lowercase) → Frontend status (uppercase)
const STATUS_TO_UPPER: Record<string, string> = {
  pending: 'PENDING',
  confirmed: 'CONFIRMED',
  processing: 'PREPARING',
  shipped: 'SHIPPED',
  delivered: 'DELIVERED',
  cancelled: 'CANCELLED',
  return_requested: 'RETURNED',
  exchange_requested: 'RETURNED',
};

// Frontend status (uppercase) → DB status (lowercase)
const STATUS_TO_LOWER: Record<string, string> = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'return_requested',
  REFUNDED: 'cancelled',
};

/**
 * GET /api/v1/partner/orders
 * 판매자 주문 목록 (sellerId로 order_items 조회 후 orders join)
 */
router.get('/', async (req, res) => {
  try {
    const sellerId = req.query.sellerId as string || (req as any).headers['x-user-id'];
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    const statusFilter = req.query.status as string;

    if (!sellerId) {
      return res.status(400).json({ success: false, message: 'sellerId required' });
    }

    // order_items에서 sellerId로 orderId 목록 조회
    const itemWhere: any = { sellerId };
    const orderItemRows = await OrderItem.findAll({
      where: itemWhere,
      attributes: ['orderId'],
      group: ['orderId'],
    });
    const orderIds = orderItemRows.map((r: any) => r.orderId);

    if (orderIds.length === 0) {
      return res.json({ success: true, orders: [], total: 0 });
    }

    const where: any = { id: { [Op.in]: orderIds } };
    if (statusFilter) {
      const dbStatus = STATUS_TO_LOWER[statusFilter] || statusFilter.toLowerCase();
      where.status = dbStatus;
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [{ model: OrderItem, as: 'items', where: { sellerId }, required: false }],
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
      distinct: true,
    });

    const formatted = orders.map((o: any) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: STATUS_TO_UPPER[o.status] || o.status.toUpperCase(),
      totalAmount: parseFloat(o.totalAmount),
      createdAt: o.createdAt,
      shippingAddress: o.shippingAddress || '',
      customer: { name: o.customerName || '', phone: o.customerPhone || '' },
      items: (o.items || []).map((item: any) => ({
        id: item.orderItemId,
        productId: item.productId,
        product: { name: item.productName },
        quantity: item.quantity,
        price: parseFloat(item.price),
        subtotal: parseFloat(item.subtotal),
        imageUrl: item.imageUrl,
      })),
    }));

    res.json({ success: true, orders: formatted, total: count });
  } catch (error: any) {
    logger.error('Error fetching partner orders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/partner/orders/counts
 */
router.get('/counts', async (req, res) => {
  try {
    const sellerId = req.query.sellerId as string || (req as any).headers['x-user-id'];

    if (!sellerId) {
      return res.status(400).json({ success: false, message: 'sellerId required' });
    }

    const itemRows = await OrderItem.findAll({
      where: { sellerId },
      attributes: ['orderId'],
      group: ['orderId'],
    });
    const orderIds = itemRows.map((r: any) => r.orderId);

    if (orderIds.length === 0) {
      return res.json({ success: true, counts: { total: 0 } });
    }

    const orders = await Order.findAll({
      where: { id: { [Op.in]: orderIds } },
      attributes: ['status'],
    });

    const counts: Record<string, number> = { total: orders.length };
    orders.forEach((o: any) => {
      const key = o.status;
      counts[key] = (counts[key] || 0) + 1;
    });

    res.json({ success: true, counts });
  } catch (error: any) {
    logger.error('Error fetching partner order counts:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/partner/orders/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      include: [{ model: OrderItem, as: 'items' }],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const o = order as any;
    res.json({
      success: true,
      order: {
        id: o.id,
        orderNumber: o.orderNumber,
        status: STATUS_TO_UPPER[o.status] || o.status.toUpperCase(),
        totalAmount: parseFloat(o.totalAmount),
        createdAt: o.createdAt,
        shippingAddress: o.shippingAddress || '',
        customer: { name: o.customerName || '', phone: o.customerPhone || '' },
        items: (o.items || []).map((item: any) => ({
          id: item.orderItemId,
          productId: item.productId,
          product: { name: item.productName },
          quantity: item.quantity,
          price: parseFloat(item.price),
          subtotal: parseFloat(item.subtotal),
          imageUrl: item.imageUrl,
        })),
      },
    });
  } catch (error: any) {
    logger.error('Error fetching partner order detail:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PATCH /api/v1/partner/orders/:id/status
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const dbStatus = STATUS_TO_LOWER[status] || status.toLowerCase();

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = dbStatus;
    await order.save();

    res.json({ success: true, data: order });
  } catch (error: any) {
    logger.error('Error updating partner order status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
