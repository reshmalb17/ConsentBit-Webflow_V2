import React from "react";
import { Toggle } from "../primitives/Toggle.jsx";

function WEdRow({ label, on = false }) {
  const [checked, setChecked] = React.useState(on);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid var(--border)", width: "270px" }}>
      <div style={{ fontSize: 12.5 }}>{label}</div>
      <Toggle on={checked} onClick={() => setChecked((v) => !v)} />
    </div>);

}

export { WEdRow };
