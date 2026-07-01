// consent-manager Worker API client.
//
// Base URL comes from VITE_WORKER_BASE_URL (see webflowAuth.js) — currently the
// test worker. Identity (the workspace email) is resolved server-side from the
// OAuth record the install/authorize flow stored, so the client never holds or
// sends a token or email.

import { WORKER_BASE_URL, CHECKOUT_API_BASE } from "./webflowAuth.js";

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
  const url = new URL(`${WORKER_BASE_URL}/api/webflow/oauth/status`);
  url.searchParams.set("siteId", wfSiteId);
  url.searchParams.set("verify", "false");

  const res = await fetch(url.toString(), { method: "GET" });
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
    const url = new URL(`${CHECKOUT_API_BASE}/api/payment/subscription`);
    url.searchParams.set("siteId", wfSiteId);
    res = await fetch(url.toString(), { method: "GET" });
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
    const url = new URL(`${CHECKOUT_API_BASE}/api/webflow/billing`);
    url.searchParams.set("siteId", wfSiteId);
    res = await fetch(url.toString(), { method: "GET" });
  } catch (e) {
    return { success: false, plan: "free", invoices: [], error: e?.message || "network" };
  }
  return parseJson(res);
}

/**
 * Cancel the current site's subscription at period end.
 *   POST /api/webflow/cancel-subscription  body { siteId } → { success, cancelAtPeriodEnd }
 */
export async function cancelWebflowSubscription(wfSiteId) {
  const res = await fetch(`${CHECKOUT_API_BASE}/api/webflow/cancel-subscription`, {
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
    res = await fetch(`${WORKER_BASE_URL}/api/verify-script`, {
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

  const result = await verifyScript({
    publicUrl,
    scriptUrl: status.scriptUrl,
    siteId: status.webappSiteId,
  });
  return { published: true, ...result };
}

/**
 * Save banner customization for an already-registered site (the repeat-publish
 * path). Mirrors the live app's saveWebappBannerCustomization:
 *   POST /api/banner-customization
 *   body: { wfSiteId, customization, compliance }
 * No auth header (consent-manager worker). Returns the parsed JSON.
 */
export async function saveWebappBannerCustomization(wfSiteId, customization, extra = {}) {
  const res = await fetch(`${WORKER_BASE_URL}/api/banner-customization`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    body: JSON.stringify({ wfSiteId, customization, ...extra }),
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
export async function registerWebflowFree({ wfSiteId, domain, initialCustomization } = {}) {
  const res = await fetch(`${WORKER_BASE_URL}/api/v2/webflow-free-register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    body: JSON.stringify({
      wfSiteId,
      domain,
      platform: "webflow",
      version: "v2",
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
    res = await fetch(`${WORKER_BASE_URL}/api/scan-site`, {
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
  const res = await fetch(`${WORKER_BASE_URL}/api/scan-history?siteId=${encodeURIComponent(siteId)}`);
  let data = {};
  try { data = await parseJson(res); } catch { data = { success: false, scans: [] }; }
  return data;
}

/** GET /api/cookies?siteId= → { success, cookies, cookiesByCategory }. */
export async function getSiteCookies(siteId) {
  const res = await fetch(`${WORKER_BASE_URL}/api/cookies?siteId=${encodeURIComponent(siteId)}`);
  let data = {};
  try { data = await parseJson(res); } catch { data = { success: false, cookies: [], cookiesByCategory: {} }; }
  return data;
}

// ── Scheduled scans — same endpoints as consentbitwebapp ─────────────────────

/** GET /api/scheduled-scan?siteId= → { success, scheduledScans: ScheduledScan[] }. */
export async function getScheduledScans(siteId) {
  const res = await fetch(`${WORKER_BASE_URL}/api/scheduled-scan?siteId=${encodeURIComponent(siteId)}`);
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
  const res = await fetch(`${WORKER_BASE_URL}/api/scheduled-scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    body: JSON.stringify({ siteId, scheduledAt, frequency }),
  });
  let data = {};
  try { data = await parseJson(res); } catch { data = { success: false, error: `Unexpected response (HTTP ${res.status})` }; }
  return data;
}

/** DELETE /api/scheduled-scan?id= → { success }. */
export async function deleteScheduledScan(id) {
  const res = await fetch(`${WORKER_BASE_URL}/api/scheduled-scan?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: { "X-Requested-With": "XMLHttpRequest" } });
  let data = {};
  try { data = await parseJson(res); } catch { data = { success: false }; }
  return data;
}

// ── Custom cookie rules — same endpoints as consentbitwebapp ─────────────────

/** GET /api/custom-cookie-rules?siteId= → { success, rules[] }. */
export async function getCustomCookieRules(siteId) {
  const res = await fetch(`${WORKER_BASE_URL}/api/custom-cookie-rules?siteId=${encodeURIComponent(siteId)}`);
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
  const res = await fetch(`${WORKER_BASE_URL}/api/custom-cookie-rules`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    body: JSON.stringify(payload),
  });
  let data = {};
  try { data = await parseJson(res); } catch { data = { success: false, error: `Unexpected response (HTTP ${res.status})` }; }
  return data;
}

/** DELETE /api/custom-cookie-rules?id= → { success }. */
export async function deleteCustomCookieRule(id) {
  const res = await fetch(`${WORKER_BASE_URL}/api/custom-cookie-rules?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: { "X-Requested-With": "XMLHttpRequest" } });
  let data = {};
  try { data = await parseJson(res); } catch { data = { success: false }; }
  return data;
}

/** Publish all draft rules for a site. POST { action:'publish', siteId } → { success }. */
export async function publishCustomCookieRules(siteId) {
  const res = await fetch(`${WORKER_BASE_URL}/api/custom-cookie-rules`, {
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
  const res = await fetch(`${WORKER_BASE_URL}/api/consent-logs?${params.toString()}`);
  let data = {};
  try { data = await parseJson(res); } catch { data = { success: false, consents: [], total: 0 }; }
  return data;
}

// Fetch a file from the worker and trigger a browser download (Blob + object URL;
// no document.body mutation). Returns nothing; throws on a non-OK response.
async function downloadBlob(url, fallbackName) {
  const res = await fetch(url);
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
  await downloadBlob(`${WORKER_BASE_URL}/api/consent-csv?${params.toString()}`, `consent-logs-${year || "all"}-${month || "all"}.xls`);
}

/** Download a single consent record as PDF. GET /api/consent-pdf?siteId=&consentId=. */
export async function downloadConsentPdf(siteId, consentId) {
  const params = new URLSearchParams({ siteId, consentId });
  await downloadBlob(`${WORKER_BASE_URL}/api/consent-pdf?${params.toString()}`, `consent_${String(consentId).slice(0, 8)}.pdf`);
}

// Paid-plan checkout lives in webflowAuth.js (startCheckout) — it uses the same
// CHECKOUT_BASE_URL (consentbit-webapp-frontend-test.pages.dev) as the plan page.
// Re-export it so callers can import from this single api module.
export { startCheckout } from "./webflowAuth.js";
