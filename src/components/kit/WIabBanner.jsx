import React, { useState } from "react";
import { sampleAtpProviders } from "../../lib/bannerContent.js";
import { iabT, resolveIabLang } from "../../lib/iabTranslations.js";
import { useIabPurposeSections } from "../../lib/iabGvlPurposes.js";
import { renderIabRichText } from "../../lib/iabRichText.js";
import "./WIabBanner.css";

// Ported from the ConsentBit webapp (Iab.jsx) so the designer-extension preview
// matches the live IAB/TCF banner exactly — including its language.
//
// Two sources of copy, exactly as in the webapp:
//   - text we author  -> iabTranslations.js, looked up by key through t()
//   - IAB's own text  -> the Global Vendor List, per language, via
//                        useIabPurposeSections() (purposes, features, …)
// Nothing here is user-editable, which is why the IAB banner takes a `lang` and
// no content props: switching language is the only thing that changes its copy.
//
// The simple GDPR/CCPA banner is a different component (WEdPreview) with its own
// copy in bannerContent.js and is untouched by any of this.

/**
 * CMP id shown in the modal's storage-disclosure text. Matches the runtime TCF
 * manager's config (consent-manager utils/Tcfmanager.js), so the preview quotes
 * the same registered id the live banner encodes into the TC string.
 */
const CMP_ID = 502;

// ─── Default Style Config ────────────────────────────────────────────────────
const defaultStyleConfig = {
  bannerBg: "#FFFFFF",
  textColor: "#000000",
  headingColor: "#000000",
  buttonColor: "#FFFFFF",
  buttonTextColor: "#007AFF",
  SecButtonColor: "#007AFF",
  SecButtonTextColor: "#FFFFFF",
  textAlign: "left",
  fontWeight: "400",
  borderRadius: "12",
  buttonBorderRadius: "4",
  bannerType: "banner", // "box" | "banner" | "popup"
  bannerEntranceAnimation: "fade-in",
  floatingButtonEnabled: false,
  floatingButtonPosition: "left",
  isGAC: false,
};

function entranceAnimStyle(anim, opts = {}) {
  const isCenter = opts?.isCenter === true;
  const a = String(anim || "fade-in").toLowerCase();
  if (isCenter) {
    if (a === "slide-up") return "cbIabCenterSlideUp 0.4s ease-out both";
    if (a === "slide-down") return "cbIabCenterSlideDown 0.4s ease-out both";
    if (a === "zoom-in") return "cbIabCenterZoomIn 0.3s ease-out both";
    return "cbIabFadeIn 0.3s ease-out both";
  }
  if (a === "slide-up") return "cbIabSlideUp 0.4s ease-out both";
  if (a === "slide-down") return "cbIabSlideDown 0.4s ease-out both";
  if (a === "zoom-in") return "cbIabZoomIn 0.3s ease-out both";
  return "cbIabFadeIn 0.3s ease-out both";
}

// ─── Cookie Categories ───────────────────────────────────────────────────────
// Names and descriptions are i18n keys resolved at render, matching the runtime
// banner — it stores keys here too rather than text, so a language switch does
// not have to rebuild the category list.
//
// This is the IAB banner's own list and deliberately separate from the shared
// `cookieCategories` in bannerContent.js, which the scanner and the GDPR
// preference centre use with their own (editable) copy.
const cookieCategories = [
  { id: "necessary", nameKey: "cat.necessary", descKey: "cat.necessaryDesc", alwaysActive: true },
  { id: "functional", nameKey: "cat.functional", descKey: "cat.functionalDesc", alwaysActive: false },
  { id: "analytics", nameKey: "cat.analytics", descKey: "cat.analyticsDesc", alwaysActive: false },
  { id: "performance", nameKey: "cat.performance", descKey: "cat.performanceDesc", alwaysActive: false },
  { id: "advertisement", nameKey: "cat.advertisement", descKey: "cat.advertisementDesc", alwaysActive: false },
];

