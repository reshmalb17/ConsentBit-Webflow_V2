import React from "react";
import { readWebflowOAuthResult, clearWebflowOAuthResult } from "./lib/webflowAuth.js";

// Screens (each its own module)
import { WLanding } from "./components/screens/auth/WLanding.jsx";
import { WSelectPlan } from "./components/screens/auth/WSelectPlan.jsx";
import { WSelectPlanFreeUsed } from "./components/screens/auth/WSelectPlanFreeUsed.jsx";
import { WInstallVerify } from "./components/screens/auth/WInstallVerify.jsx";
import { WInstallVerifyCompact } from "./components/screens/auth/WInstallVerifyCompact.jsx";
import { WInstallVerifyTwoCol } from "./components/screens/auth/WInstallVerifyTwoCol.jsx";
import { WVerifySuccess } from "./components/screens/auth/WVerifySuccess.jsx";
import { WVerifyError } from "./components/screens/auth/WVerifyError.jsx";
import { WEdGeneral } from "./components/screens/app/WEdGeneral.jsx";
import { WEdLayout } from "./components/screens/app/WEdLayout.jsx";
import { WEdColors } from "./components/screens/app/WEdColors.jsx";
import { WEdContent } from "./components/screens/app/WEdContent.jsx";
import { WEdType } from "./components/screens/app/WEdType.jsx";
import { WScan } from "./components/screens/app/WScan.jsx";
import { WConsentLogs } from "./components/screens/app/WConsentLogs.jsx";
import { WEdSimple } from "./components/screens/app/WEdSimple.jsx";
import { WDomains } from "./components/screens/app/WDomains.jsx";
import { WEdGeneralPublished } from "./components/screens/app/WEdGeneralPublished.jsx";
import { WProfile } from "./components/screens/profile/WProfile.jsx";
import { WNotifications } from "./components/screens/modals/WNotifications.jsx";
import { WInstallCode } from "./components/screens/modals/WInstallCode.jsx";
import { WLoading } from "./components/screens/modals/WLoading.jsx";
import { WPublish } from "./components/screens/modals/WPublish.jsx";
import { WUpgrade } from "./components/screens/upgrade/WUpgrade.jsx";

const GROUPS = [
  { title: "01 · Auth & onboarding", screens: [
    { id: "landing",                label: "Landing",                       Cmp: WLanding },
    { id: "select-plan",            label: "Choose plan",                   Cmp: WSelectPlan },
    { id: "select-plan-free-used",  label: "Choose plan · Free used",       Cmp: WSelectPlanFreeUsed },
    { id: "install-verify",         label: "Install & verify",              Cmp: WInstallVerify },
    { id: "install-verify-compact", label: "Install & verify · Compact",    Cmp: WInstallVerifyCompact },
    { id: "install-verify-twocol",  label: "Install & verify · Two-column", Cmp: WInstallVerifyTwoCol },
    { id: "verify-success",         label: "Verify success",                Cmp: WVerifySuccess },
    { id: "verify-error",           label: "Verify error",                  Cmp: WVerifyError },
  ]},
  { title: "02 · Main app", screens: [
    { id: "ed-general", label: "Cookie Banner · General", Cmp: WEdGeneral },
    { id: "ed-layout",  label: "Cookie Banner · Layout",  Cmp: WEdLayout },
    { id: "ed-colors",  label: "Cookie Banner · Colors",  Cmp: WEdColors },
    { id: "ed-content", label: "Cookie Banner · Content", Cmp: WEdContent },
    { id: "ed-type",    label: "Cookie Banner · Type",    Cmp: WEdType },
    { id: "scan",       label: "Scan",                    Cmp: WScan },
    { id: "logs",       label: "Consent Logs",            Cmp: WConsentLogs },
    { id: "ed-simple",  label: "Cookie Banner · Simple",  Cmp: WEdSimple },
    { id: "domains",    label: "Domains",                 Cmp: WDomains },
  ]},
  { title: "03 · Published state", screens: [
    { id: "ed-general-published", label: "Cookie Banner · General (published)", Cmp: WEdGeneralPublished },
  ]},
  { title: "04 · Profile", screens: [
    { id: "profile", label: "Profile · Settings", Cmp: WProfile },
  ]},
  { title: "05 · Modals & system states", screens: [
    { id: "notifications", label: "Notifications drawer", Cmp: WNotifications },
    { id: "install-code",  label: "Install code modal",   Cmp: WInstallCode },
    { id: "loading",       label: "Scanning state",       Cmp: WLoading },
    { id: "publish",       label: "Publish confirmation", Cmp: WPublish },
  ]},
  { title: "06 · Upgrade", screens: [
    { id: "upgrade", label: "Choose plan (upgrade)", Cmp: WUpgrade },
  ]},
];

const ALL = GROUPS.flatMap((g) => g.screens);
const byId = Object.fromEntries(ALL.map((s) => [s.id, s]));

function useHashRoute() {
  const get = () => (window.location.hash || "").replace(/^#/, "") || ALL[0].id;
  const [id, setId] = React.useState(get);
  React.useEffect(() => {
    const onHash = () => setId(get());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return id;
}

export default function App() {
  const id = useHashRoute();
  const screen = byId[id] || ALL[0];
  const Cmp = screen.Cmp;

  // Show the result when returning from the Webflow install flow, then strip
  // the params from the URL so a refresh doesn't re-trigger the banner.
  const [oauth] = React.useState(() => readWebflowOAuthResult());
  React.useEffect(() => {
    if (oauth) clearWebflowOAuthResult();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <nav className="gx-sidebar">
        <div className="gx-brand">
          <span className="gx-brand-mark">CB</span>
          ConsentBit
        </div>
        {GROUPS.map((g) => (
          <div key={g.title}>
            <div className="gx-group-title">{g.title}</div>
            {g.screens.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={"gx-link" + (s.id === screen.id ? " active" : "")}
              >
                {s.label}
              </a>
            ))}
          </div>
        ))}
      </nav>

      <main className="gx-main">
        <div className="gx-head">
          <h1>{screen.label}</h1>
          <p>{screen.id}</p>
        </div>
        {oauth && (
          <div className="gx-head" style={{ color: "var(--purple-hi)", fontSize: 12.5 }}>
            Webflow install result: {String(oauth.status || oauth.error || "received")}
          </div>
        )}
        <div className="gx-stage">
          <div className="cb-widget-wrap">
            <Cmp />
          </div>
        </div>
      </main>
    </>
  );
}
