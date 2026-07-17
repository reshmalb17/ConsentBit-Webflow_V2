import React from "react";
import "./WInstallVerify.css";
import { WAuthShell } from "../../kit/WAuthShell.jsx";
import { Icon } from "../../lib/icons.jsx";
import { WVerifyModal } from "../../kit/WVerifyModal.jsx";
import { verifyInstallation, getWebflowSiteContext, getWebflowSiteStatus, getLegacyScriptStatus, removeLegacyScripts, trackWebflowEvent } from "../../../lib/api.js";
import { isTrustedScriptUrl } from "../../../lib/scriptUrl.js";
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
          // Only trust a script URL on a ConsentBit-controlled host — never place an
          // unexpected backend-provided URL into the install snippet (integrity guard).
          if (!cancelled && isTrustedScriptUrl(status?.scriptUrl)) setScriptUrl(status.scriptUrl);
          const ls = await getLegacyScriptStatus(wfSiteId);
          // Already upgraded — the current-version script is in the head. During
          // onboarding there's nothing to install, so skip this screen and go to
          // the app. But when the user explicitly opened Install & verify from the
          // app (installVerifyFromApp), don't yank them away — they came here on
          // purpose (e.g. to re-verify), so keep them on the page.
          if (!cancelled && ls.hasCurrent && !nav?.installVerifyFromApp) { nav?.goToApp?.(); return; }
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
      await navigator.clipboard.writeText(installCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
      // installation_code_copied — funnel step 4. Sent via the first-party /track endpoint
      // (the worker emits it to PostHog server-side). script_id is parsed from the URL.
      const scriptId = (String(scriptUrl || "").match(/\/(?:consentbit|client_data)\/([^/]+)\/script\.js/) || [])[1] || null;
      trackWebflowEvent("installation_code_copied", { script_id: scriptId });
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
      // The publish is tracked server-side (banner_changes_published in the publish
      // handler) — no client analytics here.
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
      <div className="cb-install-wrap">
        {/* Back to customization — only when this page was opened from the editor. */}
        {nav && nav.installVerifyFromApp && nav.goToApp &&
          <button
            onClick={() => nav.goToApp()}
            className="cb-install-back-btn"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back to customization
          </button>
        }
        {/* Any old previous-version ConsentBit script is removed silently as the
            first step of Publish (see ensureLegacyRemoved in handlePublish) — no
            heads-up is shown. If a hard failure occurs, surface just the error. */}
        {legacy.error &&
          <div className="card cb-install-error-card">
            <div className="cb-install-error-text">{legacy.error}</div>
          </div>
        }
        <div className="card cb-install-main-card">
          {/* Heading + Copy button */}
          <div className="cb-install-head-row">
            <div className="cb-install-head-title">Copy this banner installation code</div>
            <button className="btn btn-secondary btn-sm cb-install-copy-btn" onClick={copyCode}>
              <Icon.copy />{copied ? "Copied ✓" : "Copy"}
            </button>
          </div>

          {/* Code block — line breaks match the design: opening tag, indented src
              (closing with >), then </script> on its own line. */}
          <div className="mono cb-install-code-block">
            <div className="cb-install-code-comment">&lt;!-- Start ConsentBit banner --&gt;</div>
            <div>
              <span className="cb-install-code-tag">&lt;script </span>
              <span className="cb-install-code-attr">id="consentbit" type="text/javascript"</span>
            </div>
            <div>
              <span className="cb-install-code-attr">{`  src="${scriptUrl || "loading…"}"`}</span>
              <span className="cb-install-code-tag">&gt;</span>
            </div>
            <div className="cb-install-code-tag">&lt;/script&gt;</div>
            <div className="cb-install-code-comment">&lt;!-- End ConsentBit banner --&gt;</div>
          </div>

          {/* Add-to-Webflow row: action + instructions on the left, screenshot on the right */}
          <div className="cb-install-row">
            <div>
              <a href={customCodeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm cb-install-open-link">
                Open Webflow custom code
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="cb-install-ext-icon"><path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
              <div className="cb-install-paste-note">
                Paste it right after the opening <code className="mono cb-install-code-inline">&lt;head&gt;</code> tag in your site's source code. Refer to our <a href="https://help.webflow.com/hc/en-us/articles/33961356296723-Custom-code-in-head-and-body-tags" target="_blank" rel="noopener noreferrer" className="cb-install-link">platform-wise guides</a> for instructions.
              </div>
              <button
                className="btn btn-primary cb-install-publish-btn"
                disabled={publishing}
                onClick={handlePublish}
              >
                {legacy.removing ? "Removing old code…" : publishing ? "Publishing…" : "Publish"}
              </button>
            </div>
            <div className="cb-install-shot">
              <img
                src={window.__resources && window.__resources.webflowHeadcode || "assets/webflow-headcode.png"}
                alt="Webflow head code panel"
                className="cb-install-shot-img"
              />
            </div>
          </div>

          {/* Publish → publishes the site, then verifies the banner is live. */}
         
        </div>
      </div>

      {/* Domain selection — only when the site has custom domain(s) as well as staging. */}
      {domainChoice &&
      <div onClick={() => setDomainChoice(null)} className="cb-install-domain-overlay">
        <div onClick={(e) => e.stopPropagation()} className="cb-install-domain-card">
          <div className="cb-install-domain-title">Where do you want to publish?</div>
          <div className="cb-install-domain-sub">Select the domains to publish your site to.</div>

          <label className="cb-install-domain-option" style={{ border: "1px solid " + (selSub ? "var(--purple)" : "var(--border)") }}>
            <input type="checkbox" checked={selSub} onChange={() => setSelSub((v) => !v)} />
            <div>
              <div className="cb-install-domain-opt-title">Webflow staging</div>
              <div className="cb-install-domain-opt-sub">{domainChoice.subdomain || "*.webflow.io"}</div>
            </div>
          </label>

          {domainChoice.customDomains.map((d) => (
            <label key={d.id} className="cb-install-domain-option" style={{ border: "1px solid " + (selIds.includes(d.id) ? "var(--purple)" : "var(--border)") }}>
              <input type="checkbox" checked={selIds.includes(d.id)} onChange={() => toggleId(d.id)} />
              <div>
                <div className="cb-install-domain-opt-title">Custom domain</div>
                <div className="cb-install-domain-opt-sub">{d.url || d.name || d.id}</div>
              </div>
            </label>
          ))}

          <div className="cb-install-domain-actions">
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
