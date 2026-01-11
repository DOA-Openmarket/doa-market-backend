import Joi from 'joi';

export interface CreateProductDto {
  sellerId: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  originalPrice?: number;
  stockQuantity?: number;
  metadata?: Record<string, any>;
}

export interface UpdateProductDto {
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  categoryId?: string;
  stockQuantity?: number;
  status?: string;
  metadata?: Record<string, any>;
}

export interface ProductQueryDto {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  categoryId?: string;
  sellerId?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  search?: string;
}

export interface ProductResponseDto {
  id: string;
  sellerId: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discountRate: number;
  status: string;
  stockQuantity: number;
  ratingAvg: number;
  reviewCount: number;
  salesCount: number;
  viewCount: number;
  thumbnail?: string;
  images?: string[];
  category?: {
    id: string;
    name: string;
  };
  variants?: any[];
  createdAt: Date;
  updatedAt: Date;
}

// Validation schemas
export const createProductSchema = Joi.object({
  sellerId: Joi.string().uuid().required(),
  categoryId: Joi.string().uuid().required(),
  name: Joi.string().min(1).max(255).required(),
  slug: Joi.string()
    .pattern(/^[a-z0-9-]+$/)
    .required(),
  description: Joi.string().allow('').optional(),
  price: Joi.number().min(0).required(),
  originalPrice: Joi.number().min(0).optional(),
  stockQuantity: Joi.number().integer().min(0).default(0),
  metadata: Joi.object().optional(),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  slug: Joi.string()
    .pattern(/^[a-z0-9-]+$/)
    .optional(),
  description: Joi.string().allow('').optional(),
  price: Joi.number().min(0).optional(),
  originalPrice: Joi.number().min(0).optional(),
  categoryId: Joi.string().uuid().optional(),
  stockQuantity: Joi.number().integer().min(0).optional(),
  status: Joi.string()
    .valid('draft', 'active', 'inactive', 'out_of_stock', 'deleted')
    .optional(),
  metadata: Joi.object().optional(),
});

export const productQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('createdAt', 'price', 'salesCount', 'ratingAvg').default('createdAt'),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
  categoryId: Joi.string().uuid().optional(),
  sellerId: Joi.string().uuid().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  status: Joi.string().valid('draft', 'active', 'inactive', 'out_of_stock').optional(),
  search: Joi.string().min(1).max(100).optional(),
});
