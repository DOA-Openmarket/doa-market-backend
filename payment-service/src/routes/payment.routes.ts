import { Router } from 'express';
import crypto from 'crypto';
import Payment from '../models/payment.model';

const router = Router();

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

    // Generate unique payment ID
    const paymentId = crypto.randomUUID();

    // KG Inicis 연동을 위한 파라미터 생성
    // 실제 운영시에는 이니시스에서 발급받은 MID, 인증키 등을 사용해야 합니다
    const timestamp = new Date().getTime().toString();
    const mid = process.env.INICIS_MID || 'INIpayTest';

    // Hash 생성 (P_CHKFAKE) - 실제로는 SHA512 hash 필요
    // 대상: P_AMT + P_OID + P_TIMESTAMP + HashKey
    // 테스트 환경에서는 간단한 값 사용
    const hashKey = process.env.INICIS_HASH_KEY || '';
    const hashData = `${amount}${orderId}${timestamp}${hashKey}`;
    // 실제로는: crypto.createHash('sha512').update(hashData).digest('base64')

    const inicisParams = {
      P_INI_PAYMENT: 'CARD', // 결제수단 (CARD, VBANK, MOBILE 등)
      P_MID: mid, // 상점아이디
      P_OID: orderId, // 주문번호 (Unique)
      P_AMT: amount.toString(), // 결제금액
      P_GOODS: productName, // 상품명
      P_UNAME: '구매자', // 구매자명
      P_MOBILE: '01012345678', // 구매자 휴대폰
      P_EMAIL: 'test@test.com', // 구매자 이메일
      P_NEXT_URL: `http://localhost:3005/api/v1/payments/callback`, // 결과수신 URL
      P_NOTI_URL: `http://localhost:3005/api/v1/payments/noti`, // 가상계좌 입금통보 URL
      P_TIMESTAMP: timestamp, // 타임스탬프
      P_RESERVED: 'centerCd=Y&below1000=Y&vbank_receipt=Y&iosapp=Y&app_scheme=doamarket://', // 추가옵션 (iOS 앱 스키마 포함)
      P_NOTI: paymentId, // 가맹점 임의 데이터
    };

    // Payment 레코드 생성
    const payment = await Payment.create({
      id: paymentId,
      orderId,
      amount,
      method: method || 'card',
      status: 'pending',
    });

    // KG Inicis 모바일 결제 URL (실제 운영시에는 이니시스 정책에 따라 변경)
    const paymentUrl = 'https://mobile.inicis.com/smart/payment/';

    res.json({
      success: true,
      data: {
        paymentId,
        paymentUrl,
        inicisParams,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '결제 준비 중 오류가 발생했습니다',
    });
  }
});

// 결제 완료 처리
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { pgTransactionId, status } = req.body;

    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: '결제 정보를 찾을 수 없습니다',
      });
    }

    // Update payment status
    await payment.update({
      pgTransactionId,
      status: status || 'completed',
      paidAt: new Date(),
    });

    res.json({
      success: true,
      data: payment,
    });
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

    res.json({
      success: true,
      data: payment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '결제 조회 중 오류가 발생했습니다',
    });
  }
});

// KG Inicis 결제 콜백 처리
router.post('/callback', async (req, res) => {
  try {
    // 이니시스로부터 받은 결제 결과 처리
    const { resultCode, resultMsg, tid, orderId } = req.body;

    if (resultCode === '00') {
      // 결제 성공
      // 주문 상태 업데이트 등의 로직 추가 필요
      res.send('<script>alert("결제가 완료되었습니다."); window.close();</script>');
    } else {
      // 결제 실패
      res.send(`<script>alert("결제 실패: ${resultMsg}"); window.close();</script>`);
    }
  } catch (error: any) {
    res.status(500).send('<script>alert("결제 처리 중 오류가 발생했습니다."); window.close();</script>');
  }
});

export default router;

