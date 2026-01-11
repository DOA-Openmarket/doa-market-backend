import { Request, Response, NextFunction } from 'express';
import { getCached, setCache } from '../config/redis';
import logger from '../utils/logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
  excludeQuery?: boolean;
}

/**
 * Cache middleware for GET requests
 * Caches the response based on the request path and query parameters
 */
export function cacheMiddleware(options: CacheOptions = {}) {
  const { ttl = 300, keyPrefix = 'cache', excludeQuery = false } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key
      const queryString = excludeQuery ? '' : JSON.stringify(req.query);
      const cacheKey = `${keyPrefix}:${req.path}:${queryString}`;

      // Try to get from cache
      const cached = await getCached<any>(cacheKey);

      if (cached) {
        logger.debug('Cache hit', { key: cacheKey });
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }

      logger.debug('Cache miss', { key: cacheKey });
      res.setHeader('X-Cache', 'MISS');

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function (body: any) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setCache(cacheKey, body, ttl).catch((error) => {
            logger.error('Failed to cache response:', { key: cacheKey, error });
          });
        }

        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
}

/**
 * Cache middleware specifically for product lists
 */
export function cacheProductList() {
  return cacheMiddleware({
    ttl: 600, // 10 minutes
    keyPrefix: 'products:list',
    excludeQuery: false,
  });
}

/**
 * Cache middleware for product details
 */
export function cacheProductDetail() {
  return cacheMiddleware({
    ttl: 1800, // 30 minutes
    keyPrefix: 'products:detail',
    excludeQuery: true,
  });
}

/**
 * Cache middleware for search results
 */
export function cacheSearchResults() {
  return cacheMiddleware({
    ttl: 300, // 5 minutes
    keyPrefix: 'search',
    excludeQuery: false,
  });
}

/**
 * Cache middleware for categories
 */
export function cacheCategories() {
  return cacheMiddleware({
    ttl: 3600, // 1 hour
    keyPrefix: 'categories',
    excludeQuery: true,
  });
}

/**
 * Bypass cache for authenticated requests
 */
export function bypassCacheForAuth(req: Request, res: Response, next: NextFunction) {
  if (req.headers.authorization) {
    res.setHeader('X-Cache', 'BYPASS');
    return next();
  }
  next();
}
