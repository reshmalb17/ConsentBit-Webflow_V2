// Maps the new-design app state (NavContext) → banner customization DB schema.
//
// The OUTPUT object keys are identical to the live app's
// (Currently live - Copy/ConsentBit/src/util/buildCustomizationPayload.ts) so the
// consent-manager backend accepts it unchanged. Only the VALUES differ: they come
// from this project's state + bannerContent.js (its own content/localization),
// NOT from the live app's translation-utils.
//
// Used by the Publish flow (lib/publish.js) for both the first-publish
// (initialCustomization on free-register) and repeat-publish (banner-customization).

import {
  localization,
  preferenceBanner,
  simpleBanner,
  ccpaBanner,
  editorDefaults,
  preferenceLocalization,
  languageCodes,
} from "./bannerContent.js";

// ── Helpers (ported verbatim from the reference) ─────────────────────────────
const WEIGHT_LABEL_TO_NUM = {
  Thin: "100",
  Light: "300",
  Regular: "400",
  Medium: "500",
  "Semi Bold": "600",
  Bold: "700",
  "Extra Bold": "800",
  Black: "900",
};

function weightToNumeric(label) {
  if (!label) return "700";
  const s = String(label).trim();
  if (/^\d+$/.test(s)) return s; // already numeric
  return WEIGHT_LABEL_TO_NUM[s] ?? "700";
}

function positionToDb(selected) {
  if (selected === "right") return "bottom-right";
  if (selected === "center") return "bottom-center";
  return "bottom-left";
}

const MAX_RADIUS_PX = 25;
function pxToRem(px) {
  const n = Math.min(MAX_RADIUS_PX, Math.max(0, Number(px ?? 0)));
  return `${(n / 16).toFixed(3)}rem`;
}

// ── New-design → reference value adapters ────────────────────────────────────
// bannerPos ('box' | 'banner' | 'popup') → the reference's bannerLayoutVisual.
function posToLayoutVisual(bannerPos) {
  if (bannerPos === "banner") return "banner";       // full-width
  if (bannerPos === "popup") return "bottom-center"; // centered modal
  return "box";                                       // box (left/right)
}

// bannerPos + bannerAlign → the reference's `position` (alignment).
function posToAlign(bannerPos, bannerAlign) {
  if (bannerPos === "box") return bannerAlign === "right" ? "right" : "left";
  return "center"; // banner / popup are centered
}

/**
 * Build the customization payload from the app's NavContext values.
 * @param {object} ctx - the NavContext (or an object with the same fields).
 * @returns {object} payload whose keys match the live BannerCustomization schema.
 */
