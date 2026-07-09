import React from "react";
import { WMainTabs } from "../../kit/WMainTabs.jsx";
import { WPage } from "../../kit/WPage.jsx";
import { WTopBar } from "../../kit/WTopBar.jsx";
import "./WPublish.css";

function WPublish() {
  return (
    <WPage scroll={false}>
      <WTopBar />
      <WMainTabs active="cookie" left />
      <div className="cb-publish-stage">
        <div className="cb-publish-backdrop" />
        <div className="cb-publish-card">
          <div className="cb-publish-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <div className="cb-publish-title">Changes Published</div>
          <div className="cb-publish-desc">
            Your cookie banner is now live on <b className="cb-publish-domain">acne.com</b>.
          </div>
          <div className="cb-publish-actions">

            <button className="btn btn-primary btn-sm">Customize banner</button>
             <button className="btn btn-secondary btn-sm">View on site<svg width="11" height="11" viewBox="0 0 24 24" fill="none" className="cb-publish-ext-icon"><path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
          </div>
        </div>
      </div>
    </WPage>);

}

// External / hosted page — distinct light "browser" treatment so it reads as off-app

export { WPublish };
