import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * Point 모델 - 포인트 거래 내역
 */
class Point extends Model {
  public id!: string;
  public userId!: string;
  public amount!: number;
  public type!: 'earn' | 'use' | 'expire';
  public source!: 'daily_checkin' | 'purchase' | 'review' | 'admin' | 'refund' | 'event';
  public orderId?: string;
  public description!: string;
  public balance!: number; // 거래 후 잔액
  public expiresAt?: Date; // 만료일 (적립 포인트의 경우)
  public remainingAmount!: number; // FIFO 추적용 잔여 포인트
  public usedAmount!: number; // 사용된 포인트
  public isExpired!: boolean; // 만료 여부
  public relatedPointId?: string; // 원본 포인트 참조 (환불 시)
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Point.init(
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
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '포인트 금액 (적립/사용 금액)',
    },
    type: {
      type: DataTypes.ENUM('earn', 'use', 'expire'),
      allowNull: false,
      comment: '거래 유형: earn(적립), use(사용), expire(만료)',
    },
    source: {
      type: DataTypes.ENUM('daily_checkin', 'purchase', 'review', 'admin', 'refund', 'event'),
      allowNull: false,
      comment: '포인트 출처: 출석체크, 구매, 리뷰, 관리자 지급, 환불, 이벤트',
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '관련 주문 ID',
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: '포인트 거래 설명',
    },
    balance: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '거래 후 포인트 잔액',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '포인트 만료일 (적립 포인트만)',
    },
    remainingAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'FIFO 추적용 잔여 포인트 (적립 포인트의 경우 사용 가능한 금액)',
    },
    usedAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '사용된 포인트 (적립 포인트에서 차감된 금액)',
    },
    isExpired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '만료 여부 (true인 경우 사용 불가)',
    },
    relatedPointId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '원본 포인트 참조 (환불 시 원본 적립 포인트 ID)',
      references: {
        model: 'points',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'points',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['type'] },
      { fields: ['source'] },
      { fields: ['createdAt'] },
      { fields: ['expiresAt'] },
      {
        name: 'idx_points_fifo',
        fields: ['userId', 'type', 'expiresAt', 'isExpired'],
        where: {
          type: 'earn',
          isExpired: false,
        },
      },
      {
        name: 'idx_points_related',
        fields: ['relatedPointId'],
      },
    ],
  }
);

export default Point;
