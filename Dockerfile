FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY dist/ dist/

EXPOSE 8080

CMD ["node", "dist/server.cjs"]
