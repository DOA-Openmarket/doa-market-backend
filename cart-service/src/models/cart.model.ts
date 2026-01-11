import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface CartAttributes {
  cartId: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CartCreationAttributes extends Optional<CartAttributes, 'cartId' | 'createdAt' | 'updatedAt'> {}

class Cart extends Model<CartAttributes, CartCreationAttributes> implements CartAttributes {
  declare cartId: string;
  declare userId: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Cart.init(
  {
    cartId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    tableName: 'carts',
    timestamps: true,
  }
);

export default Cart;
