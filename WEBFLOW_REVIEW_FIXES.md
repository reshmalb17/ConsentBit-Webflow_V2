# ConsentBit — Webflow Review Fixes (resubmission round)

Response to the Marketplace review rejection. Previous approved version: **2.0.1**.
All changes verified against the built production bundle (`public/assets/index-*.js`).

## Summary

| # | Finding | Fix | Files | Verified in bundle |
|---|---------|-----|-------|--------------------|
| 1 | Raw email sent to PostHog `identify()` | Email is **SHA-256 hashed** into an opaque `distinct_id`; email/name never sent | `src/lib/analytics.js` | `identify(e,{email…})` absent |
| 4 | Auto `app_opened` on load, no user action | **Deferred** — queued on load, sent on first `pointerdown`/`keydown` | `src/lib/analytics.js` | — |
| 6 | Heavy PostHog modules shipped | **Removed `posthog-js`**; events sent via one first-party `fetch()`. Bundle 586 → 369 kB (gzip 180 → 108 kB) | `src/lib/analytics.js`, `package.json` | no `autocapture`/`sessionrecording`/`rrweb` |
| 9 | PostHog public key embedded | Confirmed publishable; nothing secret depends on it (documented) | — | — |
| 2 | Google Fonts external, undeclared, no SRI | **No external fonts.** System font stack for text; ~30 icons converted to **inline SVGs**; `<link>`s removed | `index.html`, `src/components/lib/icons.jsx`, `src/styles/*.css` | no `fonts.googleapis`/`material-symbols` |
| 5 | Checkout hidden-form + DOM injection | Replaced with **click-gated navigation carrying a short-lived opaque `?t=` token**; backend GET exchanges it into a cookie | `src/lib/webflowAuth.js`, `consentbitwebapp/app/api/checkout-open/route.ts`, `consentbitwebapp-Test/app/api/checkout-open/route.ts` | no `createElement("form")` |
| 7 | Hardcoded real client ID `040a441d…` | Dev-only gallery **excluded from prod bundle** + IDs replaced with `YOUR_SITE_ID` | `src/main.jsx`, gallery variants | `040a441d…` absent |
| 8 | CookieYes competitor snippet | Same — replaced with ConsentBit placeholder + excluded | `src/main.jsx`, `src/components/screens/modals/WInstallCode.jsx` | `cookieyes` absent |
| 3 | Inline styles vs strict CSP | Low-risk (Designer Extensions permit inline styles); documented, not refactored | — | — |

## Details

### Analytics (#1, #4, #6, #9)
Rewrote `src/lib/analytics.js` to remove the `posthog-js` library entirely. Each event
is a single first-party `fetch()` POST to `https://us.i.posthog.com/capture/`.
- **No PII:** the account email is SHA-256 hashed (`crypto.subtle.digest`) and used only
  as an opaque `distinct_id`. Email/name are never sent as event properties.
- **No implicit collection:** no autocapture, pageviews, session recording, heatmaps, or
  device metadata — only the named events (`app_opened`, `banner_customized`,
  `banner_published_*`).
- **No storage / no external scripts:** nothing written to localStorage; no third-party
  script loaded.
- **Deferred `app_opened`:** on load the event is queued, not sent. A one-time
  `pointerdown`/`keydown` listener sends it on the first explicit user interaction. If the
  user never interacts, it is never sent. (This implements the reviewer's "defer until
  first explicit user action" option; the listener is one valid mechanism — it could
  instead be tied to the Authorize button.)
- `posthog-js` removed from `package.json` dependencies.

### Fonts (#2)
- `index.html`: removed the two Google Fonts `<link>`s + two `preconnect`s.
- `src/components/lib/icons.jsx`: the ~30 Material Symbols glyphs are now inline SVGs
  (stroke-based, 24×24, `currentColor`), same `Icon.<name>(props)` interface and sizes.
- `src/styles/styles.css`: removed the `.material-symbols-rounded` font-face block.
- `src/styles/*.css`: dropped `"DM Sans"` and `"JetBrains Mono"` names, leaving the
  existing system font-stack fallbacks.

### Checkout (#5)
**Why it was flagged:** the old code built a hidden `<form>`, appended it to
`document.body`, and `submit()`-ed it to open checkout — direct DOM manipulation +
popup/navigation, which the reviewer asked to replace with a click-gated redirect using a
short-lived token.

**What changed:**
- `src/lib/webflowAuth.js` `startCheckout()`: removed the hidden `<form>` +
  `document.body.appendChild` + `form.submit()`. It now mints the short-lived opaque
  token (existing worker endpoint), then opens
  `${CHECKOUT_BASE_URL}/api/checkout-open?t=<token>&dest=<dest>` via
  `window.open(href, "_blank", "noopener,noreferrer")`. If no token is minted it throws a
  friendly error (both call sites already try/catch and surface it).
- `app/api/checkout-open/route.ts` (prod + Test): the GET handler now reads `?t=`, sets
  the same short-lived same-origin `cb_checkout` cookie the POST path set (`{ t }`), and
  303-redirects to the clean checkout page. No PII/params in any URL; no DOM injection.
