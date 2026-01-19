FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy service files
WORKDIR /app/order-service
COPY order-service/package*.json ./
RUN npm install

# Copy service source
COPY order-service/ ./

# Build service
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built service and dependencies
COPY --from=builder /app/order-service/package*.json ./
COPY --from=builder /app/order-service/dist ./dist
COPY --from=builder /app/order-service/node_modules ./node_modules

EXPOSE 3003
CMD ["npm", "start"]
