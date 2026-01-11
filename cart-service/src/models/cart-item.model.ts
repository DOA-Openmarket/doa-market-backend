import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import Cart from './cart.model';

interface CartItemAttributes {
  cartItemId: string;
  cartId: string;
  productId: string;
  quantity: number;
  price: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CartItemCreationAttributes extends Optional<CartItemAttributes, 'cartItemId' | 'createdAt' | 'updatedAt'> {}

class CartItem extends Model<CartItemAttributes, CartItemCreationAttributes> implements CartItemAttributes {
  declare cartItemId: string;
  declare cartId: string;
  declare productId: string;
  declare quantity: number;
  declare price: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CartItem.init(
  {
    cartItemId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    cartId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'carts',
        key: 'cartId',
      },
      onDelete: 'CASCADE',
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'cart_items',
    timestamps: true,
  }
);

// Define associations
Cart.hasMany(CartItem, {
  foreignKey: 'cartId',
  as: 'items',
  onDelete: 'CASCADE',
});

CartItem.belongsTo(Cart, {
  foreignKey: 'cartId',
  as: 'cart',
});

export default CartItem;
