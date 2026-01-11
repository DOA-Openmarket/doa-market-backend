import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DOA Market - Payment Service API',
      version: '1.0.0',
      description: '결제 처리 서비스 API 문서',
    },
    servers: [{ url: 'http://localhost:3005', description: 'Development server' }],
    tags: [{ name: 'Payments', description: '결제 관리 API' }],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

