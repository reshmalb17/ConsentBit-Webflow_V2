import React from "react";
import { WAuthShell } from "../../kit/WAuthShell.jsx";
import { Icon } from "../../lib/icons.jsx";

function WInstallVerifyTwoCol() {
  const [copied, setCopied] = React.useState(false);
  const colHead = (n, title) =>
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <div style={{ width: 22, height: 22, borderRadius: 999, background: "var(--purple)", color: "#fff", fontSize: 11, fontWeight: 700, display: "grid", placeItems: "center", flexShrink: 0 }}>{n}</div>
      <div style={{ fontWeight: 600, fontSize: 12.5 }}>{title}</div>
    </div>;

  return (
    <WAuthShell step={3} topAlign title="Install & verify" subtitle="Add the banner to your site, then confirm it's live.">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }}>
        {/* Left column — Step 1 */}
        <div className="card" style={{ padding: 14 }}>
          {colHead(1, "Copy this banner installation code")}
          <div className="mono" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", fontSize: 10, lineHeight: 1.6, marginBottom: 10, whiteSpace: "nowrap", overflowX: "auto" }}>
            <span style={{ color: "#6E6890" }}>&lt;!-- Start ConsentBit banner --&gt;</span>{" "}
            <span style={{ color: "#FF9F45" }}>&lt;script</span> <span style={{ color: "#5AE497" }}>id="consentbit" type="text/javascript" src="https://manager.consentbit.com/consentbit/YOUR_SITE_ID/script.js"</span><span style={{ color: "#FF9F45" }}>&gt;&lt;/script&gt;</span>{" "}
            <span style={{ color: "#6E6890" }}>&lt;!-- End ConsentBit banner --&gt;</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => {setCopied(true);setTimeout(() => setCopied(false), 1200);}}>
              <Icon.copy />{copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <div style={{ fontWeight: 600, fontSize: 11.5, marginBottom: 4, lineHeight: 1.5, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
            Paste it right after the opening <code className="mono" style={{ background: "var(--purple-soft)", padding: "1px 5px", borderRadius: 4, color: "var(--purple-hi)" }}>&lt;head&gt;</code> tag in your site's source code.
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 10 }}>Refer to our <a href="https://help.webflow.com/hc/en-us/articles/33961356296723-Custom-code-in-head-and-body-tags" target="_blank" rel="noopener noreferrer" style={{ color: "var(--purple-hi)", textDecoration: "none" }}>platform-wise guides</a> for instructions.</div>
          <img src={window.__resources && window.__resources.webflowHeadcode || "assets/webflow-headcode.png"} alt="Webflow head code panel" style={{ display: "block", width: "100%", borderRadius: 8, border: "1px solid var(--border)", boxShadow: "0 10px 24px rgba(0,0,0,0.32)", marginBottom: 12 }} />
          <a href="https://webflow.com/dashboard" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>
            Open Webflow custom code
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 5, flexShrink: 0 }}><path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>
        </div>

        {/* Right column — Step 2 */}
        <div className="card" style={{ padding: 14 }}>
          {colHead(2, "Verify your installation")}
          <div style={{ display: "flex", gap: 10, background: "var(--purple-soft)", border: "1px solid var(--purple)", borderRadius: 9, padding: 12, marginBottom: 12 }}>
            <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0, marginTop: 1, color: "var(--purple-hi)" }}>
              <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="3" d="M31.4,41c-2.3,1-4.8,1.5-7.4,1.5C13.8,42.5,5.5,34.2,5.5,24c0-4.5,1.6-8.6,4.2-11.8" />
              <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="3" d="M16.3,7.2c2.3-1.1,5-1.7,7.7-1.7c10.2,0,18.5,8.3,18.5,18.5c0,4-1.3,7.7-3.4,10.7" />
              <circle cx="24" cy="16" r="2" fill="currentColor" />
              <line x1="24" x2="24" y1="22.5" y2="33.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="3" />
            </svg>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.5, marginBottom: 8 }}>
                After adding the code above, publish your site in the Webflow Designer before verifying.
              </div>
              <img src={window.__resources && window.__resources.webflowPublish || "assets/webflow-publish.png"} alt="Webflow publish destination dialog" style={{ display: "block", width: "100%", maxWidth: 300, borderRadius: 8, border: "1px solid var(--border)", marginBottom: 8 }} />
              <a href="https://discourse.webflow.com/t/webflow-site-not-publishing-despite-saying-published-successful/229949" target="_blank" rel="noopener noreferrer" style={{ color: "var(--purple-hi)", fontSize: 11, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                Site not publishing? Troubleshooting guide
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
            </div>
          </div>
          <button className="btn cb-verify-btn" style={{ height: "35px", width: "83px" }}>Verify</button>
          <div style={{ color: "var(--text-muted)", fontSize: 11, lineHeight: 1.6, marginTop: 10 }}>
            We'll load your site and check that the ConsentBit banner script is present and firing. Make sure you've published your site before verifying.
          </div>
        </div>
      </div>
    </WAuthShell>);

}

export { WInstallVerifyTwoCol };
