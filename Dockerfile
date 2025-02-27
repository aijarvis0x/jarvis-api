FROM node:20-alpine3.20 AS base

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /app

# First install dependencies (as they change less often)
COPY .gitignore .gitignore
COPY package*.json yarn.lock ./
RUN yarn install

COPY . .
RUN yarn build

# Final stage
FROM base AS runner
WORKDIR /app

# Install pm2
RUN npm install pm2 -g

# Don't run production as root
#RUN addgroup --system --gid 1001 nodejs
#RUN adduser --system --uid 1001 nodejs
#USER nodejs

COPY --from=installer /app .

ENV HOST=0.0.0.0
EXPOSE 3000 3002

CMD ["pm2-runtime", "start", "ecosystem.config.cjs"]