// ─── Purposes Data ───────────────────────────────────────────────────────────
// Purposes, special purposes, features and special features are IAB's own
// declarations, not ours. They come from the Global Vendor List in the selected
// language via useIabPurposeSections() — see lib/iabGvlPurposes.js — so the
// preview shows the same wording the live banner does.

/** Curried string lookup, so components take a plain `t(key, vars)` prop. */
const makeT = (lang) => (key, vars) => iabT(lang, key, vars);

// ─── Radii Helper ────────────────────────────────────────────────────────────
function getRadii(s) {
  const brNum = Number.parseFloat(s.borderRadius) || 0;
  const brBtnRaw = s.buttonBorderRadius != null && String(s.buttonBorderRadius).trim() !== "" ? Number.parseFloat(s.buttonBorderRadius) : null;
  return {
    br: `${brNum}px`,
    brSm: `${Math.min(brNum, 8)}px`,
    brPill: `999px`,
    brBtn: brBtnRaw != null && Number.isFinite(brBtnRaw) ? `${brBtnRaw}px` : `${Math.min(brNum, 8)}px`,
  };
}

function alignToJustify(textAlign) {
  if (textAlign === "center") return "center";
  if (textAlign === "right") return "flex-end";
  return "flex-start";
}
function footerJustify(textAlign) {
  if (textAlign === "center") return "center";
  if (textAlign === "right") return "flex-start";
  return "flex-end";
}

function Switch({ checked, onChange, disabled = false, accent = "#007AFF", size = "md" }) {
  const w = size === "sm" ? 36 : 44;
  const h = size === "sm" ? 20 : 24;
  const knob = size === "sm" ? 14 : 18;
  const inset = 3;
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => !disabled && onChange(!checked)} style={{ position: "relative", display: "inline-flex", alignItems: "center", width: `${w}px`, height: `${h}px`, borderRadius: "999px", border: "none", padding: 0, background: checked ? "#007AFF" : "#d0d5d2", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)", cursor: disabled ? "not-allowed" : "pointer", transition: "background-color 0.2s", opacity: disabled ? 0.7 : 1, flexShrink: 0 }}>
      <span style={{ position: "absolute", top: `${inset}px`, left: `${inset}px`, width: `${knob}px`, height: `${knob}px`, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.35)", transform: checked ? `translateX(${w - knob - inset * 2}px)` : "translateX(0)", transition: "transform 0.2s" }} />
    </button>
  );
}

