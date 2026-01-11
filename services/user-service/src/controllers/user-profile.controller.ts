import { Request, Response } from 'express';
import { UserProfileService } from '@services/user-profile.service';
import logger from '@utils/logger';

const userProfileService = new UserProfileService();

export class UserProfileController {
  async createProfile(req: Request, res: Response): Promise<void> {
    try {
      const profile = await userProfileService.createProfile(req.body);

      res.status(201).json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      logger.error('Error creating profile:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create profile',
      });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const profile = await userProfileService.getProfile(userId);

      if (!profile) {
        res.status(404).json({
          success: false,
          error: 'Profile not found',
        });
        return;
      }

      res.json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      logger.error('Error getting profile:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get profile',
      });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const profile = await userProfileService.updateProfile(userId, req.body);

      res.json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      logger.error('Error updating profile:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update profile',
      });
    }
  }

  async deleteProfile(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      await userProfileService.deleteProfile(userId);

      res.json({
        success: true,
        message: 'Profile deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting profile:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete profile',
      });
    }
  }

  async getAllProfiles(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await userProfileService.getAllProfiles(page, limit);

      res.json({
        success: true,
        data: result.profiles,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error: any) {
      logger.error('Error getting profiles:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get profiles',
      });
    }
  }

  async searchProfiles(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Search query is required',
        });
        return;
      }

      const profiles = await userProfileService.searchProfiles(q);

      res.json({
        success: true,
        data: profiles,
      });
    } catch (error: any) {
      logger.error('Error searching profiles:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to search profiles',
      });
    }
  }
}

export const userProfileController = new UserProfileController();
