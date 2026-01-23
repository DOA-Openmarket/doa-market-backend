import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

class User extends Model {
  public id!: string;
  public email!: string;
  public password!: string;
  public name!: string;
  public phone?: string;
  public profileImage?: string;
  public role!: string;
  public grade!: string;
  public status!: string;
  public emailVerified!: boolean;
  public lastLoginAt?: Date;
  public totalPoints!: number;
  public consecutiveCheckins!: number;
  public lastCheckinDate?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: true, comment: '암호화된 비밀번호' },
    name: { type: DataTypes.STRING(100), allowNull: false },
    phone: { type: DataTypes.STRING(20) },
    profileImage: { type: DataTypes.TEXT },
    role: { type: DataTypes.ENUM('admin', 'seller', 'user'), defaultValue: 'user' },
    grade: { type: DataTypes.ENUM('bronze', 'silver', 'gold', 'vip'), defaultValue: 'bronze' },
    status: { type: DataTypes.ENUM('active', 'suspended', 'deleted'), defaultValue: 'active' },
    emailVerified: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: true, comment: '이메일 인증 여부' },
    lastLoginAt: { type: DataTypes.DATE, allowNull: true, comment: '마지막 로그인 시간' },
    totalPoints: { type: DataTypes.INTEGER, defaultValue: 0, comment: '현재 보유 포인트' },
    consecutiveCheckins: { type: DataTypes.INTEGER, defaultValue: 0, comment: '연속 출석일' },
    lastCheckinDate: { type: DataTypes.DATEONLY, allowNull: true, comment: '마지막 출석 날짜' },
  },
  { sequelize, tableName: 'users', timestamps: true }
);

export default User;

