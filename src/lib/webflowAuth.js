// Webflow App install OAuth — client helper.
//
// Talks to the consent-manager Worker:
//   GET /api/webflow/oauth/authorize  → starts the install flow
//   (the Worker redirects to Webflow, then back to `returnTo` with
//    ?webflow_oauth=success|error&sites=N)
//
// Configure the Worker base URL via VITE_WORKER_BASE_URL in `.env`.

const WORKER_BASE_URL =
  import.meta.env.VITE_WORKER_BASE_URL ||
  "https://manager.consentbit.com";

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
  const url = new URL(`${WORKER_BASE_URL}/api/webflow/oauth/authorize`);
  url.searchParams.set("returnTo", returnTo);
  const href = url.toString();

  // Inside an embedded context (the Webflow Designer iframe) open a top-level
  // tab — Webflow's consent screen sets X-Frame-Options and can't load in an
  // iframe. Standalone, a normal redirect is fine.
  const inIframe = window.self !== window.top;
  if (inIframe) {
    window.open(href, "_blank", "noopener,noreferrer");
  } else {
    window.location.href = href;
  }
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
 *   dest     — which checkout page to land on (allow-listed server-side):
 *                'checkoutplan'  → interactive plan picker (install / plan page) [default]
 *                'checkout-plan' → read-only, shows the plan already chosen here (upgrade page)
 *
 * The extension runs in the Designer iframe, so this opens a top-level tab.
 */
export async function startCheckout({ plan, interval = "monthly", email, dest } = {}) {
  const info = await window.webflow?.getSiteInfo?.().catch(() => null);
  const wfSiteId = info?.siteId || info?.id || null;
  const domain = await currentSiteDomain(info);

  // The checkout context is sent as a request BODY throughout — never in the URL
  // (Webflow app review disallows tokens/params in the checkout URL). It goes to
  // the token endpoint as a body, then to /checkoutplan as a POST-form body.
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
    const res = await fetch(`${CHECKOUT_API_BASE}/api/v2/webflow-checkout-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    token = data?.token || null;
  } catch {
    /* fall back to posting the raw context below */
  }

  // Open the checkout page by POSTing the context in the request BODY via an
  // auto-submitting form in a new top-level tab. The /api/checkout-open route
  // stashes it in a short-lived cookie and redirects to a clean checkout URL —
  // so nothing (token or PII) ever appears in the URL. `dest` selects which
  // checkout page to land on (install/plan → /checkoutplan, upgrade → /checkout-plan).
  const action = `${CHECKOUT_BASE_URL}/api/checkout-open`;
  const fields = token ? { t: token } : { ...payload };
  if (dest) fields.dest = dest;
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  form.target = "_blank";
  form.style.display = "none";
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null || v === "") continue;
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = k;
    input.value = String(v);
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
  form.remove();
  return action;
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

  const res = await fetch(
    `${WORKER_BASE_URL}/api/webflow/domains?siteId=${encodeURIComponent(siteId)}`,
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

  const res = await fetch(`${WORKER_BASE_URL}/api/webflow/publish`, {
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
    throw new Error(`Publish failed (HTTP ${res.status})${detail ? ": " + detail : ""}`);
  }
  return data;
}

export { WORKER_BASE_URL, CHECKOUT_API_BASE };
