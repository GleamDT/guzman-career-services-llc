# Stack Audit — Guzman Career Services

Written as part of Phase 0 of the governing PRD (`instructions.md`). Reflects the actual state of the codebase, verified by reading the code — not assumed from the PRD, which turned out to be wrong about the payment processor (see below).

## Overview

Monorepo. `guzman-career-services/` holds both the React frontend and the Express backend (`guzman-career-services/backend/`). It deploys as a **single Railway service**: the Express server serves the built React app as static files *and* every `/api/*` route from one process. There is no separate frontend host.

## Frontend

- **Framework**: React 19, built with Create React App (`react-scripts` 5.0.1).
- **Routing**: `react-router-dom` v7.
- **Language**: plain JavaScript, no TypeScript.
- **Testing**: Jest, via `react-scripts test` (CRA default). Two compatibility gaps had to be worked around to get a real test running (see "Testing notes" below) — worth knowing before writing more frontend tests.
- **Linting**: ESLint via CRA's default `"react-app"` / `"react-app/jest"` presets (`eslintConfig` in `package.json`). An explicit `"lint"` script (`eslint src --ext .js,.jsx --max-warnings=0`) was added in Phase 0; the codebase was already clean under it.
- **Build output**: `guzman-career-services/build/` (static bundle), produced by `npm run build`.

### Testing notes (react-router v7 + CRA's Jest)

CRA 5 ships an old Jest (27.5.1) whose module resolver doesn't understand modern package `"exports"` maps. `react-router-dom` v7's published `"main"` field points at a file that doesn't actually exist in the package (`dist/main.js`) — it only ships `dist/index.js`/`dist/index.mjs` — so any test that imports `react-router-dom`, or imports a component that imports it, fails with `Cannot find module` unless worked around. Fixed via a `moduleNameMapper` in the frontend `package.json`'s `"jest"` block, redirecting `react-router-dom` and the `react-router/dom` subpath to their real CJS build files. Separately, `react-router` v7's internals expect `TextEncoder`/`TextDecoder` to be global, which jsdom's test environment doesn't provide — polyfilled in `src/setupTests.js` from Node's own `util` module.

A third, unrelated gap: `react-pdf` (used by `ClientDashboard.js` for resume previews) ships an ESM-only build that Jest's default config can't parse, since `node_modules` isn't transformed by default. Rendering the full `<App />` tree in a test hits this immediately, because `App.js` imports every route's component (including `ClientDashboard`) up front regardless of which route is active. **Workaround in place**: the Phase 0 smoke test (`src/components/Header.test.js`) renders `<Header />` directly instead of the full app, since `Header`'s import chain doesn't touch `react-pdf`. Testing anything that transitively imports `ClientDashboard` or `AdminDashboard` will need `react-pdf`/`jspdf` addressed first (a `transformIgnorePatterns` override, most likely) — not solved in Phase 0, flagged here as a known gap.

## Backend

