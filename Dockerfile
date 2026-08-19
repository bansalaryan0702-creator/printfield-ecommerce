FROM node:20-slim

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

RUN npm run build

RUN npm prune --omit=dev

EXPOSE 8080

CMD ["node", "dist/server.cjs"]
