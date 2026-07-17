import React from "react";
import { WMainTabs } from "../../kit/WMainTabs.jsx";
import { WPage } from "../../kit/WPage.jsx";
import { WTopBar } from "../../kit/WTopBar.jsx";

function WInstallCode() {
  return (
    <WPage scroll={false}>
      <WTopBar />
      <WMainTabs active="dashboard" />
      <div style={{ position: "relative", padding: 16, minHeight: 460 }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }} />
        <div style={{
          position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)",
          width: 560, background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 12, overflow: "hidden"
        }}>
          <div style={{ padding: "10px 14px", background: "var(--purple-soft)", borderBottom: "1px solid var(--border)", fontWeight: 600, fontSize: 12.5 }}>⛓ Install ConsentBit on your website</div>
          <div style={{ padding: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 12.5 }}>Step 1: Copy installation code</div>
            <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 8, padding: 10, fontFamily: "monospace", fontSize: 10.5, lineHeight: 1.5, marginBottom: 10, wordBreak: "break-all" }}>
              <span style={{ color: "#6E6890" }}>&lt;!-- ConsentBit --&gt;</span> <span style={{ color: "#FF9F45" }}>&lt;script</span> <span style={{ color: "#5AE497" }}>id="consentbit" src="https://manager.consentbit.com/consentbit/YOUR_SITE_ID/script.js"</span><span style={{ color: "#FF9F45" }}>&gt;&lt;/script&gt;</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <button className="btn btn-secondary btn-sm">Copy code</button>
              <button className="btn btn-secondary btn-sm">Send to teammate</button>
            </div>
            <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 12.5 }}>Step 2: Verify installation</div>
            <div style={{ display: "flex", gap: 6 }}>
              <input className="input" defaultValue="Yoursite.com" style={{ flex: 1 }} />
              <button className="btn btn-primary btn-sm">Verify</button>
            </div>
          </div>
        </div>
      </div>
    </WPage>);

}

export { WInstallCode };
