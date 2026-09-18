Original prompt: Analyze this game and app end to end, then implement the highest-impact improvements to player experience, reliability, security, performance, responsive design, and accessibility. Inspect and run first, preserve identity, and verify relevant tests and browser sizes.

## Initial audit
- Next.js 16 / React 19, deterministic Classic and Pro engines, Zustand, Supabase, Stripe. No installed dependencies or service credentials.
- Confirmed: refresh loses all progress; score replay accepts incomplete runs and unchecked numeric/action input; Pro travel omits unlock enforcement; final-day reputation events bypass game over.
- Critical: authenticated profile UPDATE/INSERT policies permit setting is_pro; ordinary signup auto-confirms arbitrary email then links unclaimed purchases by email.
- Mobile dialogs and full-screen menus can clip; range controls lack labels; eager preload of every event/combat GIF adds unnecessary transfer.
- System git unavailable due to unaccepted Xcode license. No changes to that license.

## Plan
1. Run baseline app and tests after installing locked dependencies.
2. Harden engine/action replay and service authorization/payment boundaries; add focused regression tests and SQL migration.
3. Add resilient versioned local save/resume; improve actionable feedback, onboarding, mobile/keyboard access, and media loading.
4. Verify tests, typecheck/lint/build, browser gameplay at mobile/tablet/desktop; record remaining service integration limitations.

## Implementation progress
- Baseline: all 131 tests passed. App ran; inspected home and mobile trade dialog. Confirmed clipped market columns, tiny targets, invisible fade over lower rows, and unlabelled sliders.
- Added action validation, complete-score requirement, bounded linear replays, unlock and event-choice enforcement, unique loadout validation, final-day termination and documented bank interest.
- Added action-log-only versioned local saves with replay validation, Continue, storage-failure feedback, and new-run replacement confirmation.
- Added migration 006: profile column grants, active-only client sessions, service-only atomic/idempotent score function. Must apply before deploying score action.
- Removed email-only Pro linking; signup now respects Supabase email verification. Guest purchase claims require checkout setup link. Stripe grants only for paid configured Pro price; delayed payment success supported.
- Responsive market columns and 44px buttons, numeric alternatives to sliders, labels/focus outlines, compact news, quick guide, scrollable dialogs/full-screen encounters with focus trapping, reduced CSS motion.
- Removed ~4.86MB of unconditional GIF preloads; generated optimized game backgrounds. Original PNGs retained as sources.
- Required web-game client ran using a temporary copy with only executablePath adapted to cached Chromium. Screenshot and state inspected, no error file.

## Verification results
- 169 unit/regression tests pass, including invalid numeric/action payloads, incomplete score rejection, permissions at the server boundary, save replay in all four modes, bank interest, travel unlocks, final-day completion, payment status/product and redirect normalization.
- TypeScript passes. ESLint passes with existing unused-import/image warnings (no errors).
- Local PostgreSQL (PGlite): all six migrations applied; profile escalation and forged completed sessions denied; service-only score RPC; repeated score idempotence; failed leaderboard insert rolls back session; cross-user saves hidden.
- Browser: 320x568, 375x667, 768x1024, 1440x900, 667x375. Trades, exact banking/debt inputs, focus confinement, reload/Continue, Classic/Pro event/combat/loadout, last-day warning, result/restart, corrupt save recovery, reduced-motion stills, asset purchase/lab, restored pending lab, unlocked/locked city travel, touch and blocked storage all passed. No console/page errors. Screenshots visually inspected.
- Final browser run caught/fixed intro Skip hit-testing and footer overlap at short heights. A stale dev stylesheet required a server restart; final CSS clearance verified from computed layout.
- Next.js upgraded to 16.3.5; compatible security updates + sharp 0.35.4/tsx update. npm audit: zero vulnerabilities.
- Main background reduced from 5,570,228 bytes to ~224KB; eight unconditional GIF preloads removed (~4.86MB).
- Production Webpack build passes. Default Turbopack production build is blocked by sandbox worker socket permissions; first sandbox build also could not fetch Google fonts. No source workaround to conceal these environment limitations.
- Found working read-only git at /Library/Developer/CommandLineTools/usr/bin/git; git diff --check passes.

## Remaining deployment/integration work
- Apply migration 006 before deploying; no live credentials were present and no database deployment was attempted.
- Verify real signup confirmation, guest/existing-user purchase activation, webhook delivery and leaderboard writes with configured Supabase/Stripe/Resend test services.
- Saves are intentionally local to one browser. Legal replay validation is not full anti-bot/seed-search prevention. Existing legacy account email ownership cannot be assumed.
- Original PNGs and generation/debug assets retained; optimization changes served paths, not source artwork.

