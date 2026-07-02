import React, { useState } from "react";
import { cookieCategories, purposesData, iabBanner, sampleAtpProviders } from "../../lib/bannerContent.js";

// Ported from the ConsentBit webapp (Iab.jsx) so the designer-extension preview
// matches the live IAB/TCF banner exactly. All copy & consent data come from the
// shared bannerContent.js source of truth.

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
    <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => !disabled && onChange(!checked)} style={{ position: "relative", display: "inline-flex", alignItems: "center", width: `${w}px`, height: `${h}px`, borderRadius: "999px", border: "none", padding: 0, background: checked ? accent : "#d0d5d2", cursor: disabled ? "not-allowed" : "pointer", transition: "background-color 0.2s", opacity: disabled ? 0.7 : 1, flexShrink: 0 }}>
      <span style={{ position: "absolute", top: `${inset}px`, left: `${inset}px`, width: `${knob}px`, height: `${knob}px`, borderRadius: "50%", background: "#fff", transform: checked ? `translateX(${w - knob - inset * 2}px)` : "translateX(0)", transition: "transform 0.2s" }} />
    </button>
  );
}

function ChevronRight({ open, size = 6 }) {
  return <span style={{ display: "inline-block", width: 0, height: 0, borderTop: `${size - 2}px solid transparent`, borderBottom: `${size - 2}px solid transparent`, borderLeft: `${size}px solid #999`, transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />;
}

function CookieAccordion({ category, s, radii }) {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(category.alwaysActive);
  return (
    <div style={{ border: "1px solid #ebebeb", borderRadius: radii.brSm, overflow: "hidden", background: s.bannerBg }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", gap: "12px", padding: "14px 16px", cursor: "pointer" }}>
        <div style={{ width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><ChevronRight open={open} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: s.headingColor, textAlign: s.textAlign }}>{category.name}</span>
            <div onClick={(e) => e.stopPropagation()}>
              {category.alwaysActive ? (
                <span style={{ padding: "3px 10px", background: "#DCFCE7", color: "#166534", borderRadius: radii.brPill, fontSize: "11px", fontWeight: 500 }}>{iabBanner.labels.alwaysActive}</span>
              ) : (
                <Switch checked={enabled} onChange={setEnabled} accent={s.SecButtonColor} />
              )}
            </div>
          </div>
        </div>
      </div>
      <div style={{ maxHeight: open ? "2000px" : "0px", overflow: "hidden", transition: "max-height 0.3s ease" }}>
        <div style={{ background: "#f4f4f4", border: "1px solid #ebebeb", borderRadius: radii.brSm, padding: "14px", margin: "0 14px 14px", color: s.textColor, fontSize: "12px", lineHeight: 1.6, fontWeight: s.fontWeight }}>{category.description}</div>
      </div>
    </div>
  );
}

function PurposeChildItem({ item, s, radii, isMobile = false }) {
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [legitimate, setLegitimate] = useState(!!item.hasLegitimate);
  return (
    <div style={{ borderTop: "1px solid #ebebeb" }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", gap: "12px", padding: "12px 16px", cursor: "pointer" }}>
        <div style={{ width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><ChevronRight open={open} size={5} /></div>
        <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "13px", fontWeight: 500, color: s.headingColor, textAlign: "left", flex: 1 }}>{item.title}</span>
          <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? "6px" : "12px", flexShrink: 0 }}>
            {item.hasLegitimate && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingRight: isMobile ? 0 : "12px", paddingBottom: isMobile ? "6px" : 0, borderRight: isMobile ? "none" : "1px solid #ddd", borderBottom: isMobile ? "1px solid #ddd" : "none" }}>
                <span style={{ fontSize: "11px", color: s.textColor, opacity: 0.6, fontWeight: 500, whiteSpace: "nowrap" }}>{iabBanner.labels.legitimate}</span>
                <Switch checked={legitimate} onChange={setLegitimate} accent={s.SecButtonColor} size="sm" />
              </div>
            )}
            {item.hasConsent && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "11px", color: s.textColor, opacity: 0.6, fontWeight: 500, whiteSpace: "nowrap" }}>{iabBanner.labels.consent}</span>
                <Switch checked={consent} onChange={setConsent} accent={s.SecButtonColor} size="sm" />
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{ maxHeight: open ? "1000px" : "0px", overflow: "hidden", transition: "max-height 0.3s ease" }}>
        <div style={{ padding: "14px", background: "#f9f9f9", margin: "0 14px 14px", borderRadius: radii.brSm }}>
          <p style={{ color: s.textColor, fontSize: "12px", lineHeight: 1.6, fontWeight: s.fontWeight, textAlign: s.textAlign, margin: "0 0 8px 0" }}>{item.description}</p>
          <div style={{ marginTop: "12px", fontSize: "12px", color: s.textColor, opacity: 0.6, fontWeight: 500 }}>{iabBanner.labels.vendors} <strong style={{ color: s.headingColor, fontWeight: 600 }}>{item.vendorCount}</strong></div>
        </div>
      </div>
    </div>
  );
}

