FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy service files
WORKDIR /app/search-service
COPY search-service/package*.json ./
RUN npm install

# Copy service source
COPY search-service/ ./

# Production stage (no build needed for dev mode)
FROM node:20-alpine

WORKDIR /app

# Copy service and dependencies
COPY --from=builder /app/search-service/package*.json ./
COPY --from=builder /app/search-service ./
COPY --from=builder /app/search-service/node_modules ./node_modules

EXPOSE 3009
CMD ["npm", "run", "dev"]
