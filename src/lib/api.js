// consent-manager Worker API client.
//
// Base URL comes from VITE_WORKER_BASE_URL (see webflowAuth.js) — currently the
// test worker. Identity (the workspace email) is resolved server-side from the
// OAuth record the install/authorize flow stored, so the client never holds or
// sends a token or email.

import { WORKER_BASE_URL, CHECKOUT_API_BASE, CHECKOUT_BASE_URL } from "./webflowAuth.js";
import { authedFetch, wfUrl } from "./wfClient.js";
import { isTrustedScriptUrl } from "./scriptUrl.js";

/**
 * Some worker endpoints wrap their JSON in a security envelope: { d: "<base64 JSON>" }.
 * Protected (non-public) routes like /api/verify-script are encoded this way. Decode
 * it transparently — plain (unencoded) responses pass straight through unchanged.
 */
function decodeEnvelope(parsed) {
  if (parsed && typeof parsed === "object" && typeof parsed.d === "string") {
    try {
      const binary = atob(parsed.d);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      /* not an envelope after all — fall through */
    }
  }
  return parsed;
}

/** Read a fetch Response as JSON, decoding the security envelope if present. */
async function parseJson(res) {
  try {
    return decodeEnvelope(JSON.parse(await res.text()));
  } catch {
    return {};
  }
}

/**
 * First-party Webflow telemetry. POST /api/wf/track { event, wfSiteId, properties }.
 * The worker resolves the account owner (distinct_id) from the authenticated identity
 * and emits the event to PostHog SERVER-SIDE — no analytics library ships in the bundle
 * and the extension never calls a third-party analytics host. Best-effort; never throws.
 * Only UI-only events with no other backend call are accepted (e.g. profile_settings_viewed).
 */
export async function trackWebflowEvent(event, properties = {}) {
  try {
    let wfSiteId = "";
    try { ({ wfSiteId } = await getWebflowSiteContext()); } catch { /* not in Designer */ }
    await authedFetch(wfUrl(WORKER_BASE_URL, "track"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, wfSiteId, properties }),
    });
  } catch { /* analytics is best-effort */ }
}

/**
 * Read the Webflow site context from the Designer API: the Webflow site id and
 * the best domain to register. Mirrors the live app's resolution — prefer a
 * non-staging custom domain, fall back to the staging/`.webflow.io` domain.
 * Returns { wfSiteId, domain, siteInfo } (nulls when not inside the Designer).
 */
export async function getWebflowSiteContext() {
  const wf = typeof window !== "undefined" ? window.webflow : null;
  if (!wf?.getSiteInfo) return { wfSiteId: null, domain: null, siteInfo: null };

  const siteInfo = await wf.getSiteInfo();
  const wfSiteId = siteInfo?.siteId ?? null;

  let domain = null;
  const domains = siteInfo?.domains ?? [];
  if (domains.length) {
    const custom = domains.find((d) => !d.stage || d.stage !== "staging");
    const staging = domains.find((d) => d.stage === "staging");
    const resolved = custom ?? staging;
    if (resolved?.url) {
      domain = resolved.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
    }
  }
  // No published domain yet — fall back to the Webflow subdomain / site name.
  if (!domain) {
    domain = siteInfo?.shortName
      ? `${siteInfo.shortName}.webflow.io`
      : siteInfo?.siteName ?? null;
  }

  return { wfSiteId, domain, siteInfo };
}

/**
 * Single launch-time status call. Returns everything needed to route the app on
 * open — in ONE request to the worker:
 *   GET /api/webflow/oauth/status?siteId=<wfSiteId>&verify=false
 *   → { authorized, registered, plan, version, webappSiteId }
 *
 * Routing:
 *   !authorized              → Landing (authorize)
 *   authorized && !registered→ Select Plan
 *   authorized &&  registered→ Customize/editor
 *
 * `verify=false` skips the worker's external Webflow token-verify round-trip for
 * a fast existence-only check on launch.
 */