function ChevronRight({ open, size = 6 }) {
  return <span style={{ display: "inline-block", width: 0, height: 0, borderTop: `${size - 2}px solid transparent`, borderBottom: `${size - 2}px solid transparent`, borderLeft: `${size}px solid #999`, transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />;
}

function CookieAccordion({ category, s, radii, t }) {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(category.alwaysActive);
  return (
    <div style={{ border: "1px solid #ebebeb", borderRadius: radii.brSm, overflow: "hidden", background: s.bannerBg }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", gap: "12px", padding: "14px 16px", cursor: "pointer" }}>
        <div style={{ width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><ChevronRight open={open} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: s.headingColor, textAlign: s.textAlign }}>{t(category.nameKey)}</span>
            <div onClick={(e) => e.stopPropagation()}>
              {category.alwaysActive ? (
                <span style={{ padding: "3px 10px", background: "#DCFCE7", color: "#166534", borderRadius: radii.brPill, fontSize: "11px", fontWeight: 500 }}>{t("cat.alwaysActive")}</span>
              ) : (
                <Switch checked={enabled} onChange={setEnabled} accent={s.SecButtonColor} />
              )}
            </div>
          </div>
        </div>
      </div>
      <div style={{ maxHeight: open ? "2000px" : "0px", overflow: "hidden", transition: "max-height 0.3s ease" }}>
        <div style={{ background: "#f4f4f4", border: "1px solid #ebebeb", borderRadius: radii.brSm, padding: "14px", margin: "0 14px 14px", color: s.textColor, fontSize: "12px", lineHeight: 1.6, fontWeight: s.fontWeight }}>{t(category.descKey)}</div>
      </div>
    </div>
  );
}

function PurposeChildItem({ item, s, radii, t, isMobile = false }) {
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [legitimate, setLegitimate] = useState(!!item.hasLegitimate);
  return (
    <div style={{ borderTop: "1px solid #ebebeb" }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", gap: "12px", padding: "12px 16px", cursor: "pointer" }}>
        <div style={{ width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><ChevronRight open={open} size={5} /></div>
        {/* The title and the legal-basis toggles share a row and wrap onto separate
            lines once they stop fitting, rather than squeezing each other. The
            title's flex-basis is what triggers the wrap: a purpose with BOTH bases
            carries two labelled switches, and translated labels run up to 45%
            longer than English ("Legitimate Interest" -> pl "Prawnie uzasadniony
            interes"), which in this preview's narrow pane left the title with
            almost no width at all. */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "8px 16px" }}>
          <span style={{ fontSize: "13px", fontWeight: 500, color: s.headingColor, textAlign: "left", flex: "1 1 150px", minWidth: 0, overflowWrap: "anywhere" }}>{item.title}</span>
          {/* marginLeft:auto keeps the group right-aligned on the line it lands on,
              whether that is beside the title or on its own below it. */}
          <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? "6px" : "12px", flexShrink: 0, marginLeft: "auto" }}>
            {item.hasLegitimate && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingRight: isMobile ? 0 : "12px", paddingBottom: isMobile ? "6px" : 0, borderRight: isMobile ? "none" : "1px solid #ddd", borderBottom: isMobile ? "1px solid #ddd" : "none" }}>
                <span style={{ fontSize: "11px", color: s.textColor, opacity: 0.6, fontWeight: 500, whiteSpace: "nowrap" }}>{t("section.legitimateInterest")}</span>
                <Switch checked={legitimate} onChange={setLegitimate} accent={s.SecButtonColor} size="sm" />
              </div>
            )}
            {item.hasConsent && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "11px", color: s.textColor, opacity: 0.6, fontWeight: 500, whiteSpace: "nowrap" }}>{t("label.consent")}</span>
                <Switch checked={consent} onChange={setConsent} accent={s.SecButtonColor} size="sm" />
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{ maxHeight: open ? "1000px" : "0px", overflow: "hidden", transition: "max-height 0.3s ease" }}>
        <div style={{ padding: "14px", background: "#f9f9f9", margin: "0 14px 14px", borderRadius: radii.brSm }}>
          <p style={{ color: s.textColor, fontSize: "12px", lineHeight: 1.6, fontWeight: s.fontWeight, textAlign: s.textAlign, margin: "0 0 8px 0" }}>{item.description}</p>
          {/* Only shown where the user actually has a choice. Special purposes and
              features are disclosure-only, and the runtime's count line for those
              is English-only — omitting it beats an untranslated line here. */}
          {item.hasConsent && (
            <div style={{ marginTop: "12px", fontSize: "12px", color: s.textColor, opacity: 0.6, fontWeight: 500 }}>
              {t("vendor.consentCount", { count: item.vendorCount })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PurposeSection({ section, s, radii, t, isMobile = false }) {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  return (
    <div style={{ border: "1px solid #ebebeb", borderRadius: radii.brSm, overflow: "hidden", background: s.bannerBg }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", gap: "12px", padding: "14px 16px", cursor: "pointer" }}>
        <div style={{ width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><ChevronRight open={open} /></div>
        <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "14px", fontWeight: 600, color: s.headingColor, textAlign: s.textAlign }}>{section.title}</span>
          {section.hasToggle && <div onClick={(e) => e.stopPropagation()}><Switch checked={enabled} onChange={setEnabled} accent={s.SecButtonColor} /></div>}
        </div>
      </div>
      <div style={{ maxHeight: open ? "3000px" : "0px", overflow: "hidden", transition: "max-height 0.35s ease" }}>
        <div>{section.items.map((item) => <PurposeChildItem key={item.id} item={item} s={s} radii={radii} t={t} isMobile={isMobile} />)}</div>
      </div>
    </div>
  );
}

function GooglePartnerItem({ provider, s, radii, t }) {
  const [consent, setConsent] = useState(false);
  return (
    <div style={{ padding: "14px", border: "1px solid #f0f0f0", borderRadius: radii.brSm, background: "#fafafa" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: "14px", color: s.headingColor, marginBottom: "4px" }}>{provider.name}</div>
          <div style={{ fontSize: "12px", color: s.textColor, fontFamily: "monospace" }}>AC {t("vendor.idPrefix")} {provider.id}</div>
        </div>
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: 500, color: s.textColor }}>{t("label.consent")}</span>
          <Switch checked={consent} onChange={setConsent} accent={s.SecButtonColor} size="sm" />
        </div>
      </div>
      {provider.policyUrl && (
        <div style={{ marginTop: "8px", fontSize: "12px" }}>
          <a href={provider.policyUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#007AFF", textDecoration: "none", fontWeight: 500 }}>{t("link.privacyPolicy")}</a>
        </div>
      )}
    </div>
  );
}

function PreferenceModal({ open, onClose, onAccept, onReject, s, radii, t, lang, device = "desktop", prefScale = 1 }) {
  const isMobile = device === "mobile";
  const [activeTab, setActiveTab] = useState("cookie");
  const [vendorSubTab, setVendorSubTab] = useState("iab");
  // IAB's own declarations, in the active language.
  const purposeSections = useIabPurposeSections(lang);
  const tabs = [
    { id: "cookie", label: t("tab.cookie") },
    { id: "purpose", label: t("tab.purpose") },
    { id: "vendor", label: t("tab.vendor") },
  ];
  if (!open) return null;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 1000000, background: "rgba(0,0,0,0.5)", padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: s.bannerBg, border: "1px solid #f4f4f4", borderRadius: radii.br, width: "100%", maxWidth: "720px", maxHeight: "80%", display: "flex", flexDirection: "column", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", zoom: prefScale }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f4f4f4", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "15px", fontWeight: 600, color: s.headingColor }}>{t("modal.title")}</span>
          <button type="button" onClick={onClose} aria-label={t("btn.close")} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", opacity: 0.5, display: "flex", color: s.textColor }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>
          <div style={{ color: s.textColor, fontSize: "12px", lineHeight: 1.6, fontWeight: s.fontWeight, textAlign: s.textAlign, paddingTop: "14px" }}>
            <p style={{ margin: "0 0 12px 0" }}>{t("modal.intro")}</p>
            <details style={{ fontSize: "11.5px", color: s.textColor, background: "#f7f7f7", border: "1px solid #ebebeb", borderRadius: radii.brSm, padding: "10px 12px", marginTop: "12px" }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, color: s.headingColor }}>{t("modal.disclosureSummary")}</summary>
              {/* The copy wraps <code> spans around the cookie and storage key names,
                  so it carries markup. Parsed into elements rather than injected —
                  see lib/iabRichText.js. Our own literal, never user input. */}
              <p className="cbIabRichText" style={{ marginTop: "6px", marginBottom: 0, "--cb-heading": s.headingColor }}>
                {renderIabRichText(t("modal.disclosureBodyHtml", { cmpId: CMP_ID }))}
              </p>
            </details>
          </div>
          <div style={{ marginTop: "16px", marginBottom: "16px", borderBottom: "2px solid #f4f4f4" }}>
            <ul style={{ display: "flex", flexDirection: isMobile ? "column" : "row", listStyle: "none", gap: 0, padding: 0, margin: 0 }}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <li key={tab.id} style={{ flex: 1 }}>
                    <button type="button" onClick={() => setActiveTab(tab.id)} style={{ width: "100%", padding: "10px 12px", background: "none", border: "none", borderBottom: `3px solid ${isActive ? s.SecButtonColor : "transparent"}`, cursor: "pointer", fontSize: "12px", fontWeight: isActive ? 700 : s.fontWeight, color: s.textColor, opacity: isActive ? 1 : 0.6, transition: "all 0.2s" }}>{tab.label}</button>
                  </li>
                );
              })}
            </ul>
          </div>
          {activeTab === "cookie" && (
            <div>
              <p style={{ fontSize: "15px", fontWeight: 600, color: s.headingColor, marginBottom: "12px", textAlign: s.textAlign }}>{t("tab.cookie")}</p>
              <div style={{ color: s.textColor, fontSize: "12px", lineHeight: 1.6, fontWeight: s.fontWeight, textAlign: s.textAlign }}>
                <p style={{ margin: "0 0 10px 0" }}>{t("cookie.intro1")}</p>
                <p style={{ margin: 0 }}>{t("cookie.intro2")}</p>
              </div>
              <div style={{ height: "1px", background: "#ebebeb", margin: "16px 0" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>{cookieCategories.map((cat) => <CookieAccordion key={cat.id} category={cat} s={s} radii={radii} t={t} />)}</div>
            </div>
          )}
          {activeTab === "purpose" && (
            <div>
              <p style={{ fontSize: "15px", fontWeight: 600, color: s.headingColor, marginBottom: "12px", textAlign: s.textAlign }}>{t("tab.purpose")}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>{purposeSections.map((section) => <PurposeSection key={section.id} section={section} s={s} radii={radii} t={t} isMobile={isMobile} />)}</div>
            </div>
          )}
          {activeTab === "vendor" && (
            <div>
              <p style={{ fontSize: "15px", fontWeight: 600, color: s.headingColor, marginBottom: "12px", textAlign: s.textAlign }}>{t("tab.vendor")}</p>

              {/* GAC: sub-tab switcher — IAB Vendors | Google Partners.
                  These ARE translated at runtime ('atp.tabIab' / 'atp.tabGoogle' in
                  consent-manager utils/IabCode.js), so leaving them in English here made
                  the preview disagree with the live banner in every language but English.
                  The runtime shows a vendor count on both; this preview never loads the
                  real vendor list, so the IAB tab drops the empty "()" rather than
                  claiming a number the preview does not have. */}
              {s.isGAC && (
                <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
                  {[
                    { id: "iab", label: t("atp.tabIab", { count: "" }).replace(/s*(s*)s*$/, "") },
                    { id: "google", label: t("atp.tabGoogle", { count: sampleAtpProviders.length }) },
                  ].map((tab) => {
                    const active = vendorSubTab === tab.id;
                    return (
                      <button key={tab.id} type="button" onClick={() => setVendorSubTab(tab.id)} style={{ padding: "6px 14px", border: "none", background: "transparent", color: s.textColor, cursor: "pointer", fontSize: "12px", fontWeight: active ? 700 : 500, textDecoration: active ? "underline" : "none", textUnderlineOffset: "3px" }}>{tab.label}</button>
                    );
                  })}
                </div>
              )}

              <div style={{ position: "relative", marginBottom: "16px" }}>
                <input type="text" placeholder={t("vendor.searchPlaceholder")} readOnly style={{ width: "100%", padding: "10px 14px 10px 38px", border: "2px solid #e0e0e0", borderRadius: radii.brSm, fontSize: "13px", background: "#fff", boxSizing: "border-box", outline: "none", color: s.textColor }} />
                <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", color: s.textColor, pointerEvents: "none" }}>🔍</div>
              </div>

              {s.isGAC && vendorSubTab === "google" ? (
                <div>
                  <p style={{ fontSize: "12px", color: s.textColor, opacity: 0.85, lineHeight: 1.6, margin: "0 0 12px 0", textAlign: s.textAlign }}>{t("atp.note")}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {sampleAtpProviders.map((p) => <GooglePartnerItem key={p.id} provider={p} s={s} radii={radii} t={t} />)}
                  </div>
                </div>
              ) : (
                /* Preview only — the real vendor list is fetched at runtime. */
                <p style={{ textAlign: "center", color: s.textColor, padding: "32px", fontStyle: "italic", fontSize: "13px", opacity: 0.5 }}>{t("vendor.loading")}</p>
              )}
            </div>
          )}
        </div>
        <div style={{ borderTop: "1px solid #f4f4f4", background: s.bannerBg, flexShrink: 0, borderRadius: `0 0 ${radii.br} ${radii.br}` }}>
          {/* Buttons stay on one line and scroll sideways instead of wrapping — see
              the note on BannerBar's row. The footer is the worst case for it:
              "Save My Preferences" is 30 chars in Portuguese, and all three labels
              together run to 58 in German against 39 in English. */}
          <div className={isMobile ? undefined : "cbIabBtnScroll"} style={{ padding: "12px 16px", overflowX: isMobile ? "visible" : "auto" }}>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "10px", justifyContent: isMobile ? "stretch" : footerJustify(s.textAlign), minWidth: isMobile ? undefined : "max-content" }}>
              <button type="button" onClick={onReject} style={{ padding: "9px 18px", borderRadius: radii.brBtn, fontSize: "12px", fontWeight: s.fontWeight, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, border: `2px solid ${s.buttonColor}`, background: s.buttonColor, color: s.buttonTextColor, width: isMobile ? "100%" : undefined }}>{t("btn.rejectAll")}</button>
              <button type="button" onClick={onAccept} style={{ padding: "9px 18px", borderRadius: radii.brBtn, fontSize: "12px", fontWeight: s.fontWeight, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, border: `2px solid ${s.buttonColor}`, background: s.buttonColor, color: s.buttonTextColor, width: isMobile ? "100%" : undefined }}>{t("btn.acceptAll")}</button>
              <button type="button" onClick={onClose} style={{ padding: "9px 18px", borderRadius: radii.brBtn, fontSize: "12px", fontWeight: s.fontWeight, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, border: `2px solid ${s.SecButtonColor}`, background: s.SecButtonColor, color: s.SecButtonTextColor, width: isMobile ? "100%" : undefined }}>{t("btn.savePreferences")}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Fill one of the empty spans the notice copy leaves for a generated list.
 * The runtime does the same thing in updateDynamicCounts(); keeping the spans in
 * the translated string is what lets each language put the list where its own
 * grammar needs it.
 */
