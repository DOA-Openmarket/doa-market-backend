import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DOA Market - Product Service API',
      version: '1.0.0',
      description: '상품 관리 서비스 API 문서',
    },
    servers: [{ url: 'http://localhost:3003', description: 'Development server' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    tags: [
      { name: 'Products', description: '상품 관리 API' },
      { name: 'Categories', description: '카테고리 관리 API' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

