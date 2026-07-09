import React from "react";
import { createRoot } from "react-dom/client";

import "./styles/styles.css";
import "./styles/widget-styles.css";
import "./styles/gallery.css";

// Bundled assets — exposed where the components look for them.
import logo from "./assets/logo.svg";
import logoIcon from "./assets/logo-icon.svg";
import webflowHeadcode from "./assets/Head-section.png";
import webflowPublish from "./assets/webflow-publish.png";

window.__resources = { logo, logoIcon, webflowHeadcode, webflowPublish };

import AppExtension from "./AppExtension.jsx";

const root = createRoot(document.getElementById("root"));

// Production renders the Designer Extension directly. The full-screen design gallery
// (App.jsx) is a dev-only aid — it's dynamically imported behind a build-time flag so
// it, and its demo/mock install snippets, are tree-shaken OUT of the production bundle.
if (import.meta.env.VITE_GALLERY === "1") {
  import("./App.jsx").then(({ default: App }) => root.render(<App />));
} else {
  root.render(<AppExtension />);
}
