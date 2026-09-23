// Webflow App install OAuth — client helper.
//
// Talks to the consent-manager Worker:
//   GET /api/webflow/oauth/authorize  → starts the install flow
//   (the Worker redirects to Webflow, then back to `returnTo` with
//    ?webflow_oauth=success|error&sites=N)
//
// Configure the Worker base URL via VITE_WORKER_BASE_URL in `.env`.

import { authedFetch, wfUrl } from "./wfClient.js";

const WORKER_BASE_URL =
  import.meta.env.VITE_WORKER_BASE_URL ||
  "https://manager.consentbit.com";

// Where the OAuth flow starts. Normally the same worker as everything else, but the
// redirect_uri Webflow sends the user back to must be REGISTERED on the Webflow App,
// and only the production callback is. Pointing just this step at production lets the
// test build authorize without registering a second redirect URI: both workers share
// the same D1 and the same WEBFLOW_AUTHENTICATION store, and production uses the same
// Webflow client id — so the token it saves is immediately visible to the test worker.
const OAUTH_BASE_URL =
  import.meta.env.VITE_OAUTH_BASE_URL ||
  WORKER_BASE_URL;

// Front-end webapp that hosts the /checkoutplan page (paid-plan checkout).
const CHECKOUT_BASE_URL =
  import.meta.env.VITE_CHECKOUT_BASE_URL ||
  "https://accounts.consentbit.com";

// Worker that creates the checkout token + runs the Stripe charge. This is the
// consent-manager worker (it holds the Stripe keys) — NOT the test copy. It also
// backs the checkoutplan page's token read, so the token is found in the shared KV.
const CHECKOUT_API_BASE =
  import.meta.env.VITE_CHECKOUT_API_BASE_URL ||
  "https://manager.consentbit.com";

/**
 * Kick off the Webflow install/authorize flow. Navigates the browser to the
 * Worker's /authorize endpoint (which redirects on to Webflow's consent
 * screen). After install the user is returned to `returnTo` (defaults to the
 * current page) with the result in the query string.
 */
export function startWebflowInstall(returnTo = window.location.href) {
  const url = new URL(`${OAUTH_BASE_URL}/api/webflow/oauth/authorize`);
  url.searchParams.set("returnTo", returnTo);
  const href = url.toString();

  // Inside an embedded context (the Webflow Designer iframe) open a top-level
  // tab — Webflow's consent screen sets X-Frame-Options and can't load in an
  // iframe. Standalone, a normal redirect is fine.
  //
  // Returns { href, opened }. The Designer's iframe is sandboxed, so window.open
  // can be blocked and returns null; the caller then offers `href` as a link the
  // user can open manually instead of leaving them on a button that did nothing.
  const inIframe = window.self !== window.top;
  if (inIframe) {
    let win = null;
    try { win = window.open(href, "_blank", "noopener,noreferrer"); } catch { win = null; }
    return { href, opened: !!win };
  }
  window.location.href = href;
  return { href, opened: true };
}

/**
 * Read the OAuth result from the current URL after returning from Webflow.
 * Returns { status: 'success'|'error', sites, error } or null if not present.
 */
export function readWebflowOAuthResult(search = window.location.search) {
  const p = new URLSearchParams(search);
  const status = p.get("webflow_oauth");
  if (!status) return null;
  return {
    status,
    sites: p.get("sites") ? Number(p.get("sites")) : null,
    error: p.get("error") || null,
  };
}

/** Strip the OAuth result params from the URL so a refresh doesn't re-show them. */
export function clearWebflowOAuthResult() {
  const url = new URL(window.location.href);
  ["webflow_oauth", "sites", "error"].forEach((k) => url.searchParams.delete(k));
  window.history.replaceState({}, "", url.toString());
}

/**
 * Publish the current Webflow site. The Designer API gives us the site id;
 * we hand it to the Worker, which holds the OAuth token server-side and calls
 * Webflow's Data API:  POST /v2/sites/{site_id}/publish  (scope: sites:write).
 *
 * Publishing CANNOT be done from the browser directly — it needs a secret
 * token — so this always routes through the Worker.
 *
 * Returns the Worker's JSON on success; throws Error(message) on failure.
 */
async function currentSiteId() {
  try {
    const info = await window.webflow?.getSiteInfo?.();
    return info?.siteId || info?.id || null;
  } catch {
    return null; // not in the Designer
  }
}

/** Best domain for this site: a published custom/staging domain, else the
 *  Webflow subdomain (shortName.webflow.io). Mirrors getWebflowSiteContext. */
async function currentSiteDomain(info) {
  try {
    const si = info || (await window.webflow?.getSiteInfo?.());
    const domains = si?.domains ?? [];
    const resolved =
      domains.find((d) => !d.stage || d.stage !== "staging") ||
      domains.find((d) => d.stage === "staging");
    if (resolved?.url) return resolved.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (si?.shortName) return `${si.shortName}.webflow.io`;
    return si?.siteName || null;
  } catch {
    return null;
  }
}

