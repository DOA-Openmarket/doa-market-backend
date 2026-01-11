import { Request } from 'express';

export interface AuthUser {
  userId: string;
  email: string;
  role: 'admin' | 'seller' | 'user';
  sellerId?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  traceId?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ProductFilter {
  categoryId?: string;
  sellerId?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  search?: string;
}

export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  DELETED = 'deleted',
}

export enum EventType {
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  PRODUCT_DELETED = 'product.deleted',
  PRODUCT_STATUS_CHANGED = 'product.status_changed',
  PRODUCT_STOCK_UPDATED = 'product.stock_updated',
}

export interface BaseEvent {
  eventId: string;
  eventType: EventType;
  eventVersion: string;
  timestamp: string;
  source: string;
  correlationId: string;
  userId?: string;
  metadata: {
    traceId: string;
    environment: string;
  };
  data: any;
}
