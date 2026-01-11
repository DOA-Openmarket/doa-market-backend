import { Repository } from 'typeorm';
import { AppDataSource } from '@config/database';
import { ShippingAddress } from '@models/Address';
import logger from '@utils/logger';

export interface CreateAddressInput {
  userId: string;
  recipientName: string;
  recipientPhone: string;
  postalCode: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  neighborhood?: string;
  country?: string;
  addressType?: string;
  addressLabel?: string;
  deliveryRequest?: string;
  entrancePassword?: string;
  isDefault?: boolean;
}

export interface UpdateAddressInput {
  recipientName?: string;
  recipientPhone?: string;
  postalCode?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  district?: string;
  neighborhood?: string;
  country?: string;
  addressType?: string;
  addressLabel?: string;
  deliveryRequest?: string;
  entrancePassword?: string;
  isDefault?: boolean;
}

export class AddressService {
  private repository: Repository<ShippingAddress>;
  private readonly MAX_ADDRESSES = 10; // 사용자당 최대 주소 개수

  constructor() {
    this.repository = AppDataSource.getRepository(ShippingAddress);
  }

  // 배송지 추가
  async createAddress(input: CreateAddressInput): Promise<ShippingAddress> {
    // 최대 개수 확인
    const count = await this.repository.count({ where: { userId: input.userId } });
    if (count >= this.MAX_ADDRESSES) {
      throw new Error(`Maximum ${this.MAX_ADDRESSES} addresses allowed`);
    }

    // 기본 배송지로 설정하는 경우, 기존 기본 배송지 해제
    if (input.isDefault) {
      await this.repository.update(
        { userId: input.userId, isDefault: true },
        { isDefault: false }
      );
    }

    // 첫 번째 주소는 자동으로 기본 배송지로 설정
    const isFirstAddress = count === 0;

    const address = this.repository.create({
      userId: input.userId,
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      postalCode: input.postalCode,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2 || null,
      city: input.city,
      district: input.district,
      neighborhood: input.neighborhood || null,
      country: input.country || 'Korea',
      addressType: input.addressType || null,
      addressLabel: input.addressLabel || null,
      deliveryRequest: input.deliveryRequest || null,
      entrancePassword: input.entrancePassword || null,
      isDefault: isFirstAddress || input.isDefault || false,
    });

    await this.repository.save(address);
    logger.info(`Address created: ${address.id} for user ${input.userId}`);

    return address;
  }

  // 배송지 조회 (단건)
  async getAddress(id: string, userId: string): Promise<ShippingAddress | null> {
    return this.repository.findOne({
      where: { id, userId },
    });
  }

  // 사용자의 배송지 목록
  async getUserAddresses(userId: string): Promise<ShippingAddress[]> {
    return this.repository.find({
      where: { userId },
      order: {
        isDefault: 'DESC',
        lastUsedAt: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  // 기본 배송지 조회
  async getDefaultAddress(userId: string): Promise<ShippingAddress | null> {
    return this.repository.findOne({
      where: { userId, isDefault: true },
    });
  }

  // 배송지 수정
  async updateAddress(
    id: string,
    userId: string,
    input: UpdateAddressInput
  ): Promise<ShippingAddress> {
    const address = await this.repository.findOne({
      where: { id, userId },
    });

    if (!address) {
      throw new Error('Address not found');
    }

    // 기본 배송지로 설정하는 경우, 기존 기본 배송지 해제
    if (input.isDefault === true) {
      await this.repository.update(
        { userId, isDefault: true },
        { isDefault: false }
      );
    }

    Object.assign(address, input);
    await this.repository.save(address);

    logger.info(`Address updated: ${id}`);

    return address;
  }

  // 기본 배송지 설정
  async setDefaultAddress(id: string, userId: string): Promise<ShippingAddress> {
    const address = await this.repository.findOne({
      where: { id, userId },
    });

    if (!address) {
      throw new Error('Address not found');
    }

    // 기존 기본 배송지 해제
    await this.repository.update(
      { userId, isDefault: true },
      { isDefault: false }
    );

    // 새로운 기본 배송지 설정
    address.isDefault = true;
    await this.repository.save(address);

    logger.info(`Default address set: ${id} for user ${userId}`);

    return address;
  }

  // 배송지 삭제
  async deleteAddress(id: string, userId: string): Promise<void> {
    const address = await this.repository.findOne({
      where: { id, userId },
    });

    if (!address) {
      throw new Error('Address not found');
    }

    // 기본 배송지인 경우, 다른 주소를 기본으로 설정
    if (address.isDefault) {
      const otherAddresses = await this.repository.find({
        where: { userId },
        order: { lastUsedAt: 'DESC', createdAt: 'DESC' },
      });

      // 다른 주소가 있으면 첫 번째 주소를 기본으로 설정
      if (otherAddresses.length > 1) {
        const nextDefault = otherAddresses.find(addr => addr.id !== id);
        if (nextDefault) {
          nextDefault.isDefault = true;
          await this.repository.save(nextDefault);
        }
      }
    }

    await this.repository.delete({ id });
    logger.info(`Address deleted: ${id}`);
  }

  // 마지막 사용 시간 업데이트
  async updateLastUsed(id: string, userId: string): Promise<void> {
    const address = await this.repository.findOne({
      where: { id, userId },
    });

    if (address) {
      address.lastUsedAt = new Date();
      await this.repository.save(address);
      logger.info(`Address last used updated: ${id}`);
    }
  }

  // 주소 확인 표시
  async verifyAddress(id: string, userId: string): Promise<ShippingAddress> {
    const address = await this.repository.findOne({
      where: { id, userId },
    });

    if (!address) {
      throw new Error('Address not found');
    }

    address.isVerified = true;
    await this.repository.save(address);

    logger.info(`Address verified: ${id}`);

    return address;
  }

  // 주소 검색 (우편번호로)
  async searchByPostalCode(userId: string, postalCode: string): Promise<ShippingAddress[]> {
    return this.repository.find({
      where: {
        userId,
        postalCode,
      },
    });
  }
}

