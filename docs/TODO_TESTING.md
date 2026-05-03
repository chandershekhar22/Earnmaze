# Testing TODO — automated coverage for consent flows

Stack already installed: **Vitest** + `@testing-library/svelte`. Need to add **Playwright** for E2E.

Recommended over Selenium: faster, better SvelteKit integration, auto-waits eliminate flaky tests, built-in trace viewer.

## Phase 1 — Unit tests (~1 hour)

Pure functions, run in milliseconds, no infra needed. Covers ~80% of consent-helper bug surface.

### Files to create

| File | Coverage |
|---|---|
| `src/lib/utils/mask.test.ts` | `maskEmail` — short locals, missing `@`, unicode, null/empty input |
| `src/lib/stores/cookie-consent.test.ts` | `acceptAll`/`rejectAll`, version expiry, 12-month TTL, SSR safety, `reopen` |
| `src/routes/survey-consent/safePath.test.ts` | Open-redirect rejection: `//evil.com`, `/\evil`, off-origin URL, malformed |
| `src/lib/server/email-consent.test.ts` | `canSendMarketing` returns false for inactive users, true for opted-in (mock DB) |

### Run with

```bash
cd em-panel
npm run test
```

Already wired up via `vitest` in `package.json`.

## Phase 2 — Playwright E2E (~half-day setup + ~3-4 hours)

Real browser flows. Tests catch UI regressions and full-stack data flow that unit tests can't.

### Setup

```bash
cd em-panel
npm install -D @playwright/test
npx playwright install chromium    # download browser binary
```

Add to `package.json`:
```json
"scripts": {
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

Create `playwright.config.ts` at project root.

### Test database strategy

Use **seed + cleanup** pattern. Each test creates a user with a known prefix (`e2e-{uuid}@example.com`), runs the flow, deletes via SQL or API.

Don't transaction-rollback — Playwright spans multiple HTTP requests, transactions don't survive.

### Flows to cover

| Flow | Test file | Steps |
|---|---|---|
| Cookie banner accept | `tests/e2e/cookie-banner-accept.spec.ts` | Visit `/`, see banner, no Clarity/GA loaded → click Accept all → scripts load → reload → no banner |
| Cookie banner reject | `tests/e2e/cookie-banner-reject.spec.ts` | Click Reject all → no scripts load even after navigation → footer "Cookie settings" reopens banner |
| Register requires consent | `tests/e2e/register-consent.spec.ts` | Submit without ticking → button disabled. Tick all 3 → submit succeeds → DB row has `tos_accepted_at`/`age_verified_at`/`privacy_accepted_at` set |
| Register marketing opt-in | `tests/e2e/register-marketing.spec.ts` | Tick optional marketing → audit log row appears with `source=register-form` |
| Earn-points implicit consent | `tests/e2e/earn-points-implicit.spec.ts` | Submit form → user record has timestamps stamped → audit log shows source=earn-points-form (only if marketing checked) |
| Guest upgrade re-consent | `tests/e2e/guest-upgrade-consent.spec.ts` | Step 3 of /guest/upgrade requires 3 boxes → submission re-stamps consent timestamps with current date |
| Forgot-password activation | `tests/e2e/forgot-password-activation.spec.ts` | Guest who never set password → /forgot-password → reset link → page shows consent UI → first-time activation succeeds |
| Existing-user reset (no consent UI) | `tests/e2e/forgot-password-existing.spec.ts` | Existing panelist with `tosAcceptedAt` set → reset page does NOT show consent boxes → submission works |
| Survey-consent gate first time | `tests/e2e/survey-consent-gate.spec.ts` | First-time user clicks `/start-survey?surveyId=X` → redirects to `/survey-consent?next=...` → accept → redirects back → survey transaction created |
| Survey-consent gate skipped | `tests/e2e/survey-consent-skip.spec.ts` | Already-accepted user clicks survey → no consent redirect, goes straight to qsurvey URL |
| Profile marketing toggle | `tests/e2e/profile-marketing-toggle.spec.ts` | Toggle on → audit log row appears with `source=profile-page` → reload → state persists → toggle off → another row |
| Open-redirect protection | `tests/e2e/survey-consent-redirect-safety.spec.ts` | Visit `/survey-consent?next=//evil.com` and `?next=/\evil` → after accept, redirects to `/surveys` (fallback), not the attacker URL |

### Per-test cleanup helper

Add `tests/e2e/helpers/db.ts` with `cleanupTestUser(emailPrefix)` that deletes:
- `users` row matching prefix
- Cascading: `email_consent_log`, `panelist_points`, `survey_transactions`, `sessions`

Run cleanup in `afterEach` / `afterAll`.

### Where Playwright runs

- **Local dev** during feature work (`npm run test:e2e:ui` for the visual debugger)
- **CI on push** (GitHub Actions / GitLab CI — runs `npm run test:e2e` headless)
- **Pre-deploy** against staging is overkill for current scale; revisit at higher traffic

## Pragmatic rollout

1. **Day 1:** Phase 1 unit tests. ~1 hour. High value, no new tools.
2. **Day 1:** Phase 2 setup + cookie banner E2E (smallest flow). Verify CI integration.
3. **Day 2-3:** Remaining E2E flows, prioritised by risk:
   - Register, earn-points (highest user volume)
   - Survey-consent gate (compliance-critical)
   - Forgot-password activation (edge case, easy to break)
   - Cookie banner reject (legal exposure if wrong)
4. **Ongoing:** Add a Playwright spec alongside any new consent-touching feature.

## Notes / decisions to make at start

- **Test user emails:** use `e2e-test-{uuid}@example.com` so they're easy to bulk-delete
- **Test DB:** point to a separate DB in CI; locally OK to run against dev DB if disposable
- **Turnstile bypass:** in test env, `TURNSTILE_SECRET_KEY` starting with `1x...` already short-circuits Turnstile validation (see `verifyTurnstile` in `lib/server/turnstile.ts`). Use the test site key `1x00000000000000000000AA` in Playwright config.
- **Email assertions:** Don't try to receive real emails. Mock the worker's `sendTask` calls or assert on the audit log / user state instead.
- **Headless vs headed:** CI runs headless; local dev runs `--ui` for debugging.

## Estimated total effort

- Phase 1: 1 hour
- Phase 2 setup + 1 sample test: 1 hour
- Phase 2 remaining 11 tests: 3-4 hours
- **Total: ~5-6 hours of focused work** to hit good consent-flow coverage