function PurposeSection({ section, s, radii, isMobile = false }) {
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
        <div>{section.items.map((item) => <PurposeChildItem key={item.id} item={item} s={s} radii={radii} isMobile={isMobile} />)}</div>
      </div>
    </div>
  );
}

function GooglePartnerItem({ provider, s, radii }) {
  const [consent, setConsent] = useState(false);
  return (
    <div style={{ padding: "14px", border: "1px solid #f0f0f0", borderRadius: radii.brSm, background: "#fafafa" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: "14px", color: s.headingColor, marginBottom: "4px" }}>{provider.name}</div>
          <div style={{ fontSize: "12px", color: s.textColor, fontFamily: "monospace" }}>{iabBanner.labels.acId} {provider.id}</div>
        </div>
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: 500, color: s.textColor }}>{iabBanner.labels.consent}</span>
          <Switch checked={consent} onChange={setConsent} accent={s.SecButtonColor} size="sm" />
        </div>
      </div>
      {provider.policyUrl && (
        <div style={{ marginTop: "8px", fontSize: "12px" }}>
          <a href={provider.policyUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#007AFF", textDecoration: "none", fontWeight: 500 }}>{iabBanner.labels.privacyPolicy}</a>
        </div>
      )}
    </div>
  );
}

function PreferenceModal({ open, onClose, onAccept, onReject, s, radii, device = "desktop", prefScale = 1 }) {
  const isMobile = device === "mobile";
  const [activeTab, setActiveTab] = useState("cookie");
  const [vendorSubTab, setVendorSubTab] = useState("iab");
  const tabs = iabBanner.tabs;
  if (!open) return null;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 1000000, background: "rgba(0,0,0,0.5)", padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: s.bannerBg, border: "1px solid #f4f4f4", borderRadius: radii.br, width: "100%", maxWidth: "720px", maxHeight: "92%", display: "flex", flexDirection: "column", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", zoom: prefScale }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f4f4f4", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "15px", fontWeight: 600, color: s.headingColor }}>{iabBanner.modalTitle}</span>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", opacity: 0.5, display: "flex", color: s.textColor }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>
          <div style={{ color: s.textColor, fontSize: "12px", lineHeight: 1.6, fontWeight: s.fontWeight, textAlign: s.textAlign, paddingTop: "14px" }}>
            <p style={{ margin: "0 0 12px 0" }}>{iabBanner.modalIntro}</p>
            <details style={{ fontSize: "11.5px", color: s.textColor, background: "#f7f7f7", border: "1px solid #ebebeb", borderRadius: radii.brSm, padding: "10px 12px", marginTop: "12px" }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, color: s.headingColor }}>{iabBanner.cmpStorageSummary}</summary>
              <p style={{ marginTop: "6px", marginBottom: 0 }}>
                {iabBanner.cmpStorageBefore}
                <code style={{ background: "#fff", padding: "1px 5px", borderRadius: "3px", fontSize: "11px", border: "1px solid #e0e0e0" }}>{iabBanner.cmpStorageCookie}</code>
                {iabBanner.cmpStorageMid}
                <code style={{ background: "#fff", padding: "1px 5px", borderRadius: "3px", fontSize: "11px", border: "1px solid #e0e0e0" }}>{iabBanner.cmpStorageLocalStorage}</code>
                {iabBanner.cmpStorageAfter}
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
              <p style={{ fontSize: "15px", fontWeight: 600, color: s.headingColor, marginBottom: "12px", textAlign: s.textAlign }}>{iabBanner.sectionTitles.cookie}</p>
              <div style={{ color: s.textColor, fontSize: "12px", lineHeight: 1.6, fontWeight: s.fontWeight, textAlign: s.textAlign }}>
                <p style={{ margin: "0 0 10px 0" }}>{iabBanner.cookieIntro1}</p>
                <p style={{ margin: 0 }}>{iabBanner.cookieIntro2}</p>
              </div>
              <div style={{ height: "1px", background: "#ebebeb", margin: "16px 0" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>{cookieCategories.map((cat) => <CookieAccordion key={cat.id} category={cat} s={s} radii={radii} />)}</div>
            </div>
          )}
          {activeTab === "purpose" && (
            <div>
              <p style={{ fontSize: "15px", fontWeight: 600, color: s.headingColor, marginBottom: "12px", textAlign: s.textAlign }}>{iabBanner.sectionTitles.purpose}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>{purposesData.map((section) => <PurposeSection key={section.id} section={section} s={s} radii={radii} isMobile={isMobile} />)}</div>
            </div>
          )}
          {activeTab === "vendor" && (
            <div>
              <p style={{ fontSize: "15px", fontWeight: 600, color: s.headingColor, marginBottom: "12px", textAlign: s.textAlign }}>{iabBanner.sectionTitles.vendor}</p>

              {s.isGAC && (
                <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
                  {[
                    { id: "iab", label: iabBanner.labels.iabVendors },
                    { id: "google", label: `${iabBanner.labels.googlePartners} (${sampleAtpProviders.length})` },
                  ].map((tab) => {
                    const active = vendorSubTab === tab.id;
                    return (
                      <button key={tab.id} type="button" onClick={() => setVendorSubTab(tab.id)} style={{ padding: "6px 14px", border: "none", background: "transparent", color: s.textColor, cursor: "pointer", fontSize: "12px", fontWeight: active ? 700 : 500, textDecoration: active ? "underline" : "none", textUnderlineOffset: "3px" }}>{tab.label}</button>
                    );
                  })}
                </div>
              )}

              <div style={{ position: "relative", marginBottom: "16px" }}>
                <input type="text" placeholder={iabBanner.vendorSearchPlaceholder} readOnly style={{ width: "100%", padding: "10px 14px 10px 38px", border: "2px solid #e0e0e0", borderRadius: radii.brSm, fontSize: "13px", background: "#fff", boxSizing: "border-box", outline: "none", color: s.textColor }} />
                <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", color: s.textColor, pointerEvents: "none" }}>🔍</div>
              </div>

              {s.isGAC && vendorSubTab === "google" ? (
                <div>
                  <p style={{ fontSize: "12px", color: s.textColor, opacity: 0.85, lineHeight: 1.6, margin: "0 0 12px 0", textAlign: s.textAlign }}>{iabBanner.gacNote}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {sampleAtpProviders.map((p) => <GooglePartnerItem key={p.id} provider={p} s={s} radii={radii} />)}
                  </div>
                </div>
              ) : (
                <p style={{ textAlign: "center", color: s.textColor, padding: "32px", fontStyle: "italic", fontSize: "13px", opacity: 0.5 }}>{iabBanner.vendorPlaceholder}</p>
              )}
            </div>
          )}
        </div>
        <div style={{ borderTop: "1px solid #f4f4f4", background: s.bannerBg, flexShrink: 0, borderRadius: `0 0 ${radii.br} ${radii.br}` }}>
          <div style={{ padding: "12px 16px", display: "flex", flexDirection: isMobile ? "column" : "row", gap: "10px", justifyContent: isMobile ? "stretch" : footerJustify(s.textAlign), flexWrap: "wrap" }}>
            <button type="button" onClick={onReject} style={{ padding: "9px 18px", borderRadius: radii.brBtn, fontSize: "12px", fontWeight: s.fontWeight, cursor: "pointer", whiteSpace: "nowrap", border: `2px solid ${s.buttonColor}`, background: s.buttonColor, color: s.buttonTextColor, width: isMobile ? "100%" : undefined }}>{iabBanner.buttons.rejectAll}</button>
            <button type="button" onClick={onAccept} style={{ padding: "9px 18px", borderRadius: radii.brBtn, fontSize: "12px", fontWeight: s.fontWeight, cursor: "pointer", whiteSpace: "nowrap", border: `2px solid ${s.buttonColor}`, background: s.buttonColor, color: s.buttonTextColor, width: isMobile ? "100%" : undefined }}>{iabBanner.buttons.acceptAll}</button>
            <button type="button" onClick={onClose} style={{ padding: "9px 18px", borderRadius: radii.brBtn, fontSize: "12px", fontWeight: s.fontWeight, cursor: "pointer", whiteSpace: "nowrap", border: `2px solid ${s.SecButtonColor}`, background: s.SecButtonColor, color: s.SecButtonTextColor, width: isMobile ? "100%" : undefined }}>{iabBanner.buttons.save}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NoticeDescription({ s }) {
  const [more, setMore] = useState(false);
  const after = iabBanner.noticeAfter;
  const TRUNC = 80;
  const shown = more ? after : after.slice(0, TRUNC).trimEnd() + "… ";
  return (
    <div style={{ flex: 1, color: s.textColor, lineHeight: 1.6, fontSize: "13px", fontWeight: s.fontWeight, textAlign: s.textAlign }}>
      <p style={{ margin: "0 0 10px 0", color: s.textColor }}>
        {iabBanner.noticeBefore}
        <a href="#" onClick={(e) => e.preventDefault()} style={{ color: "#007AFF", textDecoration: "underline", cursor: "pointer", fontWeight: 600 }}>{iabBanner.noticeLink}</a>
        {shown}
        <button type="button" onClick={() => setMore((m) => !m)} style={{ background: "none", border: "none", padding: 0, color: "#007AFF", fontWeight: 600, cursor: "pointer", fontSize: "inherit" }}>
          {more ? " Show less" : "Show more"}
        </button>
      </p>
      {more &&
      <p style={{ margin: "8px 0 0 0", fontSize: "13px", lineHeight: 1.5, opacity: 0.85, color: s.textColor }}>
        <strong style={{ color: s.headingColor, fontWeight: 600 }}>{iabBanner.noticePurposesIntro}</strong> {iabBanner.noticePurposes}
        <br />
        <strong style={{ color: s.headingColor, fontWeight: 600 }}>{iabBanner.noticeSpecialIntro}</strong> {iabBanner.noticeSpecial}
      </p>
      }
    </div>
  );
}