/**
 * Open the paid-plan checkout on the webapp front-end for the current Webflow
 * site. Passes the site context + version so the checkout page and Worker route
 * the v2 Webflow flow.
 *
 *   plan     — optional: 'basic' | 'essential' | 'growth' (omit → page default)
 *   interval — 'monthly' | 'yearly'
 *
 * The extension runs in the Designer iframe, so this opens a top-level tab.
 */
export async function startCheckout({ plan, interval = "monthly", email } = {}) {
  const info = await window.webflow?.getSiteInfo?.().catch(() => null);
  const wfSiteId = info?.siteId || info?.id || null;
  const domain = await currentSiteDomain(info);

  // The checkout context (site + email) is POSTed as a request BODY to mint a
  // short-lived OPAQUE token. Only that token is later placed in the checkout URL —
  // no PII, Stripe data, or params ever travel in a URL.
  const payload = {
    platform: "webflow",
    version: "v2",
    ...(wfSiteId ? { platformId: wfSiteId } : {}),
    ...(domain ? { domain } : {}),
    // Account email kept in state after OAuth — sent so the checkout page can
    // pre-fill it (worker no longer has to resolve it server-side).
    ...(email ? { email, billingEmail: email } : {}),
    interval,
    ...(plan ? { plan: String(plan).toLowerCase() } : {}),
  };

  // POST to the consent-manager worker's v2 endpoint: it resolves the email
  // server-side and stores a short-lived opaque token in the CHECKOUT_TOKENS KV.
  // (This worker holds the Stripe keys for the later charge.)
  let token = null;
  try {
    const res = await authedFetch(wfUrl(CHECKOUT_API_BASE, "webflow-checkout-token"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    token = data?.token || null;
  } catch {
    /* handled below */
  }

  if (!token) throw new Error("Couldn't start checkout. Please try again.");

  // Open the hosted checkout page DIRECTLY in a new top-level tab — no intermediate
  // /api/checkout-open redirect, so the address bar shows the real checkout page
  // from the start. Only the SHORT-LIVED OPAQUE token travels in the URL (never PII
  // or Stripe data); the page exchanges it server-side for the checkout context and
  // strips it from the address bar on load.
  const params = new URLSearchParams({ t: token });
  const href = `${CHECKOUT_BASE_URL}/checkout-plan?${params.toString()}`;
  window.open(href, "_blank", "noopener,noreferrer");
  return href;
}

/**
 * List the publish targets for the current site: the Webflow staging subdomain
 * (*.webflow.io) and any custom domains. The Worker reads them from Webflow's
 * Data API with the stored token.
 *
 * Returns { subdomain: string|null, customDomains: [{ id, url, lastPublished }] }.
 * Throws Error(message) on failure.
 */
export async function listSiteDomains() {
  const siteId = await currentSiteId();
  if (!siteId) {
    throw new Error("No site id — run inside the Webflow Designer.");
  }

  const res = await authedFetch(
    `${wfUrl(WORKER_BASE_URL, "domains")}?siteId=${encodeURIComponent(siteId)}`,
    { headers: { Accept: "application/json" } }
  );
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    throw new Error((data && data.error) || `Failed to load domains (HTTP ${res.status})`);
  }
  return { subdomain: data.subdomain || null, customDomains: data.customDomains || [] };
}

/**
 * Publish the current site to the chosen targets.
 *   publishToWebflowSubdomain — publish to *.webflow.io (staging)
 *   customDomains            — array of custom-domain IDs (from listSiteDomains)
 * At least one target is required by Webflow.
 */
export async function publishSite({ publishToWebflowSubdomain = false, customDomains = [] } = {}) {
  const siteId = await currentSiteId();
  if (!siteId) {
    throw new Error("No site id — run inside the Webflow Designer to publish.");
  }
  if (!publishToWebflowSubdomain && customDomains.length === 0) {
    throw new Error("Pick at least one target (staging or a custom domain).");
  }

  const res = await authedFetch(wfUrl(WORKER_BASE_URL, "publish"), {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    body: JSON.stringify({ siteId, publishToWebflowSubdomain, customDomains }),
  });

  // Read the body as text first so we can surface the raw error even when it
  // isn't valid JSON (helps diagnose 403 missing_scopes etc.).
  const raw = await res.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { /* non-JSON response */ }

  if (!res.ok) {
    const detail =
      (data && (data.code || data.error || data.message || data.msg)) ||
      raw ||
      "";
    const err = new Error(`Publish failed (HTTP ${res.status})${detail ? ": " + detail : ""}`);
    // Attach the HTTP status and worker `code` so callers can branch without
    // string-matching (e.g. RATE_LIMITED / 429 → friendly "already published").
    err.status = res.status;
    if (data && data.code) err.code = data.code;
    throw err;
  }
  return data;
}

export { WORKER_BASE_URL, CHECKOUT_API_BASE, CHECKOUT_BASE_URL };
