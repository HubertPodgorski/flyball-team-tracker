# Flyball Team Tracker

Team/dog-club management app: tasks, dogs, events, event templates, calendar — scoped per team, real-time via Socket.IO.

## Stack

- **Frontend** (`frontend/`): React 18 (CRA, mixed JS/TSX), MUI, socket.io-client, react-hook-form, react-router-dom v6.
- **Backend** (`api/`): Express + Socket.IO, MongoDB via Mongoose, JWT auth (`jsonwebtoken` + `bcrypt`).
- Package manager: **Yarn**. `frontend/` and `api/` are independent packages (own `yarn.lock` each) — there's no root workspace, don't `yarn install` at repo root.

## Prerequisites

- Node.js 18+
- Yarn
- A MongoDB connection string — either a local `mongod`, or an Atlas cluster (get the URL from whoever manages the shared Atlas project if you're joining an existing team).

## Repo layout

```
frontend/   CRA app
api/        Express + Socket.IO API
```

Root `package.json` only holds `prettier` as a dependency. Its `build:api` / `build:frontend` scripts are broken (missing `&&`, and `api` has no `build` script) — ignore them, run each package's own scripts directly.

## Setup

Install dependencies in each package separately:

```bash
cd api && yarn
cd ../frontend && yarn
```

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
REACT_APP_HTTPS_PROXY=http://localhost:4001
```

Used as the base URL for both REST calls and the Socket.IO connection — point it at wherever the backend is running.

## Running locally

Two terminals:

```bash
cd api && yarn dev        # nodemon, http://localhost:4001
```

```bash
cd frontend && yarn start  # CRA dev server, http://localhost:3000
```

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

**Backend** (`api/`):
- `yarn dev` — nodemon, restarts on change
- `yarn start` — plain node
- `yarn gen_vapid_keys` — generates VAPID keys for web-push (see Known gaps below — not currently wired up to anything)

**Frontend** (`frontend/`):
- `yarn start` — dev server
- `yarn build` — production build
- `yarn test` — CRA test runner
- `yarn lint` — ESLint (`react-app` config)

Neither package has automated tests written yet.

## Known gaps

Things that look like features but currently do nothing — so you don't lose time chasing them:

- **Web push notifications are unwired end to end.** Frontend: `subscribe()` in [serviceWorkerHelpers.js](frontend/src/helpers/serviceWorkerHelpers.js) (which would request permission and create a push subscription) is never called from any component, and the `subscriptionDetails` the app fetches on load is never rendered anywhere. Backend: there's no handler at all for the `save_subscription` / `get_subscription_details` socket events the frontend emits, despite `web-push` being installed and `gen_vapid_keys` existing as a script. Treat it as scaffolding for an unfinished feature, not a bug to fix incidentally.

## Coding conventions

See [.github/copilot-instructions.md](.github/copilot-instructions.md) — shared between Claude Code and GitHub Copilot, applies to both `frontend/` and `api/`.
