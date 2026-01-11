import { Router } from 'express';
import { productQnAController } from '@controllers/product-qna.controller';

const router = Router();

// 상품 문의 작성
router.post('/', (req, res) => productQnAController.createQnA(req, res));

// 문의 조회
router.get('/:id', (req, res) => productQnAController.getQnA(req, res));

// 상품별 문의 목록
router.get('/products/:productId', (req, res) => productQnAController.getProductQnAs(req, res));

// 사용자별 문의 목록
router.get('/users/:userId', (req, res) => productQnAController.getUserQnAs(req, res));

// 판매자별 문의 목록
router.get('/sellers/:sellerId', (req, res) => productQnAController.getSellerQnAs(req, res));

// 답변 작성
router.post('/answer', (req, res) => productQnAController.answerQnA(req, res));

// 답변 수정
router.patch('/:id/answer', (req, res) => productQnAController.updateAnswer(req, res));

// 문의 삭제
router.delete('/:id', (req, res) => productQnAController.deleteQnA(req, res));

// 도움이 됐어요 추가
router.post('/helpful', (req, res) => productQnAController.addHelpful(req, res));

// 도움이 됐어요 취소
router.delete('/helpful', (req, res) => productQnAController.removeHelpful(req, res));

// 통계 조회
router.get('/admin/stats', (req, res) => productQnAController.getQnAStats(req, res));

export default router;

