FROM node:alpine AS development
ENV NODE_OPTIONS=--max_old_space_size=2048
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM node:alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --production --ignore-scripts
COPY --from=development /app/dist ./dist
CMD ["npm", "run", "start:prod"]
