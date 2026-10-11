# Supabase account and cloud-save setup

The website remains playable as a guest. Local save keys and the existing five-slot save manager are preserved.

## 1. Create a Supabase project
1. Create a project in Supabase.
2. In **Authentication → Sign In / Providers**, keep Email enabled and turn **Confirm email OFF**. The username-only flow uses a synthetic internal email address, so email confirmation and email-based password recovery cannot work for these accounts.
3. Under Authentication URL configuration, add the deployed GitHub Pages URL to the allowed site URLs/redirect URLs as applicable.

## 2. Create the cloud-save table
Open **SQL Editor**, run the complete contents of `supabase/boundless-cloud-saves.sql`. Row Level Security is enabled and each authenticated user can access only their own row.

## 3. Add public browser configuration
Edit `site/assets/v824-auth-config.js`:
- `url`: Supabase Project URL
- `anonKey`: Supabase publishable/anon key

These are public browser values. Never put a `service_role` key or any secret in this file or in GitHub Pages.

## 4. Test carefully
1. Deploy the repository and hard-refresh the site.
2. Guest play and existing local saves should continue to work without signing in.
3. Register a test username (3–24 lowercase letters, digits, underscores) and password (minimum 8 characters).
4. Save a game, choose **Backup Awan**, then test restore on a separate browser/profile with a disposable save first.
5. Check Supabase Table Editor: the table should contain a row for the test account, with only that account's save payload.

## Important username-only limitation
Supabase Auth natively accepts email or phone, not arbitrary usernames. This implementation converts each username into an internal synthetic email address. It does not collect a real email address, so users cannot use email verification or standard email password recovery. If account recovery is required, change signup to collect and verify a real email address, or build a carefully secured server-side username authentication service.

Cloud sync starts after a user is logged in and a relevant save key changes. It is best-effort; local saves remain authoritative on the device if the network is unavailable. When both local and cloud saves exist, the UI asks the player to choose backup upload or restore instead of silently overwriting local progress.
