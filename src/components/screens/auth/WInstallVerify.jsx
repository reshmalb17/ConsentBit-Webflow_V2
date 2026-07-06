import React from "react";
import { WAuthShell } from "../../kit/WAuthShell.jsx";
import { Icon } from "../../lib/icons.jsx";
import { WVerifyModal } from "../../kit/WVerifyModal.jsx";
import { WImageZoom } from "../../kit/WImageZoom.jsx";
import { verifyInstallation, getWebflowSiteContext, getWebflowSiteStatus, getLegacyScriptStatus, removeLegacyScripts } from "../../../lib/api.js";
import { publishSite, listSiteDomains } from "../../../lib/webflowAuth.js";
import { useNav } from "../../../nav.jsx";

function WInstallVerify() {
  const nav = useNav();
  const [copied, setCopied] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [showPopup, setShowPopup] = React.useState(false);
  const [verifyMode, setVerifyMode] = React.useState("success"); // success | error | unpublished
  // Domain-selection UI — only shown when the site has custom domain(s) in addition
  // to the staging subdomain (so the user can choose where to publish).
  const [domainChoice, setDomainChoice] = React.useState(null); // { subdomain, customDomains } | null
  const [selSub, setSelSub] = React.useState(true);   // publish to the *.webflow.io staging domain?
  const [selIds, setSelIds] = React.useState([]);     // selected custom-domain ids

  // The REAL embed script URL for this site comes from the backend status call
  // (scriptUrl) — never hardcode it. Resolve shortName + scriptUrl in one effect.
  const [shortName, setShortName] = React.useState(null);
  const [scriptUrl, setScriptUrl] = React.useState("");
  const [siteUrl, setSiteUrl] = React.useState(""); // the site's live URL for "Preview in site"
  // Legacy cleanup — old live-app users have a ConsentBit script auto-injected by
  // the previous app ("Code added by Apps"). It must be removed before the manual
  // paste + verify, or the banner loads twice. `wfSiteId` is captured so the
  // Remove button can re-run the API call without re-reading the Designer context.
  const [wfSiteId, setWfSiteId] = React.useState(null);
  const [legacy, setLegacy] = React.useState({ checking: true, hasLegacy: false, count: 0, removing: false, removedCount: 0, error: null });
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { wfSiteId, domain, siteInfo } = await getWebflowSiteContext();
        if (!cancelled && wfSiteId) setWfSiteId(wfSiteId);
        if (!cancelled && siteInfo?.shortName) setShortName(siteInfo.shortName);
        if (!cancelled && domain) setSiteUrl(`https://${String(domain).replace(/^https?:\/\//, "").replace(/\/$/, "")}`);
        if (wfSiteId) {
          const status = await getWebflowSiteStatus(wfSiteId);
          if (!cancelled && status?.scriptUrl) setScriptUrl(status.scriptUrl);
          const ls = await getLegacyScriptStatus(wfSiteId);
          // Already upgraded — the current-version script is in the head. Nothing
          // to install, so skip this screen entirely and go to the app.
          if (!cancelled && ls.hasCurrent) { nav?.goToApp?.(); return; }
          if (!cancelled) setLegacy((s) => ({ ...s, checking: false, hasLegacy: ls.hasLegacy, count: ls.legacyCount }));
        } else if (!cancelled) {
          setLegacy((s) => ({ ...s, checking: false }));
        }
      } catch {
        /* not running inside the Designer — leave the generic fallback */
        if (!cancelled) setLegacy((s) => ({ ...s, checking: false }));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Remove the old API-injected ConsentBit code, then re-check. Returns true when
  // the site is clean afterwards. Called automatically at the start of publish.
  const ensureLegacyRemoved = async () => {
    if (!wfSiteId || !legacy.hasLegacy) return true;
    setLegacy((s) => ({ ...s, removing: true, error: null }));
    const res = await removeLegacyScripts(wfSiteId);
    const ls = await getLegacyScriptStatus(wfSiteId);
    setLegacy((s) => ({
      ...s,
      removing: false,
      hasLegacy: ls.hasLegacy,
      count: ls.legacyCount,
      removedCount: res.removedCount,
      error: ls.hasLegacy ? (res.error || "We couldn't finish updating your installation. Please try Publish again.") : null,
    }));
    return !ls.hasLegacy;
  };

  const installCode = scriptUrl
    ? `<!-- Start ConsentBit banner --> <script id="consentbit" type="text/javascript" src="${scriptUrl}"></script> <!-- End ConsentBit banner -->`
    : "";

  // Deep-link to THIS site's Site Settings → Custom code page.
  const customCodeUrl = shortName
    ? `https://webflow.com/dashboard/sites/${shortName}/custom-code`
    : "https://webflow.com/dashboard";

  const copyCode = async () => {
    if (!installCode) return; // script URL not loaded yet
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(installCode);
      } else {
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

  // Publish + verify against the chosen targets. Give Webflow's CDN a moment to
  // serve the new publish before verifying.
  const doPublishAndVerify = async ({ publishToWebflowSubdomain, customDomains }) => {
    setPublishing(true);
    try {
      await publishSite({ publishToWebflowSubdomain, customDomains });
      await new Promise((r) => setTimeout(r, 2500));
      const result = await verifyInstallation();
      if (!result.published) setVerifyMode("unpublished");
      else setVerifyMode(result.found ? "success" : "error");
    } catch {
      setVerifyMode("error");
    } finally {
      setPublishing(false);
      setDomainChoice(null);
      setShowPopup(true);
    }
  };

  // Publish → resolve the site's domains first. Only-staging publishes straight
  // away; if custom domain(s) also exist, open the target-selection panel.
  const handlePublish = async () => {
    if (publishing) return;
    setPublishing(true);
    // Auto-remove any old API-injected ConsentBit code FIRST, so the banner isn't
    // loaded twice and verify checks only the new manual install. Abort if the
    // removal fails (the warning card surfaces the error).
    const clean = await ensureLegacyRemoved();
    if (!clean) { setPublishing(false); return; }
    let targets = null;
    try { targets = await listSiteDomains(); } catch { /* fall back to staging-only */ }
    const customDomains = targets?.customDomains || [];
    if (customDomains.length > 0) {
      // Both staging + custom → let the user choose (default: everything selected).
      setSelSub(true);
      setSelIds(customDomains.map((d) => d.id).filter(Boolean));
      setDomainChoice({ subdomain: targets?.subdomain || null, customDomains });
      setPublishing(false);
      return;
    }
    // Only the staging subdomain → publish directly, no selection.
    await doPublishAndVerify({ publishToWebflowSubdomain: true, customDomains: [] });
  };

  const toggleId = (id) =>
    setSelIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  const nothingSelected = !selSub && selIds.length === 0;

  return (
    <WAuthShell step={4} topAlign title="Install & verify" subtitle="Add the banner to your site, then confirm it's live.">
      <div style={{ maxWidth: 620, margin: "0 auto", paddingBottom: 24 }}>
        {/* Back to customization — only when this page was opened from the editor. */}
        {nav && nav.installVerifyFromApp && nav.goToApp &&
          <button
            onClick={() => nav.goToApp()}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", padding: 0, marginBottom: 10 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back to customization
          </button>
        }
        {/* Any old previous-version ConsentBit script is removed silently as the
            first step of Publish (see ensureLegacyRemoved in handlePublish) — no
            heads-up is shown. If a hard failure occurs, surface just the error. */}
        {legacy.error &&
          <div className="card" style={{ padding: 12, marginBottom: 12, border: "1px solid #E0623E", background: "rgba(224,98,62,0.08)" }}>
            <div style={{ color: "#E0623E", fontSize: 11.5, fontWeight: 600 }}>{legacy.error}</div>
          </div>
        }
        <div className="card" style={{ padding: "14px 14px 24px" }}>
          {/* Heading + Copy button */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Copy this banner installation code</div>
            <button className="btn btn-secondary btn-sm" onClick={copyCode} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon.copy />{copied ? "Copied ✓" : "Copy"}
            </button>
          </div>

          {/* Code block — line breaks match the design: opening tag, indented src
              (closing with >), then </script> on its own line. */}
          <div className="mono" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 8, padding: 10, fontSize: 9.5, lineHeight: 1.5, wordBreak: "break-all" }}>
            <div style={{ color: "#6E6890" }}>&lt;!-- Start ConsentBit banner --&gt;</div>
            <div>
              <span style={{ color: "#FF9F45" }}>&lt;script </span>
              <span style={{ color: "#5AE497" }}>id="consentbit" type="text/javascript"</span>
            </div>
            <div>
              <span style={{ color: "#5AE497" }}>{`  src="${scriptUrl || "loading…"}"`}</span>
              <span style={{ color: "#FF9F45" }}>&gt;</span>
            </div>
            <div style={{ color: "#FF9F45" }}>&lt;/script&gt;</div>
            <div style={{ color: "#6E6890" }}>&lt;!-- End ConsentBit banner --&gt;</div>
          </div>

          {/* Add-to-Webflow row: action + instructions on the left, screenshot on the right */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 12, alignItems: "center" }}>
            <div>
              <a href={customCodeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
                Open Webflow custom code
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}><path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
              <div style={{ color: "var(--text-muted)", fontSize: 11, lineHeight: 1.5, marginTop: 10 }}>
                Paste it right after the opening <code className="mono" style={{ background: "var(--purple-soft)", padding: "1px 5px", borderRadius: 4, color: "var(--purple-hi)" }}>&lt;head&gt;</code> tag in your site's source code. Refer to our <a href="https://help.webflow.com/hc/en-us/articles/33961356296723-Custom-code-in-head-and-body-tags" target="_blank" rel="noopener noreferrer" style={{ color: "var(--purple-hi)", textDecoration: "none" }}>platform-wise guides</a> for instructions.
              </div>
               <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: 14, padding: "10px", height: "auto", fontSize: 13, fontWeight: 600 }}
            disabled={publishing}
            onClick={handlePublish}
          >
            {legacy.removing ? "Removing old code…" : publishing ? "Publishing…" : "Publish"}
          </button>
            </div>
            <WImageZoom
              src={window.__resources && window.__resources.webflowHeadcode || "assets/webflow-headcode.png"}
              alt="Webflow head code panel"
              style={{ display: "block", width: "100%", minHeight: 150, maxHeight: 200, objectFit: "cover", objectPosition: "top", borderRadius: 8, border: "1px solid var(--border)", boxShadow: "0 8px 18px rgba(0,0,0,0.3)" }}
            />
          </div>

          {/* Publish → publishes the site, then verifies the banner is live. */}
         
        </div>
      </div>

      {/* Domain selection — only when the site has custom domain(s) as well as staging. */}
      {domainChoice &&
      <div onClick={() => setDomainChoice(null)} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(8,6,20,0.65)", backdropFilter: "blur(2px)", display: "grid", placeItems: "center", padding: 20 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: 380, maxWidth: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 22, boxShadow: "0 24px 60px rgba(0,0,0,0.55)" }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Where do you want to publish?</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 16 }}>Select the domains to publish your site to.</div>

          <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9, border: "1px solid " + (selSub ? "var(--purple)" : "var(--border)"), marginBottom: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={selSub} onChange={() => setSelSub((v) => !v)} />
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>Webflow staging</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", wordBreak: "break-all" }}>{domainChoice.subdomain || "*.webflow.io"}</div>
            </div>
          </label>

          {domainChoice.customDomains.map((d) => (
            <label key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9, border: "1px solid " + (selIds.includes(d.id) ? "var(--purple)" : "var(--border)"), marginBottom: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={selIds.includes(d.id)} onChange={() => toggleId(d.id)} />
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>Custom domain</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", wordBreak: "break-all" }}>{d.url || d.name || d.id}</div>
              </div>
            </label>
          ))}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setDomainChoice(null)}>Cancel</button>
            <button className="btn btn-primary btn-sm" disabled={publishing || nothingSelected} onClick={() => doPublishAndVerify({ publishToWebflowSubdomain: selSub, customDomains: selIds })}>
              {publishing ? "Publishing…" : "Publish"}
            </button>
          </div>
        </div>
      </div>
      }

      {showPopup &&
      <WVerifyModal
        mode={verifyMode}
        previewUrl={siteUrl}
        onClose={() => setShowPopup(false)}
        onPrimary={() => {
          setShowPopup(false);
          if (verifyMode === "error" || verifyMode === "unpublished") {
            handlePublish(); // "Retry"
          } else if (nav && nav.goToApp) {
            nav.goToApp(); // "Customize banner" → go to the customization editor
          }
        }}
      />
      }
    </WAuthShell>);

}

export { WInstallVerify };