- **Framework**: Node.js + Express, entirely in one file, `backend/server.js` (~1500 lines). No router/controller/service split.
- **Language**: plain JavaScript, no TypeScript. No `engines` field pinning a Node version anywhere yet — this environment runs Node 22.21.0; confirm this matches what Railway's Nixpacks build actually resolves to before assuming CI should pin the same.
- **Database**: PostgreSQL, via the raw `pg` driver (`backend/db.js`). No ORM or query builder.
- **Schema management**: `node-pg-migrate`, added in Phase 0 (`backend/migrations/`, `npm run migrate`). Previously, schema evolved via `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements embedded directly in `server.js` and executed as a side effect of the module loading — i.e. the app "self-migrated" on every boot. A baseline migration (`backend/migrations/*_baseline.sql`) captures that entire pre-existing schema idempotently, so adopting the tool didn't require touching the live databases' data — the inline DDL blocks have been removed from `server.js` now that the migration owns this.
- **Auth**: custom JWT (`jsonwebtoken`) + `bcryptjs` password hashing. No third-party auth provider (no Auth0/Clerk/Passport).
- **File storage**: Cloudinary, via a wrapper module `backend/r2.js`. The filename is a legacy holdover from an earlier design that used Cloudflare R2 — it now wraps Cloudinary end to end; nothing R2-related remains.
- **Testing**: Jest, added in Phase 0. Two pure, stateless helpers (`getFileExt`, `parseDeviceInfo`) were extracted out of `server.js` into `backend/lib/helpers.js` specifically so they're unit-testable without needing a live database — `server.js` itself makes real DB calls and registers routes at module-load time, which is out of scope for a minimal test gate.
- **Linting**: none yet. Phase 0 uses `node --check server.js` as a syntax-only CI gate rather than introducing an ESLint policy for a previously-unlinted 1500-line file — a deliberate, lighter-touch choice; a real backend lint config is a reasonable fast-follow, not solved here.
- **Health check**: `GET /health` (added in Phase 0), checks real Postgres connectivity (`SELECT 1` via the shared pool) rather than bare liveness — returns `200 {status:"ok", db:"ok"}` or `503 {status:"error", db:"unreachable"}`. Registered before the SPA catch-all route so it isn't swallowed by it.

## Payments — Stripe

**The governing PRD assumes an existing Paystack integration. That's incorrect — confirmed with the owner as a PRD drafting error.** The real, working payment integration throughout this codebase is **Stripe**. Every later phase that references "the existing Paystack integration" should be read as referring to Stripe.

Integration points, all in `backend/server.js`:
- Stripe SDK initialized once at the top of the file: `stripe(process.env.STRIPE_SECRET_KEY)`.
- `POST /api/webhooks/stripe` — raw-body webhook handler, verifies `STRIPE_WEBHOOK_SECRET`, handles `checkout.session.completed`, marks the matching invoice `Paid` and logs the activity.
- `POST /api/invoices/:id/checkout` — creates a Stripe Checkout session for an invoice (`stripe.checkout.sessions.create`).
- `POST /api/payments/verify` — client-side fallback that verifies a completed session (`stripe.checkout.sessions.retrieve`) and marks the invoice paid if the webhook didn't already.
- Related read routes: `GET /api/invoices`, `GET /api/clients/:clientId/invoices`, `GET /api/clients/me/invoices`, `PATCH /api/invoices/:id/mark-paid` (manual admin override), `DELETE /api/invoices/:id`.

Env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `REACT_APP_STRIPE_PUBLISHABLE_KEY` (frontend, baked in at build time — Create React App inlines `REACT_APP_*` vars into the static bundle, so this must be set before the build runs, not just before the server starts).

## Email / Notifications — Resend

`backend/server.js` initializes a `Resend` client and sends transactional email (portal notifications, staff welcome emails, admin notifications on new intake/contact submissions) via `sendPortalNotification` and similar helpers. Env vars: `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL` (recipient for admin-facing notifications — defaults to the real support inbox if unset, overridable so staging doesn't email production's inbox).

## Hosting / Deploy

- Single Railway project, two environments:
  - **production** — `main` branch, `guzmancareerservices.com`
  - **staging** — `staging` branch, `stagingportal.guzmancareerservices.com`
  - Each has its own Postgres and its own Stripe keys (staging uses Stripe **test-mode** keys and a test-mode webhook).
- Root `package.json`:
  - `"build"`: installs and builds the frontend, then installs backend dependencies.
  - `"start"`: runs `backend/server.js`, which serves the built SPA (`express.static` + a catch-all `sendFile`) and all API routes from one process.
- No `railway.json` / `nixpacks.toml` / `Procfile` — Railway builds via its own Nixpacks auto-detection, configured through the dashboard rather than in-repo config.
- **Git hygiene** (done prior to Phase 0's CI/CD work, referenced here for context): `staging` branch, GitHub branch protection on `main` (PR required, applies to admins too), and a local `pre-push` git hook (`.githooks/pre-push`, auto-installed via a root `package.json` "prepare" script) blocking direct pushes to `main` with an `ALLOW_MAIN_PUSH=1` override.

## CI/CD

Two GitHub Actions workflows (`.github/workflows/staging.yml`, `.github/workflows/production.yml`) — install, lint, test, and build both the backend and frontend, then trigger the actual Railway deploy themselves via the Railway API/CLI. Railway's own "Deploy on Push" is turned off on both services specifically so that a failing check genuinely blocks a deploy, rather than racing an already-triggered one. See the workflow files themselves for the exact step order; the production workflow also runs `node-pg-migrate up` and polls `/health` post-deploy before considering the deploy successful.

## Known Gaps (as of Phase 0)

- No automated tests existed before Phase 0; coverage now is intentionally minimal (a handful of backend helper unit tests, one frontend smoke test) — a demonstration that the CI gate works, not a real test suite.
- No backend ESLint config — `node --check` is a syntax gate only, not a style/quality one.
- Frontend testing is currently blocked, for anything touching `ClientDashboard`/`AdminDashboard`, by `react-pdf`'s ESM-only build (see "Testing notes" above) — unresolved.
- Node version isn't pinned anywhere (no `engines` field) — CI assumes a version that should be checked against Railway's actual resolved version, not assumed to match.
