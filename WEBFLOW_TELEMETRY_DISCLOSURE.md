# Telemetry Disclosure & Compliance Record

**App:** consentbit-webflow-app (Designer Extension)
**Reference:** Webflow Marketplace Guidelines — https://developers.webflow.com/apps/docs/marketplace-guidelines
**Guideline addressed (verbatim):** "Provide clear and transparent information to users about the
collection, storage, and use of their data within your Marketplace App." · "It is imperative that
your App respects user privacy and handles personal data in accordance with relevant privacy laws
and regulations."

This document is the disclosure of the analytics the app collects, and the record of the change
made in response to the telemetry review finding. It is written for submission proof.

---

## 1. What changed

**All client-side analytics were removed from the extension bundle.** The three UI-only events the
reviewer observed in the bundle no longer exist:

| Removed client event | File |
|---|---|
| `profile_settings_viewed` | `src/components/screens/profile/WProfile.jsx` |
| `installation_code_copied` | `src/components/screens/auth/WInstallVerify.jsx` |
| `plan_selected` (the "Skip for now" outcome) | `src/components/screens/auth/WSelectPlan.jsx` |

The `trackWebflowEvent` helper was deleted from `src/lib/api.js`. **Verification:** the built bundle
returns **0 hits** for `wf/track`, `profile_settings_viewed`, and `installation_code_copied`. The
extension no longer performs any analytics request, ships no analytics library, and calls no
third-party analytics host from the client.

## 2. What the app still collects (server-side product analytics)

The app's backend (the ConsentBit worker at `manager.consentbit.com`) records product-usage events
about **the Webflow account owner's use of the app** — not about their website's visitors. These are
emitted **server-side**, from the backend handler where each action actually occurs.

**Data subject:** the Webflow user who installed the app (the account owner).
**Identifier (`distinct_id`):** the account owner's **email address**, resolved server-side from the
authenticated identity.
**Processor:** PostHog (`https://us.i.posthog.com`, United States).
**Cookies:** none are set on the account owner's or their visitors' browsers for this analytics.

### Event set

| Event | Fires when | Key properties |
|---|---|---|
| `oauth_completed` | app authorized | platform |
| `plan_selected` | free plan taken / paid plan chosen | plan_tier, billing_cycle, plan_price |
| `subscription_activated` | paid checkout completes | plan_tier, interval, price, currency, domain |
| `app_installed` | first install of the banner | domain, site_id, org_id |
| `installation_verified` | banner script confirmed live (first time) | site_id, domain |
| `banner_verified` | user verifies the banner | status (verified/failed), domain |
| `banner_customized` / `banner_settings_updated` | banner settings saved | site_id |
| `banner_changes_published` | banner published | domain, wf_site_id |
| `ownership_transfer_sent` | account ownership transfer requested | — |

Event properties are limited to plan/site/domain metadata. **No end-user (website visitor) data and
no banner-consent records are sent to analytics.** The only personal datum is the account owner's own
email, used solely as the analytics identifier.

## 3. Drop-in disclosure text

### 3a. Privacy policy — add this section

> **Product analytics.** When you use the ConsentBit app for Webflow, we record how you use the app —
> for example, when you authorize the app, choose a plan, install and verify the banner, save banner
> settings, or publish. These events are associated with your account email address and are processed
> on our behalf by PostHog, Inc. (United States) to help us understand usage and improve the product.
> We do not use this analytics to collect data about your website's visitors, and we do not set
> cookies on your or your visitors' browsers for it. You can request access to or deletion of this
> data by contacting us at [privacy@consentbit.com].

### 3b. Marketplace listing — data-handling note

> This app records product-usage analytics (e.g. plan selection, install/verify, publish) tied to your
> account email, processed by PostHog (US), to improve the product. It does not collect data about your
> site's visitors and sets no cookies for analytics. See our Privacy Policy for details.

### 3c. Optional in-app one-liner (e.g. profile/settings footer)

> We record app-usage analytics to improve ConsentBit. [Privacy Policy]

## 4. Compliance mapping

| Guideline | How it's satisfied |
|---|---|
| "clear and transparent information… about the collection… of their data" | §3a/§3b disclose the event set, identifier, processor, and no-visitor-data / no-cookies facts |
| "respects user privacy… relevant privacy laws" | discloses the US processor (PostHog) and offers access/deletion contact |
| minimize collection | client analytics fully removed; server events carry only plan/site metadata; only PII is the account email used as identifier |

## 5. Notes for the reviewer

- The `webflow.json` `telemetry.allowTelemetry` flag is the **Webflow CLI's own developer telemetry**
  (collected from the developer at build time). It is unrelated to the app's runtime analytics and
  does not control the events above.
- Client bundle now contains **zero** analytics code (verified: 0 hits for `wf/track`).
