# Boundless Account Tiers

Account tier is separate from a character's cultivation realm. It belongs to the authenticated Supabase user and persists across characters/devices.

## Tier path

- **Mortal** — default for every new account.
- **Cultivator** — requested after account EXP and achievement requirements are met; admin approval required.
- **Immortal** — requested after the account is Cultivator and the next EXP/achievement requirements are met; admin approval required.

EXP thresholds and required achievement codes are intentionally not hard-coded yet; they need game-design approval before rewards are granted automatically.

## Supabase storage

- `boundless_account_progress`: current tier, account EXP, requested tier, request note/status, approver and timestamps.
- `boundless_account_achievements`: unique achievement records per user.
- `boundless_account_exp_ledger`: append-oriented audit history for awarded account EXP.

All three tables have RLS enabled. Players can read only their own records. Browser clients cannot insert or edit EXP ledger/achievement records, and cannot change their own current tier, EXP, or approval fields. A database trigger creates the Mortal profile for new auth users, backfills existing users, and sets tier requests to pending. The trigger also rejects out-of-order tier requests.

## Current game integration

The Account & Login settings panel displays the account tier, account EXP, achievement count and request status, and lets a signed-in player submit a tier request. The existing cloud-save flow remains separate.

**Not yet automated:** awarding EXP from gameplay events, checking approved EXP/achievement thresholds, and an admin approval interface. Do not award account EXP directly from client-side JavaScript: an untrusted browser could spoof rewards. Implement rewards through a trusted server/Edge Function or admin-only operation, using idempotent ledger entries.

## Admin approval

Approval must be performed by a trusted admin process, never by a player-facing browser update. On approval, the admin process must atomically set `account_tier`, `request_status = 'approved'`, `approved_by`, and `approved_at`, and verify the required EXP/achievements first. Rejection should set `request_status = 'rejected'` and retain an explanatory note. Keep any service-role key out of the public repository and browser.

## Security

- RLS limits account data to its owner.
- Anonymous table privileges are revoked.
- Authenticated users have read access only, plus column-limited permission to submit a tier request.
- The database, not UI controls alone, enforces the Mortal → Cultivator → Immortal request order.