export async function getWebflowSiteStatus(wfSiteId) {
  if (!wfSiteId) return { authorized: false, registered: false, plan: null, version: null };
  const url = new URL(wfUrl(WORKER_BASE_URL, "oauth/status"));
  url.searchParams.set("siteId", wfSiteId);
  url.searchParams.set("verify", "false");

  // no-store: after an ownership transfer the owner email changes server-side; we
  // must never serve a stale cached status when the app re-checks.
  const res = await authedFetch(url.toString(), { method: "GET", cache: "no-store" });
  let data = {};
  try {
    data = await parseJson(res);
  } catch {
    data = {};
  }
  return {
    authorized: !!data.authorized,
    registered: !!data.registered,
    plan: data.plan ?? null,
    version: data.version ?? null,
    webappSiteId: data.webappSiteId ?? null,
    scriptUrl: data.scriptUrl ?? null,
    cdnScriptId: data.cdnScriptId ?? null,
    bannerCreated: !!data.bannerCreated,
    email: data.email ?? null,
    billingEmail: data.billingEmail ?? null,
    // Account-level: the workspace email already has a free site elsewhere, so
    // the free plan should be disabled upfront on the Choose-plan screen.
    freeUsed: !!data.freeUsed,
  };
}

/**
 * Poll the user's subscription/payment status for a Webflow site. Used by the
 * payment-processing popup to detect when a just-started checkout has completed:
 *   GET /api/payment/subscription?siteId=<wfSiteId>
 *   → { subscriptionStatuses: [{ isSubscribed, plan, updatedAt }] }
 * Returns a flattened { isSubscribed, plan, updatedAt }. Never throws — on a
 * network error it resolves to "not subscribed yet" so the poll loop keeps going.
 */
export async function getPaymentSubscription(wfSiteId) {
  if (!wfSiteId) return { isSubscribed: false, plan: null, updatedAt: null };
  let res;
  try {
    // Payment status must come from the payment worker (consent-webapp-manager) —
    // it holds the Stripe/checkout code; the -test worker is for status/scan only.
    const url = new URL(wfUrl(CHECKOUT_API_BASE, "payment/subscription"));
    url.searchParams.set("siteId", wfSiteId);
    res = await authedFetch(url.toString(), { method: "GET" });
  } catch (e) {
    return { isSubscribed: false, plan: null, updatedAt: null, error: e?.message || "network" };
  }
  let data = {};
  try { data = await parseJson(res); } catch { data = {}; }
  const first = Array.isArray(data?.subscriptionStatuses) ? data.subscriptionStatuses[0] : null;
  return {
    isSubscribed: !!first?.isSubscribed,
    plan: first?.plan ?? null,
    updatedAt: first?.updatedAt ?? null,
  };
}

/**
 * Billing for the current Webflow site (authless, siteId-keyed on the payment worker).
 *   GET /api/webflow/billing?siteId=<wfSiteId>
 *   → { success, plan, status, interval, currentPeriodEnd, cancelAtPeriodEnd, stripeSubscriptionId, invoices[] }
 */
export async function getWebflowBilling(wfSiteId) {
  if (!wfSiteId) return { success: false, plan: "free", invoices: [] };
  let res;
  try {
    const url = new URL(wfUrl(CHECKOUT_API_BASE, "billing"));
    url.searchParams.set("siteId", wfSiteId);
    res = await authedFetch(url.toString(), { method: "GET" });
  } catch (e) {
    return { success: false, plan: "free", invoices: [], error: e?.message || "network" };
  }
  return parseJson(res);
}

/**
 * Switch the current site's subscription between monthly and yearly billing (in place,
 * no new checkout). POST /api/webflow/switch-interval  body { siteId, targetInterval }
 *   → { success, interval, nextBillingDate }
 */
export async function switchWebflowInterval(wfSiteId, targetInterval) {
  const res = await authedFetch(wfUrl(CHECKOUT_API_BASE, "switch-interval"), {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    body: JSON.stringify({ siteId: wfSiteId, targetInterval }),
  });
  return parseJson(res);
}

/**
 * Cancel the current site's subscription at period end.
 *   POST /api/webflow/cancel-subscription  body { siteId } → { success, cancelAtPeriodEnd }
 */
export async function cancelWebflowSubscription(wfSiteId) {
  const res = await authedFetch(wfUrl(CHECKOUT_API_BASE, "cancel-subscription"), {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    body: JSON.stringify({ siteId: wfSiteId }),
  });
  return parseJson(res);
}

/**
 * Read the Webflow site's publication state from the Designer API. A site counts
 * as published if it has been published AT LEAST ONCE — i.e. any domain has a
 * non-null lastPublished value (we don't care how recent it is). Matches the live
 * app's check. Returns { published, publicUrl, domains }.
 *   publicUrl → the live page to verify (prefers a published non-staging domain).
 */
