import React from "react";
import "./WEdRow.css";
import { Toggle } from "../primitives/Toggle.jsx";

function WEdRow({ label, on = false, checked, onChange }) {
  const controlled = checked !== undefined;
  const [localOn, setLocalOn] = React.useState(on);
  const value = controlled ? checked : localOn;
  const toggle = () => (controlled ? onChange(!value) : setLocalOn((v) => !v));
  return (
    <div className="cb-edrow-row">
      <div className="cb-edrow-label">{label}</div>
      <Toggle on={value} onClick={toggle} />
    </div>);

}

export { WEdRow };
