# ConsentBit — Webflow App Submission Notes (for reviewer)

ConsentBit adds a GDPR/CCPA cookie-consent banner to a Webflow site and lets the user
customize it, scan cookies, view consent logs, and manage their plan — all inside the
Designer panel. Below is how each item from the previous review was resolved.

## Fixes since last review

1. **Raw email in PostHog `identify` → removed.** No analytics library is bundled at all.
   Events are a single first-party `fetch()` to the capture endpoint. The account email is
   **SHA-256 hashed** and used only as an opaque `distinct_id`; email/name are never sent.
   ([src/lib/analytics.js](src/lib/analytics.js))

2. **Google Fonts (googleapis/gstatic, no SRI, undeclared) → removed.** No external fonts
   load. UI text uses the system font stack; all icons are **inline SVGs**. No font origins
   remain in `index.html` or `webflow.json`.

3. **Inline styles / strict CSP → moved to static CSS.** UI styling lives in static CSS
   classes ([src/styles/](src/styles/) + per-component `.css`). The only remaining inline
   styles are **dynamic runtime values** (the user's chosen banner colors/fonts rendered in
   the live preview), which cannot be static classes.

4. **Auto `app_opened` telemetry on load → deferred.** `app_opened` fires only on the
   **first explicit user interaction** (pointer/key), never automatically on load.

5. **Checkout hidden-form DOM injection → removed.** No hidden form / `document.body`
   append. Checkout opens on a click-gated navigation carrying a **short-lived opaque
   token** (`?t=`); the server exchanges it into a same-origin cookie and redirects to a
   clean URL. No PII or params in any URL.

6. **Heavy PostHog modules (autocapture/session-recording/heatmaps) → gone.** Removing the
   library dropped all of that code from the bundle (bundle size reduced accordingly).

7. **Hardcoded client-ID install snippet → per-site + placeholder.** The production install
   screen generates the script URL **per site** from the API
   (`https://manager.consentbit.com/consentbit/<siteId>/script.js`). No real tenant ID is
   hardcoded; any illustrative snippet uses a non-functional `YOUR_SITE_ID` placeholder.

8. **Competitor `cdn-cookieyes` demo snippet → removed.** No third-party provider strings
   remain anywhere in the source.

9. **PostHog public key → treated as public.** It is a publishable project key; nothing
   secret depends on it.

## How the banner is installed (no API script injection)
The app does **not** auto-inject scripts. The user **manually copies one `<script>` tag**
into their site's Custom Code → `<head>` and publishes; the app then verifies it is live by
fetching the published page. No `document.createElement('script')` runtime injection.

## Outbound origins (declared in `webflow.json` → `dataConnections`)
| Origin | Purpose |
|---|---|
| `https://manager.consentbit.com` | Backend API (Cloudflare Worker): auth, billing, scans, banner config, publish, verify. Also serves the per-site banner script the user installs (`/consentbit/<siteId>/script.js`, loaded on the user's own site, not the panel). Holds all secrets. |
| `https://accounts.consentbit.com` | Hosted checkout page (paid plans). |
| `https://us.i.posthog.com` | Product analytics (privacy-hardened, see item 1/4/6/9). |

## OAuth scopes
- `sites:read` — read domains / publish state to guide install & verify.
- `sites:write` — publish the site from the "Publish" button.
- `authorized_user:read` — read the authorizing user's email to label the account.

The OAuth token is exchanged and stored **server-side** (our worker); it is never exposed
to the client or persisted in web storage.

## How to review
Open the app in the Designer on a test site → **Authorize** → choose **Free** (or start a
paid trial) → customize the banner → copy the snippet into `<head>` → **Publish** → **Verify**.

Contact: web@consentbit.com
