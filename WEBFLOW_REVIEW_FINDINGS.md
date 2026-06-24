# Webflow Marketplace Review — Findings Check (New Design)

> Cross-check of the **Webflow Marketplace rejection feedback** (resolved in
> `Currently live - Copy/ConsentBit`) against the current
> `Consentbit-Webflow-App-New -Design` project.
> PostHog / analytics / Sentry items are **omitted** per request.
>
> Date: 2026-06-25

## TL;DR

The new design is currently a **UI redesign / prototype** — most backend wiring
(auth-token storage, checkout, CSV export, runtime `fetch`, banner-script
injection) is **not implemented yet**, so most of the rejected *behaviors* are
not present. The findings that **do** apply today are the two link-safety items
and the manifest declaration gap. The rest are **forward-looking risks** to avoid
re-introducing when the integration is wired up.

---

## A. Present today — needs fixing

### A1. `target="_blank"` anchors missing `rel="noopener noreferrer"`
Review required **both** `noopener` and `noreferrer` on every `_blank` anchor.
Current state is inconsistent:

| File | Line | rel present | Gap |
|---|---|---|---|
| [WIabBanner.jsx](src/components/kit/WIabBanner.jsx#L179) | 179 | `noopener noreferrer` | ✅ OK |
| [WEdPreview.jsx](src/components/kit/WEdPreview.jsx#L102) | 102 | `noreferrer` only | ⚠️ missing `noopener` |
| [WVerifyModal.jsx](src/components/kit/WVerifyModal.jsx#L45) | 45, 51 | `noopener` only | missing `noreferrer` |
| [WInstallVerify.jsx](src/components/screens/auth/WInstallVerify.jsx#L31) | 31, 33, 57 | `noopener` only | missing `noreferrer` |
| [WInstallVerifyCompact.jsx](src/components/screens/auth/WInstallVerifyCompact.jsx#L33) | 33, 37, 60 | `noopener` only | missing `noreferrer` |
| [WInstallVerifyTwoCol.jsx](src/components/screens/auth/WInstallVerifyTwoCol.jsx#L32) | 32, 34, 55 | `noopener` only | missing `noreferrer` |

Note: `WEdPreview.jsx:102` is the only real tabnabbing concern (`noopener` is the
protective attribute; `noreferrer` implies it in modern browsers but the
reviewer checks for the literal pair). **Fix:** standardize on
`rel="noopener noreferrer"` for all of them.

### A2. `window.open` missing `noreferrer`
[webflowAuth.js:30](src/lib/webflowAuth.js#L30) — `window.open(href, "_blank", "noopener")`.
Has `noopener` but the review asked for `"noopener,noreferrer"`.
**Fix:** `window.open(href, "_blank", "noopener,noreferrer")`.

### A3. Outbound origins not declared in `webflow.json`
[webflow.json](webflow.json) has no `permissions` / `dataConnections` block.
The app already references `https://cdn.consentbit.com/...` (install snippet in
[WAddScript.jsx](src/components/kit/WAddScript.jsx#L23) and the WInstallVerify
screens) and will add backend origins once `fetch` is wired. Same declaration
gap that was flagged. **Fix:** declare every outbound origin (cdn/app/manager/
accounts/dashboard `.consentbit.com`) in the manifest before submitting.

---

## B. Not present today — forward-looking risks (don't regress)

These rejected behaviors are **absent** in the current code because the feature
isn't implemented yet. Listed so they aren't re-introduced during wiring.

### B1. PII in checkout URL (base64 query param) — NOT present ✅
No `btoa`/checkout-URL PII flow exists. The new OAuth flow
([webflowAuth.js](src/lib/webflowAuth.js)) redirects to a worker endpoint —
a **better** pattern than the rejected base64-in-URL approach.
**When wiring checkout:** pass `billingEmail`/`siteId`/`platformId` via server-side
POST or a short-lived signed token — never in the URL query string.

### B2. Bearer tokens in `localStorage`/`sessionStorage` — NOT present ✅
Only one `localStorage` reference exists and it's **descriptive banner copy text**
in [bannerContent.js:62](src/lib/bannerContent.js#L62), not token storage. No
`Bearer`/`Authorization`/`atob` JWT parsing yet.
**When wiring auth:** hold tokens in memory or use httpOnly secure cookies — don't
persist bearer tokens in web storage.

### B3. Direct DOM manipulation for CSV download / clipboard — NOT present ✅
- The CSV "Download Pdf" button in [WConsentLogs.jsx:83](src/components/screens/app/WConsentLogs.jsx#L83) has **no handler** (mockup).
- The `createElement`/`appendChild` in [WWebflowHeadMock.jsx:43](src/components/kit/WWebflowHeadMock.jsx#L43) is **escaped display text** (a visual mockup of the customer's head code), not real DOM mutation.
- No `execCommand("copy")` and no `navigator.clipboard` usage.

**When wiring export/copy:** use `navigator.clipboard.writeText()` for copy, and a
`Blob` + `useRef`-managed link for downloads — not `document.body.appendChild`.

### B4. Direct `createElement('script')` runtime injection — NOT present ✅
No real script injection in the new design. The live version uses the approved
`registerScript` / `applyScripts` Data API — keep using those, not raw
`document.createElement('script')`, when banner-script injection is added.

---

## Summary table

| # | Review finding (non-PostHog) | Status in New Design |
|---|---|---|
| A1 | `target="_blank"` missing `rel="noopener noreferrer"` | ⚠️ Present (inconsistent) |
| A2 | `window.open` missing `noreferrer` | ⚠️ Present |
| A3 | Outbound origins not declared in `webflow.json` | ⚠️ Present |
| B1 | PII (base64) in checkout URL | ✅ Not present — keep it that way |
| B2 | Bearer tokens in local/sessionStorage | ✅ Not present — keep it that way |
| B3 | DOM-injected CSV download / clipboard `execCommand` | ✅ Not present — keep it that way |
| B4 | Raw `createElement('script')` injection | ✅ Not present — keep it that way |
