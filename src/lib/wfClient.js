// Authenticated client for the consent-manager Worker's Webflow-app API surface.
//
// Every sensitive call now goes to the /api/wf/* routes and carries a Webflow ID
// token so the backend can prove WHO is calling and enforce that they are
// authorized for the site they name (see the worker's middleware/webflowIdentity.js).
//
//   • getWfIdToken()  — mint/cache a Webflow ID token via the Designer API.
//   • wfUrl(base, p)  — build a /api/wf/<p> URL on the given worker base.
//   • authedFetch()   — fetch with `Authorization: Bearer <idToken>`, retrying
//                       once with a fresh token on 401 (tokens are short-lived).

// Webflow ID tokens are short-lived. Cache briefly to avoid minting one per call,
// but always re-mint after the window so we never send a stale token.
let _idToken = null;
let _idTokenAt = 0;
const ID_TOKEN_TTL_MS = 4 * 60 * 1000; // 4 min — comfortably inside Webflow's token lifetime

/**
 * Get a Webflow ID token from the Designer API (`window.webflow.getIdToken()`).
 * Returns null when not running inside the Designer (the token can't be minted
 * outside it) — authedFetch then refuses to send the request at all.
 * Pass { force:true } to bypass the cache (used on a 401 retry).
 */
export async function getWfIdToken({ force = false } = {}) {
  const now = Date.now();
  if (!force && _idToken && now - _idTokenAt < ID_TOKEN_TTL_MS) return _idToken;

  const wf = typeof window !== "undefined" ? window.webflow : null;
  if (!wf?.getIdToken) return null;
  try {
    const token = await wf.getIdToken();
    _idToken = token || null;
    _idTokenAt = now;
    return _idToken;
  } catch {
    return null;
  }
}

// The Webflow site the user is currently in. Sent as X-Webflow-Site-Id so the
// backend resolves the ID token with THIS site's app token (Webflow only accepts
// the matching site's token) and authorizes the data id against this site.
// NOT cached: the Designer can switch sites without a full extension reload, and a
// stale id would be sent alongside a freshly-minted (different-site) ID token,
// causing 401s or wrong-site access. getSiteInfo() is a cheap local Designer call.
export async function getWfSiteId() {
  const wf = typeof window !== "undefined" ? window.webflow : null;
  if (!wf?.getSiteInfo) return null;
  try {
    const info = await wf.getSiteInfo();
    return info?.siteId || info?.id || null;
  } catch {
    return null;
  }
}

/** Build a URL for the authenticated Webflow-app route `path` on `base`. */
export function wfUrl(base, path) {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${b}/api/wf/${p}`;
}

/**
 * The response returned when no ID token can be minted. The request is never sent,
 * so this mirrors what the backend would have answered — call sites already handle
 * a 401 Response and need no special case.
 */
function missingTokenResponse() {
  return new Response(
    JSON.stringify({ success: false, error: "Missing Webflow ID token.", code: "MISSING_ID_TOKEN" }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}

/**
 * fetch() that attaches the Webflow ID token as a Bearer credential. On a 401
 * (token expired/rotated between mint and use) it mints a fresh token once and
 * retries. Everything else is passed straight through to fetch().
 *
 * FAILS CLOSED: every caller of this function targets an /api/wf/* route, and all
 * of those require the ID token. If one cannot be minted (Designer API missing, or
 * getIdToken() threw) the request is NOT sent — an unauthenticated call could only
 * ever be rejected by the backend, and sending it anyway would put a credential-less
 * request on the wire against a route that may return account data.
 */
export async function authedFetch(url, options = {}) {
  // Returns null (rather than fetching) when no token is available.
  const doFetch = async (force) => {
    const [token, wfSiteId] = await Promise.all([getWfIdToken({ force }), getWfSiteId()]);
    if (!token) return null;
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    if (wfSiteId) headers.set("X-Webflow-Site-Id", wfSiteId);
    return fetch(url, { ...options, headers });
  };

  let res = await doFetch(false);
  if (res === null) {
    // No cached token — try once to mint a fresh one before giving up.
    res = await doFetch(true);
    if (res === null) return missingTokenResponse();
  }
  if (res.status === 401) {
    // Stale token — mint a new one and try exactly once more.
    const retry = await doFetch(true);
    res = retry === null ? missingTokenResponse() : retry;
  }
  return res;
}
