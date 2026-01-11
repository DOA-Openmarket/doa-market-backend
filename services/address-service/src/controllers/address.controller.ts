import { Request, Response } from 'express';
import { AddressService } from '@services/address.service';
import logger from '@utils/logger';

const addressService = new AddressService();

export class AddressController {
  // 배송지 추가
  async createAddress(req: Request, res: Response): Promise<void> {
    try {
      const address = await addressService.createAddress(req.body);

      res.status(201).json({
        success: true,
        data: address,
      });
    } catch (error: any) {
      logger.error('Error creating address:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create address',
      });
    }
  }

  // 배송지 조회
  async getAddress(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.query.userId as string;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'userId is required',
        });
        return;
      }

      const address = await addressService.getAddress(id, userId);

      if (!address) {
        res.status(404).json({
          success: false,
          error: 'Address not found',
        });
        return;
      }

      res.json({
        success: true,
        data: address,
      });
    } catch (error: any) {
      logger.error('Error getting address:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get address',
      });
    }
  }

  // 사용자의 배송지 목록
  async getUserAddresses(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const addresses = await addressService.getUserAddresses(userId);

      res.json({
        success: true,
        data: addresses,
      });
    } catch (error: any) {
      logger.error('Error getting user addresses:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get user addresses',
      });
    }
  }

  // 기본 배송지 조회
  async getDefaultAddress(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const address = await addressService.getDefaultAddress(userId);

      if (!address) {
        res.status(404).json({
          success: false,
          error: 'Default address not found',
        });
        return;
      }

      res.json({
        success: true,
        data: address,
      });
    } catch (error: any) {
      logger.error('Error getting default address:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get default address',
      });
    }
  }

  // 배송지 수정
  async updateAddress(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, ...updateData } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'userId is required',
        });
        return;
      }

      const address = await addressService.updateAddress(id, userId, updateData);

      res.json({
        success: true,
        data: address,
      });
    } catch (error: any) {
      logger.error('Error updating address:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update address',
      });
    }
  }

  // 기본 배송지 설정
  async setDefaultAddress(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'userId is required',
        });
        return;
      }

      const address = await addressService.setDefaultAddress(id, userId);

      res.json({
        success: true,
        data: address,
      });
    } catch (error: any) {
      logger.error('Error setting default address:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to set default address',
      });
    }
  }

  // 배송지 삭제
  async deleteAddress(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'userId is required',
        });
        return;
      }

      await addressService.deleteAddress(id, userId);

      res.json({
        success: true,
        message: 'Address deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting address:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete address',
      });
    }
  }

  // 마지막 사용 시간 업데이트
  async updateLastUsed(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'userId is required',
        });
        return;
      }

      await addressService.updateLastUsed(id, userId);

      res.json({
        success: true,
        message: 'Last used time updated',
      });
    } catch (error: any) {
      logger.error('Error updating last used:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update last used',
      });
    }
  }

  // 주소 확인 표시
  async verifyAddress(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'userId is required',
        });
        return;
      }

      const address = await addressService.verifyAddress(id, userId);

      res.json({
        success: true,
        data: address,
      });
    } catch (error: any) {
      logger.error('Error verifying address:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to verify address',
      });
    }
  }
}

export const addressController = new AddressController();

