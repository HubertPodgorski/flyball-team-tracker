# Flyball Team Tracker

Team/dog-club management app: tasks, dogs, events, event templates, calendar — scoped per team, real-time via Socket.IO.

## Stack

- **Frontend** (`frontend/`): React 19 (Vite, mixed JS/TSX) with the React Compiler enabled (auto-memoization, no manual `useMemo`/`useCallback`), MUI v9, `@hello-pangea/dnd`, socket.io-client, TanStack Form, TanStack Router (file-based, routes under `frontend/src/routes/`).
- **Backend** (`api/`): Express + Socket.IO, MongoDB via Mongoose, JWT auth (`jsonwebtoken` + `bcrypt`).
- Package manager: **Yarn**. `frontend/` and `api/` are independent packages (own `yarn.lock` each, no shared workspace) — kept deliberately separate since Heroku and Vercel each deploy one of them in isolation. The root `package.json` just wires up convenience scripts (see Setup/Running below); it doesn't merge them into one dependency tree.

## Prerequisites

- Node.js 24+ (see `engines.node` in `frontend/package.json`)
- Yarn 4 (Berry), pinned per-package via the `packageManager` field + Corepack. Run `corepack enable` once (Windows: needs an elevated terminal, or install shims to a user-writable dir — see below) so plain `yarn` resolves to the pinned version instead of a stray global Yarn Classic install.
- A MongoDB connection string — either a local `mongod`, or an Atlas cluster (get the URL from whoever manages the shared Atlas project if you're joining an existing team).

## Repo layout

```
frontend/   Vite app
api/        Express + Socket.IO API
e2e/        Playwright end-to-end tests (see below)
```

## Setup

```bash
yarn
```

Run once at the repo root — its `postinstall` cds into `api/`, `frontend/` and `e2e/` and installs each. You still get independent `node_modules`/`yarn.lock` pairs underneath, just without having to run the command four times yourself.

If `yarn -v` doesn't print `4.18.0`, Corepack isn't intercepting the `yarn` command yet — a stray global Yarn Classic install is shadowing it, or Corepack was never enabled. Fix once with `corepack enable` (Windows: run that from an elevated terminal — plain `Program Files\nodejs` isn't user-writable; alternatively `corepack enable --install-directory <a dir on your PATH you own>` avoids needing admin). Each package's Yarn version is pinned via `packageManager` in its own `package.json`; Corepack just needs to be allowed to act on it.

### Backend env

Create `api/.env`:

```
PORT=4001
SOCKET_PORT=3001
SECRET=typeSecretHere
MONGO_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
CORS_ORIGIN=http://localhost:3000
```

- `SECRET` — any random string, used to sign JWTs.
- `MONGO_URL` — your MongoDB connection string.
- `CORS_ORIGIN` — the frontend origin(s) allowed to open a Socket.IO connection (`http://localhost:3000` for default CRA dev server). Only this governs Socket.IO's CORS check — regular REST endpoints have no origin restriction ([server.js](api/src/server.js) uses `cors()` with no options for those). Accepts a comma-separated list (e.g. `https://app.example.com,https://preview-123.vercel.app`) for when you need more than one frontend origin to work at once.
- `SOCKET_PORT` is in the template but unused — [server.js](api/src/server.js) runs Express and Socket.IO on the single `PORT`. Harmless to leave in, just doesn't do anything.

### Frontend env

Create `frontend/.env`:

```
VITE_HTTPS_PROXY=http://localhost:4001
```

Used as the base URL for both REST calls and the Socket.IO connection — point it at wherever the backend is running. Accessed in code via `import.meta.env.VITE_HTTPS_PROXY` (Vite only exposes `VITE_`-prefixed vars, and only through `import.meta.env`, not `process.env`).

## Running locally

```bash
yarn dev
```

Runs both at once (`concurrently`) — API on http://localhost:4001 (nodemon), frontend on http://localhost:3000 (Vite dev server) — with each line prefixed so you can tell which process is talking. Still need both `.env` files in place first (below). To run just one side, use its own `yarn dev`/`yarn start` inside `api/`/`frontend/` directly.

## Creating a local account

Signup requires a `teamCode` (checked in [userModel.js](api/src/models/userModel.js)). Valid codes:

| Code | Team |
|---|---|
| `TEST` | `TEST_TEAM` (simplest for local dev) |
| `DZIKIEGZIKI` | `DZIKIE_GZIKI` |
| `DZIKIE_GZIKI_NABOR` | `DZIKIE_GZIKI_NABOR` |
| `WEST_SIDE_DOGZ` | `WEST_SIDE_DOGZ` |
| `FLYVENGERS` | `FLYVENGERS` |

All data (dogs, tasks, events, event templates, dog tasks) is scoped by `team` — only visible to/editable by users who signed up with the same code.

New users get no `roles`. The admin panel (`/admin-panel/*`) is gated on `roles` including `ADMIN` ([useIsAdmin.ts](frontend/src/hooks/useIsAdmin.ts)). There's no UI or API to grant this — after signing up, open the user document in MongoDB (`users` collection) and set `roles: ["ADMIN"]` by hand.

## Scripts

**Root:**
- `yarn` — installs all three packages (via `postinstall`)
- `yarn dev` — runs both dev servers at once
- `yarn test:e2e` — runs the Playwright suite (see below)

**Backend** (`api/`):
- `yarn dev` — nodemon, restarts on change
- `yarn start` — plain node
- `yarn gen_vapid_keys` — generates VAPID keys for web-push (see Known gaps below — not currently wired up to anything)

**Frontend** (`frontend/`):
- `yarn start` — Vite dev server
- `yarn build` — type-checks (`tsc --noEmit`) then production build
- `yarn preview` — serves the production build locally, for a final sanity check before deploying
- `yarn test` — Vitest, runs once and exits
- `yarn test:watch` — Vitest in watch mode
- `yarn lint` — ESLint (`react-app` config, run standalone now that CRA's gone — see below)

The API has no unit tests written yet.

## Unit tests

`frontend/` uses Vitest, covering the pure helper functions in [src/helpers](frontend/src/helpers) (`yarn test` from within `frontend/`) — date/attendance formatting, the drag-and-drop position math, auth error mapping, task grid layout, etc. Nothing UI/component-level yet; that's what the Playwright suite below is for.

## End-to-end tests

`e2e/` runs Playwright against the real app, fully self-contained — no real database, no manual setup:

```bash
cd e2e && yarn && npx playwright install chromium   # one-time
yarn test:e2e                                        # from repo root, any time after
```

Each run spins up an in-memory MongoDB (`mongodb-memory-server`, downloads a real `mongod` binary the first time — needs internet once), boots the API against it on port 4101, boots the Vite dev server on port 3100 with `VITE_HTTPS_PROXY` pointed at that API, runs the tests, then tears everything down. Doesn't touch your real `.env`, your Atlas cluster, or ports 3000/4001, so it's safe to run alongside normal local dev.

Current coverage ([e2e/tests](e2e/tests)): signup, logout/login, and an admin promoting via direct DB write (there's no UI path, same limitation as real usage — see "Creating a local account" above) then adding a dog through the admin panel. `e2e/helpers/db.ts` is where that kind of direct-DB test setup lives if you add more tests needing it.

## Deploying after the Vite migration

The frontend moved from Create React App to Vite. Vercel's project is still configured for CRA's conventions — update **Settings → Build & Development Settings** before the next deploy:
- Framework Preset: `Create React App` → `Vite`
- Output Directory: `build` → `dist` (Vite's default; should auto-fill once the preset's changed)
- Env var: `REACT_APP_HTTPS_PROXY` → `VITE_HTTPS_PROXY` (same value, new name — see Frontend env above)

## Known gaps

Things that look like features but currently do nothing — so you don't lose time chasing them:

- **Web push notifications are unwired end to end.** Frontend: `subscribe()` in [serviceWorkerHelpers.js](frontend/src/helpers/serviceWorkerHelpers.js) (which would request permission and create a push subscription) is never called from any component, and the `subscriptionDetails` the app fetches on load is never rendered anywhere. Backend: there's no handler at all for the `save_subscription` / `get_subscription_details` socket events the frontend emits, despite `web-push` being installed and `gen_vapid_keys` existing as a script. Treat it as scaffolding for an unfinished feature, not a bug to fix incidentally.

## Coding conventions

See [.github/copilot-instructions.md](.github/copilot-instructions.md) — shared between Claude Code and GitHub Copilot, applies to both `frontend/` and `api/`.
