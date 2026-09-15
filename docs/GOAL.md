# Goal

Local OSRS unlock tracker for skills, diaries, and quests. No server. Mark tiles as you find, unlock, and complete them, and see what is ready versus still blocked.

## Why

Unlock trees are easy to lose in your head. You want to know:

- What is **ready** to unlock (on the board, every parent already unlocked or completed)
- What is **possible** (on the board, and you can work it using only tiles already on the board: every parent is unlocked/completed, or locked and itself ready/possible)
- What is **blocked** (on the board / seen, but a prerequisite is unseen, missing, or itself blocked because something further up the chain is still unseen)
- What is **unseen** (in the catalog, not on the board yet)
- What you already **unlocked** (have it, not finished)
- What you **completed**

## Current product

- Catalog-only tiles: non-combat skills, achievement diaries, quests (miniquests and unreleased excluded)
- Status: unseen, locked, unlocked, completed (order not enforced)
- Catalog AND prerequisites; skill wiki levels display as the exact level and store as the covering bracket tile
- Board: Unlocked / Ready / Possible / Blocked. Completed is a separate view. Unseen is off the board until added from search (or hidden again by marking unseen). Finder stays open for batch status edits. Starred tiles sort to the top of their column, then priority skill tiles. Priority skill cards show a display-only up-arrow next to the star. Board cards and finder rows use the same star and status split control as the detail card.
- Detail cards are view-only: catalog title, wiki infobox thumbnail on quests, live status, star (unseen favorites stay unseen and off the board), wiki link, last revealed/unlocked/completed chips, quest difficulty/length pills, Slayer Master / Slayer monster / transportation / spellbook / teleport spell / teleport item / minigame unlock badges, exact colored requirements, quest items without how-to-get notes, quest/diary rewards
- Stats window derived from unlocked/completed skill brackets (combat/Slayer fixed at 99). Clicking a tracked skill toggles priority; that skill’s bracket tiles float up on the board.
- Persist in `localStorage`: `{ id, status, starred?, revealedAt?, unlockedAt?, completedAt? }` for catalog tiles whose status is not `unseen`, plus starred unseen tiles, plus optional `prioritySkills`. JSON export/import. Names, parents, and requirement display are rebuilt from the catalog on load/import. Last revealed/unlock/complete times show on the detail card as chips.

## Out of scope

Custom tiles, graph canvas, notes, tags, undo history, backend.
