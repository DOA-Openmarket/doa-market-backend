import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * DailyCheckin 모델 - 출석체크 기록
 */
class DailyCheckin extends Model {
  public id!: string;
  public userId!: string;
  public checkinDate!: string; // YYYY-MM-DD 형식
  public pointsEarned!: number;
  public consecutiveDays!: number;
  public isBonus!: boolean;
  public readonly createdAt!: Date;
}

DailyCheckin.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    checkinDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: '출석 날짜 (YYYY-MM-DD)',
    },
    pointsEarned: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      comment: '획득한 포인트',
    },
    consecutiveDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '연속 출석 일수',
    },
    isBonus: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '보너스 포인트 여부 (7일, 30일 연속)',
    },
  },
  {
    sequelize,
    tableName: 'daily_checkins',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['userId'] },
      { fields: ['checkinDate'] },
      { unique: true, fields: ['userId', 'checkinDate'] }, // 하루에 한 번만 출석
    ],
  }
);

export default DailyCheckin;
