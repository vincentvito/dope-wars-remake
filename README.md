# Dope Wars

A Next.js / React remake with deterministic Classic and Pro engines, local save/resume, Supabase accounts and leaderboards, and Stripe Pro purchases.

## Local development

```sh
npm ci
npm run dev
```

Classic play needs no service credentials. Copy `.env.local.example` to `.env.local` and configure Supabase, Stripe and Resend to test account, payment, email and leaderboard integrations. Never expose the Supabase service role or Stripe secret as public environment variables.

## Deployment requirements

Apply `supabase/migrations/006_harden_game_security.sql` **before deploying this version**. It restricts profile updates so users cannot grant themselves Pro, protects completed sessions, and installs the service-only transactional `record_game_score` function used by score submission. No live database is modified by the verification scripts.

Also apply `supabase/migrations/007_classic_guest_leaderboard.sql` before deploying the free Classic leaderboard. It permits guest Classic results through the same service-only replay boundary, marks public guest scores, and keeps guest identities/action logs private. The server requires `SUPABASE_SERVICE_ROLE_KEY` for score writes. Existing accounts can post Classic scores for free; Pro modes still require Pro membership. Guests choose a 3–20 character nickname without an account. Each guest browser can post ten new runs per hour; retrying a saved run is idempotent and does not use the limit. This browser-cookie limit is basic abuse control, not bot prevention: clearing cookies bypasses it.

The leaderboard defaults to Classic and shows database/configuration failures separately from a real empty board. Finished runs show a prominent posting form, preserve errors for retry, and link to the matching mode after success. Score posting is always an explicit player action.

Configure Supabase email confirmation and its email delivery for normal signups. Existing accounts previously created with auto-confirmation cannot safely claim purchases by email alone. Guest buyers should use their private checkout setup link; signed-in buyers can activate the purchase on the matching account from that page.

Stripe fulfillment requires a paid one-time checkout containing the configured `STRIPE_PRO_PRICE_ID`. Subscribe the webhook to both `checkout.session.completed` and `checkout.session.async_payment_succeeded`. An unpaid checkout does not grant Pro.

## Saves and game rules

One run is saved automatically on the current browser/device, for guests and account holders. Reloading restores the exact Classic or Pro action history, including encounters and pending lab operations. The home menu can continue the run or reopen its final result. Starting another run replaces it after confirmation. These are local saves, not cross-device cloud sync; blocked/quota-limited browser storage displays a warning.

Saved balances are never trusted: the versioned seed and action history are replayed. Saves and submissions are limited to 5,000 actions / 750,000 serialized characters. Bump `SAVE_VERSION` when changing deterministic rules. Bank savings now earn the documented 5% per travel day, including when debt is zero; debt still grows 10%. Final-day travel ends the run even with a deferred reputation event.

Score validation checks legal actions and completed runs. It does not prevent automated play or players searching for favorable client-generated seeds; stronger competitive anti-cheat would need server-issued runs and additional infrastructure.

## Verification

```sh
npm test
npx tsc --noEmit
npm run lint
npm audit
npm run build
```

Both the default Turbopack production build and `npm run build -- --webpack` passed release verification. The default build needs permission to create worker sockets in restricted sandboxes, and the existing Google font setup requires network access during a fresh production build. Lint currently reports existing image/unused-import warnings but no errors.

Browser and database verification dependencies are optional test tools, not application dependencies:

```sh
npm install --prefix /tmp/dope-check-tools --no-save playwright @electric-sql/pglite
node --import tsx scripts/generate-check-fixtures.ts
PLAYWRIGHT_MODULE=/tmp/dope-check-tools/node_modules/playwright/index.mjs node scripts/verify-browser.mjs
PGLITE_MODULE=/tmp/dope-check-tools/node_modules/@electric-sql/pglite/dist/index.js \
PGLITE_TRGM_MODULE=/tmp/dope-check-tools/node_modules/@electric-sql/pglite/dist/contrib/pg_trgm.js \
node scripts/verify-db-security.mjs
```

Install a Playwright Chromium browser if needed, or set `CHROMIUM_EXECUTABLE_PATH` to an existing Chromium executable. `TEST_BASE_URL` defaults to `http://127.0.0.1:3000`; screenshots go to `/tmp/dope-wars-checks`. Browser checks cover onboarding, trading, finance, reload/Continue, encounters, endgame, Pro assets/labs/travel, corrupt/blocked storage, reduced motion, keyboard focus, and layouts from 320px phones through 1440px desktops. Database verification applies all migrations to ephemeral PostgreSQL and checks authorization, rollback and idempotency.

Optimized WebP game backgrounds retain the original PNG source files. Animated scenes provide still frames when reduced motion is enabled; encounter GIFs load on demand. Assets use a revalidating cache policy because their filenames are not content hashes.

Vercel Analytics is mounted only on Vercel deployments, avoiding missing-script requests when running the production server locally or self-hosting.

For the score prompt and unavailable-service retry flow, run `scripts/verify-score-browser.mjs` with the same browser variables and a local build without Supabase credentials. It checks nickname validation, final-result restore, mode/search navigation and phone/desktop layouts. Successful replay/submission and guest database behavior are covered by the score-action unit tests and `verify-db-security.mjs`.
