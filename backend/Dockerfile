# Dependencies stage
FROM node:16-alpine AS dependencies

RUN apk add --no-cache libc6-compat
WORKDIR /home/node/app

COPY package.json package-lock.json ./

RUN npm ci

# Build stage
FROM node:16-alpine AS build

WORKDIR /home/node/app
COPY package.json package-lock.json tsconfig.json ./
COPY prisma/ ./prisma
COPY src/ ./src
COPY --from=dependencies /home/node/app/node_modules ./node_modules

ENV NODE_ENV production

COPY .env ./.env

RUN npm run prisma:generate
RUN npm run build
RUN npm ci --production

# Start stage
FROM node:16-alpine AS run
WORKDIR /home/node/app

ENV NODE_ENV production

COPY .env ./.env

COPY --from=build /home/node/app/prisma/ ./prisma
COPY --from=build /home/node/app/dist ./dist/
COPY --from=build /home/node/app/node_modules ./node_modules/
COPY --from=build /home/node/app/package.json ./package.json

RUN npm run prisma:generate

USER node

EXPOSE 1337

CMD ["npm", "start"]
