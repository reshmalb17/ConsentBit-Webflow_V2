import React from "react";
import "./WLanding.css";
import { WPage } from "../../kit/WPage.jsx";
import { WSteps } from "../../kit/WSteps.jsx";
import { startWebflowInstall, readWebflowOAuthResult } from "../../../lib/webflowAuth.js";
import { getWebflowSiteContext, getWebflowSiteStatus } from "../../../lib/api.js";

// Authorization happens on webflow.com, in another tab — the consent screen can't load
// inside the Designer iframe. Nothing is posted back to this app when it finishes, so
// after opening it we poll our own status endpoint until the site reports `authorized`,
// then move on. Previously this button only advanced the screen: the OAuth flow was never
// started, so a site that wasn't already authorized could never become authorized here.
const POLL_MS = 2000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

function WLanding({ onAuthorize }) {
  const [waiting, setWaiting] = React.useState(false);
  const [error, setError] = React.useState("");
  const pollRef = React.useRef(null);
  const stoppedRef = React.useRef(false);

  React.useEffect(() => () => { stoppedRef.current = true; clearTimeout(pollRef.current); }, []);

  const pollUntilAuthorized = React.useCallback((startedAt) => {
    clearTimeout(pollRef.current);
    pollRef.current = setTimeout(async () => {
      if (stoppedRef.current) return;
      try {
        const { wfSiteId } = await getWebflowSiteContext();
        if (wfSiteId) {
          const status = await getWebflowSiteStatus(wfSiteId);
          if (stoppedRef.current) return;
          if (status?.authorized) { setWaiting(false); onAuthorize?.(status); return; }
        }
      } catch { /* keep waiting — the other tab may still be open */ }
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        setWaiting(false);
        setError("We haven't seen the authorization come through yet. Finish it in the other tab, then click Authorize again.");
        return;
      }
      pollUntilAuthorized(startedAt);
    }, POLL_MS);
  }, [onAuthorize]);

  // Standalone (non-iframe) flow: Webflow redirects back here with ?webflow_oauth=success.
  React.useEffect(() => {
    const result = readWebflowOAuthResult();
    if (result?.status === "success") { setWaiting(true); pollUntilAuthorized(Date.now()); }
    else if (result?.status === "error") setError(result.error || "Authorization was cancelled or failed.");
  }, [pollUntilAuthorized]);

  const handleAuthorize = () => {
    setError("");
    // No pop-up-blocked branch: window.open returns null whenever "noopener" is passed
    // (required by Webflow review), so its result cannot tell a blocked tab from a
    // successful one — any such message would be wrong half the time.
    startWebflowInstall();
    setWaiting(true);
    pollUntilAuthorized(Date.now());
  };

  return (
    <WPage scroll={false} className="cb-landing-page">
      <div className="w-auth-center cb-landing-center">
        <div className="cb-landing-inner">
          <div className="cb-landing-logo">
            <img src={window.__resources && window.__resources.logoIcon || "assets/logo-icon.svg"} alt="ConsentBit" className="cb-landing-logo-img" />
          </div>
          <div className="cb-landing-title">Welcome to ConsentBit 👋</div>
          <div className="cb-landing-desc">
            Let's get your Webflow site compliant. Authorize ConsentBit to access your project so we can detect the cookies and third-party scripts it loads, then help you set up a consent banner in minutes.
          </div>
          <WSteps step={1} labels={["Authorize", "Choose plan", "Install & verify"]} />
          <button className="btn btn-primary btn-lg cb-landing-btn" onClick={handleAuthorize} disabled={waiting}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="cb-landing-btn-icon"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
            {waiting ? "Waiting for authorization…" : "Authorize"}
          </button>
          {waiting &&
            <div className="cb-landing-note">Finish authorizing in the tab that just opened — this screen continues on its own.</div>
          }
          {error && <div className="cb-landing-error" role="alert">{error}</div>}
          <div className="cb-landing-disclosure">
            By continuing, you agree that ConsentBit will receive your email address, Webflow site ID, and published site URL(s) — used to create your account and email your verification code. See our <a href="https://www.consentbit.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="cb-landing-privacy-link">Privacy Policy</a>.
          </div>
        </div>
      </div>
    </WPage>);

}

export { WLanding };
