import { Router } from 'express';
import { paymentController } from '@controllers/payment.controller';

const router = Router();

router.post('/', paymentController.createPayment.bind(paymentController));
router.post('/prepare', paymentController.preparePayment.bind(paymentController));
router.post('/:paymentId/process', paymentController.processPayment.bind(paymentController));
router.post('/:paymentId/complete', paymentController.completePayment.bind(paymentController));
router.get('/:paymentId', paymentController.getPayment.bind(paymentController));
router.get('/order/:orderId', paymentController.getPaymentByOrder.bind(paymentController));
router.post('/:paymentId/cancel', paymentController.cancelPayment.bind(paymentController));
router.post('/:paymentId/refund', paymentController.refundPayment.bind(paymentController));

export default router;
