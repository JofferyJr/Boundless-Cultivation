# Boundless Server 1 multiplayer

## Runtime entry points

- `site/assets/v828-multiplayer-social.js` manages authenticated Supabase Realtime presence and sends a server-validated heartbeat for the shared Server 1 world clock.
- `site/assets/v828-multiplayer-social.js` adds authenticated character registration, presence, shared chat, profile cards, family-tree links, challenge requests, trade offers, and a position update API.
- `site/index.html` loads the multiplayer layer after the gateway.
- Supabase project: `Boundless-Cultivation` (project ref `axwfojhcdjfuixixepnt`).

## Database objects

- `boundless_families`: family groups indexed by normalized surname.
- `boundless_multiplayer_characters`: one active multiplayer character profile per authenticated account, including family, realm, stage, region and normalized position.
- `boundless_server1_state`: persistent Server 1 world-clock state; time advances only on authenticated heartbeats while a prior session lease is still active.
- `boundless_server1_sessions`: short-lived authenticated session leases, refreshed every 15 seconds and considered stale after 35 seconds.
- `boundless_family_relationships`: reciprocal relationship edges between accounts.
- `boundless_multiplayer_chat`: persistent Server 1 chat messages.
- `boundless_multiplayer_challenges`: challenge requests with pending/accepted/declined/cancelled states.
- `boundless_multiplayer_trade_offers`: inventory-backed trade offers with item IDs, item category, quantity, optional offered currency and optional requested currency.
- `boundless_sects` and `boundless_sect_members`: Server 1 sects and membership; one account can join one sect at a time.
- `boundless_pvp_battles`: persistent server-authoritative PvP battle state, turn ownership, HP, winner and action log.

RLS is enabled on multiplayer and Server 1 clock/session tables. Profile/chat reads are available to authenticated players; challenge and trade records are visible only to participants. Character registration, chat insertion, position updates, Server 1 heartbeat and disconnect go through RPC functions that require `auth.uid()`. Anonymous/public execution of the Server 1 RPCs is revoked, and clients cannot directly mutate session leases.

## Family generation rule

The first word of the character name is treated as the surname (for example, `Li Yun` has surname `Li`). When an account registers a new surname, the database has a 35% chance to link the character to an existing active character with the same normalized surname. If linked, the relation is generated using age difference and a random sibling/cousin choice. Otherwise, a separate family group is created. A repeated surname is therefore only a possibility of kinship, not proof.

## Current boundaries

The social layer requires a signed-in account. The profile table currently stores one active multiplayer character per account; save slots are not separate online identities yet.

The movement API is exposed as `window.__boundlessMultiplayer.moveTo({region, x, y})` and listens for `boundless-world-position`. The main world-map controls have not yet been connected to this event, so this API alone does not make map movement visible in the world.

Challenge acceptance remains a request state only; it does not execute combat. Trade acceptance now calls `boundless_server1_trade`, which locks the offer and both cloud-save rows, validates the current stored inventory/balances, then atomically transfers the selected item and currency in `boundless-save`. Inventory items and `spiritBeasts` are supported; spirit beasts transfer one at a time. The four existing currency fields (`stones`, `gold`, `silver`, `copper`) are reused. Offers created before the real-trade migration lack item IDs and cannot be accepted as real transfers; create a new offer instead. Same-currency amounts cannot be both offered and requested in one trade; use a single direction for that currency.

## Manual smoke-test checklist

1. Create/sign in to two separate Supabase accounts in two different browser profiles.
2. Select Multiplayer → Server 1 in both.
3. Verify both character names appear in each other's player list.
4. Send a chat message from one account and verify it appears in the other.
5. Send a challenge and verify the target can accept or decline it.
6. Select an inventory item or spirit beast, optionally add offered/requested currency, and send a trade offer. Accepting it should update both cloud saves; the accepting client and the sending client refresh their active save after the completed trade.
7. Register characters with the same surname on new accounts repeatedly to observe the probabilistic family grouping. A single attempt may create a separate family by design.
8. Check the browser console and Supabase Realtime/database logs for errors.

