import React from "react";
import { WProGate } from "./WProGate.jsx";

// Consent-template dropdown with a plan gate, shared by the General and Content tabs.
//
// A plain native <select> — same control the rest of the app uses, so the option list
// is drawn by the OS and looks exactly like every other dropdown here. The trade-off
// is that native options can't report hover, so the gate fires on SELECTION: picking
// the gated value is refused and opens the "Upgrade to Pro" popover beside the
// control. Because the <select> is controlled, refusing to update state snaps the
// dropdown back to its previous value.
//
// `options`     [{ value, label }]
// `gatedValue`  the value that requires a plan (null = nothing gated)
// `gateAllowed` whether the current plan may pick `gatedValue`
function WTemplateSelect({ value, onChange, options, disabled = false, gatedValue = null, gateAllowed = true, className = "" }) {
  const selectRef = React.useRef(null);
  const [gateOpen, setGateOpen] = React.useState(false);

  const onSelect = (e) => {
    const next = e.target.value;
    if (next === gatedValue && !gateAllowed) {
      // Anchor to the control itself — the popover sits to its right and tracks it.
      setGateOpen(true);
      return;
    }
    setGateOpen(false);
    onChange(next);
  };

  return (
    <>
      <select
        ref={selectRef}
        className={"select" + (className ? " " + className : "")}
        disabled={disabled}
        value={value}
        onChange={onSelect}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <WProGate open={gateOpen} anchorRef={selectRef} onClose={() => setGateOpen(false)} />
    </>
  );
}

export { WTemplateSelect };