export async function getWebflowPublishInfo() {
  const wf = typeof window !== "undefined" ? window.webflow : null;
  if (!wf?.getSiteInfo) return { published: false, publicUrl: null, domains: [] };

  const siteInfo = await wf.getSiteInfo();
  const domains = siteInfo?.domains ?? [];
  // Published at least once = any domain carries a lastPublished timestamp.
  const publishedDomains = domains.filter(
    (d) => d.lastPublished !== null && d.lastPublished !== undefined
  );
  const published = publishedDomains.length > 0;

  let publicUrl = null;
  if (published) {
    // Prefer a published custom (non-staging) domain, else any published one.
    const custom = publishedDomains.find((d) => !d.stage || d.stage !== "staging");
    const resolved = custom ?? publishedDomains[0];
    const host = (resolved?.url || resolved?.name || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (host) publicUrl = `https://${host}`;
  }
  return { published, publicUrl, domains };
}

/**
 * Verify the consent script is present on the published site — same as
 * consentbitwebapp's verifyScript:
 *   POST /api/verify-script  body: { publicUrl, scriptUrl, siteId }
 *   → { success, found, siteId, debug }   (15s client timeout)
 */
export async function verifyScript({ publicUrl, scriptUrl, siteId } = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  let res;
  try {
    res = await authedFetch(wfUrl(WORKER_BASE_URL, "verify-script"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      body: JSON.stringify({ publicUrl, scriptUrl, siteId }),
      signal: controller.signal,
    });
  } catch (e) {
    if (e?.name === "AbortError") {
      return { success: false, found: false, error: "Verification timed out. Please try again." };
    }
    return { success: false, found: false, error: e?.message || "Network error during verification." };
  } finally {
    clearTimeout(timeoutId);
  }
  let data = {};
  try {
    data = await parseJson(res);
  } catch {
    data = { success: false, found: false, error: `Unexpected response (HTTP ${res.status})` };
  }
  return data;
}

/**
 * Full verify flow for the current site:
 *   1. If the site isn't published → return { published:false } (UI shows the
 *      "publish your site first" popup).
 *   2. Else resolve scriptUrl + siteId (one status call) and verify the script.
 * Returns { published, found?, error?, ...verifyResponse }.
 */
export async function verifyInstallation() {
  const { wfSiteId } = await getWebflowSiteContext();
  if (!wfSiteId) return { published: false, error: "Couldn't read your Webflow site." };

  const { published, publicUrl } = await getWebflowPublishInfo();
  if (!published) return { published: false };

  // Resolve the script URL + webapp site id for this site (single status call).
  const status = await getWebflowSiteStatus(wfSiteId);
  if (!status.scriptUrl) {
    return { published: true, found: false, error: "This site isn't registered yet. Select a plan first." };
  }
  // Integrity guard: never verify against (or trust) a script URL that isn't on a
  // ConsentBit-controlled host, even if the backend returned one.
  if (!isTrustedScriptUrl(status.scriptUrl)) {
    return { published: true, found: false, error: "Unexpected script URL — please contact support." };
  }

  // Webflow's publish propagates across its CDN asynchronously, so the script
  // can be missing from the very first fetch even when it's correctly in the
  // <head>. Retry a few times with a short backoff before declaring failure —
  // stop as soon as it's found (or a hard error other than "not found").
  const VERIFY_ATTEMPTS = 4;
  const VERIFY_RETRY_MS = 3000;
  let result = { success: false, found: false };
  for (let attempt = 1; attempt <= VERIFY_ATTEMPTS; attempt++) {
    result = await verifyScript({
      publicUrl,
      scriptUrl: status.scriptUrl,
      siteId: status.webappSiteId,
    });
    if (result.found) break; // script is live — done
    // A hard error (site blocking us, 404, server error) won't fix itself on
    // retry — surface it immediately. Only a clean "loaded but not found yet"
    // (success:true, found:false, no error) is the propagation race worth retrying.
    if (result.error && result.success === false) break;
    if (attempt < VERIFY_ATTEMPTS) await new Promise((r) => setTimeout(r, VERIFY_RETRY_MS));
  }
  return { published: true, ...result };
}

/**
 * Detect LEGACY ConsentBit scripts the OLD live app auto-injected into this
 * site's <head> via the Webflow Registered-Scripts API ("Code added by Apps").
 * The new app installs by manual copy-paste, so any old API-injected script must
 * be removed first (otherwise the banner loads twice / verify passes on the old
 * tag). `hasCurrent` is true when the site ALREADY has the current-version script
 * installed (an upgraded user) — the caller uses it to skip the install/verify step.
 * Returns { hasLegacy, legacyCount, legacyScripts, hasCurrent }. Never throws — on
 * any failure it resolves to "no legacy found" so the install flow is not blocked.
 *   GET /api/webflow/script-cleanup?siteId=<wfSiteId>
 */
export async function getLegacyScriptStatus(wfSiteId) {
  if (!wfSiteId) return { hasLegacy: false, legacyCount: 0, legacyScripts: [], hasCurrent: false };
  try {
    const url = new URL(wfUrl(WORKER_BASE_URL, "script-cleanup"));
    url.searchParams.set("siteId", wfSiteId);
    const res = await authedFetch(url.toString(), { method: "GET" });
    const data = await parseJson(res);
    return {
      hasLegacy: !!data.hasLegacy,
      legacyCount: data.legacyCount || 0,
      legacyScripts: Array.isArray(data.legacyScripts) ? data.legacyScripts : [],
      hasCurrent: !!data.hasCurrent,
    };
  } catch {
    return { hasLegacy: false, legacyCount: 0, legacyScripts: [], hasCurrent: false };
  }
}

/**
 * Remove the legacy API-injected ConsentBit scripts from this site's head. Only
 * touches "Code added by Apps" — the user's manual paste is a different store the
 * API cannot see, so this is safe. Returns { success, removedCount, error? }.
 *   POST /api/webflow/script-cleanup  body: { siteId }
 */
export async function removeLegacyScripts(wfSiteId) {
  if (!wfSiteId) return { success: false, removedCount: 0, error: "Missing site id" };
  try {
    const res = await authedFetch(wfUrl(WORKER_BASE_URL, "script-cleanup"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      body: JSON.stringify({ siteId: wfSiteId }),
    });
    const data = await parseJson(res);
    return {
      success: !!data.success,
      removedCount: data.removedCount || 0,
      error: data.success ? null : data.error || "Removal failed",
    };
  } catch (e) {
    return { success: false, removedCount: 0, error: e?.message || "Network error" };
  }
}

/**
 * Save banner customization for an already-registered site (the repeat-publish
 * path). Mirrors the live app's saveWebappBannerCustomization:
 *   POST /api/banner-customization
 *   body: { wfSiteId, customization, compliance }
 * No auth header (consent-manager worker). Returns the parsed JSON.
 */
/**
 * Load the saved banner customization for a Webflow site (set from the webapp or
 * a previous save). GET /api/banner-customization?wfSiteId=  → { success, customization }.
 * Returns the raw `customization` object (or null). Never throws.
 */
export async function getBannerCustomization(wfSiteId, webappSiteId) {
  // Prefer the webapp (D1 internal) site id — it targets the EXACT BannerCustomization
  // row the webapp dashboard writes to, so dashboard content edits reflect here.
  // The wfSiteId path relies on server-side resolution which can land on a stale/
  // duplicate row, so only use it when webappSiteId is unavailable.
  const query = webappSiteId
    ? `siteId=${encodeURIComponent(webappSiteId)}`
    : wfSiteId ? `wfSiteId=${encodeURIComponent(wfSiteId)}` : null;
  if (!query) return null;
  try {
    const res = await authedFetch(`${wfUrl(WORKER_BASE_URL, "banner-customization")}?${query}`);
    const data = await parseJson(res);
    return data?.customization ?? null;
  } catch {
    return null;
  }
}

export async function saveWebappBannerCustomization(wfSiteId, customization, extra = {}) {
  const res = await authedFetch(wfUrl(WORKER_BASE_URL, "banner-customization"), {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    // manualInstall: the updated app installs by manual copy-paste — the worker
    // must not auto-inject the script into the head. `extra` can still override.
    body: JSON.stringify({ wfSiteId, customization, manualInstall: true, ...extra }),
  });
  let data = {};
  try {
    data = await parseJson(res);
  } catch {
    data = { success: false, error: `Unexpected response (HTTP ${res.status})` };
  }
  if (!res.ok && data.success === undefined) data.success = false;
  return data;
}

/**
 * Register a free webapp account + site for this Webflow site.
 * POST /api/v2/webflow-free-register
 *   body: { wfSiteId, domain, platform:'webflow', version:'v2' }
 * The worker fills the email from the stored OAuth record (D1 → KV), so no
 * email/token is sent from the client.
 *
 * Returns the parsed JSON:
 *   { success, webappSiteId, scriptUrl, cdnScriptId, injectedIntoHead }
 *   or { success:false, code:'SITE_LIMIT_REACHED', existingDomain }
 *   or { success:false, error }
 */
export async function registerWebflowFree({ wfSiteId, domain, email, initialCustomization } = {}) {
  const res = await authedFetch(wfUrl(WORKER_BASE_URL, "webflow-free-register"), {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    body: JSON.stringify({
      wfSiteId,
      domain,
      // Account email kept in state after OAuth (from the status call). Sent so
      // the worker doesn't have to resolve it server-side.
      ...(email ? { email } : {}),
      platform: "webflow",
      version: "v2",
      // Updated app: install is manual copy-paste — tell the worker NOT to
      // auto-inject the banner script into the Webflow head.
      manualInstall: true,
      ...(initialCustomization ? { initialCustomization } : {}),
    }),
  });

  let data = {};
  try {
    data = await parseJson(res);
  } catch {
    data = { success: false, error: `Unexpected response (HTTP ${res.status})` };
  }
  return data;
}

// ── Cookie scan (site scanner) — same endpoints as consentbitwebapp ──────────

/**
 * Trigger a scan for a site. POST /api/scan-site { siteId }  (45s timeout).
 * `siteId` is the webapp Site id (from getWebflowSiteStatus().webappSiteId).
 * Returns { success, scanHistoryId, scanning, scriptsFound, cookiesFound,
 *   scanDuration, error, code }. When `scanning` is true the scan runs in the
 * background and the caller should poll getScanHistory until the row is terminal.
 */
export async function scanSiteNow(siteId) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);
  let res;
  try {
    // Consented scan: accepts the ConsentBit banner during the scan so consent-gated
    // tags fire and their post-consent cookies are captured. Same response shape as
    // /api/scan-site, so the existing polling flow is unchanged.
    res = await authedFetch(wfUrl(WORKER_BASE_URL, "scan-site-consented"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      body: JSON.stringify({ siteId }),
      signal: controller.signal,
    });
  } catch (e) {
    if (e?.name === "AbortError") {
      return { success: false, error: "Scan request timed out. The site may be slow or blocking scan traffic. Please try again." };
    }
    return { success: false, error: e?.message || "Network error starting scan." };
  } finally {
    clearTimeout(timeoutId);
  }
  let data = {};
  try { data = await parseJson(res); } catch { data = { success: false, error: `Unexpected response (HTTP ${res.status})` }; }
  return data;
}

