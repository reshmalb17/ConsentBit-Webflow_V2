import React from "react";
import { Toggle } from "../primitives/Toggle.jsx";

function WEdRow({ label, on = false, checked, onChange }) {
  const controlled = checked !== undefined;
  const [localOn, setLocalOn] = React.useState(on);
  const value = controlled ? checked : localOn;
  const toggle = () => (controlled ? onChange(!value) : setLocalOn((v) => !v));
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid var(--border)", width: "270px" }}>
      <div style={{ fontSize: 12.5 }}>{label}</div>
      <Toggle on={value} onClick={toggle} />
    </div>);

}

export { WEdRow };
