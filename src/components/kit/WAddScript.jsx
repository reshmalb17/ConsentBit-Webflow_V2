import React from "react";
import { WAuthShell } from "./WAuthShell.jsx";

function WAddScript() {
  const [copied, setCopied] = React.useState(false);

  return (
    <WAuthShell step={2} title="Install the script on your site">
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ color: "var(--text-muted)", fontSize: 12, textAlign: "center", marginBottom: 18, lineHeight: 1.5 }}>
          Paste the ConsentBit loader into your Webflow site's custom code, just before the closing <code style={{ background: "var(--purple-soft)", padding: "1px 5px", borderRadius: 4, color: "var(--purple-hi)" }}>&lt;/head&gt;</code> tag, then verify it's live.
        </div>

        {/* Step 1 — copy code */}
        <div className="card" style={{ padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>Step 1: Copy the installation code</div>
            <button className="btn btn-secondary btn-sm" onClick={() => {setCopied(true);setTimeout(() => setCopied(false), 1200);}}>
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 8, padding: 10, fontFamily: "monospace", fontSize: 10, lineHeight: 1.5, wordBreak: "break-all" }}>
            <span style={{ color: "#6E6890" }}>&lt;!-- ConsentBit --&gt;</span> <span style={{ color: "#FF9F45" }}>&lt;script</span> <span style={{ color: "#5AE497" }}>src="https://cdn.consentbit.com/cb.js" id="consentbit"</span><span style={{ color: "#FF9F45" }}>&gt;&lt;/script&gt;</span>
          </div>
        </div>

        {/* Step 2 — verify */}
        <div className="card" style={{ padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Step 2: Verify your installation</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--text)", userSelect: "none" }}>acne.com</span>
            <button className="btn btn-primary btn-sm">Verify</button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <span style={{ color: "var(--text-muted)", fontSize: 11 }}>Need help? <a href="#" style={{ color: "var(--purple-hi)" }}>Installation guide ✎</a></span>
          <button className="btn btn-primary">I've added the code<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 5, flexShrink: 0 }}><path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg></button>
        </div>
      </div>
    </WAuthShell>);

}

export { WAddScript };
