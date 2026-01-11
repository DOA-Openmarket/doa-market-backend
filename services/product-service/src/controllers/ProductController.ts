import { Response, NextFunction } from 'express';
import { productService } from '@services/ProductService';
import { AuthRequest } from '@/types';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from '@dto/product.dto';
import { logger } from '@utils/logger';

export class ProductController {
  async getProducts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as ProductQueryDto;
      const result = await productService.getProducts(query);

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);

      res.json({
        success: true,
        data: product,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductBySlug(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const product = await productService.getProductBySlug(slug);

      res.json({
        success: true,
        data: product,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: CreateProductDto = req.body;
      const userId = req.user!.userId;

      // If seller, ensure they can only create products for themselves
      if (req.user!.role === 'seller') {
        data.sellerId = req.user!.sellerId!;
      }

      const product = await productService.createProduct(data, userId);

      res.status(201).json({
        success: true,
        data: product,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data: UpdateProductDto = req.body;
      const userId = req.user!.userId;

      const product = await productService.updateProduct(id, data, userId);

      res.json({
        success: true,
        data: product,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      await productService.deleteProduct(id, userId);

      res.json({
        success: true,
        data: { message: 'Product deleted successfully' },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProductStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user!.userId;

      const product = await productService.updateProductStatus(id, status, userId);

      res.json({
        success: true,
        data: product,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async searchProducts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as ProductQueryDto;

      if (!query.search) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_SEARCH_TERM',
            message: 'Search term is required',
          },
          timestamp: new Date().toISOString(),
        });
      }

      const result = await productService.getProducts(query);

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const productController = new ProductController();
