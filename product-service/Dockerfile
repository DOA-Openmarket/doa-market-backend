FROM node:20-alpine AS builder

WORKDIR /app/product-service

COPY product-service/package*.json ./
RUN npm install

COPY product-service/ ./

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/product-service/package*.json ./
COPY --from=builder /app/product-service/dist ./dist
COPY --from=builder /app/product-service/node_modules ./node_modules

EXPOSE 3003
CMD ["npm", "start"]