## Sect and PvP behavior

- The Multiplayer UI adds **Sekte** and **Pertarungan** tabs without replacing the existing player, chat, family, trade or challenge tabs.
- Sect operations are authenticated RPCs: `boundless_sect_create`, `boundless_sect_join`, and `boundless_sect_leave`. The database enforces one membership per account and promotes another member to leader when the current leader leaves; an empty sect is disbanded.
- Accepting a challenge calls `boundless_server1_challenge_accept` and creates a persistent battle with both players at 100 HP. The challenger takes the first turn.
- Each turn is validated server-side by `boundless_server1_battle_action`. Actions are normal attack, heavy attack (with a miss chance), special technique (variable damage), or guard (reduces the opponent's next attack). The server enforces participant identity, turn order, valid actions and terminal victory state; clients cannot directly write battle rows.
- Battle HP, turn, winner and action log are stored in Supabase. Realtime listeners refresh battles and sect lists when the tables change.
- Combat is currently a **turn-based PvP foundation**, not yet connected to the main game's full cultivation-derived stats, equipment, skills, consumable items, sect wars, NPC AI or ranked rewards. Those integrations need separate work before describing it as the complete Boundless combat system.

## Real trade transaction behavior

- The browser builds the item selector from the active local save (`boundless-save`), including all entries in `inventory` and `spiritBeasts`. The server does not trust the displayed item name: acceptance rechecks the item ID and quantity in the sender's cloud save.
- The transfer RPC is `public.boundless_server1_trade(uuid,text)` with `accept`, `decline`, or `cancel` actions. Only the intended recipient can accept/decline; only the sender can cancel. Public/anonymous execution is revoked.
- The database transaction moves inventory quantities, unique spirit beasts, and the selected existing currency fields together. If any item or balance check fails, the transaction raises an error and no part of the trade commits.
- The cloud save is authoritative for the transaction. If the local game state has not been saved/synced to `boundless-save`, an offer may be rejected at acceptance because the server cannot find the item/balance. The UI refreshes the active save from cloud after a completed trade.
- Automated database transaction tests were run in rollback-only transactions for a stacked inventory item plus `stones`/`gold`, and for a spirit beast. A real two-browser UI acceptance test is still required.

## Shared world clock behavior

- A successful Multiplayer connection creates a per-tab UUID session lease and immediately calls `boundless_server1_heartbeat`; a heartbeat is then sent every 15 seconds.
- The database stores the world clock in seconds and serializes clock updates by locking the Server 1 state row.
- Each heartbeat advances at most 15 seconds and only if the same session or another session was seen within the previous 35 seconds. A new session after a stale/offline gap starts the world without adding the offline gap to the clock.
- Explicit disconnect removes that session and pauses the world when no fresh session leases remain. Abrupt browser closure is handled by lease expiry on the next heartbeat; world time does not advance by itself in the database between heartbeats.
- This clock is the authoritative shared-world time foundation. It does **not yet automatically gate every local cultivation timer or every gameplay subsystem**. Any gameplay progression that derives rewards from local save timestamps must be separately audited and changed to use this server clock before claiming all offline progression is blocked.

## Verification status

- Shared-world clock, real-trade and sect/PvP migrations were applied to the connected Supabase project.
- Database transaction tests passed in rollback-only transactions for item quantity transfer, `stones`/`gold` transfer, and spirit-beast transfer. Test data was rolled back and no test inventory changes were retained.
- JavaScript syntax check passed after the sect/PvP UI update.
- Rollback-only SQL integration test passed for sect creation, a second member joining, challenge acceptance creating a battle, the first attack changing HP and turn ownership, and the opponent's next action. All test data was rolled back; current sect, member, battle and challenge table counts are zero.
- RPC privilege checks passed: `anon` cannot execute the sect/PvP functions; `authenticated` can.
- A live two-browser UI test remains necessary. PvP stats are currently fixed at 100 HP and server-defined action damage; cultivation/equipment integration remains unfinished.
