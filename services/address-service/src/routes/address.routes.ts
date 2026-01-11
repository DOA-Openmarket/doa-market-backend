import { Router } from 'express';
import { addressController } from '@controllers/address.controller';

const router = Router();

// 배송지 추가
router.post('/', (req, res) => addressController.createAddress(req, res));

// 배송지 조회
router.get('/:id', (req, res) => addressController.getAddress(req, res));

// 사용자의 배송지 목록
router.get('/users/:userId', (req, res) => addressController.getUserAddresses(req, res));

// 기본 배송지 조회
router.get('/users/:userId/default', (req, res) => addressController.getDefaultAddress(req, res));

// 배송지 수정
router.patch('/:id', (req, res) => addressController.updateAddress(req, res));

// 기본 배송지 설정
router.post('/:id/set-default', (req, res) => addressController.setDefaultAddress(req, res));

// 배송지 삭제
router.delete('/:id', (req, res) => addressController.deleteAddress(req, res));

// 마지막 사용 시간 업데이트
router.post('/:id/update-last-used', (req, res) => addressController.updateLastUsed(req, res));

// 주소 확인 표시
router.post('/:id/verify', (req, res) => addressController.verifyAddress(req, res));

export default router;