- Also removed the `execCommand` clipboard fallback in `WInstallVerify.jsx` (only
  `navigator.clipboard` remains) so no `createElement`/`appendChild` ships at all.

**End-to-end flow:**
1. Plugin → `POST /api/v2/webflow-checkout-token` (worker) mints an opaque token, stores
   the context (site, plan, interval, email) in KV.
2. Plugin → `window.open("…/api/checkout-open?t=<token>&dest=…")`.
3. `/api/checkout-open` **GET** → sets `cb_checkout={ t }` cookie → 303 redirect to the
   clean `/checkout-plan` URL (token not in this URL).
4. Checkout page reads the cookie (`token = urlT || handoff.t`, `checkout-plan/page.tsx`)
   → `GET /api/checkout-token?t=<token>` resolves the context → renders Stripe checkout.

**Backend changes required:** only the `/api/checkout-open` **GET** handler (added, prod +
Test). Every other hop already existed — the worker mint endpoint
(`webflowCheckoutToken.js`), the `/api/checkout-token` exchange route, and the page's
cookie/token consumption — and all already handle the `{ t: token }` cookie shape (the old
POST path produced the identical cookie). **Action: redeploy the webapp** so the GET goes
live; the plugin change ships in the bundle.

### Hardcoded IDs / competitor snippet (#7, #8)
- `src/main.jsx`: the dev-only design gallery (`App.jsx`) is now dynamically imported
  behind the `VITE_GALLERY` build flag, so it and its demo/mock install snippets are
  tree-shaken out of the production bundle.
- The real install screen (`WInstallVerify.jsx`) already builds the CDN script URL
  per-site from the API (`status.scriptUrl`) — no hardcoded ID.
- Sanitized the gallery variants (`WInstallVerifyCompact/TwoCol.jsx`, `WInstallCode.jsx`)
  to `YOUR_SITE_ID` / a ConsentBit placeholder as a backstop.

### PostHog project key (#9)
The embedded `phc_…` key is PostHog's **Project API key** — write-only / capture-only. It
can *only* ingest events; it cannot read data, run queries, or change settings, and PostHog
intends it to be public in client code. Verified the bundle contains **only** this `phc_`
key — no Personal API key (`phx_`), no Stripe secret. ConsentBit's auth is the worker OAuth
session, unrelated to this key, so **no secret depends on it** (the reviewer's requirement).
Possessing it grants only the ability to send junk events — no user data, account, or
billing access. Optional hardening (PostHog dashboard): rotate the key, restrict Authorized
URLs, disable unused capture features, enable bot/rate-limit filtering. Not hidden/obfuscated
on purpose — it is meant to be public.

### Inline styles vs strict CSP (#3)
Being addressed by moving **static** inline styles into co-located CSS files (per component),
while genuinely **dynamic** styles — values computed at runtime from user input (banner
preview colors/layout/device, conditional opacity, selected states) — remain inline, since
they cannot be static CSS.

**Done — `kit/` and `screens/` folders.** Total inline styles across `src/`: **693 → 262
(-62%)**, extracted into **30 co-located CSS files** plus a shared `kit/modal.css`
(overlay/card/title/text used by all dialogs). Build verified after every pass.

The 262 remaining inline styles are all legitimate:
- **~140** — the two live banner renderers (`WIabBanner`, `WEdPreview`): fully config-driven
  previews of the user's customization (colors, layout, device, font weight, animation).
  These values only exist at runtime and cannot be static CSS.
- **~62** — the dev-only gallery variants (`WInstallVerifyTwoCol/Compact`, `WInstallCode`),
  which are **excluded from the production bundle** (finding #7/#8), so they don't ship.
- **~60** — genuinely dynamic bits across the converted screens (accent colors, conditional
  opacity/`busy` states, selected swatches/cells, prop-driven sizes).

So in the shipped bundle, essentially every remaining inline style is runtime-dynamic.

Note: the app renders correctly in the Designer today, which confirms Webflow's CSP permits
inline styles — so #3 is an advisory. This refactor reduces inline-style volume substantially
as a good-faith response; what remains is legitimately dynamic. A visual smoke-test in the
Designer is recommended before resubmitting, since a build can't catch visual regressions.

## Bundle verification (after `npm run build`)
- `040a441d4818e9d47ed2318bd7caaed6` → **0 hits**
- `cookieyes` → **0 hits**
- `fonts.googleapis` / `material-symbols` → **0 hits**
- `autocapture` / `sessionrecording` / `rrweb` → **0 hits**
- `createElement("form"|"script"|"textarea")` → **none**
- Bundle size: **586 kB → 369 kB** (gzip 180 → 108 kB)

## Before resubmitting
1. **Plugin:** `npm install` (drop `posthog-js` from the lockfile) → `npm run wf:bundle`.
2. **Webapp:** deploy `consentbitwebapp` so the `/api/checkout-open` GET (token exchange)
   is live — otherwise the new token-URL checkout won't resolve.
3. Bump the app version above `2.0.1` (recommend `3.0.0`) for the update submission.
4. (Optional, safest for #4) add a one-line telemetry disclosure on the landing screen —
   satisfies "disclose" in addition to "defer."
