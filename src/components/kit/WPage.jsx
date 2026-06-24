import React from "react";

function WPage({ children, scroll = true, style = {}, className = "" }) {
  return (
    <div className={"cb-app" + (className ? " " + className : "")} style={{
      width: "100%", flex: 1, minHeight: 0,
      overflow: scroll ? "auto" : "hidden", ...style, justifyContent: "flex-start", alignItems: "stretch", height: "1005px"
    }}>{children}</div>);

}

// ---------- AUTH ----------

export { WPage };
