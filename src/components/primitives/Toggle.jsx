import React from "react";

function Toggle({ on, onClick }) {
  return <span onClick={onClick} role={onClick ? "switch" : undefined} aria-checked={onClick ? !!on : undefined} className={"toggle " + (on ? "on" : "")} style={onClick ? { cursor: "pointer" } : undefined}></span>;
}

export { Toggle };
