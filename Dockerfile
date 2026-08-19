FROM node:20-slim

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

RUN npm prune --omit=dev

EXPOSE 8080

CMD ["node", "dist/server.cjs"]
