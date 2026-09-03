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
- **Parents** are prerequisites. **Dependents** are the inverse. Stored once as `parentIds` on the child; dependents are derived and not shown or edited in the UI.
- Prerequisites are **AND**: a tile needs _all_ parents `unlocked` or `completed`.
- Derived **readiness** (never stored):
  - `completed` if status is completed
  - `unlocked` if status is unlocked
  - `unseen` if status is unseen (even if parents are done — you still need to find it)
  - `ready` if locked and every parent is unlocked or completed (or it has no parents)
  - `blocked` if locked and at least one parent is missing or not unlocked/completed
- Cycles are rejected when adding an edge.
- Default new-tile status: `locked`. Status is always editable.
- Unseen tiles stay in the store but are hidden from the board. **New tile** searches the catalog (selecting an unseen tile marks it `locked`) or creates a custom tile.
- OSRS catalogs seed as `unseen`:
  - Skills: [src/data/osrs-skills.json](src/data/osrs-skills.json) + [src/data/skill-brackets.json](src/data/skill-brackets.json) (`osrs:{skill}:{bracket}`). No combat skills (Attack, Strength, Defence, Hitpoints, Ranged, Prayer, Magic, Slayer).
  - Diaries: [src/data/osrs-diaries.json](src/data/osrs-diaries.json) + [src/data/diary-tiers.json](src/data/diary-tiers.json) (`osrs:diary:{diary}:{tier}`). Harder tiers parent easier tiers, then covering skill brackets from [src/data/osrs-diary-skill-reqs.json](src/data/osrs-diary-skill-reqs.json) (Ironman footnotes included; combat/Slayer skipped). Refresh with `yarn fetch-diary-reqs`.
  - Quests: [src/data/osrs-quests.json](src/data/osrs-quests.json) + [src/data/osrs-quest-reqs.json](src/data/osrs-quest-reqs.json) (`osrs:quest:{slug}`). Parents are required quests plus covering skill brackets (Ironman skill tags included; combat/Slayer skipped). Required coins from wiki Quest details show as Gold on the card. Refresh with `yarn fetch-quest-reqs`.
  - Missing catalog tiles are merged on load; catalog `parentIds` are synced on load/import; later status edits are kept.
  - Persist/export only custom tiles plus catalog tiles whose status is not `unseen`. Import/load merge the catalog back in.

See [docs/GOAL.md](docs/GOAL.md) for the high-level goal and v1 scope.
