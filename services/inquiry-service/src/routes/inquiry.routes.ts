import { Router } from 'express';
import { inquiryController } from '@controllers/inquiry.controller';

const router = Router();

// 문의 생성
router.post('/', (req, res) => inquiryController.createInquiry(req, res));

// 문의 조회
router.get('/:id', (req, res) => inquiryController.getInquiry(req, res));

// 사용자 문의 목록
router.get('/users/:userId', (req, res) => inquiryController.getUserInquiries(req, res));

// 모든 문의 목록 (관리자)
router.get('/admin/all', (req, res) => inquiryController.getAllInquiries(req, res));

// 문의 업데이트
router.patch('/:id', (req, res) => inquiryController.updateInquiry(req, res));

// 답변 추가
router.post('/responses', (req, res) => inquiryController.addResponse(req, res));

// 문의 삭제
router.delete('/:id', (req, res) => inquiryController.deleteInquiry(req, res));

// 문의 통계 (관리자)
router.get('/admin/stats', (req, res) => inquiryController.getInquiryStats(req, res));

export default router;

