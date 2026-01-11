import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '@config/database';
import { Order, OrderStatus, PaymentStatus } from '@models/Order';
import { OrderItem } from '@models/OrderItem';
import logger from '@utils/logger';

export interface CreateOrderItemInput {
  productId: string;
  productName: string;
  productImageUrl?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  options?: Record<string, any>;
}

export interface CreateOrderInput {
  userId: string;
  sellerId?: string;
  items: CreateOrderItemInput[];
  shippingFee?: number;
  discountAmount?: number;
  recipientName: string;
  recipientPhone: string;
  shippingAddressLine1: string;
  shippingAddressLine2?: string;
  shippingCity: string;
  shippingState?: string;
  shippingPostalCode: string;
  shippingCountry?: string;
  orderNotes?: string;
  paymentMethod?: string;
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
  trackingNumber?: string;
  courierCompany?: string;
  cancelReason?: string;
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  userId?: string;
  sellerId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
}

export class OrderService {
  private orderRepository: Repository<Order>;
  private orderItemRepository: Repository<OrderItem>;

  constructor() {
    this.orderRepository = AppDataSource.getRepository(Order);
    this.orderItemRepository = AppDataSource.getRepository(OrderItem);
  }

  async createOrder(input: CreateOrderInput): Promise<Order> {
    if (!input.items || input.items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    // Calculate totals
    const subtotal = input.items.reduce((sum, item) => {
      const itemTotal = item.unitPrice * item.quantity - (item.discountAmount || 0);
      return sum + itemTotal;
    }, 0);

    const shippingFee = input.shippingFee || 0;
    const discountAmount = input.discountAmount || 0;
    const totalAmount = subtotal + shippingFee - discountAmount;

    // Create order
    const orderId = uuidv4();
    const order = this.orderRepository.create({
      orderId,
      userId: input.userId,
      sellerId: input.sellerId || null,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      subtotal,
      shippingFee,
      discountAmount,
      totalAmount,
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      shippingAddressLine1: input.shippingAddressLine1,
      shippingAddressLine2: input.shippingAddressLine2 || null,
      shippingCity: input.shippingCity,
      shippingState: input.shippingState || null,
      shippingPostalCode: input.shippingPostalCode,
      shippingCountry: input.shippingCountry || 'KR',
      orderNotes: input.orderNotes || null,
      paymentMethod: input.paymentMethod || null,
    });

    await this.orderRepository.save(order);

    // Create order items
    const orderItems = input.items.map((item) => {
      const totalPrice = item.unitPrice * item.quantity - (item.discountAmount || 0);
      return this.orderItemRepository.create({
        orderItemId: uuidv4(),
        orderId,
        productId: item.productId,
        productName: item.productName,
        productImageUrl: item.productImageUrl || null,
        sku: item.sku || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount || 0,
        totalPrice,
        options: item.options || {},
      });
    });

    await this.orderItemRepository.save(orderItems);

    logger.info(`Order created: ${orderId} for user: ${input.userId}`);

    // Return order with items
    return this.getOrder(orderId) as Promise<Order>;
  }

  async getOrder(orderId: string): Promise<Order | null> {
    return this.orderRepository.findOne({
      where: { orderId },
      relations: ['items'],
    });
  }

  async getOrdersByUser(userId: string, params: OrderQueryParams): Promise<{
    orders: Order[];
    total: number;
    pages: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.userId = :userId', { userId });

    if (params.status) {
      queryBuilder.andWhere('order.status = :status', { status: params.status });
    }

    if (params.paymentStatus) {
      queryBuilder.andWhere('order.paymentStatus = :paymentStatus', {
        paymentStatus: params.paymentStatus,
      });
    }

    if (params.startDate) {
      queryBuilder.andWhere('order.createdAt >= :startDate', {
        startDate: params.startDate,
      });
    }

    if (params.endDate) {
      queryBuilder.andWhere('order.createdAt <= :endDate', {
        endDate: params.endDate,
      });
    }

    const [orders, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('order.createdAt', 'DESC')
      .getManyAndCount();

    return {
      orders,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async getOrdersBySeller(sellerId: string, params: OrderQueryParams): Promise<{
    orders: Order[];
    total: number;
    pages: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.sellerId = :sellerId', { sellerId });

    if (params.status) {
      queryBuilder.andWhere('order.status = :status', { status: params.status });
    }

    if (params.paymentStatus) {
      queryBuilder.andWhere('order.paymentStatus = :paymentStatus', {
        paymentStatus: params.paymentStatus,
      });
    }

    if (params.startDate) {
      queryBuilder.andWhere('order.createdAt >= :startDate', {
        startDate: params.startDate,
      });
    }

    if (params.endDate) {
      queryBuilder.andWhere('order.createdAt <= :endDate', {
        endDate: params.endDate,
      });
    }

    const [orders, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('order.createdAt', 'DESC')
      .getManyAndCount();

    return {
      orders,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async updateOrderStatus(
    orderId: string,
    input: UpdateOrderStatusInput
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    order.status = input.status;

    // Handle status-specific updates
    if (input.status === OrderStatus.SHIPPED) {
      order.shippedAt = new Date();
      if (input.trackingNumber) {
        order.trackingNumber = input.trackingNumber;
      }
      if (input.courierCompany) {
        order.courierCompany = input.courierCompany;
      }
    } else if (input.status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
    } else if (input.status === OrderStatus.CANCELLED) {
      order.cancelledAt = new Date();
      if (input.cancelReason) {
        order.cancelReason = input.cancelReason;
      }
    }

    await this.orderRepository.save(order);

    logger.info(`Order status updated: ${orderId} to ${input.status}`);

    return order;
  }

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    transactionId?: string
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    order.paymentStatus = paymentStatus;

    if (paymentStatus === PaymentStatus.COMPLETED) {
      order.paidAt = new Date();
      order.status = OrderStatus.CONFIRMED;
      if (transactionId) {
        order.paymentTransactionId = transactionId;
      }
    } else if (paymentStatus === PaymentStatus.REFUNDED) {
      order.refundedAt = new Date();
      order.status = OrderStatus.REFUNDED;
    }

    await this.orderRepository.save(order);

    logger.info(`Order payment status updated: ${orderId} to ${paymentStatus}`);

    return order;
  }

  async cancelOrder(orderId: string, reason: string): Promise<Order> {
    return this.updateOrderStatus(orderId, {
      status: OrderStatus.CANCELLED,
      cancelReason: reason,
    });
  }

  async deleteOrder(orderId: string): Promise<void> {
    const result = await this.orderRepository.delete({ orderId });

    if (result.affected === 0) {
      throw new Error('Order not found');
    }

    logger.info(`Order deleted: ${orderId}`);
  }

  async getOrderCountsBySeller(sellerId: string): Promise<Record<string, number>> {
    const baseQuery = this.orderRepository
      .createQueryBuilder('order')
      .where('order.sellerId = :sellerId', { sellerId });

    const [
      total,
      pending,
      confirmed,
      processing,
      shipped,
      delivered,
      cancelled,
    ] = await Promise.all([
      baseQuery.getCount(),
      baseQuery.clone().andWhere('order.status = :status', { status: OrderStatus.PENDING }).getCount(),
      baseQuery.clone().andWhere('order.status = :status', { status: OrderStatus.CONFIRMED }).getCount(),
      baseQuery.clone().andWhere('order.status = :status', { status: OrderStatus.PROCESSING }).getCount(),
      baseQuery.clone().andWhere('order.status = :status', { status: OrderStatus.SHIPPED }).getCount(),
      baseQuery.clone().andWhere('order.status = :status', { status: OrderStatus.DELIVERED }).getCount(),
      baseQuery.clone().andWhere('order.status = :status', { status: OrderStatus.CANCELLED }).getCount(),
    ]);

    return {
      total,
      pending,
      confirmed,
      processing,
      shipped,
      delivered,
      cancelled,
    };
  }
}
