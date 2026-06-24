import React from "react";

function Radio({ on, onClick }) {
  return <span onClick={onClick} role={onClick ? "radio" : undefined} aria-checked={onClick ? !!on : undefined} className={"radio " + (on ? "on" : "")} style={onClick ? { cursor: "pointer" } : undefined}></span>;
}

export { Radio };
