import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DOA Market - Shipping Service API',
      version: '1.0.0',
      description: '배송 관리 서비스 API 문서',
    },
    servers: [{ url: 'http://localhost:3006', description: 'Development server' }],
    tags: [{ name: 'Shippings', description: '배송 관리 API' }],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

