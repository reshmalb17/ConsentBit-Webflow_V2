import React from "react";
import { HelpQ } from "./HelpQ.jsx";

function Field({label, children, help = true, accent = false}) {
  return (
    <div style={{marginBottom: 18}}>
      <div className={"field-label " + (accent ? "purple-title" : "")} style={accent ? {color: "var(--purple-hi)", fontWeight: 500} : {}}>
        {label} {help && <HelpQ />}
      </div>
      {children}
    </div>
  );
}

export { Field };
