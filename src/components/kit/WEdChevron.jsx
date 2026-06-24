import React from "react";

function WEdChevron({ up }) {
  return (
    <span className="material-symbols-rounded" style={{ fontSize: 18, color: "var(--text-muted)", transform: up ? "rotate(180deg)" : "none" }}>
      expand_more
    </span>);

}

export { WEdChevron };
