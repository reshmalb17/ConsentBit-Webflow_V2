# ConsentBit — Webflow App Submission Notes (for reviewer)

## Changes made in response to the previous review

- **PII in analytics (fixed):** Removed the `posthog-js` library entirely. Analytics
  now uses a single first-party `fetch()` to the capture endpoint. The account email
  is **SHA-256 hashed** and used only as an opaque `distinct_id` — no raw email/name
  is ever sent. `app_opened` is **deferred to the first explicit user interaction**,
  never fired on load. Removing the library also dropped all autocapture / session-
  recording / heatmap / device-metadata / external-loading code (bundle 586 kB → 369 kB).
- **Google Fonts (fixed):** No external fonts are loaded. UI text uses the system font
  stack; the ~30 UI icons are now **inline SVGs** (previously the Material Symbols web
  font). No `fonts.googleapis.com` / `fonts.gstatic.com` origins, no SRI concern.
- **Checkout DOM manipulation (fixed):** The hidden auto-submitting form is gone.
  Checkout now opens with a plain click-gated navigation carrying only a **short-lived
  opaque token** (`?t=`); the server exchanges it into a same-origin cookie and
  redirects to a clean checkout URL. No PII/params in the URL, no DOM injection.
- **Hardcoded client ID / competitor snippet (fixed):** Those strings lived in a
  dev-only design gallery that is now **excluded from the production bundle** (verified
  absent). The install screen generates the CDN script URL **per site** from the API.
- **PostHog public key:** confirmed publishable; nothing secret depends on it.


## What the app does
ConsentBit adds a **GDPR / CCPA cookie-consent banner** to a Webflow site and lets the
user customize it, scan the site's cookies, view consent logs, and manage their plan —
all inside the Designer panel.

## How the banner is installed (no API script injection)
The app does **not** auto-inject scripts via the Registered Scripts API. The user
**manually copies a single `<script>` tag** into their site's **Custom Code → `<head>`**
and publishes. The app then verifies the tag is live by fetching the published page.
No `document.createElement('script')` runtime injection anywhere in the extension.

## OAuth scopes (and why)
- `sites:read` — read the site's domains / publish state to guide install & verify.
- `sites:write` — **publish** the site on the user's behalf from the "Publish" button.
- `authorized_user:read` — read the authorizing user's email to label the account.

The OAuth token is exchanged and stored **server-side** (our worker); it is **never**
exposed to the client or persisted in web storage.

## Outbound origins (declared in `webflow.json` → `dataConnections`)
| Origin | Purpose |
|---|---|
| `https://manager.consentbit.com` | Backend API (Cloudflare Worker): auth status, billing, scans, banner config, publish, verify. Holds all secrets. |
| `https://accounts.consentbit.com` | Hosted checkout page (paid plans). |
| `https://cdn.consentbit.com` | The consent banner script the user installs (shown for copy; loaded on the user's own site, not the panel). |
| `https://us.i.posthog.com` | Product analytics (see below). |

## Data handling / security
- **Checkout carries only a short-lived opaque token.** A click opens checkout with
  `?t=<token>`; the server exchanges it into a short-lived, same-origin cookie and
  redirects to a clean checkout URL. No PII or Stripe data ever appears in a URL, and
  there is no hidden-form/DOM injection.
- **No bearer tokens in `localStorage`/`sessionStorage`.** Auth is server-side only.
- **Clipboard** uses `navigator.clipboard`; **downloads** use a `Blob` + object URL.
- All `target="_blank"` links use `rel="noopener noreferrer"`; the single `window.open`
  uses `"noopener,noreferrer"`.

## Product analytics — privacy-hardened, no library
We count a few explicit product events only (app opened, banner customized, banner
published). There is **no analytics library** in the bundle — each event is a single
first-party `fetch()` POST to `us.i.posthog.com` (declared above):
- **No PII:** the account email is **SHA-256 hashed** and used only as an opaque
  `distinct_id`; email/name are never sent as properties.
- **No implicit collection:** no autocapture, no pageviews, no session recording, no
  heatmaps, no device metadata — only the named events above.
- **No storage / no external scripts:** nothing is written to localStorage and no
  third-party script is loaded.
- **Deferred:** `app_opened` fires on the **first explicit user interaction**, never
  automatically on load.

## Test credentials / how to review
- Open the app in the Designer on any test site and **Authorize**.
- Choose the **Free** plan (or start a paid 14-day trial) to reach the editor.
- Customize the banner, copy the install snippet into `<head>`, **Publish**, then **Verify**.

Contact: web@consentbit.com
