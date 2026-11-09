# Boundless — Module Boundaries and Migration Contract

## Purpose
Establish a complete module map before moving and deleting legacy implementation. This is the foundation, not a claim that the old game bundle has already been decomposed.

## Domain ownership
| Module | Owns | Depends on |
|---|---|---|
| character | identity, creation, background, attributes | persistence |
| cultivation | roots, realms, stages, progression | character, world |
| world | calendar, map, regions, simulation | persistence |
| npc | NPC identity, state, AI, relationships | world, character |
| family | genealogy, marriage, heirs, SALASILAH | character, npc, world |
| sect | membership, ranks, missions, governance | character, npc, economy, world |
| inventory | items, stacks, equipment, storage, transactions | character, persistence |
| spirit-beasts | species, encounters, ownership, training, evolution, contracts, Bestiary | world, inventory, character, persistence |
| combat | battle state, turn rules, effects, rewards | character, cultivation, inventory, spirit-beasts |
| economy | currency, markets, trade, auction | inventory, world |
| multiplayer | server gateway, presence, chat, synchronized actions | character, family, sect, inventory, economy |
| settings | preferences, save options, developer configuration | persistence |
| ui | navigation, screens, shared components | domain public APIs |

## Cross-module rules
1. A module owns its data. Other modules use public APIs or events; never mutate private state.
2. Events are named in site/modules/core/contracts.js. Payloads must be versioned and validated when implemented.
3. Persistence is accessed through site/modules/persistence/save-adapter.js; migrations must preserve every legacy field until parity is proven.
4. UI is a consumer, not the owner of domain rules.
5. No module may import or inspect another module's private implementation.
6. Legacy code is accessed only through named compatibility adapters during migration.

## Safe removal gates
Legacy code may be removed only after all are true:
- feature inventory and call-site audit complete;
- replacement module implements the complete feature set;
- save/load and import/export round-trip tests pass against real legacy fixtures;
- browser regression tests pass for creation, gameplay, map, inventory, family, beasts, settings and multiplayer;
- old globals have zero remaining consumers;
- rollback commit and backup are available;
- production build and deployed smoke test pass.

## Current stage
The module graph is registered as an inert foundation. Legacy scripts and page-B87MruAb.js remain active. The foundation does not yet take over game state or UI. This is intentional: deleting the bundle before feature parity would break the game.
