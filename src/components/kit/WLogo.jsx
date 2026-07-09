import React from "react";
import "./WLogo.css";

function WLogo({ size = "sm" }) {
  const h = size === "lg" ? 24 : 18;
  return (
    <img src={window.__resources && window.__resources.logo || "assets/logo.svg"} alt="ConsentBit" className="cb-logo" style={{ height: h }} />);

}

export { WLogo };
