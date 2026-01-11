import { Router } from 'express';
import { orderController } from '@controllers/order.controller';

const router = Router();

// POST /api/v1/orders - Create new order
router.post('/', orderController.createOrder.bind(orderController));

// GET /api/v1/orders/user/:userId - Get orders by user ID
router.get('/user/:userId', orderController.getOrdersByUser.bind(orderController));

// GET /api/v1/orders/seller/:sellerId - Get orders by seller ID
router.get('/seller/:sellerId', orderController.getOrdersBySeller.bind(orderController));

// GET /api/v1/orders/:orderId - Get order by ID
router.get('/:orderId', orderController.getOrder.bind(orderController));

// PATCH /api/v1/orders/:orderId/status - Update order status
router.patch('/:orderId/status', orderController.updateOrderStatus.bind(orderController));

// PATCH /api/v1/orders/:orderId/payment - Update payment status
router.patch('/:orderId/payment', orderController.updatePaymentStatus.bind(orderController));

// POST /api/v1/orders/:orderId/cancel - Cancel order
router.post('/:orderId/cancel', orderController.cancelOrder.bind(orderController));

// DELETE /api/v1/orders/:orderId - Delete order
router.delete('/:orderId', orderController.deleteOrder.bind(orderController));

export default router;