function fillSpan(html, id, text) {
  return html.replace(
    new RegExp(`(<span id="${id}"[^>]*>)\\s*(</span>)`),
    `$1${escapeHtml(text)}$2`,
  );
}

function NoticeDescription({ s, t, purposeSections }) {
  // The notice is long and this preview pane is small, so it starts clamped.
  // Clamping is done in CSS rather than by slicing the string: the copy is markup
  // (a vendor link, <strong> labels, generated spans) and cutting it at a
  // character offset would cut through a tag. Labels reuse the translated
  // show/hide-details pair rather than inventing app-only keys.
  const [expanded, setExpanded] = useState(false);

  const namesOf = (sectionId) =>
    (purposeSections.find((section) => section.id === sectionId)?.items || [])
      .map((item) => item.title)
      .filter(Boolean)
      .join(", ");

  let purposesLine = t("banner.purposesLineHtml");
  purposesLine = fillSpan(purposesLine, "consentBitPurposesText", namesOf("purposes"));
  purposesLine = fillSpan(purposesLine, "consentBitSpecialFeaturesText", namesOf("special-features"));

  // The vendors link inside the copy is inert in a preview.
  const linkProps = { href: "#", onClick: (e) => e.preventDefault() };

  return (
    <div
      className="cbIabRichText"
      style={{
        flex: 1,
        color: s.textColor,
        lineHeight: 1.6,
        fontSize: "13px",
        fontWeight: s.fontWeight,
        textAlign: s.textAlign,
        // Consumed by the .cbIabRichText rules so markup inside the translated
        // copy can pick up the configured heading colour.
        "--cb-heading": s.headingColor,
      }}
    >
      {/* Both strings carry markup — a vendor link, <strong> labels, and the spans
          filled above. Parsed into React elements (lib/iabRichText.js); our own
          literals, and the only interpolated values are IAB purpose names, escaped
          in fillSpan(). */}
      <div className={expanded ? undefined : "cbIabNoticeClamp"}>
        <p style={{ margin: "0 0 8px 0" }}>{renderIabRichText(t("banner.bodyHtml"), { linkProps })}</p>
        <p style={{ margin: 0, fontSize: "12px", opacity: 0.85 }}>{renderIabRichText(purposesLine)}</p>
      </div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="cbIabMoreBtn"
      >
        {expanded ? t("vendor.hideDetails") : t("vendor.showDetails")}
      </button>
    </div>
  );
}

