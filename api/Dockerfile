FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

EXPOSE 3100

CMD ["npx", "tsx", "src/server.ts"]
