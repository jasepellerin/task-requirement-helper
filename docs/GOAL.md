# Goal

Keep track of tiles in a tile-based game: what exists, what you've seen, what you already have, and what you can unlock right now versus what still needs prerequisites or still needs to be found.

No server. The graph is yours — you add tiles as you discover names and edges.

## Why

Unlock trees are easy to lose in your head. You want to know:

- What is **ready** to unlock (seen, every parent already unlocked or completed)
- What is **blocked** (seen, but missing a prerequisite unlock)
- What is **unseen** (you haven't found it yet, even if you know the name)
- What you already **unlocked** (have it, not finished)
- What you **completed**

## v1

- Create / edit / delete tiles
- Status: unseen, locked, unlocked, completed (default new tile: locked; order not enforced)
- Parent and dependent relationships, edited from either side
- Five lists driven by derived readiness
- Persist in `localStorage`
- Export and replace-import JSON (`StoreV1`)
- Reject cyclic relationships
- Seed OSRS skill tiles (24 skills × 10 level brackets, chained parents) from data files

## Not v1

Graph canvas, notes, tags, merge-on-import, undo history, backend.
