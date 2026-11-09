# Boundless Modular Refactor

## Status

Branch: `refactor/modular-architecture`

This branch is a safe refactoring workspace. The production runtime on `main` remains unchanged. The current repository is a deployed production snapshot, not the original React/Vite source project. The large file `site/assets/page-B87MruAb.js` is generated runtime code and must not be deleted or hand-replaced as a first step.

## Target architecture

- `site/modules/core/`: module registry, event bus, shared contracts and compatibility adapters.
- `site/modules/character/`: character creation and identity.
- `site/modules/cultivation/`: roots, realms, stages, cultivation progression.
- `site/modules/world/`: map, regions, time and world simulation.
- `site/modules/npc/`: NPC state, AI and relationships.
- `site/modules/family/`: family relations and SALASILAH.
- `site/modules/sect/`: sect membership, ranks, missions and governance.
- `site/modules/inventory/`: items, equipment, storage and item transactions.
- `site/modules/combat/`: combat rules and battle state.
- `site/modules/spirit-beasts/`: species catalogue, ownership, encounters, growth, evolution, contracts and Bestiary.
- `site/modules/economy/`: currency, market and trade.
- `site/modules/multiplayer/`: server gateway, presence, chat and synchronized actions.
- `site/modules/settings/`: settings, developer tools and configuration.
- `site/modules/persistence/`: save schema, migrations, import/export and storage adapters.
- `site/modules/ui/`: shared UI shell and navigation.

## Integration rules

1. A module owns its domain data and exposes a documented public API.
2. Cross-module communication uses typed event names and explicit API calls, not direct mutation of another module's internal state.
3. Persistence is centralized through versioned save adapters. Modules contribute and restore only their own namespaced data.
4. Existing save fields remain readable during migration. No existing save key is removed until a tested migration and rollback path exist.
5. Existing global bridges remain compatibility adapters until all consumers have moved.
6. Existing production bundle and script order remain untouched until replacement coverage is complete.
7. Assets are referenced by stable paths; the refactor does not rename or delete existing artwork.
8. Each extraction is verified independently before the next domain is moved.

## Extraction order

1. Core contracts and registry.
2. Persistence adapter and save compatibility.
3. Data-only catalogues (including all 37 official Spirit Beast species).
4. World and character state adapters.
5. Domain logic in dependency order.
6. UI components and navigation.
7. Multiplayer integration.
8. Remove legacy bridge code only after a repository-wide reference audit and regression suite.

## Immediate findings

- The repository has no original `src/` tree or usable build pipeline in `package.json`.
- `site/assets/page-B87MruAb.js` is the bundled application runtime, not an isolated system file.
- `site/assets/index-Cyw089Xg.js` dynamically loads the main page bundle.
- Spirit Beast features are split between the main bundle and legacy extension scripts. The canonical 37-species catalogue now lives in `site/modules/spirit-beasts/catalogue.js`; `v897-spirit-beast-tiers.js` consumes that API instead of maintaining a second species/region/tier dataset. Encounter, editor, wildlife bridge and detail-popup behaviour remain in their existing compatibility scripts.
- The HTML metadata still mentions 35 Bestiary creatures in one embedded description despite the 37-entry catalogue.
- There are 38 beast asset directories. The additional Chinese-named ice-deer folder is not in the official 37-entry catalogue and must be audited as an unclassified asset, not silently deleted.

## Current implementation boundary

- The canonical Spirit Beast catalogue is loaded before the tier UI script by `site/index.html` on this branch. The tier UI now reads its nine tiers, 41 regions and 37 species from that module.
- The old duplicate catalogue block (about 6.5 KB) has been removed from `v897-spirit-beast-tiers.js`; its UI/rendering logic remains in place.
- The encounter, ownership, training, evolution, contract and Bestiary logic inside the compiled main bundle has not yet been extracted. Existing global bridges and extension scripts remain in place.
- No old save fields, game assets or legacy runtime files have been deleted. The live `main` branch is unchanged; this integration exists only on `refactor/modular-architecture`.