- Production-browser verification additionally caught the pre-existing Vercel Analytics script 404 on non-Vercel hosts. Analytics is now rendered only when VERCEL=1. All gameplay assertions had passed before the console-error check exposed this.
- Final built-production browser run passed the same complete scenario suite at all five viewports with zero console/page errors. Production screenshots inspected. Vercel-only analytics gate verified. Preview remains available at http://127.0.0.1:3001.

## Follow-up: separate quantity and average-cost columns
- Replaced combined QTY / AVG cell with distinct centered QTY and AVG columns in both header and every market row, with an explicit gutter before Buy/Sell.
- At the narrowest table widths, Buy/Sell stack vertically to retain separate readable data columns and 44px touch targets.
- Verified the rebuilt production preview at 320, 360, 375, 480, 768 and 1440px: column/header center alignment, no row overflow, populated quantity and average cost, and successful buy/sell actions. Screenshots inspected; zero browser errors. Required game client screenshot/state verified.
- Focused lint, TypeScript through production Webpack build, and git diff whitespace checks passed. Production preview restarted at the existing http://127.0.0.1:3001 address. No game rules or save format changed.

## Pre-push release verification
- Re-reviewed the full change set and fetched origin/main; local main has no divergence from the remote base.
- Fresh checks pass: 169 tests, TypeScript, lint (0 errors; 23 warnings), npm audit (0 vulnerabilities), all six migrations and security/transaction checks in isolated PostgreSQL, and full built-production browser suite at five sizes with no console/page errors. Latest screenshots inspected.
- Both Webpack and the default Turbopack production builds now pass when run with the needed sandbox permissions. Prior Turbopack failure was environmental.
- Scanned changed text files for credential/private-key patterns; no matches. Verified reduced-motion still-image paths exist.
- GitHub confirms main triggers Vercel Production deployments. Production migration 006 must be verified/applied before the push; Supabase dashboard currently requires the user to sign in. No live database changes or push performed yet.

## Follow-up: make leaderboard participation available to free players
- User reported an empty leaderboard and wants players to leave scores. Code diagnosis: Classic submissions explicitly rejected; result-screen posting hidden unless both the run and user were Pro; public board defaulted to Pro; missing configuration/query errors were presented as an empty board. The supplied live domain did not resolve in browser or curl here, so production data/traffic remains unverified.
- Added a free Classic board as the default, with separate labelled Pro modes. Completed Classic runs prompt for a nickname and explicit public posting without signup; signed-in free users use their own account name. Result-page errors can be retried and success links to the correct mode. Posting does not happen automatically.
- Added migration 007 for private guest identities, marked public guest scores, service-only atomic/idempotent submission, and an atomic ten-new-runs/hour browser limit. Completed action logs are still replayed; Pro membership checks remain. Cookie resets bypass the basic guest limit (documented); this is not bot protection.
- Database/configuration failures now display an unavailable state and retry, rather than false zero scores. Mode changes cancel stale search debounce/results.
- Updated the existing terms/privacy descriptions and README to reflect nickname posting and its essential cookie. Pre-existing SEO/blog edits remain intact.
- So far: 187 tests, TypeScript, focused lint, production Webpack build, and all seven migrations/security checks in isolated PGlite pass. Browser verification ongoing. No live database changes or deployment performed.
- Final verification: 187 tests pass; focused lint, TypeScript and final production Webpack build pass; git diff whitespace checks pass. Full gameplay suite passed all five viewport sizes with zero browser errors. Focused score suite passed at 320/375/1440px: nickname constraints, service-unavailable retry with retained input, completed-run restoration, separate mode URLs and cancelled searches. Screenshots visually inspected.
- Successful end-to-end submission additionally verified using the real built Next server, a temporary local Supabase-compatible HTTP adapter and migrated PGlite: guest nickname -> server replay -> secure HttpOnly guest cookie -> atomic database result -> visible Classic guest row. Reopening/reposting the same run retained the nickname and left exactly one score. No browser errors. Test data existed only in the temporary database; the harness shut down on completion.
- Required web-game client ran on the final build; screenshot/text state inspected. Score prompt/success/board/error screenshots are under /tmp/dope-score-checks. Local no-credentials preview is http://127.0.0.1:3001.
- Deployment remains outstanding: apply migration 007 after 006 with production Supabase access, then deploy the app with the service role key configured. Local workspace has no production service credentials. The live domain supplied by the user did not resolve here. No live writes or deployment were attempted.
