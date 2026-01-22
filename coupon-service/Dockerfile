FROM node:20-alpine
WORKDIR /app
COPY coupon-service/package*.json ./
RUN npm install
COPY coupon-service/. .
RUN npm run build
EXPOSE 3009
CMD ["npm", "start"]