/** GET /api/scan-history?siteId= → { success, scans: ScanHistoryRow[] }. */
export async function getScanHistory(siteId) {
  const res = await authedFetch(`${wfUrl(WORKER_BASE_URL, "scan-history")}?siteId=${encodeURIComponent(siteId)}`);
  let data = {};
  try { data = await parseJson(res); } catch { data = { success: false, scans: [] }; }
  return data;
}

/** GET /api/cookies?siteId= → { success, cookies, cookiesByCategory }. */
export async function getSiteCookies(siteId) {
  const res = await authedFetch(`${wfUrl(WORKER_BASE_URL, "cookies")}?siteId=${encodeURIComponent(siteId)}`);
  let data = {};
  try { data = await parseJson(res); } catch { data = { success: false, cookies: [], cookiesByCategory: {} }; }
  return data;
}

// ── Scheduled scans — same endpoints as consentbitwebapp ─────────────────────

/** GET /api/scheduled-scan?siteId= → { success, scheduledScans: ScheduledScan[] }. */
export async function getScheduledScans(siteId) {
  const res = await authedFetch(`${wfUrl(WORKER_BASE_URL, "scheduled-scan")}?siteId=${encodeURIComponent(siteId)}`);
  let data = {};
  try { data = await parseJson(res); } catch { data = { success: false, scheduledScans: [] }; }
  return data;
}

