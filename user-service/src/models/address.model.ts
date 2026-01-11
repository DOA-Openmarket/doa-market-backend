import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface AddressAttributes {
  addressId: string;
  userId: string;
  recipientName: string;
  phone: string;
  zipCode: string;
  address: string;
  addressDetail: string;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AddressCreationAttributes extends Optional<AddressAttributes, 'addressId' | 'isDefault' | 'createdAt' | 'updatedAt'> {}

class Address extends Model<AddressAttributes, AddressCreationAttributes> implements AddressAttributes {
  declare addressId: string;
  declare userId: string;
  declare recipientName: string;
  declare phone: string;
  declare zipCode: string;
  declare address: string;
  declare addressDetail: string;
  declare isDefault: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Address.init(
  {
    addressId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    recipientName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    zipCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    addressDetail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'addresses',
    timestamps: true,
  }
);

export default Address;
