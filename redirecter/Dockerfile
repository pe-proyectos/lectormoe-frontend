FROM oven/bun:latest

WORKDIR /app

COPY index.ts .
COPY package.json .

RUN bun install

EXPOSE 3001

CMD ["bun", "run", "index.ts"]

