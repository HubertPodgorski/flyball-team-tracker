# Project Notes

## Response Style

Caveman response mode. Terse, technical prose. Drop greetings, filler, repeated summaries, hedging. Fragments fine. Preserve code, commands, paths, URLs, identifiers, diffs, tables, errors exactly. Explain only non-obvious decisions, risks, or required user actions. Use normal clarity for security warnings, destructive operations, ambiguity, user-facing documentation.

## Coding Conventions

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for React/TypeScript coding conventions (component style, naming, context patterns, routing, imports). These apply to all code in this repo and are shared with GitHub Copilot.

See [.github/instructions/api.instructions.md](.github/instructions/api.instructions.md) for backend (`api/`) conventions — same sharing mechanism, scoped via `applyTo`.

## Domain naming: Club / Team / Lineup

Old names clashed with their Polish translations one level apart: org ("Team") ↔ Klub, dog-pool ("Squad") ↔ Drużyna (= "Team"), 4-dog lineup ("Matchup") ↔ Skład (= "Squad"). Renamed to break the chain: **Club** (org/tenant), **Team** (dog pool, was Squad), **Lineup** (4-dog ordered set, was Matchup).

Code-level identifiers, routes, the JWT claim, and SSE events have all been renamed (route is `/teams`, JWT claim is `club`, model is `mongoose.model("Team", ...)`, broadcast event is `teams_updated`, etc.) — this part of the migration is done, don't go looking for a stale `/squads`/`squads_updated` anywhere in current code.

What's still deliberately unrenamed, because it's actual persisted data and renaming it needs a real migration, not just a code change:
- The Mongo **collection** stays named `squads` (`mongoose.model("Team", teamSchema, "squads")` in `teamModel.js`).
- The **DB field / query param** for club is still the literal string `team` (e.g. `Model.find({ team: club })`, `?team=CLUB_CODE`) — every route-level variable is named `club` and reads/writes this field, but the field key itself hasn't moved.
- Wire field names `matchupRef`, `squadId`, `matchupId` (see comments in `helpers/types.ts` and `.github/instructions/api.instructions.md`) and the `matchups` array key on a Team document.

A future data-migration pass would rename the collection and these field keys in one scripted, coordinated step. Until then, new code should use Club/Team/Lineup terminology everywhere except where it's reading/writing one of the fields above — there, keep the old literal key and let the surrounding variable name carry the new terminology instead.
