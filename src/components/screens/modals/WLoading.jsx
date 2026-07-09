import React from "react";
import { WPage } from "../../kit/WPage.jsx";
import { WLogo } from "../../kit/WLogo.jsx";
import "./WLoading.css";

// Launch loading screen — the ConsentBit logo above a centered spinner. No top bar
// or tabs, so nothing flashes/leaks before the status call resolves and routes the app.
function WLoading() {
  return (
    <WPage scroll={false}>
      <div className="cb-loading-stage">
        <WLogo size="lg" />
        <svg width="48" height="48" viewBox="0 0 56 56">
          <circle cx="28" cy="14" r="4" fill="#7C5CFC"><animate attributeName="opacity" values="1;.3;1" dur="1s" begin="0s" repeatCount="indefinite" /></circle>
          <circle cx="40" cy="28" r="4" fill="#8E72FF"><animate attributeName="opacity" values="1;.3;1" dur="1s" begin="0.2s" repeatCount="indefinite" /></circle>
          <circle cx="28" cy="42" r="4" fill="#A78BFA"><animate attributeName="opacity" values="1;.3;1" dur="1s" begin="0.4s" repeatCount="indefinite" /></circle>
          <circle cx="16" cy="28" r="4" fill="#7C5CFC"><animate attributeName="opacity" values="1;.3;1" dur="1s" begin="0.6s" repeatCount="indefinite" /></circle>
        </svg>
      </div>
    </WPage>);

}

export { WLoading };
