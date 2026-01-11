import { productRepository } from '@repositories/ProductRepository';
import { redisService } from '@config/redis';
import { opensearchService } from '@config/opensearch';
import { eventPublisher } from '@events/publishers/EventPublisher';
import { CreateProductDto, UpdateProductDto, ProductQueryDto, ProductResponseDto } from '@dto/product.dto';
import { ProductFilter, PaginationQuery, EventType } from '@/types';
import { logger } from '@utils/logger';
import { AppError } from '@utils/errors';

export class ProductService {
  private cachePrefix = 'product:';
  private cacheTTL = 3600; // 1 hour

  async getProductById(id: string): Promise<ProductResponseDto> {
    try {
      // Try cache first
      const cacheKey = `${this.cachePrefix}${id}`;
      const cached = await redisService.get<ProductResponseDto>(cacheKey);
      if (cached) {
        logger.debug('Product retrieved from cache', { id });
        // Increment view count asynchronously
        productRepository.incrementViewCount(id).catch((err) => {
          logger.error('Failed to increment view count', { id, error: err });
        });
        return cached;
      }

      // Get from database
      const product = await productRepository.findById(id);
      if (!product) {
        throw new AppError('PRODUCT_NOT_FOUND', 'Product not found', 404);
      }

      // Transform to DTO
      const productDto = this.transformToDto(product);

      // Cache the result
      await redisService.set(cacheKey, productDto, this.cacheTTL);

      // Increment view count asynchronously
      productRepository.incrementViewCount(id).catch((err) => {
        logger.error('Failed to increment view count', { id, error: err });
      });

      return productDto;
    } catch (error) {
      logger.error('Error getting product by ID:', { id, error });
      throw error;
    }
  }

  async getProductBySlug(slug: string): Promise<ProductResponseDto> {
    try {
      const product = await productRepository.findBySlug(slug);
      if (!product) {
        throw new AppError('PRODUCT_NOT_FOUND', 'Product not found', 404);
      }

      // Increment view count asynchronously
      productRepository.incrementViewCount(product.id).catch((err) => {
        logger.error('Failed to increment view count', { id: product.id, error: err });
      });

      return this.transformToDto(product);
    } catch (error) {
      logger.error('Error getting product by slug:', { slug, error });
      throw error;
    }
  }

