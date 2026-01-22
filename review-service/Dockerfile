FROM node:20-alpine
WORKDIR /app
COPY review-service/package*.json ./
RUN npm install
COPY review-service/. .
RUN npm run build
EXPOSE 3012
CMD ["npm", "start"]

