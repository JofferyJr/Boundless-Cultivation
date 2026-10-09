# Boundless Cultivation
### A standalone Xianxia cultivation RPG

**Boundless Cultivation** is a browser-based Xianxia RPG project hosted with GitHub Pages. The repository contains the game website, its runtime assets, world-map resources, item artwork, and supporting development documentation.

<p align="center">
  <a href="https://jofferyjr.github.io/Boundless-Cultivation/"><strong>▶ Play Boundless Cultivation</strong></a>
  ·
  <a href="https://github.com/JofferyJr/Boundless-Cultivation"><strong>Repository</strong></a>
</p>

---

## Project at a glance

| Detail | Value |
|---|---|
| Project | Boundless Cultivation |
| Genre | Xianxia / cultivation RPG |
| Delivery | Static website |
| Main website source | `site/` |
| Hosting | GitHub Pages |
| Live website | https://jofferyjr.github.io/Boundless-Cultivation/ |
| Main branch | `main` |

The repository is maintained as the standalone Boundless project. **Boundless Cultivation** is the current project name; “Jalan Dao” and “Cultivation” are legacy names, not the current game title.

## Contents

- [Game systems](#game-systems)
- [Character creation](#character-creation)
- [Spiritual Root](#spiritual-root-and-reroll-rates)
- [World maps](#world-maps)
- [Inventory and item atlases](#inventory-and-item-atlases)
- [Weapons and forging](#weapons-and-forging)
- [Save, export, and settings](#save-export-and-settings)
- [Developer tools](#developer-tools)
- [Repository structure](#repository-structure)
- [Updating images safely](#updating-images-safely)
- [Development and deployment](#development-and-deployment)
- [Troubleshooting](#troubleshooting)

---

## Game systems

Boundless is designed around character growth and a persistent cultivation world. The project includes systems for:

- Character creation, including name, age, gender, portrait, talents, and background options.
- **Kertas Pemilihan Muka** (Face Selection Album) for choosing player and eligible partner portraits.
- Spiritual Root grades and rerolls.
- Bloodlines, physiques, family background, lineage, sects, and relationships.
- Bestiary entries for creatures and their descriptions.
- Inventory content such as items, herbs, ores, pills, artifacts, weapons, manuals, and portal keys.
- World simulation and AI-related runtime modules.
- Background music.
- Save-slot management and import/export tools.
- Development settings and cultivation realm testing tools.

Availability and behaviour of individual features depend on the current deployed build.

## Character creation

Character creation is the starting point for a new cultivation journey. It brings together identity, age, gender, portraits, talents, background, and cultivation-related choices.

The face-selection interface is intended to present portraits in an album-style panel that can be closed after a selection. Partner-related options are conditional on the rules of the game.

### True Love

The game's stated rule is that **True Love is only available to characters aged 18 or older**. Partner and family/lineage outcomes depend on the character's relationship state and the applicable background rules.

## Spiritual Root and reroll rates

A Spiritual Root reroll determines the root grade using the following configured probability distribution:

| Result | Probability |
|---|---:|
| False Root — 5 slots | 35% |
| False Root — 4 slots | 25% |
| True Root — 3 slots | 20% |
| True Root — 2 slots | 15% |
| Heavenly Root | 5% |
| **Total** | **100%** |

### Root categories

- **False Root:** Fire, Water, Wood, Metal, Earth.
- **True Root:** Lightning, Ice, Wind, Light, Dark.
- **Heavenly Root:** a special root with one usable slot.

The reroll is intended to determine the grade and slot configuration; it should not arbitrarily replace the root category rules. Only usable root slots should be presented as available.

## Background: Reincarnated Tree Spirit

**Reincarnated Tree Spirit** represents a tree spirit reborn as a human. The documented compatible roots include Water, Wood, Earth, Wind, and Light/Yang.

When the character has a **Wood Root**, this background's specified bonus is **+45% Cultivation Speed**. The bonus is conditional on having the Wood Root.

## World maps

Boundless separates the main world map from the ocean-world map.

### Main world map

Current documented source asset:

`site/assets/uploads/Peta Xianxia dengan Laut Tenggara Tenang.png`

The main map remains the primary world-map experience.

### Dunia Laut

Current documented ocean-map asset:

`site/world-map/v3/dunia_laut/Peta Laut Xianxia yang Harmoni.png.webp`

Dunia Laut is a separate ocean setting connected to the world through the portal concept. Its map is intended to supplement—not replace—the main world map.

> **Asset-path note:** Keep filenames, capitalization, extensions, and directory paths consistent with the runtime references. A file existing in the repository does not by itself prove that the live game is loading that copy.

## Inventory and item atlases

Inventory artwork is supplied by image assets and runtime mappings. The repository contains multiple atlas-like files, so replace the exact file referenced by the inventory rather than assuming that similarly named copies are interchangeable.

### Documented atlas paths

| Purpose | Path |
|---|---|
| Item atlas | `site/game-assets/items/item-atlas-v1.webp` |
| Accessory atlas | `site/game-assets/items/Assesoris.webp` |
| Additional item-atlas copy | `site/game-art/item-atlas-v1.webp` |

The additional copy under `site/game-art/` may not be the same file used by the inventory. Check the runtime's actual image URL before deciding which copy to replace.

### Replacing an atlas image

1. Open the existing file in the repository and confirm the exact path.
2. Replace its image content while keeping the same filename, capitalization, extension, and path.
3. Preserve the atlas dimensions, grid, sprite positions, and item ordering if the runtime uses fixed coordinates or sprite indices.
4. Commit the changed image to `main` and wait for the GitHub Pages deployment to finish.
5. Open the live game and perform a hard refresh (`Ctrl+Shift+R` in most desktop browsers). A private/incognito window can help test without an existing browser cache.
6. If the old artwork still appears, inspect the image URL requested by the inventory in the browser's developer tools. Confirm that the URL matches the file you replaced and that the deployed response contains the new image.

**Important:** Replacing an atlas image changes artwork, not item IDs, names, descriptions, or inventory data. Those depend on the game's item definitions and mappings. If sprites move to different positions in the new atlas, the corresponding mapping may also need to be updated.

### Asset locations

- `site/game-assets/items/` — item-related assets.
- `site/game-assets/bestiary/` — bestiary image assets.
- `site/game-art/item-atlas-v1.webp` — additional atlas copy.
- `site/assets/uploads/` — general image uploads and map source material.

The uploads folder is a staging area; it is not automatically the canonical runtime location for every image.

## Weapons and forging

The weapon system uses the `WPN-` item prefix and is documented as accessible through **Inventory → Equipment Slot → Weapons & Forging**.

### Weapon components

- **Weapon types:** Sword, Saber, Spear, Bow, Staff, Fan, Guandao, Hammer, Dagger, and Orb.
- **Grades:** Mortal, Spiritual, Earth, Heaven, Immortal, and Divine.
- **Core Material:** provides the base weapon attributes.
- **Catalyst / Soul:** may provide an element or special skill.
- **Karma alignment:** Orthodox, Neutral, or Asura/Demonic.
- **Quality:** levels 1–5.
- **Purity and Stability:** influence forging outcomes.
- **Dao Tribulation:** adds risk at higher grades.
- **Refinement and Tempering:** upgrade mechanics with potential failure or backlash.
- **Dao Rune Matrix:** includes Sword Qi, Lightning, Fire, Ice, Wind, Illusion, Defense, Space, and Soul themes.
- **Affixes:** secondary effects such as Spirit Flow, Flame Edge, Void Rend, and Astral.
- **Durability, repair, mastery, weapon intent, and soul resonance:** support weapon progression.
- **Persistent identity:** weapons use unique `WPN-...` IDs and may be renamed.

### Forging flow

`Furnace → Core Material → Catalyst/Soul → Purity/Stability → Shape → Dao Runes → Tribulation → Weapon Intent`

The weapon system is organized as a separate runtime module to support future expansion without requiring every feature to be embedded in the main game bundle.

## Save, export, and settings

Save and export tools are documented under **Settings → Game**. Available controls may include:

- Save and load.
- Delete a save.
- Import and export.
- Export all saves.

Settings are also organized around areas such as display, gameplay, Help & Tips, Dev, AI controls, music, save/export, and refreshing the displayed version.

When testing save/load changes, use a disposable test save first. Do not assume a new build is compatible with every older save unless that compatibility has been verified.

## Developer tools

When Dev Mode is unlocked, the Dev settings area is intended to provide a **Cultivation Realm Editor** for testing.

The documented realm sequence is:

1. Body Refinement
2. Qi Condensation — 13 layers
3. Foundation Establishment
4. Core Formation
5. Nascent Soul
6. Soul Transformation
7. Void Refinement
8. Dao Integration
9. Tribulation Transcendence
10. Immortal Ascension

The editor is documented with realm stages—Early, Middle, Late, and Great Perfection—and Qi-layer selection for Qi Condensation. Changes are intended to apply to the current player save through the game's save/state loader.

## Repository structure

Key locations in the repository include:

| Path | Purpose |
|---|---|
| `site/` | Website and game runtime served by GitHub Pages |
| `site/index.html` | Website entry point |
| `site/assets/` | Runtime JavaScript, CSS, music, and supporting assets |
| `site/assets/music/` | Background music files |
| `site/assets/uploads/` | General uploaded assets and map source material |
| `site/game-assets/items/` | Item atlas and item-related assets |
| `site/game-assets/bestiary/` | Bestiary images |
| `site/game-art/` | Additional game-art assets |
| `site/world-map/v3/dunia_laut/` | Dunia Laut map assets |
| `docs/` | Design, migration, and development documentation |
| `.github/workflows/` | GitHub Actions workflows, including Pages deployment |

Runtime bundles under `site/assets/` may have generated or hashed filenames. Do not rename or replace a bundle casually: the HTML entry point and other runtime files may refer to its exact name.

## Development and deployment

Boundless is published as a static site through GitHub Pages. The website is served from the repository's `site/` directory through the configured deployment workflow.

### Safe change workflow

1. Identify the exact source file and all runtime references to it.
2. Make a focused change on a branch when possible.
3. Check paths and filename capitalization.
4. Validate the relevant HTML, CSS, JavaScript, JSON, or image asset.
5. Review the diff to ensure unrelated files were not changed.
6. Commit and push the change.
7. Wait for the Pages workflow to complete, then test the deployed website—not only the GitHub file preview.

For image-only changes, verify the actual binary file changed in the commit and that the deployed image URL serves the new artwork. For runtime changes, check the browser console and test the affected flow.

### Compatibility principles

- Keep existing canonical paths stable unless all references are updated.
- Preserve existing save data where possible.
- Avoid duplicate event handlers and repeated audio playback.
- Avoid changing generated runtime bundles without checking their HTML/import references.
- Do not delete an asset simply because another copy appears to exist; confirm whether the game still references it.
- Do not perform a rollback unless it is explicitly requested.

## Troubleshooting

### Inventory still displays the old atlas

1. Verify that the new image was committed to the correct branch.
2. Confirm the exact canonical path used by the inventory.
3. Check whether the inventory loads `site/game-assets/items/item-atlas-v1.webp`, `site/game-assets/items/Assesoris.webp`, or another image path.
4. Hard-refresh the live website or test in a private window.
5. Inspect the requested image URL and response in the browser's developer tools.
6. If the new image loads but the wrong items appear, compare the new atlas grid and sprite positions with the runtime's item mapping.

### Image is missing or fails to load

- Check spelling, capitalization, extension, and directory.
- Confirm the file is committed and available in the deployed branch.
- Check for broken relative paths or references to an old filename.
- Verify that the image format matches the file extension.

### A runtime feature breaks after an update

- Check the browser console for JavaScript errors.
- Inspect the deployment workflow for build or publishing failures.
- Review recent commits for changes to shared state, event handlers, asset paths, and runtime loading order.
- Reproduce the issue using the deployed build and document the steps before changing additional files.

## Music assets

Music files are stored in `site/assets/music/`, including:

- `Xian Dao Chang (仙道长).mp3`
- `ni-tian-xing-loop.ogg`

The filenames above identify repository assets; the live settings UI must still reference the correct file path for playback.

## Project identity

The official current name is **Boundless Cultivation**. New documentation, UI labels, commits, and project-facing text should use this name consistently.

---

## License and asset ownership

No license terms are specified here. Before redistributing the project or its artwork, confirm the license and usage rights for the code, images, music, and any third-party assets included in the repository.
