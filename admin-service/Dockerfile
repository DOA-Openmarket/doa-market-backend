FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy service files
WORKDIR /app/admin-service
COPY admin-service/package*.json ./
RUN npm install

# Copy service source
COPY admin-service/ ./

# Build the service
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built service and dependencies
COPY --from=builder /app/admin-service/package*.json ./
COPY --from=builder /app/admin-service/dist ./dist
COPY --from=builder /app/admin-service/node_modules ./node_modules

EXPOSE 3012
CMD ["npm", "start"]
