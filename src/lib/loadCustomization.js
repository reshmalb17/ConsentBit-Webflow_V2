// Reverse of buildCustomizationPayload: maps a saved BannerCustomization row
// (from GET /api/banner-customization) back into the editor's NavContext state,
// so customization done in the webapp shows up in the plugin editor + preview.
//
// Every mapped object is pruned to DEFINED values only — callers merge it onto
// the existing defaults, so a missing field keeps its default instead of blanking.

function remToPx(rem) {
  if (rem == null) return null;
  const s = String(rem).trim();
  const n = parseFloat(s);
  if (isNaN(n)) return null;
  return Math.round(/rem$/i.test(s) ? n * 16 : n);
}

const truthy = (v) => v === true || v === 1 || v === "1";

// Remove undefined/null keys so a merge doesn't clobber existing defaults.
function defined(obj) {
  const out = {};
  for (const k of Object.keys(obj)) {
    if (obj[k] !== undefined && obj[k] !== null) out[k] = obj[k];
  }
  return out;
}

export function mapCustomizationToState(c) {
  if (!c || typeof c !== "object") return {};
  const cfg = (c.translations && c.translations.config) || {};
  const en = (c.translations && c.translations.en) || {};
  const out = {};

  // ── Colors ──────────────────────────────────────────────────────────────
  out.bannerColors = defined({
    bannerBg: c.backgroundColor,
    textColor: c.textColor,
    headingColor: c.headingColor,
    btnBg: c.acceptButtonBg,
    btnText: c.acceptButtonText,
    prefBtnBg: c.customiseButtonBg,
    prefBtnText: c.customiseButtonText,
  });

  // ── Layout ──────────────────────────────────────────────────────────────
  const layout = cfg.bannerLayoutVisual;
  if (layout === "banner") out.bannerPos = "banner";
  else if (layout === "bottom-center") out.bannerPos = "popup";
  else if (layout === "box") out.bannerPos = "box";
  if (c.position) out.bannerAlign = String(c.position).includes("right") ? "right" : "left";
  const br = remToPx(c.bannerBorderRadius); if (br != null) out.bannerRadius = br;
  const bbr = remToPx(c.buttonBorderRadius); if (bbr != null) out.bannerBtnRadius = bbr;
  const anim = c.centerAnimationDirection || cfg.bannerEntranceAnimation;
  if (anim) out.bannerAnim = anim;

  // ── Typography ──────────────────────────────────────────────────────────
  if (cfg.bannerFontWeight) out.bannerWeight = String(cfg.bannerFontWeight);
  if (cfg.bannerTextAlign) out.bannerTextAlign = cfg.bannerTextAlign;

  // ── Toggles ─────────────────────────────────────────────────────────────
  if (cfg.closeButtonEnabled !== undefined) out.closeBtn = truthy(cfg.closeButtonEnabled);
  if (cfg.rejectButtonEnabled !== undefined) out.showReject = truthy(cfg.rejectButtonEnabled);
  if (cfg.customizeButtonEnabled !== undefined) out.showCustomize = truthy(cfg.customizeButtonEnabled);
  if (cfg.cookiePolicyLinkEnabled !== undefined) out.showPolicy = truthy(cfg.cookiePolicyLinkEnabled);

  // ── Floating reopen button ──────────────────────────────────────────────
  // Saved under translations.config by buildCustomizationPayload; without this
  // the floating button set in an earlier customization is lost on reload.
  if (cfg.floatingButtonEnabled !== undefined) out.floating = truthy(cfg.floatingButtonEnabled);
  if (cfg.floatingButtonPosition) out.floatPos = cfg.floatingButtonPosition === "right" ? "right" : "left";

  // ── IAB / Google Additional Consent ─────────────────────────────────────
  if (en.isIab !== undefined || en.iab_enabled !== undefined) out.iab = truthy(en.isIab) || truthy(en.iab_enabled);
  if (en.isGoogleAc !== undefined || en.googleAdditionalConsent !== undefined) out.gac = truthy(en.isGoogleAc) || truthy(en.googleAdditionalConsent);

  // ── Language ────────────────────────────────────────────────────────────
  // languageSelected is a lowercase ISO code (see buildCustomizationPayload);
  // map it back to the display name the Content dropdown uses so a saved
  // non-English banner reopens on the right language instead of "English".
  const CODE_TO_LANG = { en: "English", es: "Spanish", fr: "French", de: "German", nl: "Dutch" };
  const langCode = String(en.languageSelected || "").toLowerCase();
  if (CODE_TO_LANG[langCode]) out.language = CODE_TO_LANG[langCode];

  // ── Template (from compliance) ──────────────────────────────────────────
  const comp = String(en.compliance || c.compliance || "").toUpperCase();
  if (comp === "BOTH") out.template = "CCPA+GDPR";
  else if (comp === "CCPA") out.template = "CCPA (USA)";
  else if (comp === "GDPR") out.template = "GDPR (EU)";

  // ── Content ─────────────────────────────────────────────────────────────
  out.bannerContent = defined({
    title: en.title,
    message: en.description,
    accept: en.acceptAll,
    reject: en.rejectAll,
    customize: en.customise,
    policy: en.privacyPolicy,
    policyUrl: c.privacyPolicyUrl || undefined,
  });

  // ── Preference-center content ───────────────────────────────────────────
  const prefCats = [
    defined({ name: en.strictlyNecessary || en.essential, desc: en.essentialDescription, always: true }),
    defined({ name: en.marketing, desc: en.marketingDescription }),
    defined({ name: en.analytics, desc: en.analyticsDescription }),
    defined({ name: en.preferences, desc: en.preferencesDescription }),
  ];
  out.prefContent = defined({
    title: en.cookiePreferences,
    overview: en.managePreferences,
    save: en.saveMyPreferences,
    alwaysActive: en.alwaysActive,
    cats: prefCats.some((c2) => c2.name) ? prefCats : undefined,
  });

  // ── CCPA content ────────────────────────────────────────────────────────
  out.ccpaContent = defined({
    doNotShare: en.doNotSell,
    optOutTitle: en.optOutPreference,
    optOutBody: en.ccpaOptOutPreferenceIntro,
    cancel: en.cancel,
    save: en.saveMyPreferences,
  });

  return out;
}
