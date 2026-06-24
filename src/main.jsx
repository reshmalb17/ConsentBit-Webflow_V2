import React from "react";
import { createRoot } from "react-dom/client";

import "./styles/styles.css";
import "./styles/widget-styles.css";
import "./styles/gallery.css";

// Bundled assets — exposed where the components look for them.
import logo from "./assets/logo.svg";
import logoIcon from "./assets/logo-icon.svg";
import webflowHeadcode from "./assets/webflow-headcode.png";
import webflowPublish from "./assets/webflow-publish.png";

window.__resources = { logo, logoIcon, webflowHeadcode, webflowPublish };

import App from "./App.jsx";
import AppExtension from "./AppExtension.jsx";

// The Designer Extension bundle opens straight to the Landing screen.
// Set VITE_GALLERY=1 (see .env.development) to render the full screen gallery
// instead — used for design review via `npm run dev`.
const showGallery = import.meta.env.VITE_GALLERY === "1";

createRoot(document.getElementById("root")).render(
  showGallery ? <App /> : <AppExtension />
);
