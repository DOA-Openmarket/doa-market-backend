import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import bcrypt from 'bcryptjs';

export interface UserAttributes {
  id: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'admin' | 'seller' | 'user';
  status: 'active' | 'suspended' | 'deleted';
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'phone' | 'lastLoginAt' | 'createdAt' | 'updatedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare email: string;
  declare password: string;
  declare name: string;
  declare phone?: string;
  declare role: 'admin' | 'seller' | 'user';
  declare status: 'active' | 'suspended' | 'deleted';
  declare emailVerified: boolean;
  declare lastLoginAt?: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Instance methods
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    const password = this.password || this.getDataValue('password') || (this as any).dataValues?.password;
    if (!password) {
      return false;
    }
    return bcrypt.compare(candidatePassword, password);
  }

  public toJSON(): Omit<UserAttributes, 'password'> {
    const values = { ...this.get() };
    delete (values as any).password;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('admin', 'seller', 'user'),
      defaultValue: 'user',
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'deleted'),
      defaultValue: 'active',
      allowNull: false,
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
    ],
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          console.log('[User Model] beforeCreate hook: Hashing password for', user.email);
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
          console.log('[User Model] beforeCreate hook: Password hashed successfully');
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          console.log('[User Model] beforeUpdate hook: Hashing password for', user.email);
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
          console.log('[User Model] beforeUpdate hook: Password hashed successfully');
        }
      },
    },
  }
);

export default User;

