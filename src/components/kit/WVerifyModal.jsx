import React from "react";
import "./modal.css";

// The verification-result modal (success / error): just the dim backdrop and
// the centered card. It deliberately does NOT include the page behind it — it
// renders ON TOP of whatever screen is already showing (e.g. WInstallVerify),
// so embedding the page here would recurse.
//
// position: "fixed" (default) covers the whole panel — used in the live flow.
// position: "absolute" covers the nearest positioned ancestor — used by
// WVerifyResult in the gallery (which wraps it in a relative container).
// Static chrome lives in modal.css; only the dynamic `position` prop stays inline.
function WVerifyModal({ mode = "success", position = "fixed", onClose, onPrimary, previewUrl }) {
  const error = mode === "error";
  const unpublished = mode === "unpublished";
  // The "publish your site first" popup — shown when the Webflow site has no
  // published domain yet (so there's nothing live to verify against).
  if (unpublished) {
    return (
      <div className="cb-modal-overlay" onClick={onClose} style={{ position }}>
        <div className="card cb-modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="cb-modal-icon cb-modal-icon--info">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></svg>
          </div>
          <div className="cb-modal-title">Publish your site first</div>
          <div className="cb-modal-text">
            Your site isn't published yet, so there's no live page to check. Publish your site in the Webflow Designer, then come back and click Verify.
          </div>
          <button className="btn btn-primary btn-lg cb-modal-btn" onClick={onPrimary || onClose}>
            Got it
          </button>
        </div>
      </div>);
  }
  return (
    <div className="cb-modal-overlay" onClick={onClose} style={{ position }}>
      <div className="card cb-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* icon */}
        <div className={"cb-modal-icon " + (error ? "cb-modal-icon--error" : "cb-modal-icon--success")}>
          {error ?
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /></svg> :
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          }
        </div>
        <div className="cb-modal-title">
          {error ? "We couldn't verify your banner" : "Verification successful 🎉"}
        </div>
        <div className="cb-modal-text">
          {error ?
          "We loaded your site but couldn't find the ConsentBit script in your site's <head>. Make sure you've added the code and re-published your site, then try again." :
          "Your banner code is installed and firing correctly. Now let's customize your banner further."}
        </div>
        <button className="btn btn-primary btn-lg cb-modal-btn--stacked" onClick={onPrimary}>
          {error ? "Retry verification" : "Customize banner"}
        </button>
        {!error && previewUrl &&
        <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-lg cb-modal-link">
          Preview in site
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="cb-modal-link-ic"><path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </a>
        }
      </div>
    </div>);

}

export { WVerifyModal };
