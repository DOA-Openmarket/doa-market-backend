import { Repository } from 'typeorm';
import { AppDataSource } from '@config/database';
import { UserProfile, Gender } from '@models/UserProfile';
import logger from '@utils/logger';

export interface CreateProfileInput {
  userId: string;
  displayName?: string;
  bio?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  nationality?: string;
  occupation?: string;
  company?: string;
  website?: string;
  preferences?: Record<string, any>;
}

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  nationality?: string;
  occupation?: string;
  company?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  preferences?: Record<string, any>;
  metadata?: Record<string, any>;
}

export class UserProfileService {
  private repository: Repository<UserProfile>;

  constructor() {
    this.repository = AppDataSource.getRepository(UserProfile);
  }

  async createProfile(input: CreateProfileInput): Promise<UserProfile> {
    const existingProfile = await this.repository.findOne({
      where: { userId: input.userId },
    });

    if (existingProfile) {
      throw new Error('Profile already exists for this user');
    }

    const profile = this.repository.create({
      userId: input.userId,
      displayName: input.displayName || null,
      bio: input.bio || null,
      dateOfBirth: input.dateOfBirth || null,
      gender: input.gender || null,
      nationality: input.nationality || null,
      occupation: input.occupation || null,
      company: input.company || null,
      website: input.website || null,
      preferences: input.preferences || {},
    });

    await this.repository.save(profile);
    logger.info(`Profile created for user: ${input.userId}`);

    return profile;
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    return this.repository.findOne({
      where: { userId },
    });
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileInput
  ): Promise<UserProfile> {
    const profile = await this.repository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    Object.assign(profile, input);
    await this.repository.save(profile);

    logger.info(`Profile updated for user: ${userId}`);

    return profile;
  }

  async deleteProfile(userId: string): Promise<void> {
    const result = await this.repository.delete({ userId });

    if (result.affected === 0) {
      throw new Error('Profile not found');
    }

    logger.info(`Profile deleted for user: ${userId}`);
  }

  async getAllProfiles(
    page: number = 1,
    limit: number = 10
  ): Promise<{ profiles: UserProfile[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const [profiles, total] = await this.repository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      profiles,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async searchProfiles(query: string): Promise<UserProfile[]> {
    return this.repository
      .createQueryBuilder('profile')
      .where('profile.displayName ILIKE :query', { query: `%${query}%` })
      .orWhere('profile.bio ILIKE :query', { query: `%${query}%` })
      .orWhere('profile.occupation ILIKE :query', { query: `%${query}%` })
      .orWhere('profile.company ILIKE :query', { query: `%${query}%` })
      .limit(20)
      .getMany();
  }
}
