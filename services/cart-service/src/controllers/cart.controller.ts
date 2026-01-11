import { Request, Response } from 'express';
import { CartService } from '@services/cart.service';

const cartService = new CartService();

export class CartController {
  async getCart(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const cart = await cartService.getOrCreateCart(userId);
      res.json({ success: true, data: cart });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async addItem(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { productId, quantity, options } = req.body;
      const cart = await cartService.addItem(userId, productId, quantity, options);
      res.json({ success: true, data: cart });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async updateItem(req: Request, res: Response): Promise<void> {
    try {
      const { userId, productId } = req.params;
      const { quantity } = req.body;
      const cart = await cartService.updateItemQuantity(userId, productId, quantity);
      res.json({ success: true, data: cart });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async removeItem(req: Request, res: Response): Promise<void> {
    try {
      const { userId, productId } = req.params;
      const cart = await cartService.removeItem(userId, productId);
      res.json({ success: true, data: cart });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async clearCart(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      await cartService.clearCart(userId);
      res.json({ success: true, message: 'Cart cleared' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const cartController = new CartController();