/**
 * Create a scheduled scan.
 *   POST /api/scheduled-scan  body: { siteId, scheduledAt, frequency }
 *   frequency: 'once' | 'daily' | 'weekly' | 'monthly'  ·  scheduledAt: ISO string
 * Returns { success, scheduledScanId } or { success:false, code:'SCAN_LIMIT_REACHED', ... }.
 */
export async function createScheduledScan(siteId, scheduledAt, frequency = "once") {
  const res = await authedFetch(wfUrl(WORKER_BASE_URL, "scheduled-scan"), {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    body: JSON.stringify({ siteId, scheduledAt, frequency }),
  });
  let data = {};
  try { data = await parseJson(res); } catch { data = { success: false, error: `Unexpected response (HTTP ${res.status})` }; }
  return data;
}

/**
 * DELETE /api/wf/scheduled-scan?id=&siteId= → { success }.
 * siteId is required so the backend can authorize the caller for this site.
 */
export async function deleteScheduledScan(siteId, id) {
  const res = await authedFetch(`${wfUrl(WORKER_BASE_URL, "scheduled-scan")}?id=${encodeURIComponent(id)}&siteId=${encodeURIComponent(siteId)}`, { method: "DELETE", headers: { "X-Requested-With": "XMLHttpRequest" } });
  let data = {};
  try { data = await parseJson(res); } catch { data = { success: false }; }
  return data;
}