function BannerBar({ s, radii, layout, onCustomise, onReject, onAccept, device = "desktop" }) {
  const isFullBanner = layout === "banner";
  const isMobile = device === "mobile";
  // Always stack: description on top, buttons in the last row underneath.
  const horizontalLayout = false;
  const btnJustify = isMobile ? "stretch" : alignToJustify(s.textAlign);
  const buttonBase = { padding: "9px 16px", borderRadius: radii.brBtn, fontSize: "13px", fontWeight: s.fontWeight, cursor: "pointer", minHeight: "38px", display: "inline-flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap", boxSizing: "border-box", width: isMobile ? "100%" : undefined };
  return (
    <div style={{ background: s.bannerBg, border: "1px solid #f4f4f4", borderRadius: radii.br, padding: isMobile ? "16px" : isFullBanner ? "14px 18px" : "18px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <p style={{ fontSize: isMobile ? "15px" : "17px", fontWeight: s.fontWeight, lineHeight: 1.3, margin: "0 0 8px 0", color: s.headingColor, textAlign: s.textAlign }}>{iabBanner.heading}</p>
        <div style={{ display: "flex", flexDirection: horizontalLayout ? "row" : "column", alignItems: horizontalLayout ? "center" : "stretch", gap: "16px", flex: 1 }}>
          <NoticeDescription s={s} />
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "8px", flexWrap: "wrap", paddingTop: horizontalLayout ? 0 : "12px", borderTop: horizontalLayout ? "none" : "1px solid #f0f0f0", justifyContent: btnJustify, flexShrink: 0 }}>
            <button type="button" onClick={onCustomise} style={{ ...buttonBase, border: `2px solid ${s.SecButtonColor}`, background: s.SecButtonColor, color: s.SecButtonTextColor }}>{iabBanner.buttons.customise}</button>
            <button type="button" onClick={onReject} style={{ ...buttonBase, border: `2px solid ${s.buttonColor}`, background: s.buttonColor, color: s.buttonTextColor }}>{iabBanner.buttons.rejectAll}</button>
            <button type="button" onClick={onAccept} style={{ ...buttonBase, border: `2px solid ${s.buttonColor}`, background: s.buttonColor, color: s.buttonTextColor }}>{iabBanner.buttons.acceptAll}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main IAB/TCF Banner ─────────────────────────────────────────────────────
export function WIabBanner({ config = {}, device = "desktop", alignment = "bottom-left", scale = 1, prefScale = 1 }) {
  const s = { ...defaultStyleConfig, ...config };
  const radii = getRadii(s);
  const [visible, setVisible] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

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

  return (
    <div className="cb-iab-root">
      {visible && (
        <>
          {s.bannerType === "box" && (
            <div style={{ position: "absolute", bottom: isMobile ? "10px" : "16px", left: "16px", zIndex: 9, width: isMobile ? undefined : "100%", maxWidth: isMobile ? "calc(100% - 20px)" : "440px", maxHeight: "calc(100% - 32px)", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", borderRadius: br, animation: entranceAnimStyle(s.bannerEntranceAnimation), zoom: scale, ...positionStyles }}>
              <BannerBar s={s} radii={radii} layout="box" device={device} onCustomise={handleCustomise} onReject={handleReject} onAccept={handleAccept} />
            </div>
          )}
          {s.bannerType === "popup" && (
            <div style={{ position: "absolute", bottom: isMobile ? "10px" : "16px", left: "50%", transform: "translateX(-50%)", zIndex: 9, width: "calc(100% - 32px)", maxWidth: "440px", maxHeight: "calc(100% - 32px)", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", borderRadius: br, animation: entranceAnimStyle(s.bannerEntranceAnimation, { isCenter: true }), zoom: scale }}>
              <BannerBar s={s} radii={radii} layout="popup" device={device} onCustomise={handleCustomise} onReject={handleReject} onAccept={handleAccept} />
            </div>
          )}
          {s.bannerType === "banner" && (
            <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, zIndex: 9, maxHeight: "calc(100% - 24px)", overflowY: "auto", borderRadius: br, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", animation: entranceAnimStyle(s.bannerEntranceAnimation), zoom: scale }}>
              <BannerBar s={s} radii={radii} layout="banner" device={device} onCustomise={handleCustomise} onReject={handleReject} onAccept={handleAccept} />
            </div>
          )}
        </>
      )}
      <PreferenceModal open={modalOpen} onClose={() => { setModalOpen(false); setVisible(true); }} onAccept={handleAccept} onReject={handleReject} s={s} radii={radii} device={device} prefScale={prefScale} />
      <style>{`
        @keyframes cbIabFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes cbIabSlideUp{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes cbIabSlideDown{from{transform:translateY(-24px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes cbIabZoomIn{from{transform:scale(0.92);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes cbIabCenterSlideUp{from{transform:translateX(-50%) translateY(24px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}
        @keyframes cbIabCenterSlideDown{from{transform:translateX(-50%) translateY(-24px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}
        @keyframes cbIabCenterZoomIn{from{transform:translateX(-50%) scale(0.92);opacity:0}to{transform:translateX(-50%) scale(1);opacity:1}}
      `}</style>
    </div>
  );
}

export { WIabBanner as CookieConsentBanner };
