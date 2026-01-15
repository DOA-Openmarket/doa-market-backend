import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DOA Market - User Service API',
      version: '1.0.0',
      description: '사용자 관리 서비스 API 문서',
    },
    servers: [{ url: 'http://localhost:3002', description: 'Development server' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    tags: [{ name: 'Users', description: '사용자 관리 API' }],
  },
  // In production, swagger-jsdoc reads from compiled JS files
  apis: process.env.NODE_ENV === 'production'
    ? ['./dist/routes/*.js']
    : ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

