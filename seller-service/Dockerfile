FROM node:20-alpine
WORKDIR /app
COPY seller-service/package*.json ./
RUN npm install
COPY seller-service/. .
RUN npm run build
EXPOSE 3007
CMD ["npm", "start"]

