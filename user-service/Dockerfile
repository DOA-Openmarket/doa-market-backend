FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy service files
WORKDIR /app/user-service
COPY user-service/package*.json ./
RUN npm install

# Copy service source
COPY user-service/ ./

# Build service
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built service and dependencies
COPY --from=builder /app/user-service/package*.json ./
COPY --from=builder /app/user-service/dist ./dist
COPY --from=builder /app/user-service/node_modules ./node_modules

EXPOSE 3002
CMD ["npm", "start"]
