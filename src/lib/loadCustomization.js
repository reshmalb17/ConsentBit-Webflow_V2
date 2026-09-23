// Reverse of buildCustomizationPayload: maps a saved BannerCustomization row
// (from GET /api/banner-customization) back into the editor's NavContext state,
// so customization done in the webapp shows up in the plugin editor + preview.
//
// Every mapped object is pruned to DEFINED values only — callers merge it onto
// the existing defaults, so a missing field keeps its default instead of blanking.

import { languageCodes } from "./bannerContent.js";
import { resolveIabLang } from "./iabTranslations.js";

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
  // Font card. bannerFontMode is what the CDN actually reads, so it wins when both
  // keys are present; bannerFontEnabled is the fallback for configs saved without it.
  if (cfg.bannerFontMode !== undefined) out.bannerFontEnabled = String(cfg.bannerFontMode).toLowerCase() !== "inherit";
  else if (cfg.bannerFontEnabled !== undefined) out.bannerFontEnabled = truthy(cfg.bannerFontEnabled);

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
  // Derived from languageCodes so adding a language to bannerContent.js is enough —
  // this map can no longer drift behind the dropdown.
  const CODE_TO_LANG = Object.fromEntries(
    Object.entries(languageCodes).map(([name, code]) => [code.toLowerCase(), name]),
  );
  const langCode = String(en.languageSelected || "").toLowerCase();

  if (out.iab) {
    // IAB on: languageSelected is the IAB banner's language, so it restores the
    // General tab's picker. Normalised on the way in so a stored browser-style tag
    // ("de-AT") or an unknown code lands on a language the string table has.
    if (langCode) out.iabLang = resolveIabLang(langCode);
    // The Content tab's own language then has to come from the `language` column
    // rather than from languageSelected, which no longer describes that copy.
    // Reading it back from languageSelected would relabel the GDPR/CCPA banner in
    // the IAB language while its copy stayed English — visible the moment IAB is
    // switched back off.
    const named = String(c.language || "");
    if (Object.prototype.hasOwnProperty.call(languageCodes, named)) out.language = named;
  } else if (CODE_TO_LANG[langCode]) {
    out.language = CODE_TO_LANG[langCode];
  }

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
  // `ccpaDescription` is the CCPA notice body. Rows saved by older builds of this
  // app hold the opt-out panel's intro there instead (it was mapped from
  // `optOutBody`), and a few older rows hold the GDPR "By clicking Accept" default.
  // Reading either back would put the wrong paragraph in the notice field and let
  // the next save re-commit it, so both shapes are dropped and the caller keeps the
  // default. Same two signatures the worker guards on (cdnM.js CCPA_NOTICE_DEFAULTS):
  // identical to the opt-out intro, or the GDPR default's opening clause.
  const GDPR_ACCEPT_DEFAULT_PREFIXES = [
    "We use cookies to enhance your browsing experience, serve personalised ads or content",
    "We gebruiken cookies om uw browse-ervaring te verbeteren",
    "Nous utilisons des cookies pour améliorer votre expérience de navigation",
    "Wir verwenden Cookies, um Ihr Surferlebnis zu verbessern",
    "Utilizziamo i cookie per migliorare la tua esperienza di navigazione",
    "Używamy plików cookie, aby ulepszyć Twoje doświadczenie przeglądania",
    "Utilizamos cookies para melhorar a sua experiência de navegação",
    "Usamos cookies para mejorar su experiencia de navegación",
    "Vi använder cookies för att förbättra din surfupplevelse",
  ];
  const rawCcpaNotice = String(en.ccpaDescription ?? "").trim();
  const ccpaNoticeIsWrongField =
    !rawCcpaNotice ||
    rawCcpaNotice === String(en.ccpaOptOutPreferenceIntro ?? "").trim() ||
    GDPR_ACCEPT_DEFAULT_PREFIXES.some((p) => rawCcpaNotice.indexOf(p) === 0);

  out.ccpaContent = defined({
    message: ccpaNoticeIsWrongField ? undefined : rawCcpaNotice,
    doNotShare: en.doNotSell,
    optOutTitle: en.optOutPreference,
    optOutBody: en.ccpaOptOutPreferenceIntro,
    cancel: en.cancel,
    save: en.saveMyPreferences,
  });

  return out;
}
