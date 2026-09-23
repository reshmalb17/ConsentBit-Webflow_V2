// Plan → feature entitlements for the Designer app UI.
//
// Mirrors the pricing table rendered by WSelectPlan.jsx and WUpgrade.jsx:
//   Free / Basic       → "GDPR/CCPA"  — one regime at a time, no IAB TCF
//   Essential / Growth → "GDPR+CCPA"  — both regimes (geo-routed), IAB TCF
//
// NOTE: this is a UI gate only. The backend (consent-manager
// handlers/bannerCustomization.js) still accepts compliance=['gdpr','us'] from any
// plan and writes Site.region_mode='both' without a plan check, so this does not
// enforce the entitlement on its own.

const PRO_PLANS = ["essential", "growth"];

// The consent-template option that covers BOTH regimes. The <select> values in
// WEdGeneral/WEdContent must use this exact string.
export const BOTH_TEMPLATE = "CCPA+GDPR";

// Starting template for a site with nothing saved yet. GDPR-only, so a site never
// lands on the Pro-tier CCPA+GDPR without the user explicitly choosing it (and
// clearing the plan gate). Sites that DO have a saved compliance value are
// unaffected — loadCustomization.js restores their template over this.
export const DEFAULT_TEMPLATE = "GDPR (EU)";

// The consent-template choices, shared by the General and Content tabs so the two
// dropdowns can't drift apart.
export const TEMPLATE_OPTIONS = [
  { value: "CCPA (USA)", label: "CCPA (USA)" },
  { value: DEFAULT_TEMPLATE, label: DEFAULT_TEMPLATE },
  { value: BOTH_TEMPLATE, label: BOTH_TEMPLATE },
];

export function normalizePlan(plan) {
  return String(plan || "free").toLowerCase();
}

// IAB TCF v2.3 + Google Additional Consent.
export function canUseTcf(plan) {
  return PRO_PLANS.includes(normalizePlan(plan));
}

// GDPR *and* CCPA on one site (Site.region_mode='both').
export function canUseBothRegions(plan) {
  return PRO_PLANS.includes(normalizePlan(plan));
}
