# Redirecter

Simple redirect service that redirects subdomains to the main domain with the correct path structure.

## Usage

```bash
# Install dependencies
bun install

# Run locally
bun run dev

# Or run in production
bun run start
```

## Docker

```bash
# Build
docker build -t redirecter .

# Run
docker run -p 3001:3001 redirecter
```

## Environment Variables

- `PORT` - Server port (default: 3001)