export function buildCustomizationPayload(ctx = {}) {
  const {
    bannerColors = {},
    bannerContent = {},
    prefContent = {},
    ccpaContent = {},
    bannerPos = "box",
    bannerAlign = "left",
    bannerRadius = 12,
    bannerBtnRadius = 4,
    bannerAnim = "fade-in",
    bannerWeight = "700",
    bannerTextAlign = "left",
    closeBtn = false,
    showReject = true,
    showCustomize = true,
    showPolicy = false,
    floating = false,
    floatPos = "left",
    language = "English",
    iab = false,
    gac = false,
    template = "",
  } = ctx;

  // ── IAB / TCF (added per consentbitwebapp; absent from the live Webflow build) ─
  // When IAB is selected the webapp writes these flags into translations.en.
  const iabEnabled = !!iab;
  const googleAc = iabEnabled && !!gac; // Google Additional Consent only with IAB
  const complianceLabel = (() => {
    const t = String(template || "").toUpperCase();
    const hasGdpr = t.includes("GDPR");
    const hasCcpa = t.includes("CCPA");
    if (hasGdpr && hasCcpa) return "BOTH";
    if (hasCcpa && !hasGdpr) return "CCPA";
    return "GDPR";
  })();

  // Effective privacy URL only when the policy link is shown (matches reference's
  // privacyUrl-presence checks).
  const privacyUrl = showPolicy ? (bannerContent.policyUrl ?? "") : "";

  // Preference-center categories, in this project's order:
  // 0 Strictly Necessary · 1 Marketing · 2 Analytics · 3 Preferences
  const cats = Array.isArray(prefContent.cats) ? prefContent.cats : [];
  const cat = (i) => cats[i] || {};
  const locPref = preferenceLocalization[language] || preferenceLocalization.English;
  const locBanner = localization[language] || localization.English;

  return {
    // ── Colors ──────────────────────────────────────────────────────────────
    backgroundColor:     bannerColors.bannerBg     ?? "#ffffff",
    textColor:           bannerColors.textColor    ?? "#334155",
    headingColor:        bannerColors.headingColor ?? "#0f172a",
    acceptButtonBg:      bannerColors.btnBg        ?? "#0284c7",
    acceptButtonText:    bannerColors.btnText      ?? "#ffffff",
    rejectButtonBg:      bannerColors.btnBg        ?? "#0284c7",
    rejectButtonText:    bannerColors.btnText      ?? "#ffffff",
    customiseButtonBg:   bannerColors.prefBtnBg    ?? "#ffffff",
    customiseButtonText: bannerColors.prefBtnText  ?? "#334155",
    saveButtonBg:        bannerColors.prefBtnBg    ?? "#ffffff",
    saveButtonText:      bannerColors.prefBtnText  ?? "#334155",
    backButtonBg:        "#ffffff",
    backButtonText:      "#334155",
    doNotSellButtonBg:   "#ffffff",
    doNotSellButtonText: "#334155",

    // ── Layout ───────────────────────────────────────────────────────────────
    position:           positionToDb(posToAlign(bannerPos, bannerAlign)),
    bannerBorderRadius: pxToRem(bannerRadius),
    buttonBorderRadius: pxToRem(bannerBtnRadius),
    preferencePosition: "center",

    // ── Animation ────────────────────────────────────────────────────────────
    animationEnabled:         1,
    centerAnimationDirection: bannerAnim ?? "fade",

    // ── Behaviour ────────────────────────────────────────────────────────────
    stopScroll: 0,
    footerLink: privacyUrl ? 1 : 0,

    // ── Settings ─────────────────────────────────────────────────────────────
    language:             language ?? "English",
    autoDetectLanguage:   0,
    cookieExpirationDays: 120,
    showBannerLogo:       1,
    // Mirror floatingButtonPosition — the runtime loaders read bannerLogoPosition
    // FIRST when positioning the floating trigger, so these two MUST agree (matches
    // the live app, which sets both from bannerToggleStates.logoPosition).
    bannerLogoPosition:   floatPos === "right" ? "right" : "left",
    privacyPolicyUrl:     privacyUrl ?? "",

    configJson: null,

    // ── Translations ─────────────────────────────────────────────────────────
    translations: {
      // config: language-independent layout + toggle settings
      config: {
        bannerLayoutVisual:      posToLayoutVisual(bannerPos),
        bannerFontFamily:        "Inter",
        bannerFontWeight:        weightToNumeric(bannerWeight),
        bannerFontSize:          16,
        bannerTextAlign:         bannerTextAlign ?? "left",
        bannerBg2:               "#798EFF",
        bannerEntranceAnimation: bannerAnim ?? "fade",
        closeButtonEnabled:      closeBtn ? "1" : "0",
        rejectButtonEnabled:     showReject ? "1" : "0",
        customizeButtonEnabled:  showCustomize ? "1" : "0",
        cookiePolicyLinkEnabled: privacyUrl ? "1" : "0",
        floatingButtonEnabled:   floating ? "1" : "0",
        floatingButtonPosition:  floatPos === "right" ? "right" : "left",
        // IAB / Google Additional Consent (config-level, matching the webapp — the
        // runtime reads these here). Gated on IAB: GAC only applies when IAB is on.
        isIab:                   iabEnabled,
        isGoogleAc:              googleAc,       // !!iab && !!gac
        googleAdditionalConsent: googleAc,       // !!iab && !!gac
      },
      // en: language-specific text content (always stored under the 'en' key)
      en: {
        // ── IAB / TCF flags (same keys the webapp writes when IAB is on) ──────
        compliance:                complianceLabel,
        isIab:                     iabEnabled,
        iab_enabled:               iabEnabled,
        isGoogleAc:                googleAc,
        googleAdditionalConsent:   googleAc,

        languageSelected:          (languageCodes[language] ?? "EN").toLowerCase(),
        title:                     bannerContent.title    ?? locBanner.title,
        acceptAll:                 bannerContent.accept   ?? locBanner.accept,
        description:               bannerContent.message  ?? locBanner.message,
        ccpaDescription:           ccpaContent.optOutBody ?? ccpaBanner.optOutBody,
        rejectAll:                 bannerContent.reject   ?? preferenceBanner.buttons.reject,
        customise:                 bannerContent.customize ?? simpleBanner.buttons.preference,
        doNotSell:                 ccpaContent.doNotShare ?? ccpaBanner.doNotShare,
        cookiePreferences:         prefContent.title      ?? preferenceBanner.title,
        managePreferences:         prefContent.overview   ?? preferenceBanner.overview,
        // Section labels
        essential:                 cat(0).name ?? "Strictly Necessary",
        strictlyNecessary:         cat(0).name ?? "Strictly Necessary",
        analytics:                 cat(2).name ?? "Analytics",
        marketing:                 cat(1).name ?? "Marketing",
        preferences:               cat(3).name ?? "Preferences",
        // Section descriptions
        essentialDescription:      cat(0).desc ?? "",
        analyticsDescription:      cat(2).desc ?? "",
        marketingDescription:      cat(1).desc ?? "",
        preferencesDescription:    cat(3).desc ?? "",
        optOutPreference:          ccpaContent.optOutTitle ?? ccpaBanner.optOutTitle,
        ccpaOptOutPreferenceIntro: ccpaContent.optOutBody  ?? ccpaBanner.optOutBody,
        saveMyPreferences:         prefContent.save        ?? preferenceBanner.buttons.save,
        privacyPolicy:             bannerContent.policy    ?? editorDefaults.default.policyLinkLabel,
        alwaysActive:              prefContent.alwaysActive ?? locPref.alwaysActive,
        cancel:                    ccpaContent.cancel      ?? ccpaBanner.buttons.cancel,
      },
    },
  };
}
