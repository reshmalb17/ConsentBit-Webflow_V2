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
  "https://consent-webapp-manager-test.web-8fb.workers.dev";

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
    window.open(href, "_blank", "noopener");
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

export { WORKER_BASE_URL };
