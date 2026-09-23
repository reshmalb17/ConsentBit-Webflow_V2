import React from "react";

function Checkbox({ on, onClick }) {
  return <span onClick={onClick} role={onClick ? "checkbox" : undefined} aria-checked={onClick ? !!on : undefined} className={"checkbox " + (on ? "on" : "")} style={onClick ? { cursor: "pointer" } : undefined}></span>;
}

export { Checkbox };
