FROM oven/bun:latest as base
WORKDIR /app

FROM base AS install
USER root

COPY ./package.json ./bun.lockb ./astro.config.mjs ./postcss.config.js ./tailwind.config.js ./tsconfig.json ./
COPY ./src ./src
COPY ./public ./public

# Install dependencies
RUN bun install
RUN bun run build

FROM base AS release
USER root

COPY --from=install /app/ .

EXPOSE 4321/tcp
ENTRYPOINT [ "bun", "dist/server/entry.mjs" ]
