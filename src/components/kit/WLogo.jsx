import React from "react";

function WLogo({ size = "sm" }) {
  const h = size === "lg" ? 24 : 18;
  return (
    <img src={window.__resources && window.__resources.logo || "assets/logo.svg"} alt="ConsentBit" style={{ height: h, display: "block" }} />);

}

export { WLogo };
