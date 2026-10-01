FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./

# Development: all dependencies, nodemon (source is bind-mounted by docker-compose.yml)
FROM base AS dev
ENV NODE_ENV=development
RUN npm ci --legacy-peer-deps
COPY . .
EXPOSE 5000
CMD ["npm", "run", "start:dev"]

# Production: runtime dependencies only, non-root user
FROM base AS prod
ENV NODE_ENV=production
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force
COPY --chown=node:node . .
RUN mkdir -p uploads && chown node:node uploads
USER node
EXPOSE 5000
CMD ["npm", "start"]
