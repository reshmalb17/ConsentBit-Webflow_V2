import React from "react";
import { WAuthShell } from "./WAuthShell.jsx";

function WPublishStep() {
  return (
    <WAuthShell step={3} title="Publish your consent banner">
      <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 999, background: "var(--green-soft)", display: "grid", placeItems: "center", margin: "0 auto 16px", color: "#5AE497" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Everything's ready to go live</div>
        <div style={{ color: "var(--text-muted)", fontSize: 12.5, lineHeight: 1.55, marginBottom: 22 }}>
          Your scripts are categorized and the banner is installed. Publish to make your consent banner live on <b style={{ color: "var(--text)" }}>acne.com</b>.
        </div>

        <div className="card" style={{ padding: 16, textAlign: "left", marginBottom: 22, height: "129px", margin: "0px 0px 24px" }}>
          {[
          { l: "Project authorized", v: "Webflow connected" },
          { l: "Banner installed", v: "Loader detected in <head>" },
          { l: "Compliance mode", v: "GDPR + US State Laws" }].
          map((r, i) =>
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                <span style={{ color: "#5AE497", display: "grid", placeItems: "center" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg></span>
                {r.l}
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>{r.v}</span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="btn btn-secondary">Preview on site<svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: "0px", marginLeft: 1, flexShrink: 0 }}><path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
          <button className="btn btn-success">Publish &amp; continue<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 5, flexShrink: 0 }}><path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg></button>
        </div>
      </div>
    </WAuthShell>);

}

export { WPublishStep };
