import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface VerificationCodeAttributes {
  id: string;
  email: string;
  code: string;
  expiresAt: Date;
  verified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

class VerificationCode extends Model<VerificationCodeAttributes> implements VerificationCodeAttributes {
  public id!: string;
  public email!: string;
  public code!: string;
  public expiresAt!: Date;
  public verified!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

VerificationCode.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'verification_codes',
    timestamps: true,
  }
);

export default VerificationCode;
