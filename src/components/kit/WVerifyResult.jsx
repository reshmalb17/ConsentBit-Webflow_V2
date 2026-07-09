import React from "react";
import { WInstallVerify } from "../screens/auth/WInstallVerify.jsx";
import { WVerifyModal } from "./WVerifyModal.jsx";
import "./WVerifyResult.css";

// Gallery screen: the Install & verify page WITH the result modal layered on
// top. The modal markup lives in WVerifyModal so the live flow (WInstallVerify)
// can reuse it without re-rendering the page behind it.
function WVerifyResult({ mode }) {
  return (
    <div className="cb-verify-result">
      <WInstallVerify />
      <WVerifyModal mode={mode} position="absolute" />
    </div>);

}

export { WVerifyResult };
