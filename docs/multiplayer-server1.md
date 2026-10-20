# Boundless Server 1 multiplayer

## Runtime entry points

- `site/assets/v826-server1-gateway.js` maintains the initial Server 1 presence gateway.
- `site/assets/v828-multiplayer-social.js` adds authenticated character registration, presence, shared chat, profile cards, family-tree links, challenge requests, trade offers, and a position update API.
- `site/index.html` loads the multiplayer layer after the gateway.
- Supabase project: `Boundless-Cultivation` (project ref `axwfojhcdjfuixixepnt`).

## Database objects

- `boundless_families`: family groups indexed by normalized surname.
- `boundless_multiplayer_characters`: one active multiplayer character profile per authenticated account, including family, realm, stage, region and normalized position.
- `boundless_family_relationships`: reciprocal relationship edges between accounts.
- `boundless_multiplayer_chat`: persistent Server 1 chat messages.
- `boundless_multiplayer_challenges`: challenge requests with pending/accepted/declined/cancelled states.
- `boundless_multiplayer_trade_offers`: item-name offers with pending/accepted/declined/cancelled states.

RLS is enabled on all multiplayer tables. Profile/chat reads are available to authenticated players; challenge and trade records are visible only to participants. Character registration, chat insertion, and position updates go through RPC functions that require `auth.uid()`. Public/anonymous execution of those RPCs is revoked.

## Family generation rule

The first word of the character name is treated as the surname (for example, `Li Yun` has surname `Li`). When an account registers a new surname, the database has a 35% chance to link the character to an existing active character with the same normalized surname. If linked, the relation is generated using age difference and a random sibling/cousin choice. Otherwise, a separate family group is created. A repeated surname is therefore only a possibility of kinship, not proof.

## Current boundaries

The social layer requires a signed-in account. The profile table currently stores one active multiplayer character per account; save slots are not separate online identities yet.

The movement API is exposed as `window.__boundlessMultiplayer.moveTo({region, x, y})` and listens for `boundless-world-position`. The main world-map controls have not yet been connected to this event, so this API alone does not make map movement visible in the world.

Challenge acceptance is a request state only; it does not execute combat. Trade acceptance records the offer status only; it does not move items into another player's inventory. These must be integrated with the game combat and inventory state before those features can be called complete.

## Manual smoke-test checklist

1. Create/sign in to two separate Supabase accounts in two different browser profiles.
2. Select Multiplayer → Server 1 in both.
3. Verify both character names appear in each other's player list.
4. Send a chat message from one account and verify it appears in the other.
5. Send a challenge and verify the target can accept or decline it.
6. Send a trade offer and verify the target can accept or decline it; do not expect inventory changes yet.
7. Register characters with the same surname on new accounts repeatedly to observe the probabilistic family grouping. A single attempt may create a separate family by design.
8. Check the browser console and Supabase Realtime/database logs for errors.