function BannerBar({ s, radii, layout, t, purposeSections, onCustomise, onReject, onAccept, device = "desktop" }) {
  const isFullBanner = layout === "banner";
  const isMobile = device === "mobile";
  // Always stack: description on top, buttons in the last row underneath.
  const horizontalLayout = false;
  const btnJustify = isMobile ? "stretch" : alignToJustify(s.textAlign);
  // flexShrink:0 with whiteSpace:nowrap is what makes the row overflow (and so
  // scroll) instead of squeezing the buttons down to unreadable slivers.
  const buttonBase = { padding: "9px 16px", borderRadius: radii.brBtn, fontSize: "13px", fontWeight: s.fontWeight, cursor: "pointer", minHeight: "38px", display: "inline-flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap", flexShrink: 0, boxSizing: "border-box", width: isMobile ? "100%" : undefined };
  return (
    <div style={{ background: s.bannerBg, border: "1px solid #f4f4f4", borderRadius: radii.br, padding: isMobile ? "16px" : isFullBanner ? "14px 18px" : "18px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <p style={{ fontSize: isMobile ? "15px" : "17px", fontWeight: s.fontWeight, lineHeight: 1.3, margin: "0 0 8px 0", color: s.headingColor, textAlign: s.textAlign }}>{t("banner.title")}</p>
        <div style={{ display: "flex", flexDirection: horizontalLayout ? "row" : "column", alignItems: horizontalLayout ? "center" : "stretch", gap: "16px", flex: 1 }}>
          <NoticeDescription s={s} t={t} purposeSections={purposeSections} />
          {/* Buttons stay on a single line and the row scrolls sideways when the
              labels outgrow it, rather than wrapping the last button onto its own
              line — three translated labels run to 42 chars in Polish against 29
              in English, so at some languages a wrapped row was unavoidable.
              overflow lives on the outer block, not on the flex row, because
              `justify-content: flex-end` on an overflowing flex container makes the
              start of the row unreachable in Safari and Firefox. `min-width:
              max-content` is what lets the inner row grow past the container while
              still honouring the alignment when there is room to spare. */}
          <div className={isMobile ? undefined : "cbIabBtnScroll"} style={{ paddingTop: horizontalLayout ? 0 : "12px", borderTop: horizontalLayout ? "none" : "1px solid #f0f0f0", flexShrink: 0, overflowX: isMobile ? "visible" : "auto" }}>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "8px", justifyContent: btnJustify, minWidth: isMobile ? undefined : "max-content" }}>
              <button type="button" onClick={onCustomise} style={{ ...buttonBase, border: `2px solid ${s.SecButtonColor}`, background: s.SecButtonColor, color: s.SecButtonTextColor }}>{t("btn.customise")}</button>
              <button type="button" onClick={onReject} style={{ ...buttonBase, border: `2px solid ${s.buttonColor}`, background: s.buttonColor, color: s.buttonTextColor }}>{t("btn.rejectAll")}</button>
              <button type="button" onClick={onAccept} style={{ ...buttonBase, border: `2px solid ${s.buttonColor}`, background: s.buttonColor, color: s.buttonTextColor }}>{t("btn.acceptAll")}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main IAB/TCF Banner ─────────────────────────────────────────────────────
export function WIabBanner({ config = {}, device = "desktop", alignment = "bottom-left", scale = 1, prefScale = 1, lang = "en" }) {
  const s = { ...defaultStyleConfig, ...config };
  const radii = getRadii(s);
  const [visible, setVisible] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Narrowed once here so every child sees the same language the strings resolve
  // against, rather than each one re-deriving it from a raw tag.
  const resolvedLang = resolveIabLang(lang);
  const t = makeT(resolvedLang);
  // The notice quotes the IAB purpose names, so the banner needs the GVL too —
  // the hook shares one bundled table with the modal.
  const purposeSections = useIabPurposeSections(resolvedLang);

  const handleAccept = () => { setVisible(true); setModalOpen(false); };
  const handleReject = () => { setVisible(true); setModalOpen(false); };
  const handleCustomise = () => { setVisible(false); setModalOpen(true); };

  const br = radii.br;
  const isMobile = device === "mobile";
  const boxEdge = isMobile ? 10 : 16;
  const positionStyles =
    s.bannerType === "box"
      ? alignment === "bottom-right"
        ? { right: `${boxEdge}px`, left: isMobile ? `${boxEdge}px` : "auto" }
        : { left: `${boxEdge}px`, right: isMobile ? `${boxEdge}px` : "auto" }
      : {};

  const bar = (layout) => (
    <BannerBar s={s} radii={radii} layout={layout} t={t} purposeSections={purposeSections} device={device} onCustomise={handleCustomise} onReject={handleReject} onAccept={handleAccept} />
  );

  return (
    <div className="cb-iab-root">
      {visible && (
        <>
          {s.bannerType === "box" && (
            <div style={{ position: "absolute", bottom: isMobile ? "10px" : "16px", left: "16px", zIndex: 9, width: isMobile ? undefined : "100%", maxWidth: isMobile ? "calc(100% - 20px)" : "440px", maxHeight: "calc(100% - 32px)", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", borderRadius: br, animation: entranceAnimStyle(s.bannerEntranceAnimation), zoom: scale, ...positionStyles }}>
              {bar("box")}
            </div>
          )}
          {s.bannerType === "popup" && (
            <div style={{ position: "absolute", bottom: isMobile ? "10px" : "16px", left: "50%", transform: "translateX(-50%)", zIndex: 9, width: "calc(100% - 32px)", maxWidth: "440px", maxHeight: "calc(100% - 32px)", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", borderRadius: br, animation: entranceAnimStyle(s.bannerEntranceAnimation, { isCenter: true }), zoom: scale }}>
              {bar("popup")}
            </div>
          )}
          {s.bannerType === "banner" && (
            <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, zIndex: 9, maxHeight: "calc(100% - 24px)", overflowY: "auto", borderRadius: br, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", animation: entranceAnimStyle(s.bannerEntranceAnimation), zoom: scale }}>
              {bar("banner")}
            </div>
          )}
        </>
      )}
      <PreferenceModal open={modalOpen} onClose={() => { setModalOpen(false); setVisible(true); }} onAccept={handleAccept} onReject={handleReject} s={s} radii={radii} t={t} lang={resolvedLang} device={device} prefScale={prefScale} />
    </div>
  );
}

export { WIabBanner as CookieConsentBanner };