// ── Custom cookie rules — same endpoints as consentbitwebapp ─────────────────

/** GET /api/custom-cookie-rules?siteId= → { success, rules[] }. */
export async function getCustomCookieRules(siteId) {
  const res = await authedFetch(`${wfUrl(WORKER_BASE_URL, "custom-cookie-rules")}?siteId=${encodeURIComponent(siteId)}`);
  let data = {};
  try { data = await parseJson(res); } catch { data = { success: false, rules: [] }; }
  return data;
}

/**
 * Create a custom cookie rule (starts as a draft, published=0).
 *   POST /api/custom-cookie-rules
 *   body: { siteId, name, domain, category, provider?, scriptUrlPattern?, description?, duration? }
 * Returns { success, id }.
 */
export async function addCustomCookieRule(payload) {
  const res = await authedFetch(wfUrl(WORKER_BASE_URL, "custom-cookie-rules"), {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    body: JSON.stringify(payload),
  });
  let data = {};
  try { data = await parseJson(res); } catch { data = { success: false, error: `Unexpected response (HTTP ${res.status})` }; }
  return data;
}

/**
 * DELETE /api/wf/custom-cookie-rules?id=&siteId= → { success }.
 * siteId is required so the backend can authorize the caller for this site.
 */
export async function deleteCustomCookieRule(siteId, id) {
  const res = await authedFetch(`${wfUrl(WORKER_BASE_URL, "custom-cookie-rules")}?id=${encodeURIComponent(id)}&siteId=${encodeURIComponent(siteId)}`, { method: "DELETE", headers: { "X-Requested-With": "XMLHttpRequest" } });
  let data = {};
  try { data = await parseJson(res); } catch { data = { success: false }; }
  return data;
}

/** Publish all draft rules for a site. POST { action:'publish', siteId } → { success }. */
export async function publishCustomCookieRules(siteId) {
  const res = await authedFetch(wfUrl(WORKER_BASE_URL, "custom-cookie-rules"), {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    body: JSON.stringify({ action: "publish", siteId }),
  });
  let data = {};
  try { data = await parseJson(res); } catch { data = { success: false, error: `Unexpected response (HTTP ${res.status})` }; }
  return data;
}

// ── Consent logs — same endpoints as consentbitwebapp ────────────────────────

/**
 * GET /api/consent-logs?siteId=&limit=&offset=&year=&month=
 * → { success, consents, cookies, customCookieRules, total, limit, offset }.
 * year+month must BOTH be set to filter by date (worker requirement).
 */
export async function getConsentHistory(siteId, { limit = 100, offset = 0, year, month } = {}) {
  const params = new URLSearchParams({ siteId, limit: String(limit), offset: String(offset) });
  if (year && month) { params.set("year", year); params.set("month", month); }
  const res = await authedFetch(`${wfUrl(WORKER_BASE_URL, "consent-logs")}?${params.toString()}`);
  let data = {};
  try { data = await parseJson(res); } catch { data = { success: false, consents: [], total: 0 }; }
  return data;
}

