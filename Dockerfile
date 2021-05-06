FROM node:alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY --from=development /app/dist ./dist
CMD ["npm", "run", "start:prod"]
