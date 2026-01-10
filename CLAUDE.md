# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LectorMoe is a multi-tenant manga/scanlation platform frontend built with Astro 5, React 18, and Bun. It serves both a global landing page and organization-specific (scan) pages with distinct routing patterns.

## Setup

No special setup required beyond running `bun install`.

## Commands

```bash
# Development
bun install          # Install dependencies (uses workspace for shared deps)
bun run dev          # Start dev server at localhost:4321

# Production
bun run build        # Build to ./dist/
bun run start        # Run production server
bun run preview      # Same as start

# Linting
bun run lint         # Run Biome linter with auto-fix
bun run lint:ls      # Run ls-lint for file naming

# Docker
docker-compose up    # Build and run with Docker
```

## Architecture

### Multi-Tenant Routing Pattern

The app uses a slug-based multi-tenant system where URLs follow `/{organizationSlug}/...` pattern:

- `/` - Global landing page (no organization context)
- `/login`, `/register`, `/search` - Global routes (reserved)
- `/{slug}` - Organization landing page (e.g., `/senshimanga`)
- `/{slug}/manga/{mangaSlug}` - Manga detail page within organization
- `/{slug}/admin/*` - Organization admin panel

Reserved routes that don't match organization slugs: `logout`, `404`, `500`, `forgot-password`, `login`, `register`, `search`, `scans`, `subscriptions`, `organizations`, `profile`, `settings`

### Middleware (`src/middleware/index.ts`)

Central middleware handles:
- Organization resolution from URL slug
- Authentication via token cookie and `/api/auth/check`
- Setting `Astro.locals` with `organization`, `user`, `logged`, `token`, `callAPI`, `isLandingPage`
- Country-based access control (blocked/allowed countries)
- Admin route protection

### API Calls

Two `callAPI` implementations exist:

1. **Server-side** (`src/middleware/index.ts`): Used in Astro pages
   - Includes `x-organization` header automatically
   - Available as `Astro.locals.callAPI`

2. **Client-side** (`src/util/callApi.ts`): For React components
   - Reads organization from cookies/URL
   - Import: `import { callAPI } from '@/util/callApi';`

Both call `PUBLIC_API_URL` environment variable. API responses follow `{ status: boolean, data: any }` pattern.

### Component Structure

```
src/components/
├── admin/           # Admin panel components (React TSX)
│   ├── Admin*.tsx   # Feature components (Dashboard, Settings, Users, etc.)
│   └── ui/          # Reusable UI primitives (Button, Modal, Table, etc.)
├── landing/         # Public-facing pages (React TSX)
│   ├── *Page.tsx    # Full page components
│   ├── *Container.tsx  # Page wrappers that handle data fetching
│   └── Scan*.tsx    # Organization-specific components
└── *.jsx            # Shared components (Reader, MangaCard, etc.)
```

### Layouts

- `LandingLayout.astro` - Public pages with SEO meta tags, ads support
- `AdminLayout.astro` - Admin panel with sidebar and navbar
- `Layout.astro` - Base layout

### i18n

Translations in `src/translations/{en,es}.ts`. Use `getTranslator(language)` from `src/util/translate.ts`.

### Styling

- Tailwind CSS with DaisyUI components
- Dark theme default (zinc color palette)
- Custom scrollbar styles defined in layouts
- MUI components for admin panel forms

### Path Aliases

```typescript
"@/*": ["./src/*"]
"@api/*": ["./lectormoe-api/src/*"]  // External API types
```

## Key Files

- `astro.config.mjs` - Astro config with Bun adapter, React, Tailwind
- `biome.json` - Linter/formatter config (single quotes, no trailing commas, semicolons as needed)
- `.commitlintrc.json` - Conventional commits enforced

## Environment Variables

- `PUBLIC_API_URL` - Backend API base URL (required)

## Conventions

- Commit messages follow conventional commits (`feat:`, `fix:`, etc.)
- React components use `.tsx` in admin/landing, `.jsx` for shared components
- Biome enforces single quotes, no trailing commas, arrow function parentheses
