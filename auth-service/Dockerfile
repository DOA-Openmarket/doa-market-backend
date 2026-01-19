FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy service files
WORKDIR /app/auth-service
COPY auth-service/package*.json ./
RUN npm install

# Copy service source
COPY auth-service/ ./

# Build service
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built service and dependencies
COPY --from=builder /app/auth-service/package*.json ./
COPY --from=builder /app/auth-service/dist ./dist
COPY --from=builder /app/auth-service/node_modules ./node_modules

EXPOSE 3001
CMD ["npm", "start"]
