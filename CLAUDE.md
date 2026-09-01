# Project Notes

## Response Style

Caveman response mode. Terse, technical prose. Drop greetings, filler, repeated summaries, hedging. Fragments fine. Preserve code, commands, paths, URLs, identifiers, diffs, tables, errors exactly. Explain only non-obvious decisions, risks, or required user actions. Use normal clarity for security warnings, destructive operations, ambiguity, user-facing documentation.

## Coding Conventions

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for React/TypeScript coding conventions (component style, naming, context patterns, routing, imports). These apply to all code in this repo and are shared with GitHub Copilot.

See [.github/instructions/api.instructions.md](.github/instructions/api.instructions.md) for backend (`api/`) conventions — same sharing mechanism, scoped via `applyTo`.

## Domain naming: Club / Team / Lineup (mid-migration)

Old names clashed with their Polish translations one level apart: org ("Team") ↔ Klub, dog-pool ("Squad") ↔ Drużyna (= "Team"), 4-dog lineup ("Matchup") ↔ Skład (= "Squad"). Renamed frontend-side to break the chain: **Club** (org/tenant), **Team** (dog pool, was Squad), **Lineup** (4-dog ordered set, was Matchup).

Backend hasn't caught up yet - don't "fix" these to look consistent, they're intentional bridges:
- JWT claim / DB field / API param: still `team` (means Club now)
- REST endpoint: still `/squads`
- Wire field names: `matchupRef`, `squadId`, `matchupId` (see comments in `helpers/types.ts`)
- SSE event: still `squads_updated`
- Frontend function/type names on the Club/Team/Lineup side reflect the new terms; their internal wire calls don't

Full backend rename (JWT/DB/routes/socket rooms) is a separate future branch. Until then, new code should use Club/Team/Lineup terminology at the frontend-facing layer (types, components, labels) and only touch the old wire names where required to talk to the backend.
