import React from "react";
import { WAuthShell } from "./WAuthShell.jsx";

function WVerifyInstall() {
  return (
    <WAuthShell step={3} title="Verify your installation">
      <div className="card" style={{ padding: 16, maxWidth: 600, margin: "0 auto" }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>Your Next Steps</div>
        <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 8, padding: 10, fontFamily: "monospace", fontSize: 10, lineHeight: 1.5, marginBottom: 10, wordBreak: "break-all" }}>
          <span style={{ color: "#FF9F45" }}>&lt;script</span> <span style={{ color: "#5AE497" }}>id="cookieyes" type="text/javascript" src="…"</span><span style={{ color: "#FF9F45" }}>&gt;&lt;/script&gt;</span>
        </div>
        <div style={{ fontSize: 11.5, marginBottom: 12 }}>Paste after the opening <code style={{ background: "var(--purple-soft)", padding: "1px 5px", borderRadius: 4, color: "var(--purple-hi)" }}>&lt;head&gt;</code> tag.</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="input" defaultValue="Yoursite.com" style={{ flex: 1 }} />
          <button className="btn btn-primary">Verify</button>
        </div>
      </div>
    </WAuthShell>);

}

// ---------- APP SHELL ----------

export { WVerifyInstall };
