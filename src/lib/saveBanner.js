// Save the current banner customization to the backend for the CURRENT site.
//
// This is NOT a Webflow site publish and does NOT create any component or inject
// any script. It only persists the banner settings to the consent-manager backend
// via POST /api/banner-customization — one API call.
//
// The site must already be registered (the launch flow routes registered users to
// the Customize screen, so by the time they save, a Site row exists).

import { getWebflowSiteContext, getWebflowSiteStatus, saveWebappBannerCustomization } from "./api.js";
import { buildCustomizationPayload } from "./buildCustomizationPayload.js";

// template (+ IAB) → compliance array. Matches the webapp:
//   IAB on or "both"  → ['gdpr', 'us']
//   CCPA only         → ['us']
//   GDPR              → ['gdpr']
function complianceFromTemplate(template, iab = false) {
  const t = String(template || "").toUpperCase();
  const hasGdpr = t.includes("GDPR");
  const hasCcpa = t.includes("CCPA");
  if (iab || (hasGdpr && hasCcpa)) return ["gdpr", "us"];
  if (hasCcpa && !hasGdpr) return ["us"];
  return ["gdpr"];
}

/**
 * Build the customization payload from the current app state and save it to the
 * backend for the current Webflow site.
 * @param {object} ctx - NavContext values (state + template).
 * @returns {Promise<object>} the worker response ({ success, ... } or { success:false, error }).
 */
export async function saveBanner(ctx = {}) {
  const { wfSiteId } = await getWebflowSiteContext();
  if (!wfSiteId) {
    return { success: false, error: "Couldn't read your Webflow site. Open this inside the Designer." };
  }

  const customization = buildCustomizationPayload(ctx);
  const compliance = complianceFromTemplate(ctx.template, ctx.iab);

  // Prefer the webapp (D1 internal) site id so the save writes the SAME
  // BannerCustomization row the webapp dashboard reads/writes — keeping content in
  // sync both ways. Fall back to wfSiteId resolution when it's unavailable.
  let webappSiteId = ctx.webappSiteId || null;
  if (!webappSiteId) {
    try {
      const st = await getWebflowSiteStatus(wfSiteId);
      webappSiteId = st?.webappSiteId || null;
    } catch { /* fall back to wfSiteId */ }
  }

  const extra = { compliance, ...(webappSiteId ? { siteId: webappSiteId } : {}) };
  return saveWebappBannerCustomization(wfSiteId, customization, extra);
}
