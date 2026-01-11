import { Client } from '@opensearch-project/opensearch';
import { logger } from '../utils/logger';

const OPENSEARCH_NODE = process.env.OPENSEARCH_NODE || 'http://localhost:9200';

export const opensearchClient = new Client({
  node: OPENSEARCH_NODE,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const PRODUCTS_INDEX = 'products';

export interface ProductDocument {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  sellerId: string;
  stock: number;
  imageUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const createProductsIndex = async (): Promise<void> => {
  try {
    const indexExists = await opensearchClient.indices.exists({
      index: PRODUCTS_INDEX,
    });

    if (indexExists.body) {
      logger.info(`Index ${PRODUCTS_INDEX} already exists`);
      return;
    }

    await opensearchClient.indices.create({
      index: PRODUCTS_INDEX,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          analysis: {
            analyzer: {
              korean_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'trim'],
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
            description: {
              type: 'text',
              analyzer: 'korean_analyzer',
            },
            price: { type: 'float' },
            categoryId: { type: 'keyword' },
            sellerId: { type: 'keyword' },
            stock: { type: 'integer' },
            imageUrl: { type: 'keyword' },
            status: { type: 'keyword' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' },
          },
        },
      },
    });

    logger.info(`Created index: ${PRODUCTS_INDEX}`);
  } catch (error) {
    logger.error('Failed to create index:', error);
    throw error;
  }
};

export const indexProduct = async (product: ProductDocument): Promise<void> => {
  try {
    await opensearchClient.index({
      index: PRODUCTS_INDEX,
      id: product.id,
      body: product,
      refresh: true,
    });

    logger.info(`Indexed product: ${product.id}`);
  } catch (error) {
    logger.error(`Failed to index product ${product.id}:`, error);
    throw error;
  }
};

export const updateProduct = async (productId: string, updates: Partial<ProductDocument>): Promise<void> => {
  try {
    await opensearchClient.update({
      index: PRODUCTS_INDEX,
      id: productId,
      body: {
        doc: updates,
      },
      refresh: true,
    });

    logger.info(`Updated product: ${productId}`);
  } catch (error) {
    logger.error(`Failed to update product ${productId}:`, error);
    throw error;
  }
};

export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    await opensearchClient.delete({
      index: PRODUCTS_INDEX,
      id: productId,
      refresh: true,
    });

    logger.info(`Deleted product: ${productId}`);
  } catch (error) {
    logger.error(`Failed to delete product ${productId}:`, error);
    throw error;
  }
};

export const searchProducts = async (query: string, options: {
  from?: number;
  size?: number;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest';
}) => {
  const {
    from = 0,
    size = 20,
    categoryId,
    minPrice,
    maxPrice,
    sortBy = 'relevance',
  } = options;

  const must: any[] = [
    { term: { status: 'active' } },
  ];

  if (query && query.trim()) {
    must.push({
      multi_match: {
        query: query.trim(),
        fields: ['name^3', 'description'],
        type: 'best_fields',
        fuzziness: 'AUTO',
      },
    });
  }

  const filter: any[] = [];

  if (categoryId) {
    filter.push({ term: { categoryId } });
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    const range: any = {};
    if (minPrice !== undefined) range.gte = minPrice;
    if (maxPrice !== undefined) range.lte = maxPrice;
    filter.push({ range: { price: range } });
  }

  const sort: any[] = [];
  switch (sortBy) {
    case 'price_asc':
      sort.push({ price: 'asc' });
      break;
    case 'price_desc':
      sort.push({ price: 'desc' });
      break;
    case 'newest':
      sort.push({ createdAt: 'desc' });
      break;
    default:
      if (query && query.trim()) {
        sort.push('_score');
      } else {
        sort.push({ createdAt: 'desc' });
      }
  }

  try {
    const response = await opensearchClient.search({
      index: PRODUCTS_INDEX,
      body: {
        from,
        size,
        query: {
          bool: {
            must,
            filter: filter.length > 0 ? filter : undefined,
          },
        },
        sort,
      },
    });

    return {
      total: response.body.hits.total.value,
      products: response.body.hits.hits.map((hit: any) => ({
        ...hit._source,
        score: hit._score,
      })),
    };
  } catch (error) {
    logger.error('Search error:', error);
    throw error;
  }
};

export const autocomplete = async (query: string, limit: number = 10) => {
  if (!query || !query.trim()) {
    return [];
  }

  try {
    const response = await opensearchClient.search({
      index: PRODUCTS_INDEX,
      body: {
        size: limit,
        query: {
          bool: {
            must: [
              { term: { status: 'active' } },
              {
                match_phrase_prefix: {
                  name: {
                    query: query.trim(),
                  },
                },
              },
            ],
          },
        },
        _source: ['id', 'name', 'price', 'imageUrl'],
      },
    });

    return response.body.hits.hits.map((hit: any) => hit._source);
  } catch (error) {
    logger.error('Autocomplete error:', error);
    throw error;
  }
};
