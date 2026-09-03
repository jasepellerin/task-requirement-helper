# SlayerScape Requirements Helper

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

**New tile** searches the catalog. Toggle Skills / Diaries / Quests independently. Each result shows unseen / locked / unlocked / completed; the current status is highlighted. Changing status keeps the row in place. The finder stays open so you can update several at once.

### Prerequisites

- **Parents** are AND prerequisites. Derived as `parentIds` from catalog reqs.
- **Dependents** are the inverse: derived, not shown or edited.
- A parent counts as satisfied when its status is `unlocked` or `completed`.
- Catalog names, parents, wiki, gold, rewards, and requirement display come from the catalog. Status edits are kept.

### Readiness (derived, never stored)

- `completed` if status is completed
- `unlocked` if status is unlocked
- `unseen` if status is unseen (even if parents are done — you still need to find it)
- `ready` if locked and every parent is satisfied (or it has no parents)
- `possible` if locked, not ready, and every parent is at least locked (none unseen or missing)
- `blocked` if locked and at least one parent is missing or unseen

### Catalogs

All catalog tiles seed as `unseen`.

- **Skills** — [src/data/osrs-skills.json](src/data/osrs-skills.json) + [src/data/skill-brackets.json](src/data/skill-brackets.json) (`osrs:{skill}:{bracket}`). No combat skills (Attack, Strength, Defence, Hitpoints, Ranged, Prayer, Magic, Slayer). Each bracket parents every earlier bracket of the same skill. First-bracket quest unlocks from [src/data/osrs-skill-quest-reqs.json](src/data/osrs-skill-quest-reqs.json) (Herblore → Druidic Ritual, Sailing → Pandemonium).
- **Diaries** — [src/data/osrs-diaries.json](src/data/osrs-diaries.json) + [src/data/diary-tiers.json](src/data/diary-tiers.json) (`osrs:diary:{diary}:{tier}`). Harder tiers parent easier tiers, then covering skill brackets from [src/data/osrs-diary-skill-reqs.json](src/data/osrs-diary-skill-reqs.json) (Ironman footnotes included; combat/Slayer skipped). Rewards from each diary page’s per-tier Rewards section. Refresh with `yarn fetch-diary-reqs`.
- **Quests** — [src/data/osrs-quests.json](src/data/osrs-quests.json) + [src/data/osrs-quest-reqs.json](src/data/osrs-quest-reqs.json) (`osrs:quest:{slug}`). List comes from wiki [[Quests/List]] categories (Free-to-play + Members'); keep Infobox Quest pages only. Miniquests and unreleased (`{{Future Content}}`) excluded. Parents from `Module:Questreq/data` when present, otherwise Quest details (direct quests + covering skill brackets; Ironman tags included; combat/Slayer skipped). Hand overrides in [src/data/osrs-quest-req-overrides.json](src/data/osrs-quest-req-overrides.json) are unioned onto wiki reqs at catalog load (wiki first, extras appended, duplicates skipped), so they survive `yarn fetch-quest-reqs`. The Fremennik Trials override treats the optional lyre-craft skills as required (25 Fletching, 40 Woodcutting, 40 Crafting). Required coins from wiki Quest details show as Gold. Difficulty, length, and item requirements from Quest details. Rewards from `{{Quest rewards}}` (quest points + reward bullets). Infobox image from `{{Infobox Quest}}`. Refresh with `yarn fetch-quest-reqs`. Quests that unlock a Slayer Master (A Porcine of Interest → Spria, Priest in Peril → Mazchna, Lost City → Chaeldar, Shilo Village → Duradel, Fallen From Grace → Mortimer) show the wiki Slayer Master icon. Quests that unlock Slayer monsters (from wiki assignment tables) show the wiki Slayer skill icon. Quests that unlock a transportation network (Enlightened Journey → balloons, Tree Gnome Village → spirit trees, Fairytale II → fairy rings, plus gliders, eagles, quetzals, carts, and extra network nodes) show the wiki Transportation map icon. Quests that unlock a teleport spell (Plague City → Ardougne Teleport, Watchtower, Desert Treasure I → Ancient Magicks, Lunar Diplomacy, etc.) show the wiki teleport spell icon. Quests that reward a teleport item (Ghosts Ahoy → Ectophial, Mourning’s End Part I → teleport crystal, Monkey Madness II → royal seed pod, Kharedst pages on the five house quests use the memoirs book sprite, etc.) show that item’s wiki sprite. Quests that unlock a minigame (Temple of the Eye → Guardians of the Rift, Sleeping Giants → Giants’ Foundry, Tears of Guthix, Sins of the Father → Hallowed Sepulchre, Song of the Elves → The Gauntlet, plus Trouble Brewing, Temple Trekking, Blast Furnace, Pyramid Plunder, Volcanic Mine, and the rest of the wiki minigames that a catalog quest actually gates) show the wiki minigame map icon.

A wiki skill level maps to the lowest covering bracket (e.g. 45 Farming → Farming 41–50). That covering tile is the derived parent; the UI still shows the exact wiki level.

Load/import overlays stored statuses onto the catalog.

### Persistence

Persist/export `{ id, status, starred? }` for catalog tiles whose status is not `unseen`. Names, parents, and requirement display live in the catalog and are rebuilt on load/import. Old full-tile JSON still imports (name/`parentIds` ignored).

### UI

- **Board**: Ready / Possible / Blocked / Unlocked. Unseen and completed are hidden here. Starred tiles sort to the top of their column. Cards show unmet parent counts as lock (locked) and slashed eye (unseen/missing); a zero count is omitted. Filter bar next to Skills / Diaries / Quests: name search (same folding as the finder) plus independent kind toggles.
- **Completed**: separate window, split Skills / Diaries / Quests.
- **Stats**: OSRS-style skill window. Tracked skills use the highest unlocked/completed bracket (else 1). Combat/Slayer always show 99. No total. Clicking a skill opens its wiki page.
- **Detail card** (click a tile):
  - View-only. Header: catalog title, wiki infobox thumbnail on quests, live status icon (menu, saves immediately), star (on-board tiles), wiki (external-link icon), X to close.
  - Status icons: slashed eye = unseen, lock = locked, open lock = unlocked, check = completed. Marking unseen takes it off the board.
  - **Required**: one line per parent. Quest/diary parents use the tile name. Skill reqs use the exact wiki level (`45 Farming`, `42 Crafting (Ironman)`). Color is the covering/parent tile status: red unseen, orange locked, yellow unlocked, green completed. Click opens that tile.
  - Quest cards show difficulty and length as pills, Gold when the wiki lists required coins, Unlocks lines with the Slayer Master icon, Slayer skill icon, Transportation icon, teleport spell icon, teleport-item sprite, and/or minigame map icon when the quest unlocks a master, Slayer monsters, a transport network, a teleport spell, a teleport item, or a minigame, and an Items section for required items (wiki how-to-get notes are dropped).
  - Quest and diary cards list completion rewards from the wiki.
- **Finder** (`+`): search skills, diaries, and quests. Independent Skills / Diaries / Quests toggles. Empty search lists all alphabetized tiles for the active filters. Leading A / An / The is ignored for prefix and A–Z. Skill cape tiles sort as `{skill} 99`. Each result has all four status icons with the current one highlighted. Stays open for batch edits.

See [docs/GOAL.md](docs/GOAL.md) for the high-level goal.
