import React from "react";
import { useNav } from "../../nav.jsx";
import { WIabBanner } from "./WIabBanner.jsx";
import { simpleBanner, preferenceBanner, ccpaBanner, localization, prefCategories as DEFAULT_CATS } from "../../lib/bannerContent.js";
import consentLogo from "../../assets/consent_logo.png";

function WEdPreview({ variant = "default" }) {
  const nav = useNav();
  // Consent template decides which region tabs are available in the preview.
  const template = nav ? nav.template : "CCPA+GDPR";
  const regions = template === "GDPR (EU)" ? ["GDPR"] : template === "CCPA (USA)" ? ["CCPA"] : ["GDPR", "CCPA"];

  // Active region is shared (so the Content editor can show CCPA vs GDPR fields).
  const region = nav ? nav.activeRegion : regions[0];
  const setRegion = (r) => nav && nav.setActiveRegion(r);
  const [device, setDevice] = React.useState("Desktop");

  // Keep the selected region valid when the template changes.
  React.useEffect(() => {
    if (!regions.includes(region)) setRegion(regions[0]);
  }, [template, region]); // eslint-disable-line react-hooks/exhaustive-deps

  // Which banner is shown. Seeded from the `variant` prop (the Content tab's
  // Default/Preference toggle) but also switchable by clicking Preference / the
  // Do Not Share link in the preview; the modal ✕ returns to the default banner.
  const [view, setView] = React.useState(variant);
  React.useEffect(() => { setView(variant); }, [variant]);

  const isPref = view === "pref";
  const isCCPA = region === "CCPA";
  const iab = nav ? nav.iab : false; // IAB TCF banner overrides GDPR/CCPA

  const [openAcc, setOpenAcc] = React.useState(null); // expanded accordion (one at a time)
  const [catOn, setCatOn] = React.useState({});       // GDPR category toggles
  const [ccpaCheck, setCcpaCheck] = React.useState(false); // CCPA "Do Not Share" checkbox
  const [msgMore, setMsgMore] = React.useState(false);     // default banner message "Show more"
  const [prefMore, setPrefMore] = React.useState(false);   // preference overview "Show more"
  const [catMore, setCatMore] = React.useState(null);      // index of the one expanded category description

  // Any terminal action (Accept/Reject/Save/Cancel) or a click outside the
  // banner card returns the preview to the initial default banner and clears
  // interaction state — mirrors finishing/dismissing the real consent flow.
  // Applies to every variant (GDPR default + preference, CCPA opt-out).
  const resetToInitial = () => {
    setView("default");
    setOpenAcc(null);
    setCatOn({});
    setCcpaCheck(false);
    setMsgMore(false);
    setPrefMore(false);
    setCatMore(null);
  };

  // Simulated viewport width per device.
  const winWidth = device === "Phone" ? 250 : device === "Tab" ? 380 : "100%";
  // Desktop initial banner is wider so it reads correctly on the full-width
  // preview; Phone/Tab stay compact.
  const bannerWidth = device === "Phone" ? 210 : device === "Tab" ? 300 : 360;
  // Shrink the whole banner (fonts, buttons, padding) on the smaller simulated
  // viewports so it reads proportionally. The preference banner is denser, so it
  // gets a stronger reduction — including a nudge down on Desktop.
  const bannerZoom = device === "Phone" ? 0.8 : device === "Tab" ? 0.9 : 1;
  const prefZoom = device === "Phone" ? 0.78 : device === "Tab" ? 0.86 : 0.92;
  // The IAB/TCF banner is far larger than the simple banners, so it needs a
  // stronger reduction to sit correctly inside the preview area on EVERY device
  // (including Desktop, where the simple banners stay at full size).
  const iabZoom = device === "Phone" ? 0.62 : device === "Tab" ? 0.74 : 0.84;
  const iabPrefZoom = device === "Phone" ? 0.6 : device === "Tab" ? 0.72 : 0.82;

  // Floating reopen button/logo — shown in the preview corner (left/right) when
  // the Content tab's "Floating button" is enabled. Mirrors the live app.
  const floating = nav ? nav.floating : false;
  const floatPos = nav ? nav.floatPos : "left";
  const logoSize = device === "Phone" ? 22 : 28;
  const logoIconSrc = consentLogo;

  // Layout: where the default banner sits. box -> corner (left/right by align),
  // banner -> full-width bottom, popup -> bottom center.
  const bannerPos = nav ? nav.bannerPos : "box";
  const bannerAlign = nav ? nav.bannerAlign : "left";
  const posStyle =
    bannerPos === "banner" ? { bottom: 12, left: 12, right: 12 } :
    bannerPos === "popup" ? { bottom: 16, left: "50%", transform: "translateX(-50%)", width: bannerWidth } :
    bannerAlign === "right" ? { bottom: 16, right: 16, width: bannerWidth } :
    { bottom: 16, left: 16, width: bannerWidth };

  // Layout: border radius (max 25) + entrance animation.
  const bannerRadius = nav ? nav.bannerRadius : 12;
  const bannerAnim = nav ? nav.bannerAnim : "fade-in";
  const centerPopup = bannerPos === "popup";
  const animName = ({
    "fade-in": "cbAnimFadeIn",
    "slide-up": centerPopup ? "cbAnimSlideUpCenter" : "cbAnimSlideUp",
    "slide-down": centerPopup ? "cbAnimSlideDownCenter" : "cbAnimSlideDown",
    "zoom-in": centerPopup ? "cbAnimZoomInCenter" : "cbAnimZoomIn",
  })[bannerAnim] || "cbAnimFadeIn";
  const bannerAnimCss = `${animName} 0.4s ease-out both`;
  // Replays the entrance animation whenever the layout/anim changes.
  const animKey = bannerAnim + "-" + bannerPos + "-" + bannerAlign + "-" + region + "-" + view;

  // Colors from the Colors tab, applied to every preview banner.
  const colors = nav ? nav.bannerColors : { bannerBg: "#FFFFFF", textColor: "#374151", headingColor: "#0F1B2E", btnBg: "#007AFF", btnText: "#FFFFFF", prefBtnBg: "#FFFFFF", prefBtnText: "#0284C7" };
  const bannerBtnRadius = nav ? nav.bannerBtnRadius : 4;
  // Buttons truncate with an ellipsis to fit one row; full label shows on hover.
  const btnText = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 };
  // Accept/Reject/Cancel buttons.
  const solidBtn = { background: colors.btnBg, color: colors.btnText, border: "1px solid " + colors.btnBg, borderRadius: bannerBtnRadius, padding: "6px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer", ...btnText };
  // Preferences buttons (Preference / Save my preferences).
  const prefBtn = { background: colors.prefBtnBg, color: colors.prefBtnText, border: "1px solid " + colors.prefBtnText, borderRadius: bannerBtnRadius, padding: "6px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer", ...btnText };
  const closeX = <span onClick={resetToInitial} style={{ position: "absolute", top: 10, right: 12, fontSize: 13, color: "#888", cursor: "pointer" }}>✕</span>;

  // Type tab: font weight + text alignment.
  const bannerWeight = nav ? nav.bannerWeight : "400";
  const bannerTextAlign = nav ? nav.bannerTextAlign : "left";

  const cardBase = { background: colors.bannerBg, borderRadius: 10, padding: 14, boxShadow: "0 14px 30px rgba(0,0,0,0.4)" };
  // Reserve clearance on the right so a right-aligned heading doesn't run under
  // the close ✕ (pinned top-right at right:12).
  const titleStyle = { fontSize: 14, fontWeight: bannerWeight, marginBottom: 6, color: colors.headingColor, textAlign: bannerTextAlign, overflowWrap: "break-word", wordBreak: "break-word", paddingRight: bannerTextAlign === "right" ? 22 : 0 };
  const bodyStyle = { fontSize: "11px", lineHeight: 1.5, marginBottom: 10, color: colors.textColor, fontWeight: bannerWeight, textAlign: bannerTextAlign, overflowWrap: "break-word", wordBreak: "break-word" };
  // Live banner text from the Content editor.
  const content = nav ? nav.bannerContent : { title: simpleBanner.title, message: simpleBanner.body, accept: simpleBanner.buttons.accept, reject: simpleBanner.buttons.reject, customize: simpleBanner.buttons.preference };
  const prefC = nav ? nav.prefContent : { title: preferenceBanner.title, overview: preferenceBanner.overview, save: preferenceBanner.buttons.save };
  const ccpaC = nav ? nav.ccpaContent : { message: ccpaBanner.message, doNotShare: ccpaBanner.doNotShare, optOutTitle: ccpaBanner.optOutTitle, optOutBody: ccpaBanner.optOutBody, cancel: ccpaBanner.buttons.cancel, save: ccpaBanner.buttons.save };
  const PREF_TRUNC = preferenceBanner.overview.length;
  const prefLong = prefC.overview.length > PREF_TRUNC;
  const prefShown = prefMore || !prefLong ? prefC.overview : prefC.overview.slice(0, PREF_TRUNC).trimEnd() + "… ";
  const showClose = nav ? nav.closeBtn : false; // Content "Close button" toggle
  const showReject = nav ? nav.showReject : true;
  const showCustomize = nav ? nav.showCustomize : true;
  const showPolicy = nav ? nav.showPolicy : false;
  // Cookie policy link, appended inline to the message (matches the webapp).
  const policyHref = content.policyUrl && !/^https?:\/\//i.test(content.policyUrl) ? "https://" + content.policyUrl : content.policyUrl;
  const policyLink = showPolicy && content.policyUrl ?
    <> <a href={policyHref} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: colors.btnBg, textDecoration: "underline", fontSize: "inherit", fontWeight: 600, overflowWrap: "anywhere", wordBreak: "break-word" }}>{content.policy || "Privacy Policy"}</a></> :
    null;
  // Show "Show more" only when the message is longer than the default copy;
  // truncate back to the default length when collapsed.
  const MSG_TRUNC = localization.English.message.length;
  const longMsg = content.message.length > MSG_TRUNC;
  const shownMsg = msgMore || !longMsg ? content.message : content.message.slice(0, MSG_TRUNC).trimEnd() + "… ";
  const bodyNode =
    <>
      {shownMsg}
      {longMsg &&
      <span onClick={() => setMsgMore((m) => !m)} style={{ color: colors.btnBg, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontSize: "inherit" }}>{msgMore ? " Show less" : " Show more"}</span>
      }
      {policyLink}
    </>;

  return (
    <div style={{ width: "450px", paddingRight: 12, position: "sticky", top: 0, alignSelf: "start" }}>
      {/* Header: Preview label + region tabs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Preview</div>
        {!iab &&
        <div style={{ display: "flex", gap: 6 }}>
          {regions.map((l) =>
          <button key={l} onClick={() => setRegion(l)} className={"w-nav-btn " + (region === l ? "active" : "")}>{l}</button>
          )}
        </div>
        }
      </div>

      {/* Browser window */}
      <div className="preview-window" onClick={(e) => { if (e.target === e.currentTarget) resetToInitial(); }} style={{ width: winWidth, margin: device === "Desktop" ? undefined : "0 auto", height: iab ? 400 : isPref ? 400 : 320, position: "relative", overflow: "hidden", transition: "width 0.2s ease" }}>
        <div className="preview-titlebar"><span className="dot" /><span className="dot" /><span className="dot" /></div>

        {/* Floating reopen button/logo — positioned by the Floating button setting.
            Rendered before the banner so the banner overlaps it (matches the live app). */}
        {floating &&
        <div style={{ position: "absolute", bottom: 12, left: floatPos === "left" ? 12 : "auto", right: floatPos === "right" ? 12 : "auto", width: logoSize, height: logoSize, borderRadius: 999, background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.35)", display: "grid", placeItems: "center" }}>
          <img src={logoIconSrc} alt="ConsentBit" style={{ width: Math.round(logoSize * 0.62), height: Math.round(logoSize * 0.62), display: "block" }} />
        </div>
        }

        {iab ?
        /* ---- IAB / TCF banner (ported from the webapp) ---- */
        /* Clip the IAB banner to the area BELOW the titlebar and make this the
           positioning context for its absolute children. Otherwise the banner is
           anchored to the full preview-window (top hidden behind the titlebar) and
           its zoomed max-height lets "Show more" grow it up over the titlebar and
           out of the frame. This sub-frame keeps it inside the visible area. */
        <div style={{ position: "absolute", top: 28, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
          <WIabBanner key={animKey} device={device === "Phone" ? "mobile" : "desktop"} scale={iabZoom} prefScale={iabPrefZoom} alignment={bannerAlign === "right" ? "bottom-right" : "bottom-left"} config={{ isGAC: nav ? nav.gac : false, bannerType: bannerPos, borderRadius: bannerRadius, buttonBorderRadius: bannerBtnRadius, bannerEntranceAnimation: bannerAnim, bannerBg: colors.bannerBg, textColor: colors.textColor, headingColor: colors.headingColor, buttonColor: colors.btnBg, buttonTextColor: colors.btnText, SecButtonColor: colors.prefBtnBg, SecButtonTextColor: colors.prefBtnText, fontWeight: bannerWeight, textAlign: bannerTextAlign }} />
        </div> :

        isPref ? (
        isCCPA ?
        /* ---- CCPA · Opt-out Preference ---- */
        <div style={{ position: "absolute", top: "50%", left: 16, right: 16, transform: "translateY(-50%)", maxHeight: "calc(100% - 24px)", overflowY: "auto", ...cardBase, zoom: prefZoom }}>
          {showClose && closeX}
          <div style={{ ...titleStyle, marginBottom: 8 }}>{ccpaC.optOutTitle}</div>
          <div style={{ fontSize: "9.5px", fontWeight: bannerWeight, lineHeight: 1.5, marginBottom: 10, color: colors.textColor, textAlign: bannerTextAlign, overflowWrap: "break-word", wordBreak: "break-word" }}>
            {ccpaC.optOutBody}
          </div>
          <label onClick={() => setCcpaCheck((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0 14px", fontSize: 10.5, fontWeight: 700, cursor: "pointer", color: colors.headingColor }}>
            <span style={{ width: 15, height: 15, border: "1px solid " + (ccpaCheck ? colors.btnBg : "#bbb"), borderRadius: 3, flexShrink: 0, background: ccpaCheck ? colors.btnBg : "#fff", display: "grid", placeItems: "center" }}>
              {ccpaCheck && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
            </span>
            {ccpaC.doNotShare}
          </label>
          <div style={{ display: "flex", flexDirection: device === "Phone" ? "column" : "row", gap: 8 }}>
            <button onClick={resetToInitial} style={{ ...solidBtn, flex: device === "Phone" ? undefined : 1, width: device === "Phone" ? "100%" : undefined }}>{ccpaC.cancel}</button>
            <button onClick={resetToInitial} style={{ ...prefBtn, flex: device === "Phone" ? undefined : 1, width: device === "Phone" ? "100%" : undefined }}>{ccpaC.save}</button>
          </div>
        </div> :
        /* ---- GDPR · Cookie Preferences ---- */
        <div style={{ position: "absolute", top: "50%", left: 16, right: 16, transform: "translateY(-50%)", maxHeight: "calc(100% - 24px)", overflowY: "auto", ...cardBase, zoom: prefZoom }}>
          {showClose && closeX}
          <div style={{ ...titleStyle, marginBottom: 6 }}>{prefC.title}</div>
          <div style={{ fontSize: "10px", fontWeight: bannerWeight, marginBottom: 10, color: colors.textColor, textAlign: bannerTextAlign, overflowWrap: "break-word", wordBreak: "break-word" }}>
            {prefShown}
            {prefLong &&
            <span onClick={() => setPrefMore((m) => !m)} style={{ color: colors.btnBg, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontSize: "inherit" }}>{prefMore ? " Show less" : " Show more"}</span>
            }
            {policyLink}
          </div>

          <div style={{ border: "1px solid #e4e4ea", borderRadius: 8, overflow: "hidden" }}>
            {prefC.cats.map((c, i) => {
              const open = openAcc === i;
              const on = !!catOn[i];
              return (
              <div key={i} style={{ borderTop: i ? "1px solid #e4e4ea" : "none" }}>
                <div onClick={() => { setOpenAcc(open ? null : i); setCatMore(null); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{ width: 15, height: 15, border: "1px solid #ccc", borderRadius: 3, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, lineHeight: 1, color: "#555", flexShrink: 0 }}>{open ? "−" : "+"}</span>
                    <span style={{ fontSize: 10.5, fontWeight: bannerWeight, color: colors.headingColor, overflowWrap: "break-word", wordBreak: "break-word", minWidth: 0 }}>{c.name}</span>
                  </div>
                  {c.always ?
                  <span style={{ fontSize: 9.5, color: "#555", flexShrink: 0 }}>{prefC.alwaysActive}</span> :
                  <span onClick={(e) => { e.stopPropagation(); setCatOn((s) => ({ ...s, [i]: !s[i] })); }} style={{ width: 26, height: 15, borderRadius: 999, background: on ? "#22c55e" : "#d4d4dc", position: "relative", flexShrink: 0, cursor: "pointer", transition: "background 0.15s" }}>
                    <span style={{ position: "absolute", top: 2, left: on ? 13 : 2, width: 11, height: 11, borderRadius: 999, background: "#fff", transition: "left 0.15s" }} />
                  </span>
                  }
                </div>
                {open && (() => {
                  const defLen = DEFAULT_CATS[i] ? DEFAULT_CATS[i].desc.length : c.desc.length;
                  const long = c.desc.length > defLen;
                  const expanded = catMore === i;
                  const shown = expanded || !long ? c.desc : c.desc.slice(0, defLen).trimEnd() + "… ";
                  return (
                  <div style={{ fontSize: 8.5, fontWeight: bannerWeight, color: "#777", lineHeight: 1.45, padding: "0 10px 8px 33px", textAlign: bannerTextAlign, overflowWrap: "break-word", wordBreak: "break-word" }}>
                    {shown}
                    {long &&
                    <span onClick={() => setCatMore(expanded ? null : i)} style={{ color: colors.btnBg, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontSize: "inherit" }}>{expanded ? " Show less" : " Show more"}</span>
                    }
                  </div>);
                })()}
              </div>);

            })}
          </div>

          <div style={{ display: "flex", flexDirection: device === "Phone" ? "column" : "row", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
            {showReject &&
            <button onClick={resetToInitial} title={content.reject} style={{ ...solidBtn, width: device === "Phone" ? "100%" : undefined }}>{content.reject}</button>
            }
            <button onClick={resetToInitial} title={prefC.save} style={{ ...prefBtn, width: device === "Phone" ? "100%" : undefined }}>{prefC.save}</button>
          </div>
        </div>
        ) : (
        isCCPA ?
        /* ---- CCPA · default banner ---- */
        <div key={animKey} style={{ position: "absolute", ...posStyle, ...cardBase, borderRadius: bannerRadius, animation: bannerAnimCss, maxHeight: "calc(100% - 24px)", overflowY: "auto", zoom: bannerZoom }}>
          {showClose && closeX}
          <div style={titleStyle}>{content.title}</div>
          <div style={bodyStyle}>{ccpaC.message || ccpaBanner.message}{policyLink}</div>
          <a href="#" onClick={(e) => { e.preventDefault(); setView("pref"); }} style={{ color: colors.btnBg, fontSize: 11, fontWeight: 600, textDecoration: "underline" }}>{ccpaC.doNotShare}</a>
        </div> :
        /* ---- GDPR · default banner ---- */
        <div key={animKey} style={{ position: "absolute", ...posStyle, ...cardBase, borderRadius: bannerRadius, animation: bannerAnimCss, maxHeight: "calc(100% - 24px)", overflowY: "auto", zoom: bannerZoom }}>
          {showClose && closeX}
          <div style={titleStyle}>{content.title}</div>
          <div style={bodyStyle}>{bodyNode}</div>
          <div style={{ display: "flex", flexDirection: device === "Phone" ? "column" : "row", gap: 6, justifyContent: "flex-end", flexWrap: "nowrap" }}>
            {showCustomize &&
            <button title={content.customize} style={{ ...prefBtn, flex: device === "Phone" ? undefined : "1 1 0", width: device === "Phone" ? "100%" : undefined }} onClick={() => setView("pref")}>{content.customize}</button>
            }
            {showReject &&
            <button onClick={resetToInitial} title={content.reject} style={{ ...solidBtn, flex: device === "Phone" ? undefined : "1 1 0", width: device === "Phone" ? "100%" : undefined }}>{content.reject}</button>
            }
            <button onClick={resetToInitial} title={content.accept} style={{ ...solidBtn, flex: device === "Phone" ? undefined : "1 1 0", width: device === "Phone" ? "100%" : undefined }}>{content.accept}</button>
          </div>
        </div>
        )}
      </div>

      {/* Device tabs — hidden: preview is desktop-only (device stays "Desktop") */}
      {/*
      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        {[
        { l: "Phone", d: "M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" },
        { l: "Tab", d: "M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-15a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 4.5v15a2.25 2.25 0 0 0 2.25 2.25Z" },
        { l: "Desktop", d: "M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" }].
        map((d, i) =>
        <button key={i} onClick={() => setDevice(d.l)} className={"w-nav-btn " + (device === d.l ? "active" : "")} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", fontSize: 12.5 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={d.d} /></svg>
            {d.l}
          </button>
        )}
      </div>
      */}
    </div>);

}

export { WEdPreview };
