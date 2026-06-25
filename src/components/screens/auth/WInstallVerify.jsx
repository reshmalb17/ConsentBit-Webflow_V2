import React from "react";
import { WAuthShell } from "../../kit/WAuthShell.jsx";
import { WSubStep } from "../../kit/WSubStep.jsx";
import { Icon } from "../../lib/icons.jsx";
import { WVerifyModal } from "../../kit/WVerifyModal.jsx";

function WInstallVerify() {
  const [copied, setCopied] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [showPopup, setShowPopup] = React.useState(false);
  const platforms = ["Wp", "Wx", "K", "S", "M", "B", "D", "Sq", "Sh", "Wf", "Fr", "C"];

  const installCode = '<!-- Start ConsentBit banner --> <script id="consentbit" type="text/javascript" src="https://cdn.consentbit.com/client_data/040a441d4818e9d47ed2318bd7caaed6/script.js"></script> <!-- End ConsentBit banner -->';

  // Deep-link to THIS site's Site Settings → Custom code page. The Designer API
  // gives us the site's shortName (slug); we build the same URL the live app
  // uses: https://webflow.com/dashboard/sites/{shortName}/custom-code
  const [shortName, setShortName] = React.useState(null);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const info = await window.webflow?.getSiteInfo?.();
        if (!cancelled && info?.shortName) setShortName(info.shortName);
      } catch {
        /* not running inside the Designer — leave the generic fallback */
      }
    })();
    return () => { cancelled = true; };
  }, []);
  const customCodeUrl = shortName
    ? `https://webflow.com/dashboard/sites/${shortName}/custom-code`
    : "https://webflow.com/dashboard";

  const copyCode = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(installCode);
      } else {
        // Fallback for environments without the async Clipboard API
        const ta = document.createElement("textarea");
        ta.value = installCode;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard blocked — leave the button label unchanged */
    }
  };
  return (
    <WAuthShell step={3} topAlign title="Install & verify" subtitle="Add the banner to your site, then confirm it's live.">
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        {/* Sub-step 1 — copy code & paste into <head> */}
        <WSubStep n={1}>
          <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 10 }}>Copy this banner installation code</div>
          <div className="mono" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 8, padding: 11, fontSize: 10, lineHeight: 1.6, marginBottom: 12, wordBreak: "break-all" }}>
            <span style={{ color: "#6E6890" }}>&lt;!-- Start ConsentBit banner --&gt;</span>{" "}
            <span style={{ color: "#FF9F45" }}>&lt;script</span> <span style={{ color: "#5AE497" }}>id="consentbit" type="text/javascript" src="https://cdn.consentbit.com/client_data/040a441d4818e9d47ed2318bd7caaed6/script.js"</span><span style={{ color: "#FF9F45" }}>&gt;&lt;/script&gt;</span>{" "}
            <span style={{ color: "#6E6890" }}>&lt;!-- End ConsentBit banner --&gt;</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button className="btn btn-secondary btn-sm" onClick={copyCode}>
              <Icon.copy />{copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 4, lineHeight: 1.5, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            Paste it right after the opening <code className="mono" style={{ background: "var(--purple-soft)", padding: "1px 5px", borderRadius: 4, color: "var(--purple-hi)" }}>&lt;head&gt;</code> tag in your site's source code.
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 12 }}>Refer to our <a href="https://help.webflow.com/hc/en-us/articles/33961356296723-Custom-code-in-head-and-body-tags" target="_blank" rel="noopener" style={{ color: "var(--purple-hi)", textDecoration: "none" }}>platform-wise guides</a> for instructions.</div>
          <img src={window.__resources && window.__resources.webflowHeadcode || "assets/webflow-headcode.png"} alt="Webflow head code panel" style={{ display: "block", width: "100%", borderRadius: 10, border: "1px solid var(--border)", boxShadow: "0 10px 24px rgba(0,0,0,0.32)" }} />
          <a href={customCodeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ marginTop: 12, textDecoration: "none" }}>
            Open Webflow custom code
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 5, flexShrink: 0 }}><path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>
        </WSubStep>

        {/* Sub-step 2 — verify */}
        <WSubStep n={2} last>
          <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 12 }}>Verify your installation</div>

          {/* Highlighted publish reminder */}
          <div style={{ display: "flex", gap: 10, background: "var(--purple-soft)", border: "1px solid var(--purple)", borderRadius: 9, padding: 12, marginBottom: 14 }}>
            <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0, marginTop: 1, color: "var(--purple-hi)" }}>
              <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="3" d="M31.4,41c-2.3,1-4.8,1.5-7.4,1.5C13.8,42.5,5.5,34.2,5.5,24c0-4.5,1.6-8.6,4.2-11.8" />
              <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="3" d="M16.3,7.2c2.3-1.1,5-1.7,7.7-1.7c10.2,0,18.5,8.3,18.5,18.5c0,4-1.3,7.7-3.4,10.7" />
              <circle cx="24" cy="16" r="2" fill="currentColor" />
              <line x1="24" x2="24" y1="22.5" y2="33.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="3" />
            </svg>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.5, marginBottom: 8 }}>
                After adding the code above, publish your site in the Webflow Designer before verifying.
              </div>
              {/* Webflow publish screenshot */}
              <img src={window.__resources && window.__resources.webflowPublish || "assets/webflow-publish.png"} alt="Webflow publish destination dialog" style={{ display: "block", width: "100%", maxWidth: 300, borderRadius: 8, border: "1px solid var(--border)", marginBottom: 8 }} />
              <a href="https://discourse.webflow.com/t/webflow-site-not-publishing-despite-saying-published-successful/229949" target="_blank" rel="noopener" style={{ color: "var(--purple-hi)", fontSize: 11, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                Site not publishing? Troubleshooting guide
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
            </div>
          </div>

          <button className="btn cb-verify-btn" style={{ height: "35px", width: "83px" }} onClick={() => {
            
              setShowPopup(true);
           
          }}>
            Verify
          </button>
          <div style={{ color: "var(--text-muted)", fontSize: 11, lineHeight: 1.6, marginTop: 12 }}>
            We'll load your site and check that the ConsentBit banner script is present and firing. Make sure you've published your site before verifying.
          </div>
        </WSubStep>
      </div>
      {showPopup &&
      <WVerifyModal mode="success" onClose={() => setShowPopup(false)} onPrimary={() => setShowPopup(false)} />
      }
    </WAuthShell>);

}



export { WInstallVerify };
