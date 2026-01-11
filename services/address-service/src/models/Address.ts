import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('shipping_addresses')
@Index(['userId'])
@Index(['isDefault'])
export class ShippingAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'recipient_name', type: 'varchar', length: 100 })
  recipientName: string; // 수령인 이름

  @Column({ name: 'recipient_phone', type: 'varchar', length: 20 })
  recipientPhone: string; // 수령인 전화번호

  @Column({ name: 'postal_code', type: 'varchar', length: 10 })
  postalCode: string; // 우편번호

  @Column({ name: 'address_line1', type: 'varchar', length: 255 })
  addressLine1: string; // 기본 주소

  @Column({ name: 'address_line2', type: 'varchar', length: 255, nullable: true })
  addressLine2: string | null; // 상세 주소

  @Column({ type: 'varchar', length: 100 })
  city: string; // 시/도

  @Column({ type: 'varchar', length: 100 })
  district: string; // 시/군/구

  @Column({ type: 'varchar', length: 100, nullable: true })
  neighborhood: string | null; // 동/읍/면

  @Column({ type: 'varchar', length: 100, default: 'Korea' })
  country: string; // 국가

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean; // 기본 배송지 여부

  @Column({ name: 'address_type', type: 'varchar', length: 20, nullable: true })
  addressType: string | null; // 주소 유형 (home, office, etc.)

  @Column({ name: 'address_label', type: 'varchar', length: 50, nullable: true })
  addressLabel: string | null; // 별칭 (집, 회사, 부모님댁 등)

  @Column({ name: 'delivery_request', type: 'text', nullable: true })
  deliveryRequest: string | null; // 배송 요청사항

  @Column({ name: 'entrance_password', type: 'varchar', length: 50, nullable: true })
  entrancePassword: string | null; // 공동현관 비밀번호

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean; // 주소 확인 여부

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt: Date | null; // 마지막 사용일

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

