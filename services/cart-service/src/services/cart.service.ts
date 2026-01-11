import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '@config/database';
import { Cart } from '@models/Cart';

const CartItem = require('@models/Cart').CartItem;

export class CartService {
  private cartRepository: Repository<Cart>;
  private itemRepository: Repository<any>;

  constructor() {
    this.cartRepository = AppDataSource.getRepository(Cart);
    this.itemRepository = AppDataSource.getRepository(CartItem);
  }

  async getOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items'],
    });

    if (!cart) {
      cart = this.cartRepository.create({
        cartId: uuidv4(),
        userId,
      });
      await this.cartRepository.save(cart);
    }

    return cart;
  }

  async addItem(userId: string, productId: string, quantity: number, options?: any): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);

    const existingItem = await this.itemRepository.findOne({
      where: { cartId: cart.cartId, productId },
    });

    if (existingItem) {
      existingItem.quantity += quantity;
      await this.itemRepository.save(existingItem);
    } else {
      const item = this.itemRepository.create({
        cartItemId: uuidv4(),
        cartId: cart.cartId,
        productId,
        quantity,
        options: options || {},
      });
      await this.itemRepository.save(item);
    }

    return this.getOrCreateCart(userId);
  }

  async updateItemQuantity(userId: string, productId: string, quantity: number): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);

    const item = await this.itemRepository.findOne({
      where: { cartId: cart.cartId, productId },
    });

    if (!item) throw new Error('Item not found in cart');

    if (quantity <= 0) {
      await this.itemRepository.remove(item);
    } else {
      item.quantity = quantity;
      await this.itemRepository.save(item);
    }

    return this.getOrCreateCart(userId);
  }

  async removeItem(userId: string, productId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);

    await this.itemRepository.delete({
      cartId: cart.cartId,
      productId,
    });

    return this.getOrCreateCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.getOrCreateCart(userId);
    await this.itemRepository.delete({ cartId: cart.cartId });
  }
}
