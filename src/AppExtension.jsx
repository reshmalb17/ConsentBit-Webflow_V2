import React from "react";
import { NavContext } from "./nav.jsx";
import { localization, editorDefaults, preferenceBanner, prefCategories, ccpaBanner } from "./lib/bannerContent.js";

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
import { WLoading } from "./components/screens/modals/WLoading.jsx";
import { WPaymentProcessing } from "./components/screens/modals/WPaymentProcessing.jsx";
import { getWebflowSiteContext, getWebflowSiteStatus, getPaymentSubscription, getBannerCustomization } from "./lib/api.js";
import { mapCustomizationToState } from "./lib/loadCustomization.js";

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
  const [bannerRadius, setBannerRadius] = React.useState(12);   // Layout: border radius (max 25)
  const [bannerAnim, setBannerAnim] = React.useState("fade-in"); // Layout: fade-in | slide-up | slide-down | zoom-in
  const [bannerBtnRadius, setBannerBtnRadius] = React.useState(4); // Layout: button border radius (max 24)
  const [bannerContent, setBannerContent] = React.useState({     // Content tab -> preview banner text
    title: localization.English.title,
    message: localization.English.message,
    accept: localization.English.accept,
    reject: editorDefaults.default.rejectLabel,
    customize: editorDefaults.default.customizeLabel,
    policy: editorDefaults.default.policyLinkLabel,
    policyUrl: editorDefaults.default.policyUrl,
  });
  const [prefContent, setPrefContent] = React.useState({         // Content tab -> preference modal text
    title: preferenceBanner.title,
    overview: preferenceBanner.overview,
    save: preferenceBanner.buttons.save,
    alwaysActive: "Always Active",
    cats: prefCategories.map((c) => ({ name: c.l, desc: c.desc, always: !!c.always })),
  });
  const [closeBtn, setCloseBtn] = React.useState(false);         // Content: show the close (X) icon
  const [activeRegion, setActiveRegion] = React.useState("GDPR"); // preview region (GDPR | CCPA) — drives the Content editor too
  const [ccpaContent, setCcpaContent] = React.useState({         // CCPA-specific editable content
    doNotShare: ccpaBanner.doNotShare,
    optOutTitle: ccpaBanner.optOutTitle,
    optOutBody: ccpaBanner.optOutBody,
    cancel: ccpaBanner.buttons.cancel,
    save: ccpaBanner.buttons.save,
  });
  const [showReject, setShowReject] = React.useState(true);      // Content: show the Reject button
  const [showCustomize, setShowCustomize] = React.useState(true); // Content: show the Customize/Preference button
  const [showPolicy, setShowPolicy] = React.useState(false);     // Content: show the Cookie policy link (off by default)
  const [floating, setFloating] = React.useState(false);         // Content: floating reopen button/logo enabled
  const [floatPos, setFloatPos] = React.useState("left");        // Content: floating button position (left | right)
  const [bannerWeight, setBannerWeight] = React.useState("700");  // Type: font weight (heading + text)
  const [bannerTextAlign, setBannerTextAlign] = React.useState("left"); // Type: left | center | right
  const [bannerColors, setBannerColors] = React.useState({       // Colors tab -> preview banners
    bannerBg: "#FFFFFF",
    textColor: "#374151",
    headingColor: "#0F1B2E",
    btnBg: "#007AFF",        // Accept/Reject/Cancel background
    btnText: "#FFFFFF",      // Accept/Reject/Cancel text
    prefBtnBg: "#FFFFFF",    // Preferences background
    prefBtnText: "#0284C7",  // Preferences text
  });

 // --- Auth onboarding flow -------------------------------------------------
  // Start in "loading" while we make the single launch status call. Routing:
  //   !authorized               → "landing"  (authorize)
  //   authorized && !registered → "select-plan"
  //   authorized &&  registered → "app"      (customize/editor)
  const [screen, setScreen] = React.useState("loading");
  const [freeUsed, setFreeUsed] = React.useState(false); // free site already used on this account
  const [freeResult, setFreeResult] = React.useState(null); // { webappSiteId, scriptUrl, ... }
  const [bannerCreated, setBannerCreated] = React.useState(false); // a banner was already saved → CTA shows "Update Banner"
  const [plan, setPlan] = React.useState(null); // current plan — null until resolved (blank in the top bar); then 'free' or a paid tier
  const [registered, setRegistered] = React.useState(false); // has the site taken a plan (free or paid)? Gates Install & verify.
  const [accountEmail, setAccountEmail] = React.useState(""); // account owner email (from status)
  // Payment-processing popup state. Opened by startPaymentFlow() when a paid
  // checkout link is clicked; it self-polls while open (see WPaymentProcessing).
  const [paymentFlow, setPaymentFlow] = React.useState({ open: false, siteId: null });

  // One launch-time call to the worker (oauth/status) returns authorized +
  // registered + plan together — no extra round-trips.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { wfSiteId } = await getWebflowSiteContext();
        if (!wfSiteId) {            // not inside the Designer (e.g. dev preview)
          if (!cancelled) setScreen("landing");
          return;
        }
        const status = await getWebflowSiteStatus(wfSiteId);
        if (cancelled) return;
        setBannerCreated(!!status.bannerCreated);
        // Only show a plan once one is actually taken — no hardcoded "Free" for
        // unregistered/skipped users (keeps the top-bar plan pill blank).
        setPlan(status.registered ? (status.plan ?? "Free") : null);
        setRegistered(!!status.registered);
        setAccountEmail(status.email ?? "");
        // Disable the free plan upfront if this account already used its free site.
        if (status.freeUsed) setFreeUsed(true);
        if (!status.authorized) setScreen("landing");
        else if (!status.registered) setScreen("select-plan");
        else setScreen("app");

        // Load the saved banner customization (from the webapp or a previous save)
        // so the editor + preview reflect it — merged onto defaults so missing
        // fields keep their default.
        try {
          const saved = await getBannerCustomization(wfSiteId, status.webappSiteId);
          console.log("[BannerLoad] wfSiteId=", wfSiteId, "| webappSiteId=", status.webappSiteId, "| saved?", !!saved, "| title=", saved?.translations?.en?.title, "| bg=", saved?.backgroundColor);
          if (!cancelled && saved) {
            const m = mapCustomizationToState(saved);
            console.log("[BannerLoad] mapped:", { bannerContent: m.bannerContent, bannerColors: m.bannerColors, template: m.template, pos: m.bannerPos });
            if (m.bannerColors) setBannerColors((p) => ({ ...p, ...m.bannerColors }));
            if (m.bannerContent) setBannerContent((p) => ({ ...p, ...m.bannerContent }));
            if (m.prefContent) setPrefContent((p) => ({
              ...p, ...m.prefContent,
              cats: m.prefContent.cats ? m.prefContent.cats.map((c, i) => ({ ...(p.cats?.[i] || {}), ...c })) : p.cats,
            }));
            if (m.ccpaContent) setCcpaContent((p) => ({ ...p, ...m.ccpaContent }));
            if (m.bannerPos) setBannerPos(m.bannerPos);
            if (m.bannerAlign) setBannerAlign(m.bannerAlign);
            if (m.bannerRadius != null) setBannerRadius(m.bannerRadius);
            if (m.bannerBtnRadius != null) setBannerBtnRadius(m.bannerBtnRadius);
            if (m.bannerAnim) setBannerAnim(m.bannerAnim);
            if (m.bannerWeight) setBannerWeight(m.bannerWeight);
            if (m.bannerTextAlign) setBannerTextAlign(m.bannerTextAlign);
            if (m.closeBtn !== undefined) setCloseBtn(m.closeBtn);
            if (m.showReject !== undefined) setShowReject(m.showReject);
            if (m.showCustomize !== undefined) setShowCustomize(m.showCustomize);
            if (m.showPolicy !== undefined) setShowPolicy(m.showPolicy);
            if (m.template) setTemplate(m.template);
            if (m.iab !== undefined) setIab(m.iab);
            if (m.gac !== undefined) setGac(m.gac);
          }
        } catch { /* keep editor defaults */ }
      } catch {
        if (!cancelled) setScreen("landing");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Open the payment-processing popup (resolves the current Webflow site id so
  // the popup can poll for it). Called by the paid-checkout buttons right after
  // they open the Stripe checkout tab.
  const startPaymentFlow = React.useCallback(async () => {
    // Open the popup IMMEDIATELY so it always appears on click — never block it on
    // a worker fetch. siteId + baseline are filled in as they resolve.
    setPaymentFlow({ open: true, siteId: null, baseline: null });
    let sid = null;
    try { const ctx = await getWebflowSiteContext(); sid = ctx?.wfSiteId || null; } catch { /* not in Designer */ }
    setPaymentFlow((pf) => (pf.open ? { ...pf, siteId: sid } : pf));
    // Capture the pre-payment subscription state in the BACKGROUND, so the popup
    // only treats a CHANGE (new/upgraded plan) as success — without delaying it.
    if (sid) {
      getPaymentSubscription(sid)
        .then((b) => setPaymentFlow((pf) => (pf.open ? { ...pf, baseline: b } : pf)))
        .catch(() => { /* no baseline — first paid plan still counts as success */ });
    }
  }, []);

  const closePaymentFlow = React.useCallback(() => setPaymentFlow({ open: false, siteId: null }), []);

  // Payment confirmed by the popup's polling: update the plan, close the popup,
  // and send the user to the install + verify code section.
  const handlePaymentSuccess = React.useCallback(({ plan: paidPlan } = {}) => {
    if (paidPlan) setPlan(paidPlan);
    setRegistered(true); // a paid plan is now taken → Install & verify is allowed
    setPaymentFlow({ open: false, siteId: null });
    setScreen("install-verify");
  }, []);

  // Navigate to the Install & verify page from anywhere in the app, and back.
  // Track when it was opened from the editor so the page can show a "Back" button
  // (onboarding reaches it without this flag → no back button).
  const [installVerifyFromApp, setInstallVerifyFromApp] = React.useState(false);
  // Install & verify requires a taken plan — guard so it can't be reached without one.
  const goToInstallVerify = React.useCallback(() => { if (!registered) return; setInstallVerifyFromApp(true); setScreen("install-verify"); }, [registered]);
  const goToApp = React.useCallback(() => { setInstallVerifyFromApp(false); setScreen("app"); }, []);

  // Cookie Banner editor (the "customization" screen) — pick the editor for the
  // active section tab.
  const editor =
    subTab === "content" ? <WEdContent /> :
    subTab === "layout" ? <WEdLayout /> :
    subTab === "colors" ? <WEdColors /> :
    subTab === "type" ? <WEdType /> :
    <WEdGeneral />;

  // Top-level tab → screen. The cookie-banner tab shows the editor; the other
  // tabs swap the whole screen. The avatar opens Profile over the top.
  const main =
    mainTab === "scan" ? <WScan /> :
    mainTab === "logs" ? <WConsentLogs /> :
    mainTab === "upgrade" ? <WUpgrade /> :
    editor;

  const current =
    // Profile opens over ANY screen (the avatar is in the top bar everywhere).
    profileOpen ? (
      <WProfile />
    ) : screen === "loading" ? (
      <WLoading />
    ) : screen === "app" ? (
      main
    ) : screen === "install-verify" ? (
      // Never show Install & verify without a taken plan (belt-and-suspenders —
      // the button that navigates here is disabled when !registered).
      registered ? <WInstallVerify /> : main
    ) : screen === "select-plan" ? (
      <WSelectPlan
        freeDisabled={freeUsed}
        onSelectPlan={() => { setRegistered(true); setScreen("install-verify"); }}
        onFreeRegistered={(result) => { setFreeResult(result); setPlan("free"); setRegistered(true); setScreen("install-verify"); }}
        onFreeLimitReached={() => setFreeUsed(true)}
        onSkip={() => setScreen("app")}
      />
    ) : (
      <WLanding onAuthorize={() => setScreen("select-plan")} />
    );
  //-------------------------------------------------------------------------

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
    <NavContext.Provider value={{ mainTab, setMainTab, subTab, setSubTab, profileOpen, setProfileOpen, notifOpen, setNotifOpen, template, setTemplate, iab, setIab, gac, setGac, bannerPos, setBannerPos, bannerAlign, setBannerAlign, bannerRadius, setBannerRadius, bannerAnim, setBannerAnim, bannerBtnRadius, setBannerBtnRadius, bannerColors, setBannerColors, bannerWeight, setBannerWeight, bannerTextAlign, setBannerTextAlign, bannerContent, setBannerContent, prefContent, setPrefContent, closeBtn, setCloseBtn, showReject, setShowReject, showCustomize, setShowCustomize, showPolicy, setShowPolicy, floating, setFloating, floatPos, setFloatPos, activeRegion, setActiveRegion, ccpaContent, setCcpaContent, bannerCreated, setBannerCreated, plan, setPlan, registered, setRegistered, startPaymentFlow, accountEmail, goToInstallVerify, goToApp, installVerifyFromApp }}>
      <div style={{ position: "relative", height: "100%" }}>
        {current}
        {paymentFlow.open &&
          <WPaymentProcessing
            siteId={paymentFlow.siteId}
            baseline={paymentFlow.baseline}
            onPaid={handlePaymentSuccess}
            onCancel={closePaymentFlow}
          />
        }
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
