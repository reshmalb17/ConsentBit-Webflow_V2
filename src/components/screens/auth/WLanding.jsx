import React from "react";
import "./WLanding.css";
import { WPage } from "../../kit/WPage.jsx";
import { WSteps } from "../../kit/WSteps.jsx";
import { startWebflowInstall } from "../../../lib/webflowAuth.js";

function WLanding({ onAuthorize }) {
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
          <button className="btn btn-primary btn-lg cb-landing-btn" onClick={onAuthorize }>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="cb-landing-btn-icon"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
            Authorize
          </button>
          <div className="cb-landing-note">Secure connection · You can revoke access anytime</div>
        </div>
      </div>
    </WPage>);

}

export { WLanding };
