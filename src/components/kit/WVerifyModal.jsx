import React from "react";

// The verification-result modal (success / error): just the dim backdrop and
// the centered card. It deliberately does NOT include the page behind it — it
// renders ON TOP of whatever screen is already showing (e.g. WInstallVerify),
// so embedding the page here would recurse.
//
// position: "fixed" (default) covers the whole panel — used in the live flow.
// position: "absolute" covers the nearest positioned ancestor — used by
// WVerifyResult in the gallery (which wraps it in a relative container).
function WVerifyModal({ mode = "success", position = "fixed", onClose, onPrimary, previewUrl }) {
  const error = mode === "error";
  const unpublished = mode === "unpublished";
  // The "publish your site first" popup — shown when the Webflow site has no
  // published domain yet (so there's nothing live to verify against).
  if (unpublished) {
    return (
      <div
        onClick={onClose}
        style={{ position, inset: 0, zIndex: 50, background: "rgba(8,6,20,0.72)", backdropFilter: "blur(2px)", display: "grid", placeItems: "center", padding: 20 }}>
        <div
          className="card"
          onClick={(e) => e.stopPropagation()}
          style={{ width: 360, maxWidth: "100%", padding: 24, textAlign: "center", background: "var(--surface)", boxShadow: "0 24px 60px rgba(0,0,0,0.55)" }}>
          <div style={{ width: 56, height: 56, borderRadius: 999, margin: "0 auto 16px", display: "grid", placeItems: "center", background: "rgba(124,92,252,0.14)", color: "var(--purple-hi)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Publish your site first</div>
          <div style={{ color: "var(--text-muted)", fontSize: 12.5, lineHeight: 1.55, marginBottom: 22 }}>
            Your site isn't published yet, so there's no live page to check. Publish your site in the Webflow Designer, then come back and click Verify.
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }} onClick={onPrimary || onClose}>
            Got it
          </button>
        </div>
      </div>);
  }
  return (
    <div
      onClick={onClose}
      style={{ position, inset: 0, zIndex: 50, background: "rgba(8,6,20,0.72)", backdropFilter: "blur(2px)", display: "grid", placeItems: "center", padding: 20 }}>
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 360, maxWidth: "100%", padding: 24, textAlign: "center", background: "var(--surface)", boxShadow: "0 24px 60px rgba(0,0,0,0.55)" }}>
        {/* icon */}
        <div style={{
          width: 56, height: 56, borderRadius: 999, margin: "0 auto 16px",
          display: "grid", placeItems: "center",
          background: error ? "rgba(244,159,69,0.14)" : "var(--green-soft)",
          color: error ? "#F49F45" : "#5AE497"
        }}>
          {error ?
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /></svg> :
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          }
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
          {error ? "We couldn't verify your banner" : "Verification successful 🎉"}
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: 12.5, lineHeight: 1.55, marginBottom: 22 }}>
          {error ?
          "We loaded your site but couldn't find the ConsentBit script in your site's <head>. Make sure you've added the code and re-published your site, then try again." :
          "Your banner code is installed and firing correctly. Now let's customize your banner further."}
        </div>
        <button className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center", marginBottom: 12 }} onClick={onPrimary}>
          {error ? "Retry verification" : "Customize banner"}
        </button>
        {!error && previewUrl &&
        <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-lg" style={{ width: "100%", justifyContent: "center", marginBottom: 12, textDecoration: "none" }}>
          Preview in site
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 5, flexShrink: 0 }}><path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </a>
        }
      </div>
    </div>);

}

export { WVerifyModal };
