# Tiles

Local OSRS unlock tracker. No backend. Catalog is skills, diaries, and quests only.

Data lives in `localStorage` (`tiles:v1`) with JSON export/import as backup.

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

## Product

Tiles come from the OSRS catalogs. There are no custom tiles.

A **tile** has a name and status: `unseen` | `locked` | `unlocked` | `completed`

- **unseen**: in the catalog, not on the board. This is also how you hide a tile.
- **locked**: on the board, not unlocked yet
- **unlocked**: you have it, not finished yet
- **completed**: done with it (Completed view, not the board)

Typical flow is unseen → locked → unlocked → completed. The app does **not** enforce that order — any status is always settable.

**New tile** searches the catalog. Selecting an unseen tile marks it `locked`.

### Prerequisites

- **Parents** are AND prerequisites. Stored as `parentIds` on the child.
- **Dependents** are the inverse: derived, not shown or edited.
- A parent counts as satisfied when its status is `unlocked` or `completed`.
- Catalog names and `parentIds` are the source of truth and are synced on load/import. Status edits are kept.

### Readiness (derived, never stored)

- `completed` if status is completed
- `unlocked` if status is unlocked
- `unseen` if status is unseen (even if parents are done — you still need to find it)
- `ready` if locked and every parent is satisfied (or it has no parents)
- `blocked` if locked and at least one parent is missing or unsatisfied

### Catalogs

All catalog tiles seed as `unseen`.

- **Skills** — [src/data/osrs-skills.json](src/data/osrs-skills.json) + [src/data/skill-brackets.json](src/data/skill-brackets.json) (`osrs:{skill}:{bracket}`). No combat skills (Attack, Strength, Defence, Hitpoints, Ranged, Prayer, Magic, Slayer). Each bracket parents every earlier bracket of the same skill.
- **Diaries** — [src/data/osrs-diaries.json](src/data/osrs-diaries.json) + [src/data/diary-tiers.json](src/data/diary-tiers.json) (`osrs:diary:{diary}:{tier}`). Harder tiers parent easier tiers, then covering skill brackets from [src/data/osrs-diary-skill-reqs.json](src/data/osrs-diary-skill-reqs.json) (Ironman footnotes included; combat/Slayer skipped). Refresh with `yarn fetch-diary-reqs`.
- **Quests** — [src/data/osrs-quests.json](src/data/osrs-quests.json) + [src/data/osrs-quest-reqs.json](src/data/osrs-quest-reqs.json) (`osrs:quest:{slug}`). Parents are required quests plus covering skill brackets (Ironman skill tags included; combat/Slayer skipped). Required coins from wiki Quest details show as Gold. Refresh with `yarn fetch-quest-reqs`.

A wiki skill level maps to the lowest covering bracket (e.g. 45 Farming → Farming 41–50). That covering tile is the stored parent; the UI still shows the exact wiki level.

Load/import merges any missing catalog tiles back in.

### Persistence

Persist/export only catalog tiles whose status is not `unseen`. Import/load merge the catalog back in and resync catalog names and `parentIds`.

### UI

- **Board**: Ready / Blocked / Unlocked. Unseen and completed are hidden here.
- **Completed**: separate window, split Skills / Diaries / Quests.
- **Stats**: OSRS-style skill window. Tracked skills use the highest unlocked/completed bracket (else 1). Combat/Slayer always show 99. No total. Clicking a tracked skill opens its covering tile.
- **Detail card** (click a tile):
  - View-only. Header: catalog title, live status icon (menu, saves immediately), wiki (external-link icon), X to close.
  - Status icons: slashed eye = unseen, lock = locked, open lock = unlocked, check = completed. Marking unseen takes it off the board.
  - **Required**: one line per parent. Quest/diary parents use the tile name. Skill reqs use the exact wiki level (`45 Farming`, `42 Crafting (Ironman)`). Color is the covering/parent tile status: red unseen, orange locked, yellow unlocked, green completed. Click opens that tile.
  - Quest cards also show Gold when the wiki lists required coins.
- **Finder** (`+`): search skills, diaries, and quests.

See [docs/GOAL.md](docs/GOAL.md) for the high-level goal.
