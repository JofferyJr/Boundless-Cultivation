# Boundless Map Asset Slots

This directory is the organized asset location for the five world-map categories. Each slot has its own folder so images can be replaced independently without mixing assets.

## Slots

1. **Main World** — `main-world/`
2. **Sea World** — `sea-world/`
3. **Upper Realm** — `upper-realm/`
4. **Underworld** — `underworld/`
5. **Dungeon** — `dungeon/`

## Asset rules

- Keep each map's original filename and extension consistent with the code that loads it.
- Do not delete or move existing maps in `site/world-map/` or `site/game-assets/maps/v3/` as part of this folder organization.
- These folders are asset slots only. Creating them does **not** switch the game runtime to load from them; runtime paths must be updated separately when a slot is ready to be connected.
- Use descriptive names for additional maps and avoid storing duplicate copies unless a specific runtime path requires them.
