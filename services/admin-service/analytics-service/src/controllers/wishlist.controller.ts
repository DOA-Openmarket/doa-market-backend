import { Request, Response } from 'express';
import { WishlistService } from '@services/wishlist.service';

const wishlistService = new WishlistService();

export class WishlistController {
  async add(req: Request, res: Response): Promise<void> {
    try {
      const { userId, productId, metadata } = req.body;
      const wishlist = await wishlistService.addToWishlist(userId, productId, metadata);
      res.status(201).json({ success: true, data: wishlist });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const { userId, productId } = req.params;
      await wishlistService.removeFromWishlist(userId, productId);
      res.json({ success: true, message: 'Removed from wishlist' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getUserWishlist(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const wishlist = await wishlistService.getUserWishlist(userId);
      res.json({ success: true, data: wishlist });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async checkInWishlist(req: Request, res: Response): Promise<void> {
    try {
      const { userId, productId } = req.params;
      const inWishlist = await wishlistService.checkInWishlist(userId, productId);
      res.json({ success: true, data: { inWishlist } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getCount(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const count = await wishlistService.getWishlistCount(userId);
      res.json({ success: true, data: { count } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const wishlistController = new WishlistController();
