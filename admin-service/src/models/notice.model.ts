import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

class Notice extends Model {
  public id!: string;
  public title!: string;
  public content!: string;
  public category!: string;
  public status!: string;
  public priority!: string;
  public views!: number;
  public isPinned!: boolean;
  public attachments?: string[];
  public startDate?: Date;
  public endDate?: Date;
  public createdBy!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Notice.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '공지사항 제목'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '공지사항 내용'
    },
    category: {
      type: DataTypes.ENUM('공지', '이벤트', '업데이트', '점검'),
      defaultValue: '공지',
      comment: '공지사항 카테고리'
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      defaultValue: 'draft',
      comment: '공지사항 상태'
    },
    priority: {
      type: DataTypes.ENUM('normal', 'urgent'),
      defaultValue: 'normal',
      comment: '우선순위: 일반/긴급'
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '조회수'
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '상단 고정 여부'
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '첨부파일 URL 배열'
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '게시 시작일'
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '게시 종료일'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '작성자 ID'
    },
  },
  {
    sequelize,
    tableName: 'notices',
    timestamps: true
  }
);

export default Notice;
