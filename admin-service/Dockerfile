FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy service files
WORKDIR /app/admin-service
COPY admin-service/package*.json ./
RUN npm install

# Copy service source
COPY admin-service/ ./

# Production stage (no build needed for dev mode)
FROM node:20-alpine

WORKDIR /app

# Copy service and dependencies
COPY --from=builder /app/admin-service/package*.json ./
COPY --from=builder /app/admin-service ./
COPY --from=builder /app/admin-service/node_modules ./node_modules

EXPOSE 3014
CMD ["npm", "run", "dev"]
