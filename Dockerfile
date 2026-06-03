# Multi-stage build for smallest possible image
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copy only package files first for better layer caching
COPY package*.json ./

# Install production dependencies only (no dev dependencies)
RUN npm ci --only=production && npm cache clean --force

# Second stage - production image
FROM node:20-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy production dependencies from first stage
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application source
COPY --chown=nodejs:nodejs . .

# Winston writes local development logs here; keep it writable for bind mounts.
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app/logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application with optimal Node.js flags
CMD ["node", "--max-old-space-size=512", "--optimize-for-size", "src/server.js"]
