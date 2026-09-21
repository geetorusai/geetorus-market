# AGENTS.md — geetorus-market

## Stack
Next.js + TypeScript + Drizzle ORM + Postgres (Neon/local)

## Structure
  src/app/        → Next.js App Router pages
  src/components/ → React components
  src/lib/        → Utilities and DB client
  src/db/         → Drizzle schema
  drizzle/        → Migration files
  public/         → Static assets

## Key Commands
  npm run dev         # Start dev server (port 3000)
  npm run build       # Production build
  npx drizzle-kit generate   # After schema changes
  npx drizzle-kit push       # Push schema to DB

## Rules
- Use App Router (src/app/) not Pages Router
- Drizzle for all DB queries — no raw SQL
- After schema changes: generate migration → push → typecheck

## Fast Fix Guide
- Route not found → check src/app/ folder structure
- DB error → check drizzle/ migrations are up to date
- Type error → run: npx tsc --noEmit
