FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy service files
WORKDIR /app/api-gateway
COPY api-gateway/package*.json ./
RUN npm install

# Copy service source
COPY api-gateway/ ./

# Build service
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built service and dependencies
COPY --from=builder /app/api-gateway/package*.json ./
COPY --from=builder /app/api-gateway/dist ./dist
COPY --from=builder /app/api-gateway/node_modules ./node_modules

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["npm", "start"]
