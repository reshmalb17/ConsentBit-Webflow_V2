import React from "react";
import { NavContext } from "./nav.jsx";

// --- Auth onboarding flow (disabled for now) -------------------------------
import { WLanding } from "./components/screens/auth/WLanding.jsx";
import { WSelectPlan } from "./components/screens/auth/WSelectPlan.jsx";
import { WInstallVerify } from "./components/screens/auth/WInstallVerify.jsx";
// ---------------------------------------------------------------------------

// Main app screens
import { WEdGeneral } from "./components/screens/app/WEdGeneral.jsx";
import { WEdContent } from "./components/screens/app/WEdContent.jsx";
import { WEdLayout } from "./components/screens/app/WEdLayout.jsx";
import { WEdColors } from "./components/screens/app/WEdColors.jsx";
import { WEdType } from "./components/screens/app/WEdType.jsx";
import { WScan } from "./components/screens/app/WScan.jsx";
import { WConsentLogs } from "./components/screens/app/WConsentLogs.jsx";
import { WUpgrade } from "./components/screens/upgrade/WUpgrade.jsx";
import { WProfile } from "./components/screens/profile/WProfile.jsx";
import { WNotificationsPanel } from "./components/kit/WNotificationsPanel.jsx";

// What the Webflow Designer Extension panel renders: the main app, opening on
// the Cookie Banner editor (General tab). The top tab bar (WMainTabs) and the
// section tabs (WEdShell) switch screens via NavContext.
export default function AppExtension() {
  const inDesigner = typeof window !== "undefined" && !!window.webflow;

  const [mainTab, setMainTab] = React.useState("cookie"); // cookie | scan | logs | upgrade
  const [subTab, setSubTab] = React.useState("general");  // general | content | layout | colors | type
  const [profileOpen, setProfileOpen] = React.useState(false); // avatar -> Profile Settings
  const [notifOpen, setNotifOpen] = React.useState(false);     // bell -> Notifications
  const [template, setTemplate] = React.useState("CCPA+GDPR"); // consent template -> preview regions
  const [iab, setIab] = React.useState(false);                 // IAB TCF -> preview shows IAB banner
  const [gac, setGac] = React.useState(false);                 // Google Additional Consent -> Vendors > Google Partners
  const [bannerPos, setBannerPos] = React.useState("box");     // Layout: box | banner | popup
  const [bannerAlign, setBannerAlign] = React.useState("left"); // Layout: left | right (box only)

 // --- Auth onboarding flow (disabled for now) -----------------------------
  // const [screen, setScreen] = React.useState("landing");
  // const current =
  //   screen === "install-verify" ? (
  //     <WInstallVerify />
  //   ) : screen === "select-plan" ? (
  //     <WSelectPlan onSelectPlan={() => setScreen("install-verify")} />
  //   ) : (
  //     <WLanding onAuthorize={() => setScreen("select-plan")} />
  //   );
  //-------------------------------------------------------------------------

  // // Cookie Banner editor — pick the screen for the active section tab.
  const editor =
    subTab === "content" ? <WEdContent /> :
    subTab === "layout" ? <WEdLayout /> :
    subTab === "colors" ? <WEdColors /> :
    subTab === "type" ? <WEdType /> :
    <WEdGeneral />;

  // // Top-level tab → screen.
  const main =
    mainTab === "scan" ? <WScan /> :
    mainTab === "logs" ? <WConsentLogs /> :
    mainTab === "upgrade" ? <WUpgrade /> :
    editor;

  // The avatar opens Profile Settings (full screen). Notifications is a
  // dropdown that floats ABOVE the current screen — handled in `app` below so
  // the background tab content stays visible.
  const current = profileOpen ? <WProfile /> : main;

  React.useEffect(() => {
    // Size the Designer panel to the design's 800×560 (Designer-only API —
    // a no-op in a normal browser).
    try {
      window.webflow?.setExtensionSize?.({ width: 800, height: 560 });
    } catch {
      try {
        window.webflow?.setExtensionSize?.("large");
      } catch {
        /* not running inside the Designer */
      }
    }
  }, []);

  const app = (
    <NavContext.Provider value={{ mainTab, setMainTab, subTab, setSubTab, profileOpen, setProfileOpen, notifOpen, setNotifOpen, template, setTemplate, iab, setIab, gac, setGac, bannerPos, setBannerPos, bannerAlign, setBannerAlign }}>
      <div style={{ position: "relative", height: "100%" }}>
        {current}
        {notifOpen &&
        <>
          {/* click-away backdrop (transparent) — closes the dropdown */}
          <div onClick={() => setNotifOpen(false)} style={{ position: "absolute", inset: 0, zIndex: 60 }} />
          {/* dropdown floats above the current screen, anchored near the bell */}
          <div style={{ position: "absolute", top: 8, right: 12, zIndex: 61 }}>
            <WNotificationsPanel />
          </div>
        </>
        }
      </div>
    </NavContext.Provider>
  );

  const panel = (
    <div className="cb-ext">
      <div className="cb-widget-wrap">
        {app}
      </div>
    </div>
  );

  // In the Designer the host sizes the panel (fills it). In a plain browser
  // (npm run dev) there's no host, so frame it to the real 800×560 to preview
  // exactly what the panel will look like.
  if (inDesigner) return panel;

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div
        className="cb-ext"
        style={{
          width: 800,
          height: 560,
          boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
          borderRadius: 12,
          overflow: "hidden",
        }}>
        <div className="cb-widget-wrap">
          {app}
        </div>
      </div>
    </div>
  );
}
