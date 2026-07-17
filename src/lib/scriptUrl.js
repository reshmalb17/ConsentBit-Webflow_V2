// Integrity check for the ConsentBit install-snippet URL.
//
// The banner script URL comes back from the backend (getWebflowSiteStatus().scriptUrl)
// and is interpolated into the <script> tag the user pastes into their site. Because
// the script is generated per-site (config baked in, regenerated on every edit) an
// SRI content hash cannot be used — a pinned hash would break the banner on the next
// customization change. Instead we validate that the URL points at a host WE control
// before we ever place it in the snippet or hand it to the verifier. This prevents a
// tampered/unexpected backend response from injecting a third-party script onto the
// customer's live site.

import { WORKER_BASE_URL, CHECKOUT_API_BASE } from "./webflowAuth.js";

// Hosts of the backends this app is configured to talk to (prod: manager.consentbit.com;
// test/staging: the worker's *.workers.dev domain). The banner script is served by the
// same backend, and a site's embedScriptUrl is frozen at creation to that host — so any
// host we send requests to is a host we trust to serve the script.
function configuredBackendHosts() {
  const hosts = new Set();
  for (const base of [WORKER_BASE_URL, CHECKOUT_API_BASE]) {
    try {
      const h = new URL(base).hostname.toLowerCase();
      if (h) hosts.add(h);
    } catch {
      /* ignore malformed base */
    }
  }
  return hosts;
}

// A host is allowed if it is a consentbit.com (sub)domain, one of the configured
// backend hosts above, or localhost (dev).
function isAllowedHost(host) {
  const h = String(host || "").toLowerCase();
  if (!h) return false;
  if (h === "consentbit.com" || h.endsWith(".consentbit.com")) return true;
  if (h === "localhost" || h === "127.0.0.1") return true;
  if (configuredBackendHosts().has(h)) return true;
  return false;
}

/**
 * True when `scriptUrl` is a well-formed URL on a trusted host. HTTPS is required
 * except for localhost (dev). Returns false for anything malformed, an unexpected
 * host, or a non-HTTPS production URL.
 */
export function isTrustedScriptUrl(scriptUrl) {
  if (!scriptUrl) return false;
  let u;
  try {
    u = new URL(String(scriptUrl));
  } catch {
    return false;
  }
  const isLocal = u.hostname === "localhost" || u.hostname === "127.0.0.1";
  if (u.protocol !== "https:" && !(u.protocol === "http:" && isLocal)) return false;
  return isAllowedHost(u.hostname);
}
