import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';

@Entity('carts')
@Index(['userId'], { unique: true })
export class Cart {
  @PrimaryColumn('uuid')
  cartId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => require('./CartItem').CartItem, (item: any) => item.cart)
  items: any[];
}

@Entity('cart_items')
@Index(['cartId'])
@Index(['productId'])
export class CartItem {
  @PrimaryColumn('uuid')
  cartItemId: string;

  @Column({ name: 'cart_id', type: 'uuid' })
  cartId: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  options: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
