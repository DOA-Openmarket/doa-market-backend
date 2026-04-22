FROM node:20-alpine AS builder

WORKDIR /app/api-gateway

COPY api-gateway/package*.json ./
RUN npm install

COPY api-gateway/ ./

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/api-gateway/package*.json ./
COPY --from=builder /app/api-gateway/dist ./dist
COPY --from=builder /app/api-gateway/node_modules ./node_modules

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["npm", "start"]
