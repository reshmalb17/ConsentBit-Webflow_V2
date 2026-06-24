import React from "react";

function WWebflowHeadMock() {
  return (
    <div style={{
      background: "#fbfbfc", borderRadius: 10, border: "1px solid #e4e4ea",
      overflow: "hidden", color: "#1a1a25", boxShadow: "0 10px 24px rgba(0,0,0,0.32)",
      fontFamily: "'DM Sans', sans-serif"
    }}>
      {/* top nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 12px", borderBottom: "1px solid #ececf1", fontSize: 10.5 }}>
        <div style={{ width: 18, height: 18, borderRadius: 4, background: "#146EF5", display: "grid", placeItems: "center", color: "white", fontWeight: 800, fontStyle: "italic", fontSize: 11 }}>W</div>
        <span style={{ fontWeight: 600, borderBottom: "2px solid #146EF5", paddingBottom: 9, marginBottom: -9 }}>Dashboard</span>
        <span style={{ color: "#6b6b78" }}>Marketplace ▾</span>
        <span style={{ color: "#6b6b78" }}>Learn</span>
        <span style={{ color: "#6b6b78" }}>Resources ▾</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ color: "#6b6b78" }}>◉</span>
          <span style={{ width: 18, height: 18, borderRadius: 999, background: "#6E59F5", color: "white", display: "grid", placeItems: "center", fontSize: 8.5, fontWeight: 700 }}>SM</span>
          <span style={{ color: "#6b6b78" }}>Account ▾</span>
        </div>
      </div>
      <div style={{ display: "flex" }}>
        {/* mini sidebar */}
        <div style={{ width: 108, borderRight: "1px solid #ececf1", padding: "14px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, color: "#1a1a25", background: "#f0f0f4", padding: "6px 8px", borderRadius: 6 }}>
            <span className="mono" style={{ fontWeight: 700 }}>&lt;/&gt;</span> Custom code
          </div>
        </div>
        {/* main */}
        <div style={{ flex: 1, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Head code</div>
            <span style={{ background: "#146EF5", color: "white", fontSize: 10, fontWeight: 600, padding: "4px 12px", borderRadius: 5 }}>Save</span>
          </div>
          <div style={{ fontSize: 9.5, color: "#8a8a95", marginBottom: 10 }}>Add code at the end of the &lt;head&gt; tag</div>
          {/* code editor */}
          <div className="mono" style={{ border: "1px solid #e4e4ea", borderRadius: 7, overflow: "hidden", fontSize: 8, lineHeight: 1.5 }}>
            {/* highlighted block */}
            <div style={{ display: "flex", border: "2px solid #7C5CFC", borderRadius: 4, margin: 5 }}>
              <div style={{ background: "#f4f4f8", color: "#a0a0aa", padding: "5px 6px", textAlign: "right", userSelect: "none" }}>1</div>
              <div style={{ padding: "5px 6px", color: "#444", wordBreak: "break-all" }}>
                <span style={{ color: "#146EF5" }}>&lt;script&gt;</span>!function(){"{"}window.semaphore=window.semaphore||[],window.ketch=function(){"{"}window.semaphore.push(arguments){"}"};var e=document.createElement(<span style={{ color: "#1BA672" }}>"script"</span>);e.type=<span style={{ color: "#1BA672" }}>"text/javascript"</span>,e.src=<span style={{ color: "#1BA672" }}>"https://global.ketchcdn.com/web/v3/config/ketch_apps/boot.js"</span>,e.defer=e.async=!0,document.getElementsByTagName(<span style={{ color: "#1BA672" }}>"head"</span>)[0].appendChild(e){"}"}();<span style={{ color: "#146EF5" }}>&lt;/script&gt;</span>
              </div>
            </div>
            {/* GTM block */}
            <div style={{ display: "flex", padding: "0 5px 5px" }}>
              <div style={{ color: "#a0a0aa", padding: "0 6px", textAlign: "right", userSelect: "none", whiteSpace: "pre" }}>{"2\n3\n4\n5"}</div>
              <div style={{ padding: "0 6px", color: "#444" }}>
                <div style={{ color: "#8a8a95" }}>&lt;!-- Google Tag Manager --&gt;</div>
                <div>&lt;script&gt;(function(w,d,s,l,i){"{"}w[l]=w[l]||[];w[l].push({"{"}<span style={{ color: "#1BA672" }}>'gtm.start'</span>:</div>
                <div>new Date().getTime(),event:<span style={{ color: "#1BA672" }}>'gtm.js'</span>{"}"});var f=d.getElementsByTagName(s)[0],</div>
                <div>j=d.createElement(s),dl=l!=<span style={{ color: "#1BA672" }}>'dataLayer'</span>?<span style={{ color: "#1BA672" }}>'&amp;l='</span>+l:<span style={{ color: "#1BA672" }}>''</span>;j.async=true;j.src=</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);

}

export { WWebflowHeadMock };
