import { Client } from '@opensearch-project/opensearch';
import { logger } from '@utils/logger';

const opensearchConfig = {
  node: process.env.OPENSEARCH_NODE || 'https://localhost:9200',
  auth: {
    username: process.env.OPENSEARCH_USERNAME || 'admin',
    password: process.env.OPENSEARCH_PASSWORD || 'admin',
  },
  ssl: {
    rejectUnauthorized: false,
  },
};

export const opensearchClient = new Client(opensearchConfig);

const INDEX_PREFIX = process.env.OPENSEARCH_INDEX_PREFIX || 'doa-market';

export const INDICES = {
  PRODUCTS: `${INDEX_PREFIX}-products`,
  CATEGORIES: `${INDEX_PREFIX}-categories`,
};

export const initializeOpenSearch = async (): Promise<void> => {
  // Check if OpenSearch is enabled
  const opensearchEnabled = process.env.OPENSEARCH_ENABLED !== 'false';

  if (!opensearchEnabled) {
    logger.warn('OpenSearch is disabled. Skipping initialization.');
    return;
  }

  try {
    // Check cluster health
    const health = await opensearchClient.cluster.health();
    logger.info('OpenSearch cluster health:', health.body);

    // Create products index if not exists
    const productsIndexExists = await opensearchClient.indices.exists({
      index: INDICES.PRODUCTS,
    });

    if (!productsIndexExists.body) {
      await opensearchClient.indices.create({
        index: INDICES.PRODUCTS,
        body: {
          settings: {
            number_of_shards: 3,
            number_of_replicas: 2,
            analysis: {
              analyzer: {
                korean_analyzer: {
                  type: 'custom',
                  tokenizer: 'nori_tokenizer',
                  filter: ['lowercase', 'nori_part_of_speech'],
                },
              },
            },
          },
          mappings: {
            properties: {
              id: { type: 'keyword' },
              name: {
                type: 'text',
                analyzer: 'korean_analyzer',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              slug: { type: 'keyword' },
              description: {
                type: 'text',
                analyzer: 'korean_analyzer',
              },
              price: { type: 'double' },
              originalPrice: { type: 'double' },
              discountRate: { type: 'float' },
              categoryId: { type: 'keyword' },
              categoryName: {
                type: 'text',
                analyzer: 'korean_analyzer',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              sellerId: { type: 'keyword' },
              sellerName: {
                type: 'text',
                analyzer: 'korean_analyzer',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              status: { type: 'keyword' },
              ratingAvg: { type: 'float' },
              reviewCount: { type: 'integer' },
              salesCount: { type: 'integer' },
              viewCount: { type: 'integer' },
              tags: { type: 'keyword' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' },
            },
          },
        },
      });
      logger.info(`OpenSearch index created: ${INDICES.PRODUCTS}`);
    }

    logger.info('OpenSearch initialized successfully');
  } catch (error) {
    logger.warn('OpenSearch initialization failed (continuing without OpenSearch):', error);
    // Don't throw error, just continue without OpenSearch
  }
};

export class OpenSearchService {
  async indexProduct(productId: string, productData: any): Promise<void> {
    try {
      await opensearchClient.index({
        index: INDICES.PRODUCTS,
        id: productId,
        body: productData,
        refresh: true,
      });
      logger.debug('Product indexed in OpenSearch:', { productId });
    } catch (error) {
      logger.error('OpenSearch indexing error:', { productId, error });
      throw error;
    }
  }

  async updateProduct(productId: string, productData: any): Promise<void> {
    try {
      await opensearchClient.update({
        index: INDICES.PRODUCTS,
        id: productId,
        body: {
          doc: productData,
        },
        refresh: true,
      });
      logger.debug('Product updated in OpenSearch:', { productId });
    } catch (error) {
      logger.error('OpenSearch update error:', { productId, error });
      throw error;
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    try {
      await opensearchClient.delete({
        index: INDICES.PRODUCTS,
        id: productId,
        refresh: true,
      });
      logger.debug('Product deleted from OpenSearch:', { productId });
    } catch (error) {
      logger.error('OpenSearch delete error:', { productId, error });
    }
  }

  async searchProducts(query: any): Promise<any> {
    try {
      const response = await opensearchClient.search({
        index: INDICES.PRODUCTS,
        body: query,
      });
      return response.body;
    } catch (error) {
      logger.error('OpenSearch search error:', { query, error });
      throw error;
    }
  }
}

export const opensearchService = new OpenSearchService();