// Fetch a file from the worker and trigger a browser download (Blob + object URL;
// no document.body mutation). Returns nothing; throws on a non-OK response.
async function downloadBlob(url, fallbackName) {
  const res = await authedFetch(url);
  if (!res.ok) throw new Error(`Download failed (HTTP ${res.status})`);
  const blob = await res.blob();
  const cd = res.headers.get("Content-Disposition") || "";
  const m = cd.match(/filename="?([^"]+)"?/i);
  const name = m?.[1] || fallbackName;
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objUrl;
  a.download = name;
  a.rel = "noopener";
  a.click();
  setTimeout(() => URL.revokeObjectURL(objUrl), 1500);
}

/**
 * Download the consent-logs export. GET /api/consent-csv?siteId=&year=&month=.
 * The worker returns an Excel SpreadsheetML file (Content-Type application/vnd.ms-excel),
 * so the fallback name MUST be .xls — a .csv extension makes Excel show the raw XML.
 * (Content-Disposition isn't readable cross-origin, so this fallback name is what's used.)
 */
export async function downloadConsentCsv(siteId, { year, month } = {}) {
  const params = new URLSearchParams({ siteId });
  if (year && month) { params.set("year", year); params.set("month", month); }
  await downloadBlob(`${wfUrl(WORKER_BASE_URL, "consent-csv")}?${params.toString()}`, `consent-logs-${year || "all"}-${month || "all"}.xls`);
}

/** Download a single consent record as PDF. GET /api/consent-pdf?siteId=&consentId=. */
export async function downloadConsentPdf(siteId, consentId) {
  const params = new URLSearchParams({ siteId, consentId });
  await downloadBlob(`${wfUrl(WORKER_BASE_URL, "consent-pdf")}?${params.toString()}`, `consent_${String(consentId).slice(0, 8)}.pdf`);
}

// ── Account ownership transfer ───────────────────────────────────────────────

/**
 * Request an account ownership transfer. The backend resolves the current account
 * owner from THIS Webflow site's organization and emails an authorization link to
 * that owner's email — nothing changes until they click it. Authenticated by the
 * Webflow ID token (authedFetch); no email/session is sent from the client.
 *   POST /api/wf/transfer-ownership/request  body { newEmail, newName, appOrigin }
 *   → { success, sentTo?, authorizeLink? (dev only), expiresAt? }
 * The authorize link is built against the webapp frontend (CHECKOUT_BASE_URL),
 * which hosts the /transfer-ownership/authorize page — the Designer iframe cannot.
 */
export async function requestOwnershipTransfer({ newEmail, newName } = {}) {
  const res = await authedFetch(wfUrl(WORKER_BASE_URL, "transfer-ownership/request"), {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    body: JSON.stringify({
      newEmail: String(newEmail || "").trim().toLowerCase(),
      newName: String(newName || "").trim(),
      appOrigin: CHECKOUT_BASE_URL,
    }),
  });
  let data = {};
  try { data = await parseJson(res); } catch { data = { success: false, error: `Unexpected response (HTTP ${res.status})` }; }
  if (!res.ok && data.success === undefined) data.success = false;
  return data;
}

/**
 * Update the account owner's profile (billing email). Mirrors the webapp's
 * updateProfile — the backend resolves the current owner from THIS Webflow site's
 * organization and persists the billing email. Authenticated by the Webflow ID
 * token (authedFetch).
 *   POST /api/wf/profile  body { billingEmail }  → { success, user }
 */
export async function updateOwnerProfile({ billingEmail } = {}) {
  const res = await authedFetch(wfUrl(WORKER_BASE_URL, "profile"), {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    body: JSON.stringify({ ...(billingEmail !== undefined ? { billingEmail } : {}) }),
  });
  let data = {};
  try { data = await parseJson(res); } catch { data = { success: false, error: `Unexpected response (HTTP ${res.status})` }; }
  if (!res.ok && data.success === undefined) data.success = false;
  return data;
}

// Paid-plan checkout lives in webflowAuth.js (startCheckout) — it uses the same
// CHECKOUT_BASE_URL (accounts.consentbit.com) as the plan page.
// Re-export it so callers can import from this single api module.
export { startCheckout } from "./webflowAuth.js";
