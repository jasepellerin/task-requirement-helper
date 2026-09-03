# Goal

Local OSRS unlock tracker for skills, diaries, and quests. No server. Mark tiles as you find, unlock, and complete them, and see what is ready versus still blocked.

## Why

Unlock trees are easy to lose in your head. You want to know:

- What is **ready** to unlock (on the board, every parent already unlocked or completed)
- What is **possible** (on the board, every parent is at least locked — none still unseen)
- What is **blocked** (on the board, but a prerequisite is unseen or missing)
- What is **unseen** (in the catalog, not on the board yet)
- What you already **unlocked** (have it, not finished)
- What you **completed**

## Current product

- Catalog-only tiles: non-combat skills, achievement diaries, quests (miniquests and unreleased excluded)
- Status: unseen, locked, unlocked, completed (order not enforced)
- Catalog AND prerequisites; skill wiki levels display as the exact level and store as the covering bracket tile
- Board: Unlocked / Ready / Possible / Blocked. Completed is a separate view. Unseen is off the board until added from search (or hidden again by marking unseen). Finder stays open for batch status edits. Starred tiles sort to the top of their column, then priority skill tiles. Priority skill cards show a display-only up-arrow next to the star.
- Detail cards are view-only: catalog title, wiki infobox thumbnail on quests, live status, star, wiki link, quest difficulty/length pills, Slayer Master / Slayer monster / transportation / teleport spell / teleport item / minigame unlock badges, exact colored requirements, quest items without how-to-get notes, quest/diary rewards
- Stats window derived from unlocked/completed skill brackets (combat/Slayer fixed at 99). Clicking a tracked skill toggles priority; that skill’s bracket tiles float up on the board.
- Persist in `localStorage`: `{ id, status, starred? }` for catalog tiles whose status is not `unseen`, plus optional `prioritySkills`. JSON export/import. Names, parents, and requirement display are rebuilt from the catalog on load/import.

## Out of scope

Custom tiles, graph canvas, notes, tags, undo history, backend.
