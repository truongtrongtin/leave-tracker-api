FROM node:20-alpine AS development
# ENV NODE_OPTIONS=--max_old_space_size=2048
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm pkg delete scripts.prepare
RUN npm ci --omit=dev
COPY --from=development /app/dist ./dist
CMD ["node", "dist/main"]
