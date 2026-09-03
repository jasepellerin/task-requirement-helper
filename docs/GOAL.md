# Goal

Local OSRS unlock tracker for skills, diaries, and quests. No server. Mark tiles as you find, unlock, and complete them, and see what is ready versus still blocked.

## Why

Unlock trees are easy to lose in your head. You want to know:

- What is **ready** to unlock (on the board, every parent already unlocked or completed)
- What is **blocked** (on the board, but a prerequisite is not done)
- What is **unseen** (in the catalog, not on the board yet)
- What you already **unlocked** (have it, not finished)
- What you **completed**

## Current product

- Catalog-only tiles: non-combat skills, achievement diaries, quests (miniquests excluded)
- Status: unseen, locked, unlocked, completed (order not enforced)
- Catalog AND prerequisites; skill wiki levels display as the exact level and store as the covering bracket tile
- Board: Ready / Blocked / Unlocked. Completed is a separate view. Unseen is off the board until added from search (or hidden again by marking unseen). Finder stays open for batch status edits.
- Detail cards are view-only: catalog title, live status, wiki link, exact colored requirements
- Stats window derived from unlocked/completed skill brackets (combat/Slayer fixed at 99)
- Persist in `localStorage`: `{ id, status }` for catalog tiles whose status is not `unseen`. JSON export/import. Names, parents, and requirement display are rebuilt from the catalog on load/import.

## Out of scope

Custom tiles, graph canvas, notes, tags, undo history, backend.
