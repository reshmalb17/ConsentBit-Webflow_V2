# ConsentBit — Webflow App Submission Notes (for reviewer)

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
- **No PII or tokens in URLs.** Checkout is opened by POSTing context in the request
  **body** (an auto-submitting form) → the server stashes it in a short-lived,
  same-origin cookie → redirects to a clean checkout URL. Nothing sensitive appears in
  any query string.
- **No bearer tokens in `localStorage`/`sessionStorage`.** Auth is server-side only.
- **Clipboard** uses `navigator.clipboard`; **downloads** use a `Blob` + object URL.
- All `target="_blank"` links use `rel="noopener noreferrer"`; the single `window.open`
  uses `"noopener,noreferrer"`.

## Product analytics (PostHog) — privacy-hardened
We use PostHog only to count a few explicit product events (app opened, banner
customized, banner published). It is configured in a strict, review-safe mode:
- `persistence: "memory"` — **no localStorage**.
- `autocapture: false`, `capture_pageview: false` — **no DOM scraping / implicit events**.
- `disable_session_recording`, `disable_surveys`, `disable_web_experiments` — off.
- `disable_external_dependency_loading`, `advanced_disable_decide` — loads **no external
  scripts** and makes **no feature-flag calls**.

So PostHog **only POSTs the explicit events we define** to `us.i.posthog.com` (declared
above). No session recording, no autocapture, no third-party script loading.

## Test credentials / how to review
- Open the app in the Designer on any test site and **Authorize**.
- Choose the **Free** plan (or start a paid 14-day trial) to reach the editor.
- Customize the banner, copy the install snippet into `<head>`, **Publish**, then **Verify**.

Contact: web@consentbit.com
