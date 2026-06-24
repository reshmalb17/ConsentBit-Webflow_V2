import React from "react";
import { WMainTabs } from "../../kit/WMainTabs.jsx";
import { WPage } from "../../kit/WPage.jsx";
import { WTopBar } from "../../kit/WTopBar.jsx";

function WLoading() {
  return (
    <WPage scroll={false}>
      <WTopBar />
      <WMainTabs active="scan" left />
      <div style={{ position: "relative", padding: 16, minHeight: 460 }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }} />
        <div style={{
          position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)",
          width: 280, background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 14, padding: 26, textAlign: "center"
        }}>
          <svg width="44" height="44" viewBox="0 0 56 56" style={{ marginBottom: 12 }}>
            <circle cx="28" cy="14" r="4" fill="#7C5CFC"><animate attributeName="opacity" values="1;.3;1" dur="1s" begin="0s" repeatCount="indefinite" /></circle>
            <circle cx="40" cy="28" r="4" fill="#8E72FF"><animate attributeName="opacity" values="1;.3;1" dur="1s" begin="0.2s" repeatCount="indefinite" /></circle>
            <circle cx="28" cy="42" r="4" fill="#A78BFA"><animate attributeName="opacity" values="1;.3;1" dur="1s" begin="0.4s" repeatCount="indefinite" /></circle>
            <circle cx="16" cy="28" r="4" fill="#7C5CFC"><animate attributeName="opacity" values="1;.3;1" dur="1s" begin="0.6s" repeatCount="indefinite" /></circle>
          </svg>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Scanning…</div>
          <div style={{ color: "var(--text-muted)", fontSize: 11.5 }}>Your site "Acme.com" is scanning</div>
        </div>
      </div>
    </WPage>);

}

export { WLoading };
