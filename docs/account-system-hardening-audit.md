# Boundless Account System — Hardening Audit

**Audit date:** 2026-10-15  
**Branch:** `account-system-hardening`  
**Status:** Changes are isolated on this branch. Cloud-version table has been added to the connected Supabase project; the GitHub Pages default branch has not been changed by this branch.

## Scope decisions

- Accounts are optional for local play.
- Cloud backup requires a Boundless account and covers all save keys managed by the save manager.
- Multiplayer requires an authenticated Boundless account.
- Account tier and account EXP are independent of character cultivation realm and EXP.
- Game systems (characters, inventory, cultivation titles, map, NPC simulation, sects, etc.) remain outside the account subsystem.

## Findings verified against the connected repository and Supabase project

### Existing account foundation

- Browser account module: `site/assets/v824-auth.js`.
- Public browser configuration: `site/assets/v824-auth-config.js`. It contains the Supabase project URL and a public browser key only; never place a service-role key in this file.
- Tier progression Edge Function: `boundless-account-progression`, currently deployed with JWT verification enabled.
- Existing database tables include `boundless_account_progress`, `boundless_account_achievements`, `boundless_account_exp_ledger`, `boundless_account_admins`, `boundless_account_special_roles`, `boundless_account_tier_requirements`, and `boundless_cloud_saves`.
- The save manager's source of truth is `site/assets/v815-save-manager-core.mjs`, which currently defines `MAX_SAVE_SLOTS = 5`. Cloud backup imports this constant instead of maintaining a second hard-coded slot count.
- The account flow supports guest play and keeps local saves when logging out.

### Cloud backup risks addressed on this branch

- Previously, the account module silently upserted the current cloud payload after local save changes. A second device could therefore have its newer cloud save overwritten.
- Cloud backup now compares payloads, stops automatic replacement when local and cloud data differ, asks for explicit confirmation for a manual replacement, archives the previous cloud payload, and uses the previous `updated_at` value as an optimistic concurrency check.
- Restoring cloud data first stores the current local payload as a restore point, then replaces the managed save keys as a set so stale local slots do not remain mixed into the restored state.
- A cloud-version history UI lists the ten latest versions and allows a player to restore a selected version. Versions are owner-scoped by RLS.
- Slot coverage is tied to the shared save-manager constant. The current supported save manager has five manual slots; do not change the slot count without updating and testing the save manager itself.

### Security findings

- RLS is enabled on the inspected account and cloud-save tables.
- Player-facing policies on progression, achievements, EXP ledger and cloud saves restrict access to rows owned by `auth.uid()`.
- The admin allowlist, special-role and tier-requirement tables intentionally have no user-facing policies, so browser users cannot access them directly; the Edge Function uses its server-side service role after checking the authenticated user's admin status. Keep service-role credentials server-side.
- Supabase Security Advisor reported leaked-password protection disabled. The available connected tools do not expose this Auth dashboard setting, so it remains an explicit dashboard action: enable leaked-password protection in Supabase Auth password/security settings.
- Re-run Security Advisor after the deployment and review any changed findings. RLS alone does not prove the Edge Function's complete authorization logic is correct.

## Multiplayer audit

Searches of the default branch for `multiplayer`, `WebSocket`, `supabase.channel`, `Realtime presence`, `lobby` and `game server` did not return matching implementation files. This is not proof that no multiplayer code exists anywhere, but no functioning server-side multiplayer implementation was verified during this audit.

Recommended design before implementation:
1. Require a valid Boundless Auth session before creating or joining a multiplayer session.
2. Validate identity server-side with `auth.getUser()`; never trust a client-supplied account ID or username.
3. Keep authoritative shared game state on the server. Do not treat client-side localStorage as authoritative multiplayer state.
4. Add a dedicated session/room model only after the server transport and multiplayer gameplay requirements are specified.
5. Enforce ownership and membership checks on every room/session operation. Account tier must not grant admin or gameplay privileges by itself.
6. Keep offline local play working when the multiplayer service is unavailable.

## Files changed on the branch

- `site/assets/v824-auth.js`: shared slot count, payload comparison, safer backup replacement, restore points, optimistic concurrency, and version history.
- `site/assets/v824-auth.css`: version-history layout.
- `site/index.html`: cache-busting asset query strings.
- `docs/account-system-hardening-audit.md`: this audit and implementation record.
- `docs/sql/boundless-cloud-save-versions.sql`: repeatable SQL definition for the additive cloud history table.

## Validation still required before merging

- Confirm signup/login, guest play and logout in a browser.
- Test first backup, repeated backup, conflicting local/cloud payloads, simultaneous update from a second device, restore of current cloud, and restore of an older version.
- Verify all five save slots are included and that the legacy active-save keys still restore correctly.
- Confirm version history cannot be read or inserted for another user's account.
- Enable leaked-password protection in the Supabase dashboard.
- Re-run Supabase Security and Performance Advisors.
- Multiplayer remains a separate implementation task; no multiplayer server has been claimed as implemented by this branch.
