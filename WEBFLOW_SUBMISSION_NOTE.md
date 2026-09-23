# ConsentBit — Submission Notes

## Note for the reviewer (paste as-is)

UI update only. In the banner editor, selecting the combined GDPR+CCPA consent
template on a plan that does not include it now shows an "Upgrade to Pro" popup beside
the dropdown instead of applying the selection. The dropdown also now defaults to
GDPR.

No new permissions, OAuth scopes, or outbound origins. No change to the consent banner
served to site visitors.

Contact: web@consentbit.com

---

## What changed in this version

**"Upgrade to Pro" popup on the consent template.** The combined "CCPA+GDPR" template
runs both regimes on one site and is included on the Essential and Growth plans.
Selecting it on a lower plan is now refused: the dropdown returns to its previous
value and a small "Upgrade to Pro" card appears beside it, explaining the requirement
with a button to the in-app Upgrade tab.

The option stays listed and readable — it is not hidden or greyed out — so the user
can see what the higher plan includes. The card is a positioned popover next to the
dropdown rather than a full-screen dialog, so the user keeps their place in the
editor, and it matches the existing IAB TCF upsell already shown on the same screen.

The same dropdown and behaviour appear in two places: **General → Consent template**
and **Content → Localization**.

**Consent-template default.** The dropdown started on "CCPA+GDPR" for every new site.
It now starts on "GDPR (EU)". Sites with a template already saved are unaffected —
their saved value is loaded over the default, so nothing changes for an existing
install.

## Outbound origins

Unchanged from the previous submission.

| Origin | Use |
|---|---|
| `manager.consentbit.com` | Worker API — OAuth status, banner config, scans, billing, plan changes |
| `accounts.consentbit.com` | Hosted checkout page |
| `www.consentbit.com` | Privacy-policy link on the first screen |

## Review findings

- No new permissions or OAuth scopes; the manifest is unchanged.
- No new network destinations — the upsell button navigates to the existing in-app
  Upgrade tab, it does not open an external page.
- The popup renders through a React portal into `document.body`. It contains static
  text and one in-app button; no HTML is injected and no user input is rendered into
  it.
- No `createElement("script"|"form"|"textarea")`, no `execCommand`, no `eval`.
- No external fonts or third-party scripts; the arrow icon is an inline SVG.
- No change to the consent banner delivered to end users.

## How to verify

Open the app in the Designer on a test site on the Free or Basic plan, then go to
**General → Consent template**. It reads "GDPR (EU)". Open the dropdown and choose
"CCPA+GDPR": the dropdown returns to "GDPR (EU)" and the "Upgrade to Pro" popup
appears to the right of it. **Get Pro Plan** switches to the Upgrade tab. Clicking
anywhere else, pressing Escape, or picking a different template dismisses it.

The same behaviour appears under **Content → Localization**.

On an Essential or Growth site, "CCPA+GDPR" is selected normally and no popup appears.

Contact: web@consentbit.com
