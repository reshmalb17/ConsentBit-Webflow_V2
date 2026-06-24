import React from "react";
import { Radio } from "./Radio.jsx";
import { Toggle } from "./Toggle.jsx";

function Page({width = 1280, height = 820, children, scroll = false, style = {}}) {
  return (
    <div className="cb-app" style={{width, height, overflow: scroll ? "auto" : "hidden", ...style}}>
      {children}
    </div>
  );
}

// Toggle, Radio

export { Page };
