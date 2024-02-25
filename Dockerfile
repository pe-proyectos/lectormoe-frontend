FROM oven/bun:canary-debian as base
WORKDIR /app

FROM base AS install
USER root

COPY ./package.json ./bun.lockb ./astro.config.mjs ./postcss.config.js ./tailwind.config.js ./tsconfig.json ./
COPY ./src ./src
COPY ./public ./public

# Install dependencies
RUN bun install

FROM base AS release
USER root

COPY --from=install /app/ .
RUN bunx --bun astro build

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
# CMD bunx astro dev
CMD bunx --bun astro preview
