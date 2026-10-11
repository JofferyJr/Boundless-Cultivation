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


## Approved thresholds and achievement counts

Initial configuration:
- Mortal → Cultivator: **2,500 account EXP + at least 3 recorded account achievements + admin approval**.
- Cultivator → Immortal: **25,000 account EXP + at least 10 recorded account achievements + admin approval**.

The EXP values are the owner-approved thresholds. The achievement counts (3 and 10) are initial defaults because the owner specified that achievements are mandatory but did not specify exact counts; an authorized admin can change these counts in the in-game admin panel.

## Secure server endpoint

Supabase Edge Function `boundless-account-progression` is deployed with JWT verification enabled. It verifies the user's access token, checks the admin allowlist for admin-only operations, validates tier order and requirements on the server, and only allows an approval when EXP and achievement requirements still pass. Admin EXP awards use a database RPC and a unique (user, reason, reference) ledger key to prevent duplicate awards. Achievement codes are unique per account.

The static game client cannot securely prove that a gameplay event really happened. Therefore this version's manual EXP/achievement award tools are admin-only. Automatic EXP from quests or battles must be wired to authoritative server-validated events before being enabled; never trust a client-supplied amount or event name alone.

## Give the owner account admin access

The admin panel stays hidden until the account is explicitly allowlisted. In Supabase Dashboard → SQL Editor, replace `YOUR_USERNAME` with the exact Boundless login username and run:

```sql
insert into public.boundless_account_admins (user_id)
select id
from auth.users
where raw_user_meta_data ->> 'username' = 'YOUR_USERNAME'
on conflict (user_id) do nothing;
```

Check that exactly one account matches before running the insert:

```sql
select id, raw_user_meta_data ->> 'username' as username
from auth.users
where raw_user_meta_data ->> 'username' = 'YOUR_USERNAME';
```

Only the project owner should perform this allowlist change from the Supabase SQL Editor. Do not expose the service-role key in the game or GitHub. After granting admin access, log out and log back in, then open Settings → Account & Login to see the admin panel.

## Admin panel operations

- Review and approve/reject pending tier requests.
- Award account EXP with a reason and unique reference ID.
- Record account achievements by unique achievement code.
- Adjust minimum EXP and achievement counts for both promotion steps.

A rejection note is retained with the request. Approvals re-check requirements server-side immediately before updating the tier.


## Special account roles (separate from progression tiers)

Special roles are stored in `public.boundless_account_special_roles`; they do not replace or modify Mortal, Cultivator, or Immortal.

- **DEV** — unlocks the DEV settings entry for developer/test tools.
- **ADMIN** — includes DEV access and server-authorized account progression administration.
- Regular progression remains Mortal → Cultivator → Immortal and still requires EXP, achievements, and admin approval.

Role grants are deliberately not available to normal browser clients or the in-game admin panel. Assign or revoke a role only from the trusted Supabase SQL Editor after verifying the exact username and account UUID. Never grant a role based only on a username supplied in an untrusted request.

Example lookup (verify the result before changing anything):

```sql
select id, raw_user_meta_data ->> 'username' as username
from auth.users
where raw_user_meta_data ->> 'username' = 'EXACT_USERNAME';
```

Grant DEV to a verified account:

```sql
insert into public.boundless_account_special_roles (user_id, special_role, note)
values ('VERIFIED-USER-UUID', 'dev', 'Authorized developer access')
on conflict (user_id) do update set special_role = excluded.special_role, note = excluded.note;
```

Grant ADMIN through the existing admin allowlist or special-role table only to the verified project owner/admin. A special-role ADMIN record is also recognized by the server-side admin check. Revoke a special role by deleting that account's row from `public.boundless_account_special_roles`. Keep role assignment outside public client APIs.
