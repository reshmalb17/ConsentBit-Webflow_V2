# Compliance Proof — Privacy-Policy URL Input Hardening

**App:** consentbit-webflow-app (Designer Extension)
**Scope:** the "Cookie policy → URL" field in the banner Content editor, and the value it
persists (`privacyPolicyUrl`) which is rendered as an `<a href>` on the customer's
published banner.
**Reference:** Webflow Marketplace Guidelines — https://developers.webflow.com/apps/docs/marketplace-guidelines

This document maps each relevant Webflow guideline to the change we made, with the exact
file/line and the evidence that verifies it. It is intended as review proof for submission.

---

## 1. The issue we fixed

The privacy-policy URL a user types in the editor was passed through to `privacyPolicyUrl`
with **no scheme validation and no length limit**, then rendered as an anchor `href` on the
customer's live site. A value such as `javascript:alert(document.cookie)` would therefore
become an executable link on a published Webflow project — i.e. our App could introduce a
vulnerability into a user's project. The field also seeded a broken placeholder value
(`https.link.com`).

## 2. Webflow guidelines this addresses (verbatim)

| # | Section | Guideline (quoted verbatim) |
|---|---------|------------------------------|
| G1 | Safety / Legal | "We do not allow Apps that intend to harm or compromise the security of our users or **their projects**." |
| G2 | Safety / Legal | "Implement appropriate security measures to protect user data from unauthorized access or breaches." |
| G3 | Performance / Technical | "Do not use statements or patterns that could introduce vulnerabilities in your App (e.g. `eval()` statements, direct DOM manipulation, excessive use of global variables, etc.)." |
| G4 | Performance / Technical | "Ensure that your App's source code is well-organized and adheres to industry standards and conventions." |
| G5 | Design / Usability | "Apps that are error prone, not actively maintained, or those that present users with persistent usability issues will be removed from the marketplace." |

## 3. What we changed — compliance mapping

Defense is applied at three independent layers so a dangerous value is stopped no matter
its source (typed in the editor, loaded from the webapp, or migrated from the DB).

| Layer | File · line | Change | Satisfies |
|-------|-------------|--------|-----------|
| **A. Input validation + feedback** | `src/components/screens/app/WEdContent.jsx:19` (`classifyPolicyUrl`), `:216`–`:231` (field) | Classifies the value live; shows a red border + inline message. Dangerous schemes and malformed URLs are flagged as the user types. | G1, G5 |
| **A. Length limit** | `WEdContent.jsx:36` (`LIMITS.policyUrl = 300`), `:224` (`maxLength`) | The URL field was the only text field with no `maxLength`; now capped at 300. | G2, G5 |
| **A. Format guidance** | `WEdContent.jsx:225` (`placeholder`) | Placeholder `https://example.com/privacy` matches Webflow's `https://` link-field convention; broken default value removed (`src/lib/bannerContent.js:156` → `policyUrl: ""`). | G5 |
| **B. Block on save** | `src/lib/saveBanner.js:36` | `saveBanner` refuses to persist and returns a user-facing error when the policy link is shown and the URL carries a dangerous scheme. | G1, G3 |
| **C. Persistence sanitizer (authoritative gate)** | `src/lib/buildCustomizationPayload.js:47` (`isDangerousUrl`), `:55` (`sanitizePolicyUrl`), `:130` (applied) | Final gate before the value becomes `privacyPolicyUrl`. Strips `javascript:` / `data:` / `vbscript:` / `file:` — including whitespace/control-char obfuscations — regardless of how the value arrived. | G1, G3 |
| **Code quality** | shared `isDangerousUrl` used by all three layers | Single source of truth; no `eval`, no `innerHTML`, no direct DOM injection. | G3, G4 |

### Core rule (well-organized, single source of truth — G4)

```js
// src/lib/buildCustomizationPayload.js
export function isDangerousUrl(raw) {
  const bare = String(raw ?? "").replace(/[\x00-\x20\x7f-\xa0]/g, "").toLowerCase();
  return /^(javascript|data|vbscript|file):/.test(bare);
}
export function sanitizePolicyUrl(raw) {
  return isDangerousUrl(raw) ? "" : String(raw ?? "");
}
```

The control-char strip (`\x00-\x20\x7f-\xa0`) runs **before** the scheme test, so
obfuscations like `" javascript:"`, `"java\tscript:"`, and mixed case are all caught.
The original string is returned untouched when safe, so legitimate URLs are never altered.

### Editor validation rule (G1, G5)

```js
// src/components/screens/app/WEdContent.jsx
function classifyPolicyUrl(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return "empty";
  if (isDangerousUrl(s)) return "dangerous";           // blocks save
  if (/^https?:\/\/[^\s./]+\.[^\s]+/i.test(s)) return "ok";
  return "malformed";                                   // warns inline
}
```

## 4. Behavior (before → after)

| Input | Before | After |
|-------|--------|-------|
| `javascript:alert(1)` | saved verbatim → executable link on live site | inline error, **save blocked**, sanitized to `""` at the gate |
| `data:` / `vbscript:` / `file:` | saved verbatim | same as above |
| ` javascript:` / `java\tscript:` (obfuscated) | saved verbatim | detected and blocked |
| `/privacy`, `example.com` (relative / no scheme) | saved; broke in the Designer preview | inline warning: "Enter a full URL starting with https://…" |
| `https://example.com/privacy` | saved | accepted, no warning |
| 400+ characters | saved (unbounded) | capped at 300 |
| default seed | `https.link.com` (broken) | empty, with `https://…` placeholder |

## 5. Design decision — why a full `https://` URL is required

The banner renders the link with `target="_blank"`. We require an absolute `https://`
URL (rather than accepting relative paths like `/privacy`) because:

- The value the user types is exactly what opens in the new tab — no origin-resolution
  step, and identical behavior between the Designer preview and the published site.
- It matches Webflow's own Link-field convention, whose placeholder is `https://`.
- It removes an "error-prone / persistent usability issue" (G5): relative paths render
  correctly on the live site but appeared broken in the in-app preview.

Dangerous schemes are always **blocked**; merely malformed values only **warn** (they do
not block the save), so a user is never hard-stopped over a formatting nitpick.

## 6. Verification evidence

- **Unit tests (pure functions):** `sanitizePolicyUrl` 17/17 and `classifyPolicyUrl`
  13/13 cases pass, covering legitimate URLs, relative/bare inputs, dangerous schemes,
  and obfuscations. (Run against the actual exported module.)
- **Production build:** `npm run build` — 133 modules transformed, no errors.
- **Bundle check:** the removed placeholder string `https.link.com` returns **0 hits**
  in the built bundle.
- **No unsafe patterns:** the fix uses string/regex checks only — no `eval`, no
  `innerHTML`, no direct DOM manipulation (G3).

## 7. Files changed

- `src/lib/buildCustomizationPayload.js` — added `isDangerousUrl` / `sanitizePolicyUrl`; applied at the persistence gate.
- `src/lib/saveBanner.js` — block save on a dangerous URL.
- `src/components/screens/app/WEdContent.jsx` — `classifyPolicyUrl`, inline validation UI, `maxLength`, placeholder, deduplicated field.
- `src/components/screens/app/WEdContent.css` — `.input.is-invalid` / `.cb-field-error` styles.
- `src/lib/bannerContent.js` — removed the broken default (`policyUrl: ""`).
