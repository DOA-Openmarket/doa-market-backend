import { Router } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import Payment from '../models/payment.model';

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3003';

const router = Router();

// 콜백 결과를 웹(popup) / Flutter(WebView) 양쪽에 전달하는 HTML 생성
function buildCallbackHtml(result: {
  status: 'success' | 'failed';
  paymentId?: string;
  transactionId?: string;
  message?: string;
}) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3100';
  const { status, paymentId = '', transactionId = '', message = '' } = result;

  const redirectUrl =
    status === 'success'
      ? `${frontendUrl}/payment/complete?status=success&paymentId=${encodeURIComponent(paymentId)}&transactionId=${encodeURIComponent(transactionId)}`
      : `${frontendUrl}/payment/complete?status=failed&message=${encodeURIComponent(message)}`;

  const resultJson = JSON.stringify({ type: 'PAYMENT_RESULT', ...result });

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>결제 처리 중</title></head>
<body>
<p style="text-align:center;margin-top:40px;font-family:sans-serif">결제 처리 중입니다...</p>
<script>
(function(){
  var result = ${resultJson};
  if (window.opener && !window.opener.closed) {
    try { window.opener.postMessage(result, '*'); } catch(e){}
    setTimeout(function(){ window.close(); }, 200);
  } else {
    location.replace('${redirectUrl}');
  }
})();
</script>
</body></html>`;
}

router.get('/', async (req, res) => {
  const payments = await Payment.findAll();
  res.json({ success: true, data: payments });
});

router.post('/', async (req, res) => {
  const payment = await Payment.create(req.body);
  res.json({ success: true, data: payment });
});

// 결제 준비 (KG Inicis)
router.post('/prepare', async (req, res) => {
  try {
    const { orderId, userId, amount, productName, method } = req.body;

    if (!orderId || !userId || !amount || !productName) {
      return res.status(400).json({
        success: false,
        message: '필수 파라미터가 누락되었습니다',
      });
    }

    const paymentId = crypto.randomUUID();
    const timestamp = new Date().getTime().toString();
    const mid = process.env.INICIS_MID || 'INIpayTest';

    // 콜백 URL: 환경 변수로 관리 (배포 환경에 맞게 설정)
    const callbackUrl =
      process.env.PAYMENT_CALLBACK_URL ||
      `http://localhost:3005/api/v1/payments/callback`;

    const inicisParams = {
      P_INI_PAYMENT: 'CARD',
      P_MID: mid,
      P_OID: orderId,
      P_AMT: amount.toString(),
      P_GOODS: productName,
      P_UNAME: req.body.userName || '구매자',
      P_MOBILE: req.body.userPhone || '01000000000',
      P_EMAIL: req.body.userEmail || '',
      P_NEXT_URL: callbackUrl,
      P_NOTI_URL: callbackUrl.replace('/callback', '/noti'),
      P_TIMESTAMP: timestamp,
      P_RESERVED: 'centerCd=Y&below1000=Y&vbank_receipt=Y&iosapp=Y&app_scheme=doamarket://',
      P_NOTI: paymentId, // paymentId를 P_NOTI에 담아 콜백에서 식별
    };

    await Payment.create({
      id: paymentId,
      orderId,
      amount,
      method: method || 'card',
      status: 'pending',
    });

    // 모바일: https://mobile.inicis.com/smart/payment/ (테스트)
    // PC 표준: INIStdPay.pay() 에서 직접 처리 (URL 불필요)
    const paymentUrl = process.env.INICIS_TEST === 'false'
      ? 'https://mobile.inicis.com/smart/payment/'
      : 'https://mobile.inicis.com/smart/payment/';

    res.json({
      success: true,
      data: {
        paymentId,
        paymentUrl,
        inicisParams,
        // PC 표준결제창용 추가 정보
        mid,
        timestamp,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '결제 준비 중 오류가 발생했습니다',
    });
  }
});

// 결제 완료 처리 (프론트엔드에서 직접 호출)
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { pgTransactionId, transactionId, status } = req.body;
    const txId = pgTransactionId || transactionId;

    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: '결제 정보를 찾을 수 없습니다',
      });
    }

    // Normalize status: 'success' → 'completed'
    const normalizedStatus = (status === 'success' || status === 'completed') ? 'completed' : 'failed';

    await payment.update({
      pgTransactionId: txId,
      status: normalizedStatus,
      paidAt: normalizedStatus === 'completed' ? new Date() : null,
    });

    if (normalizedStatus === 'completed') {
    // Notify order service to update order status to 'confirmed'
    try {
      await axios.patch(
        `${ORDER_SERVICE_URL}/api/v1/orders/${payment.orderId}/status`,
        { status: 'confirmed' },
        { timeout: 5000 }
      );
    } catch (err: any) {
      // Non-fatal: log but don't fail the payment completion
      console.warn(`[payment] Failed to update order status for orderId=${payment.orderId}:`, err?.message);
    }
    }

    res.json({ success: true, data: payment });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '결제 완료 처리 중 오류가 발생했습니다',
    });
  }
});

// 결제 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findByPk(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: '결제 정보를 찾을 수 없습니다',
      });
    }

    res.json({ success: true, data: payment });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '결제 조회 중 오류가 발생했습니다',
    });
  }
});

// KG Inicis 결제 콜백 (P_NEXT_URL)
// - 웹(popup): window.opener.postMessage 후 window.close()
// - Flutter WebView: FRONTEND_URL/payment/complete?status=... 로 리다이렉트
router.post('/callback', async (req, res) => {
  try {
    const body = req.body;

    // Inicis 파라미터 이름은 버전/결제수단에 따라 다름
    const resultCode = body.resultCode || body.P_STATUS || body.p_status || '';
    const resultMsg  = body.resultMsg  || body.P_RMESG1 || body.p_rmesg1 || '결제 실패';
    const tid        = body.tid        || body.P_TID    || body.p_tid    || '';
    const paymentId  = body.P_NOTI     || body.p_noti   || '';

    if (resultCode === '00') {
      // 결제 성공 → DB 업데이트
      if (paymentId) {
        try {
          const payment = await Payment.findByPk(paymentId);
          if (payment) {
            await payment.update({
              pgTransactionId: tid,
              status: 'completed',
              paidAt: new Date(),
            });
          }
        } catch (_) {}
      }

      res.send(buildCallbackHtml({ status: 'success', paymentId, transactionId: tid }));
    } else {
      res.send(buildCallbackHtml({ status: 'failed', paymentId, message: resultMsg }));
    }
  } catch (error: any) {
    res.send(buildCallbackHtml({ status: 'failed', message: '결제 처리 중 오류가 발생했습니다' }));
  }
});

// 가상계좌 입금 통보 (추후 구현)
router.post('/noti', async (req, res) => {
  res.json({ success: true });
});

export default router;
