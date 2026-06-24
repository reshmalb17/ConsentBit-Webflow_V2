import React from "react";
import { useNav } from "../../nav.jsx";
import { WIabBanner } from "./WIabBanner.jsx";
import { prefCategories as PREF_CATS, simpleBanner, preferenceBanner, ccpaBanner } from "../../lib/bannerContent.js";

function WEdPreview({ variant = "default" }) {
  const nav = useNav();
  // Consent template decides which region tabs are available in the preview.
  const template = nav ? nav.template : "CCPA+GDPR";
  const regions = template === "GDPR (EU)" ? ["GDPR"] : template === "CCPA (USA)" ? ["CCPA"] : ["GDPR", "CCPA"];

  const [region, setRegion] = React.useState(regions[0]);
  const [device, setDevice] = React.useState("Desktop");

  // Keep the selected region valid when the template changes.
  React.useEffect(() => {
    if (!regions.includes(region)) setRegion(regions[0]);
  }, [template]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const [ccpaMore, setCcpaMore] = React.useState(false);   // CCPA opt-out body "Show more"

  // Simulated viewport width per device.
  const winWidth = device === "Phone" ? 250 : device === "Tab" ? 380 : "100%";
  const bannerWidth = device === "Phone" ? 210 : 300;

  // Layout: where the default banner sits. box -> corner (left/right by align),
  // banner -> full-width bottom, popup -> bottom center.
  const bannerPos = nav ? nav.bannerPos : "box";
  const bannerAlign = nav ? nav.bannerAlign : "left";
  const posStyle =
    bannerPos === "banner" ? { bottom: 12, left: 12, right: 12 } :
    bannerPos === "popup" ? { bottom: 16, left: "50%", transform: "translateX(-50%)", width: bannerWidth } :
    bannerAlign === "right" ? { bottom: 16, right: 16, width: bannerWidth } :
    { bottom: 16, left: 16, width: bannerWidth };

  // Banner button styles (blue theme to match the live default design).
  const BLUE = "#1f6fe8";
  const solidBtn = { background: BLUE, color: "#fff", border: "none", borderRadius: 7, padding: "6px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer" };
  const outlineBtn = { background: "#fff", color: BLUE, border: "1px solid " + BLUE, borderRadius: 7, padding: "6px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer" };
  const closeX = <span onClick={() => setView("default")} style={{ position: "absolute", top: 10, right: 12, fontSize: 13, color: "#888", cursor: "pointer" }}>✕</span>;

  const cardBase = { background: "white", borderRadius: 10, padding: 14, boxShadow: "0 14px 30px rgba(0,0,0,0.4)" };
  const bannerBody = simpleBanner.body;

  return (
    <div style={{ width: "450px", position: "sticky", top: 0, alignSelf: "start" }}>
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
      <div className="preview-window" style={{ width: winWidth, margin: device === "Desktop" ? undefined : "0 auto", height: iab ? 400 : isPref ? 400 : 320, position: "relative", overflow: "hidden", transition: "width 0.2s ease" }}>
        <div className="preview-titlebar"><span className="dot" /><span className="dot" /><span className="dot" /></div>

        {iab ?
        /* ---- IAB / TCF banner (ported from the webapp) ---- */
        <WIabBanner device={device === "Phone" ? "mobile" : "desktop"} alignment={bannerAlign === "right" ? "bottom-right" : "bottom-left"} config={{ isGAC: nav ? nav.gac : false, bannerType: bannerPos }} /> :

        isPref ? (
        isCCPA ?
        /* ---- CCPA · Opt-out Preference ---- */
        <div className="preview-card" style={{ position: "absolute", top: "50%", left: 16, right: 16, transform: "translateY(-50%)", maxHeight: "calc(100% - 24px)", overflowY: "auto", ...cardBase }}>
          {closeX}
          <div className="preview-title" style={{ marginBottom: 8 }}>{ccpaBanner.optOutTitle}</div>
          <div style={{ fontSize: "9.5px", lineHeight: 1.5, marginBottom: 10, color: "#1a1a1a" }}>
            {ccpaMore ? ccpaBanner.optOutBody : ccpaBanner.optOutBody.slice(0, 120).trimEnd() + "… "}
            <span onClick={() => setCcpaMore((m) => !m)} style={{ color: "#1f6fe8", fontWeight: 600, cursor: "pointer" }}>{ccpaMore ? " Show less" : "Show more"}</span>
          </div>
          <label onClick={() => setCcpaCheck((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0 14px", fontSize: 10.5, fontWeight: 700, cursor: "pointer" }}>
            <span style={{ width: 15, height: 15, border: "1px solid " + (ccpaCheck ? "#1f6fe8" : "#bbb"), borderRadius: 3, flexShrink: 0, background: ccpaCheck ? "#1f6fe8" : "#fff", display: "grid", placeItems: "center" }}>
              {ccpaCheck && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
            </span>
            {ccpaBanner.doNotShare}
          </label>
          <div style={{ display: "flex", flexDirection: device === "Phone" ? "column" : "row", gap: 8 }}>
            <button className="pv-solid" style={{ ...solidBtn, flex: device === "Phone" ? undefined : 1, width: device === "Phone" ? "100%" : undefined }}>{ccpaBanner.buttons.cancel}</button>
            <button className="pv-outline" style={{ ...outlineBtn, flex: device === "Phone" ? undefined : 1, width: device === "Phone" ? "100%" : undefined }}>{ccpaBanner.buttons.save}</button>
          </div>
        </div> :
        /* ---- GDPR · Cookie Preferences ---- */
        <div className="preview-card" style={{ position: "absolute", top: "50%", left: 16, right: 16, transform: "translateY(-50%)", maxHeight: "calc(100% - 24px)", overflowY: "auto", ...cardBase }}>
          {closeX}
          <div className="preview-title" style={{ marginBottom: 6 }}>{preferenceBanner.title}</div>
          <div style={{ fontSize: "10px", fontWeight: 600, marginBottom: 10, color: "#1a1a1a" }}>{preferenceBanner.overview}</div>

          <div style={{ border: "1px solid #e4e4ea", borderRadius: 8, overflow: "hidden" }}>
            {PREF_CATS.map((c, i) => {
              const open = openAcc === c.l;
              const on = !!catOn[c.l];
              return (
              <div key={c.l} style={{ borderTop: i ? "1px solid #e4e4ea" : "none" }}>
                <div onClick={() => setOpenAcc(open ? null : c.l)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 15, height: 15, border: "1px solid #ccc", borderRadius: 3, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, lineHeight: 1, color: "#555", flexShrink: 0 }}>{open ? "−" : "+"}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700 }}>{c.l}</span>
                  </div>
                  {c.always ?
                  <span style={{ fontSize: 9.5, color: "#555" }}>Always Active</span> :
                  <span onClick={(e) => { e.stopPropagation(); setCatOn((s) => ({ ...s, [c.l]: !s[c.l] })); }} style={{ width: 26, height: 15, borderRadius: 999, background: on ? "#1f6fe8" : "#d4d4dc", position: "relative", flexShrink: 0, cursor: "pointer", transition: "background 0.15s" }}>
                    <span style={{ position: "absolute", top: 2, left: on ? 13 : 2, width: 11, height: 11, borderRadius: 999, background: "#fff", transition: "left 0.15s" }} />
                  </span>
                  }
                </div>
                {open &&
                <div style={{ fontSize: 8.5, color: "#777", lineHeight: 1.45, padding: "0 10px 8px 33px" }}>{c.desc}</div>
                }
              </div>);

            })}
          </div>

          <div style={{ display: "flex", flexDirection: device === "Phone" ? "column" : "row", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
            <button className="pv-solid" style={{ ...solidBtn, width: device === "Phone" ? "100%" : undefined }}>{preferenceBanner.buttons.reject}</button>
            <button className="pv-outline" style={{ ...outlineBtn, width: device === "Phone" ? "100%" : undefined }}>{preferenceBanner.buttons.save}</button>
          </div>
        </div>
        ) : (
        isCCPA ?
        /* ---- CCPA · default banner ---- */
        <div className="preview-card" style={{ position: "absolute", ...posStyle, ...cardBase, borderRadius: 9 }}>
          {closeX}
          <div className="preview-title">{ccpaBanner.title}</div>
          <div className="preview-body" style={{ fontSize: "11px" }}>{bannerBody}</div>
          <a className="pv-link" href="#" onClick={(e) => { e.preventDefault(); setView("pref"); }} style={{ color: BLUE, fontSize: 11, fontWeight: 600, textDecoration: "underline" }}>{ccpaBanner.doNotShare}</a>
        </div> :
        /* ---- GDPR · default banner ---- */
        <div className="preview-card" style={{ position: "absolute", ...posStyle, ...cardBase, borderRadius: 9 }}>
          {closeX}
          <div className="preview-title">{simpleBanner.title}</div>
          <div className="preview-body" style={{ fontSize: "11px" }}>{bannerBody}</div>
          <div style={{ display: "flex", flexDirection: device === "Phone" ? "column" : "row", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button className="pv-outline" style={{ ...outlineBtn, width: device === "Phone" ? "100%" : undefined }} onClick={() => setView("pref")}>{simpleBanner.buttons.preference}</button>
            <button className="pv-solid" style={{ ...solidBtn, width: device === "Phone" ? "100%" : undefined }}>{simpleBanner.buttons.reject}</button>
            <button className="pv-solid" style={{ ...solidBtn, width: device === "Phone" ? "100%" : undefined }}>{simpleBanner.buttons.accept}</button>
          </div>
        </div>
        )}
      </div>

      {/* Device tabs */}
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
    </div>);

}

export { WEdPreview };
