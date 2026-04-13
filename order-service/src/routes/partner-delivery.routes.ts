import { Router } from 'express';
import { Op, QueryTypes } from 'sequelize';
import axios from 'axios';
import Order from '../models/order.model';
import OrderItem from '../models/order-item.model';
import { sequelize } from '../config/database';
import { logger } from '../utils/logger';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3005';

const router = Router();

// DB status → Frontend status
const STATUS_TO_UPPER: Record<string, string> = {
  processing: 'READY',
  shipped: 'SHIPPED',
  delivered: 'DELIVERED',
};

// Frontend status → DB status
const STATUS_TO_LOWER: Record<string, string> = {
  READY: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  PREPARING: 'processing',
  IN_TRANSIT: 'shipped',
};

// Delivery-related DB statuses
const DELIVERY_STATUSES = ['processing', 'shipped', 'delivered'];

async function resolveSellerUserId(sellerId: string): Promise<string> {
  try {
    const rows = await sequelize.query<{ userId: string }>(
      'SELECT "userId" FROM sellers WHERE id = :id LIMIT 1',
      { replacements: { id: sellerId }, type: QueryTypes.SELECT }
    );
    if (rows.length > 0 && rows[0].userId) return rows[0].userId;
  } catch {
    // fall through
  }
  return sellerId;
}

async function formatOrders(orders: any[], sellerId: string) {
  const uniqueUserIds = [...new Set(orders.map((o: any) => o.userId))];
  const userMap: Record<string, { name: string; phone: string; email: string }> = {};
  await Promise.all(
    uniqueUserIds.map(async (userId) => {
      try {
        const res = await axios.get(`${USER_SERVICE_URL}/api/v1/users/${userId}`, {
          headers: { 'x-user-role': 'admin' },
          timeout: 3000,
        });
        const u = res.data?.data || {};
        userMap[userId as string] = { name: u.name || '', phone: u.phone || '', email: u.email || '' };
      } catch {
        userMap[userId as string] = { name: '', phone: '', email: '' };
      }
    })
  );

  return orders.map((o: any) => {
    const addr = o.shippingAddress || {};
    const userInfo = userMap[o.userId] || { name: '', phone: '', email: '' };
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      status: STATUS_TO_UPPER[o.status] || o.status.toUpperCase(),
      totalAmount: parseFloat(o.totalAmount),
      createdAt: o.createdAt,
      trackingNumber: o.trackingNumber || null,
      deliveryCompany: o.deliveryCompany || null,
      shippingAddress: addr,
      customer: {
        name: addr.name || userInfo.name,
        phone: addr.phone || userInfo.phone,
        email: userInfo.email || '',
        address: addr.address || '',
        detailAddress: addr.detailAddress || '',
        zipcode: addr.zipcode || '',
      },
      items: (o.items || []).map((item: any) => ({
        id: item.orderItemId,
        productId: item.productId,
        product: { name: item.productName },
        quantity: item.quantity,
        price: parseFloat(item.price),
        subtotal: parseFloat(item.subtotal),
        imageUrl: item.imageUrl,
      })),
    };
  });
}

/**
 * GET /api/v1/partner/deliveries
 * 배송 목록 조회 (READY/SHIPPED/DELIVERED 상태만)
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

    const effectiveSellerId = await resolveSellerUserId(sellerId);

    const orderItemRows = await OrderItem.findAll({
      where: { sellerId: effectiveSellerId },
      attributes: ['orderId'],
      group: ['orderId'],
    });
    const orderIds = orderItemRows.map((r: any) => r.orderId);

    if (orderIds.length === 0) {
      return res.json({ success: true, deliveries: [], total: 0 });
    }

    const where: any = {
      id: { [Op.in]: orderIds },
      status: { [Op.in]: DELIVERY_STATUSES },
    };

    if (statusFilter) {
      const dbStatus = STATUS_TO_LOWER[statusFilter] || statusFilter.toLowerCase();
      where.status = dbStatus;
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [{ model: OrderItem, as: 'items', where: { sellerId: effectiveSellerId }, required: false }],
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
      distinct: true,
    });

    const formatted = await formatOrders(orders, effectiveSellerId);
    res.json({ success: true, deliveries: formatted, total: count });
  } catch (error: any) {
    logger.error('Error fetching partner deliveries:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/partner/deliveries/counts
 * 배송 상태별 건수
 */
router.get('/counts', async (req, res) => {
  try {
    const sellerId = req.query.sellerId as string || (req as any).headers['x-user-id'];
    if (!sellerId) {
      return res.status(400).json({ success: false, message: 'sellerId required' });
    }

    const effectiveSellerId = await resolveSellerUserId(sellerId);

    const orderItemRows = await OrderItem.findAll({
      where: { sellerId: effectiveSellerId },
      attributes: ['orderId'],
      group: ['orderId'],
    });
    const orderIds = orderItemRows.map((r: any) => r.orderId);

    if (orderIds.length === 0) {
      return res.json({ success: true, counts: { READY: 0, SHIPPED: 0, DELIVERED: 0 } });
    }

    const rows = await sequelize.query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) as count FROM orders WHERE id IN (:orderIds) AND status IN ('processing','shipped','delivered') GROUP BY status`,
      { replacements: { orderIds }, type: QueryTypes.SELECT }
    );

    const counts: Record<string, number> = { READY: 0, SHIPPED: 0, DELIVERED: 0 };
    for (const row of rows) {
      const key = STATUS_TO_UPPER[row.status] || row.status.toUpperCase();
      counts[key] = (counts[key] || 0) + parseInt(row.count, 10);
    }

    res.json({ success: true, counts });
  } catch (error: any) {
    logger.error('Error fetching delivery counts:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PATCH /api/v1/partner/deliveries/:id/start
 * 배송 시작 (상태를 shipped로, 운송장번호 저장)
 */
router.patch('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const { trackingNumber, deliveryCompany } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = 'shipped';
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber || null;
    if (deliveryCompany !== undefined) order.deliveryCompany = deliveryCompany || null;
    await order.save();

    res.json({ success: true, data: { id: order.id, status: 'SHIPPED', trackingNumber: order.trackingNumber, deliveryCompany: order.deliveryCompany } });
  } catch (error: any) {
    logger.error('Error starting delivery:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PATCH /api/v1/partner/deliveries/:id/tracking
 * 운송장 번호 수정
 */
router.patch('/:id/tracking', async (req, res) => {
  try {
    const { id } = req.params;
    const { trackingNumber, deliveryCompany } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber || null;
    if (deliveryCompany !== undefined) order.deliveryCompany = deliveryCompany || null;
    await order.save();

    res.json({ success: true, data: { id: order.id, trackingNumber: order.trackingNumber, deliveryCompany: order.deliveryCompany } });
  } catch (error: any) {
    logger.error('Error updating tracking number:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PATCH /api/v1/partner/deliveries/:id/complete
 * 배송 완료 처리
 */
router.patch('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = 'delivered';
    await order.save();

    res.json({ success: true, data: { id: order.id, status: 'DELIVERED' } });
  } catch (error: any) {
    logger.error('Error completing delivery:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
