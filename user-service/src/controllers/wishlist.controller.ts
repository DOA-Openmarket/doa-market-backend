import { Request, Response } from 'express';
import Wishlist from '../models/wishlist.model';
import axios from 'axios';

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3003/api/v1';

export const getWishlist = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const wishlists = await Wishlist.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    // Fetch product details for each wishlist item
    const wishlistWithProducts = await Promise.all(
      wishlists.map(async (wishlist) => {
        try {
          const wishlistData = wishlist.toJSON();
          const productResponse = await axios.get(`${PRODUCT_SERVICE_URL}/products/${wishlistData.productId}`);
          return {
            ...wishlistData,
            product: productResponse.data.data || productResponse.data
          };
        } catch (error: any) {
          console.error(`Error fetching product ${wishlist.productId}:`, error.message);
          return {
            ...wishlist.toJSON(),
            product: null
          };
        }
      })
    );

    res.json({ success: true, data: wishlistWithProducts });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addToWishlist = async (req: Request, res: Response) => {
  try {
    const { userId, productId } = req.body;

    const existing = await Wishlist.findOne({ where: { userId, productId } });
    if (existing) {
      return res.json({ success: true, data: existing, message: 'Already in wishlist' });
    }

    const wishlist = await Wishlist.create({ userId, productId });
    res.status(201).json({ success: true, data: wishlist });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const removeFromWishlist = async (req: Request, res: Response) => {
  try {
    const { userId, productId } = req.params;
    const deleted = await Wishlist.destroy({ where: { userId, productId } });
    if (!deleted) {
      return res.status(404).json({ error: 'Wishlist item not found' });
    }
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkWishlist = async (req: Request, res: Response) => {
  try {
    const { userId, productId } = req.params;
    const wishlist = await Wishlist.findOne({ where: { userId, productId } });
    res.json({ success: true, data: { isInWishlist: !!wishlist } });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getWishlistCount = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const count = await Wishlist.count({ where: { userId } });
    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Get wishlist count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
