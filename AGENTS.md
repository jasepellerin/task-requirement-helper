# Tiles

Local-only unlock tracker for a tile-based game. No backend. Data lives in `localStorage` (`tiles:v1`) with JSON export/import as backup.

## Conventions

- Functional React + TypeScript. Never `React.FC`.
- Yarn, not npm/npx.
- ESLint + Prettier. No `any`. Use `ts-expect-error` with a real reason, never `ts-ignore`.
- No comments unless the logic is actually confusing.
- Drive UI from derived data. Put reusable logic in helpers.
- Unit-test computational/domain changes (`yarn test`).

```bash
yarn dev
yarn test
yarn lint
yarn typecheck
yarn build
```

## Product rules

- A **tile** has a name and status: `unseen` | `locked` | `unlocked` | `completed`
  - **unseen**: you know it exists (or added it as a rumor/prerequisite) but have not encountered it
  - **locked**: seen, not unlocked yet
  - **unlocked**: you have it, not finished yet
  - **completed**: done with it
- Typical in-game flow is unseen → locked → unlocked → completed. The app does **not** enforce that order — any status is always settable.
- **Parents** are prerequisites. **Dependents** are the inverse. Stored once as `parentIds` on the child; dependents are derived.
- Prerequisites are **AND**: a tile needs _all_ parents `unlocked` or `completed`.
- Derived **readiness** (never stored):
  - `completed` if status is completed
  - `unlocked` if status is unlocked
  - `unseen` if status is unseen (even if parents are done — you still need to find it)
  - `ready` if locked and every parent is unlocked or completed (or it has no parents)
  - `blocked` if locked and at least one parent is missing or not unlocked/completed
- Cycles are rejected when adding an edge.
- Default new-tile status: `locked`. Status is always editable.
- OSRS skill catalog lives in [src/data/osrs-skills.json](src/data/osrs-skills.json) and [src/data/skill-brackets.json](src/data/skill-brackets.json). Catalog tiles seed as `unseen` (not ready). Missing catalog tiles are merged on load (stable ids `osrs:{skill}:{bracket}`); later status edits are kept.

See [docs/GOAL.md](docs/GOAL.md) for the high-level goal and v1 scope.
