FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy and build common package first
COPY packages/common ./packages/common
WORKDIR /app/packages/common
RUN npm install && npm run build

# Copy service files
WORKDIR /app/user-service
COPY user-service/package*.json ./
RUN npm install

# Link the built common package
RUN mkdir -p node_modules/@doa-market && \
    ln -s ../../packages/common node_modules/@doa-market/common

# Copy service source
COPY user-service/ ./

# Build service
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy common package
COPY --from=builder /app/packages/common /app/packages/common

# Copy built service and dependencies
COPY --from=builder /app/user-service/package*.json ./
COPY --from=builder /app/user-service/dist ./dist
COPY --from=builder /app/user-service/node_modules ./node_modules

EXPOSE 3002
CMD ["npm", "start"]
