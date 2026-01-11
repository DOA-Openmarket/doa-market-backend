import { Request, Response } from 'express';
import Cart from '../models/cart.model';
import CartItem from '../models/cart-item.model';
import { z } from 'zod';
import axios from 'axios';

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003';

// Validation schemas
const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).default(1),
});

const updateQuantitySchema = z.object({
  quantity: z.number().int().min(0), // 0 allows deletion
});

// Get user's cart
export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find or create cart
    let cart = await Cart.findOne({
      where: { userId },
      include: [
        {
          model: CartItem,
          as: 'items',
        },
      ],
    });

    if (!cart) {
      cart = await Cart.create({ userId });
    }

    // Enrich with product details
    const items = await Promise.all(
      (cart.get('items') as CartItem[] || []).map(async (item) => {
        try {
          const productResponse = await axios.get(
            `${PRODUCT_SERVICE_URL}/api/v1/products/${item.productId}`
          );
          return {
            ...item.toJSON(),
            product: productResponse.data.data,
          };
        } catch (error) {
          return {
            ...item.toJSON(),
            product: null, // Product may have been deleted
          };
        }
      })
    );

    // Calculate total
    const total = items.reduce((sum, item) => {
      return sum + (parseFloat(item.price as any) * item.quantity);
    }, 0);

    res.json({
      success: true,
      data: {
        cartId: cart.cartId,
        userId: cart.userId,
        items,
        itemCount: items.length,
        total: total.toFixed(2),
      },
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add item to cart
export const addToCart = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate input
    const validationResult = addToCartSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const { productId, quantity } = validationResult.data;

    // Verify product exists and get its price
    let productData;
    try {
      const productResponse = await axios.get(
        `${PRODUCT_SERVICE_URL}/api/v1/products/${productId}`
      );
      productData = productResponse.data.data;
    } catch (error) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Find or create cart
    let cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      cart = await Cart.create({ userId });
    }

    // Check if item already exists in cart
    let cartItem = await CartItem.findOne({
      where: {
        cartId: cart.cartId,
        productId,
      },
    });

    if (cartItem) {
      // Update quantity
      cartItem.quantity += quantity;
      await cartItem.save();
    } else {
      // Create new cart item
      cartItem = await CartItem.create({
        cartId: cart.cartId,
        productId,
        quantity,
        price: productData.price,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Item added to cart',
      data: {
        ...cartItem.toJSON(),
        product: productData,
      },
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update cart item quantity
export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { cartItemId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate input
    const validationResult = updateQuantitySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const { quantity } = validationResult.data;

    // Find cart item
    const cartItem = await CartItem.findOne({
      where: { cartItemId },
      include: [
        {
          model: Cart,
          as: 'cart',
          where: { userId },
        },
      ],
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (quantity === 0) {
      // Delete item
      await cartItem.destroy();
      return res.json({
        success: true,
        message: 'Item removed from cart',
      });
    }

    // Update quantity
    cartItem.quantity = quantity;
    await cartItem.save();

    res.json({
      success: true,
      message: 'Cart item updated',
      data: cartItem,
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Remove item from cart
export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { cartItemId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find and delete cart item
    const cartItem = await CartItem.findOne({
      where: { cartItemId },
      include: [
        {
          model: Cart,
          as: 'cart',
          where: { userId },
        },
      ],
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    await cartItem.destroy();

    res.json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Clear cart
export const clearCart = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find cart
    const cart = await Cart.findOne({ where: { userId } });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Delete all items
    await CartItem.destroy({
      where: { cartId: cart.cartId },
    });

    res.json({
      success: true,
      message: 'Cart cleared',
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