  async getProducts(query: ProductQueryDto): Promise<{ data: ProductResponseDto[]; meta: any }> {
    try {
      const { page = 1, limit = 20, sortBy, sortOrder, search, ...filter } = query;

      // If search query exists, use OpenSearch
      if (search) {
        return await this.searchProducts(search, filter, { page, limit, sortBy, sortOrder });
      }

      // Otherwise use database
      const pagination: PaginationQuery = { page, limit, sortBy, sortOrder };
      const { products, total } = await productRepository.findAll(filter, pagination);

      return {
        data: products.map((p) => this.transformToDto(p)),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting products:', { query, error });
      throw error;
    }
  }

  async searchProducts(
    searchTerm: string,
    filter: ProductFilter,
    pagination: PaginationQuery
  ): Promise<{ data: ProductResponseDto[]; meta: any }> {
    try {
      logger.info('Searching products with term:', { searchTerm, filter, pagination });
      const { page = 1, limit = 20 } = pagination;
      const from = (page - 1) * limit;

      const query: any = {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: searchTerm,
                  fields: ['name^3', 'description', 'categoryName', 'sellerName'],
                  type: 'best_fields',
                  fuzziness: 'AUTO',
                },
              },
            ],
            filter: [],
          },
        },
        from,
        size: limit,
        sort: [{ _score: 'desc' }, { createdAt: 'desc' }],
      };

      // Add filters
      if (filter.categoryId) {
        query.query.bool.filter.push({ term: { categoryId: filter.categoryId } });
      }

      if (filter.sellerId) {
        query.query.bool.filter.push({ term: { sellerId: filter.sellerId } });
      }

      if (filter.status) {
        query.query.bool.filter.push({ term: { status: filter.status } });
      }

      if (filter.minPrice || filter.maxPrice) {
        query.query.bool.filter.push({
          range: {
            price: {
              gte: filter.minPrice || 0,
              lte: filter.maxPrice || Number.MAX_SAFE_INTEGER,
            },
          },
        });
      }

      try {
        logger.info('Attempting OpenSearch...');
        const result = await opensearchService.searchProducts(query);
        logger.info('OpenSearch successful, got results:', { total: result.hits.total.value });

        const productIds = result.hits.hits.map((hit: any) => hit._id);
        const products = await productRepository.findByIds(productIds);

        // Sort products by OpenSearch result order
        const productMap = new Map(products.map((p) => [p.id, p]));
        const sortedProducts = productIds.map((id: string) => productMap.get(id)).filter(Boolean);

        return {
          data: sortedProducts.map((p: any) => this.transformToDto(p)),
          meta: {
            page,
            limit,
            total: result.hits.total.value,
            totalPages: Math.ceil(result.hits.total.value / limit),
          },
        };
      } catch (opensearchError) {
        logger.warn('OpenSearch unavailable, falling back to database search:', opensearchError);

        // Fallback to database search using LIKE
        const searchFilter = { ...filter, search: searchTerm };
        logger.info('Database search filter:', searchFilter);
        const { products, total } = await productRepository.findAll(searchFilter, pagination);
        logger.info('Database search results:', { total, count: products.length });

        return {
          data: products.map((p) => this.transformToDto(p)),
          meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      }
    } catch (error) {
      logger.error('Error searching products:', { searchTerm, filter, error });
      throw error;
    }
  }

  async createProduct(data: CreateProductDto, userId: string): Promise<ProductResponseDto> {
    try {
      // Check slug uniqueness
      const slugExists = await productRepository.checkSlugExists(data.slug);
      if (slugExists) {
        throw new AppError('SLUG_ALREADY_EXISTS', 'Product slug already exists', 400);
      }

      // Calculate discount rate
      let discountRate = 0;
      if (data.originalPrice && data.originalPrice > data.price) {
        discountRate = ((data.originalPrice - data.price) / data.originalPrice) * 100;
      }

      // Create product
      const product = await productRepository.create({
        ...data,
        discountRate,
        status: 'draft',
      });

      // Index to OpenSearch asynchronously
      this.indexProductToOpenSearch(product).catch((err) => {
        logger.error('Failed to index product to OpenSearch', { productId: product.id, error: err });
      });

      // Publish event
      await eventPublisher.publishProductCreated({
        productId: product.id,
        sellerId: product.sellerId,
        categoryId: product.categoryId,
        name: product.name,
        price: product.price,
        userId,
      });

      return this.transformToDto(product);
    } catch (error) {
      logger.error('Error creating product:', { data, error });
      throw error;
    }
  }

  async updateProduct(id: string, data: UpdateProductDto, userId: string): Promise<ProductResponseDto> {
    try {
      // Check product exists
      const existingProduct = await productRepository.findById(id);
      if (!existingProduct) {
        throw new AppError('PRODUCT_NOT_FOUND', 'Product not found', 404);
      }

      // Check slug uniqueness if slug is being updated
      if (data.slug && data.slug !== existingProduct.slug) {
        const slugExists = await productRepository.checkSlugExists(data.slug, id);
        if (slugExists) {
          throw new AppError('SLUG_ALREADY_EXISTS', 'Product slug already exists', 400);
        }
      }

      // Calculate discount rate if prices are updated
      if (data.price !== undefined || data.originalPrice !== undefined) {
        const originalPrice = data.originalPrice ?? existingProduct.originalPrice;
        const price = data.price ?? existingProduct.price;

        if (originalPrice && originalPrice > price) {
          data.metadata = {
            ...data.metadata,
            discountRate: ((originalPrice - price) / originalPrice) * 100,
          };
        }
      }

      // Update product
      const updatedProduct = await productRepository.update(id, data);
      if (!updatedProduct) {
        throw new AppError('PRODUCT_UPDATE_FAILED', 'Failed to update product', 500);
      }

      // Invalidate cache
      await redisService.del(`${this.cachePrefix}${id}`);

      // Update OpenSearch index asynchronously
      this.indexProductToOpenSearch(updatedProduct).catch((err) => {
        logger.error('Failed to update product in OpenSearch', { productId: id, error: err });
      });

      // Publish event
      await eventPublisher.publishProductUpdated({
        productId: id,
        sellerId: updatedProduct.sellerId,
        changes: data,
        userId,
      });

      return this.transformToDto(updatedProduct);
    } catch (error) {
      logger.error('Error updating product:', { id, data, error });
      throw error;
    }
  }

  async deleteProduct(id: string, userId: string): Promise<void> {
    try {
      const product = await productRepository.findById(id);
      if (!product) {
        throw new AppError('PRODUCT_NOT_FOUND', 'Product not found', 404);
      }

      await productRepository.delete(id);

      // Invalidate cache
      await redisService.del(`${this.cachePrefix}${id}`);

      // Delete from OpenSearch asynchronously
      opensearchService.deleteProduct(id).catch((err) => {
        logger.error('Failed to delete product from OpenSearch', { productId: id, error: err });
      });

      // Publish event
      await eventPublisher.publishProductDeleted({
        productId: id,
        sellerId: product.sellerId,
        userId,
      });
    } catch (error) {
      logger.error('Error deleting product:', { id, error });
      throw error;
    }
  }

  async updateProductStatus(id: string, status: string, userId: string): Promise<ProductResponseDto> {
    try {
      const product = await productRepository.findById(id);
      if (!product) {
        throw new AppError('PRODUCT_NOT_FOUND', 'Product not found', 404);
      }

      const updatedProduct = await productRepository.update(id, { status });
      if (!updatedProduct) {
        throw new AppError('PRODUCT_UPDATE_FAILED', 'Failed to update product status', 500);
      }

      // Invalidate cache
      await redisService.del(`${this.cachePrefix}${id}`);

      // Update OpenSearch
      await opensearchService.updateProduct(id, { status });

      // Publish event
      await eventPublisher.publishProductStatusChanged({
        productId: id,
        sellerId: product.sellerId,
        oldStatus: product.status,
        newStatus: status,
        userId,
      });

      return this.transformToDto(updatedProduct);
    } catch (error) {
      logger.error('Error updating product status:', { id, status, error });
      throw error;
    }
  }

  private async indexProductToOpenSearch(product: any): Promise<void> {
    const searchData = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      discountRate: product.discountRate,
      categoryId: product.categoryId,
      categoryName: product.category?.name,
      sellerId: product.sellerId,
      status: product.status,
      ratingAvg: product.ratingAvg,
      reviewCount: product.reviewCount,
      salesCount: product.salesCount,
      viewCount: product.viewCount,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    await opensearchService.indexProduct(product.id, searchData);
  }

  private transformToDto(product: any): ProductResponseDto {
    return {
      id: product.id,
      sellerId: product.sellerId,
      categoryId: product.categoryId,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: parseFloat(product.price),
      originalPrice: product.originalPrice ? parseFloat(product.originalPrice) : undefined,
      discountRate: parseFloat(product.discountRate),
      status: product.status,
      stockQuantity: product.stockQuantity,
      ratingAvg: parseFloat(product.ratingAvg),
      reviewCount: product.reviewCount,
      salesCount: product.salesCount,
      viewCount: product.viewCount,
      thumbnail: product.images?.find((img: any) => img.isPrimary)?.thumbnailUrl,
      images: product.images?.map((img: any) => img.imageUrl),
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
          }
        : undefined,
      variants: product.variants,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}

export const productService = new ProductService();
