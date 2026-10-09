# Boundless Map Asset Slots

This directory organizes the five world-map categories and the shared resources used by map views.

## World-map slots

1. **Main World** — `main-world/`
2. **Sea World** — `sea-world/`
3. **Upper Realm** — `upper-realm/`
4. **Underworld** — `underworld/`
5. **Dungeon** — `dungeon/`

## Shared map resources

Use `shared-map-assets/` for reusable map UI resources that are not exclusive to one world map, such as markers, pins, logos, symbols, and common base-map assets.

Current shared files:
- `shared-map-assets/marker_gold.png` — gold location marker used on the main world map.
- `shared-map-assets/map_base.webp` — shared base-map resource.

## Asset rules

- Keep filenames and extensions consistent with the runtime paths that load them.
- Store each world map in its matching slot; put reusable markers, icons, and symbols in `shared-map-assets/`.
- Do not restore the deleted `site/world-map/` path. Runtime references should use `site/game-assets/maps/`.
- Creating or moving assets does not automatically connect them to the game; update runtime paths whenever an asset path changes.
- Avoid duplicate copies unless a specific runtime path requires them.
