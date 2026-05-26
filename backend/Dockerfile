# Stage 1: Dependency builder
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

# Stage 2: Production runner
FROM node:18-alpine AS runner

WORKDIR /usr/src/app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Create a non-privileged user to run the app safely inside the container
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Copy dependencies and application source
COPY --chown=nodejs:nodejs --from=builder /usr/src/app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

# Grant permissions and switch user
USER nodejs

EXPOSE 5000

CMD ["node", "server.js"]
