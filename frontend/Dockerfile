FROM oven/bun:1 AS builder

WORKDIR /app

# Copy dependency definitions
COPY package.json bun.lock ./

# Install dependencies based on lockfile
RUN bun install --frozen-lockfile

# Copy the source code
COPY . .

# Build the Next.js application
RUN bun run build

# Start a new lightweight stage
FROM oven/bun:1-slim

WORKDIR /app

# Copy built app and dependencies from builder stage
COPY --from=builder /app /app

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "run", "start"]
