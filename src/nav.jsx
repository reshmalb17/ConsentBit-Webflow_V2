import React from "react";

// App navigation shared via context so the tab bars (WMainTabs, WEdShell's
// section tabs) can switch screens without threading callbacks through every
// screen component. Returns null when there's no provider (e.g. the gallery or
// WPublish render the tab bars standalone) — callers fall back to their static
// `active` prop in that case.
const NavContext = React.createContext(null);

function useNav() {
  return React.useContext(NavContext);
}

export { NavContext, useNav };
