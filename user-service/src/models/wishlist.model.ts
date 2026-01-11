import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

interface WishlistAttributes {
  id: string;
  userId: string;
  productId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class Wishlist extends Model<WishlistAttributes> implements WishlistAttributes {
  public id!: string;
  public userId!: string;
  public productId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Wishlist.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'product_id',
    },
  },
  {
    sequelize,
    tableName: 'wishlists',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'product_id'],
      },
      {
        fields: ['user_id'],
      },
    ],
  }
);

export default Wishlist;
