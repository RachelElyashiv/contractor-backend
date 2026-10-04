# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

# The build needs the Nest CLI and TypeScript, which are devDependencies.
# Installing with --only=production here meant `nest build` was never on PATH
# and the image could not be built at all.
RUN npm ci

COPY . .

RUN npm run build

# Drop the build tooling again so the runtime image stays small
RUN npm prune --omit=dev && npm cache clean --force

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create uploads directory
RUN mkdir -p uploads && \
    chown -R nodejs:nodejs uploads

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --chown=nodejs:nodejs package*.json ./

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/v1', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
