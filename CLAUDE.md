# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev       # Start development server (localhost:3000)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

No test framework is configured in this project.

## Architecture

This is a Next.js App Router application using route groups:
- `app/(auth)/` — Unauthenticated routes (login page)
- `app/(main)/` — Protected routes; layout wraps pages with header and sidebar

**Authentication** uses NextAuth v5 (beta) with Microsoft Entra ID. The `auth()` server function gates protected layouts. The access token is injected into API requests via `lib/api-client.ts`, which is a thin wrapper around `fetch` that adds the `Authorization` header automatically.

**Data fetching** uses TanStack React Query. Custom hooks in `hooks/` (e.g., `useBugReports.ts`, `useIncidents.ts`) encapsulate query/mutation logic and expose typed data. The `QueryProvider` is set up in `components/providers/QueryProvider.tsx`.

**State management** uses Zustand. There are three stores:
- `store/useAppStore.ts` — Global UI state (sidebar open/closed, notifications)
- `store/useBugReportStore.ts` — Bug report view/filter state
- `store/useIncidentStore.ts` — Incident view/filter state

**Validation** uses Zod. Schemas live in `schemas/index.ts` and types are derived via `z.infer<>`.

**UI components** are shadcn/ui (Radix UI) in `components/ui/`. Add new ones with the shadcn CLI: `npx shadcn@latest add <component>`. Feature components are organized by domain: `components/bug-report/`, `components/incident/`, `components/layout/`.

**Styling** uses Tailwind CSS v4 with CSS variables. Each feature area also has a scoped `.css` file (e.g., `bug-report.css`, `incident-tracking.css`). Global styles are in `app/globals.css`.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:
- `AUTH_SECRET` — 32-byte base64 secret for session signing
- `AUTH_MICROSOFT_ENTRA_ID_ID` / `_SECRET` / `_TENANT_ID` — Azure app registration credentials
- `NEXTAUTH_URL` — App URL (`http://localhost:3000` for dev)
- `NEXT_PUBLIC_API_BASE_URL` — Backend API base URL
- `AUTH_TRUST_HOST=true` — Required when deployed behind a reverse proxy (e.g., Azure Container Apps)

## Deployment

`next.config.ts` uses `output: "standalone"` for Docker. A `Dockerfile` and `deploy.sh` are present for containerized deployment.

## Path Alias

`@/*` maps to the project root (configured in `tsconfig.json`).
