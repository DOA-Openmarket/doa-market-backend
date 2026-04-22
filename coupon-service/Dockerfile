FROM node:20-alpine AS builder

WORKDIR /app/coupon-service

COPY coupon-service/package*.json ./
RUN npm install

COPY coupon-service/ ./

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/coupon-service/package*.json ./
COPY --from=builder /app/coupon-service/dist ./dist
COPY --from=builder /app/coupon-service/node_modules ./node_modules

EXPOSE 3009

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3009/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["npm", "start"]
