import React from "react";
import { WMainTabs } from "./WMainTabs.jsx";
import { WPage } from "./WPage.jsx";
import { WTopBar } from "./WTopBar.jsx";
import { WToast } from "./WToast.jsx";
import { useNav } from "../../nav.jsx";
import { saveBanner } from "../../lib/saveBanner.js";
import { analytics } from "../../lib/analytics.js";

function WEdShell({ active = "general", children, showAdvanced = true, cta = "Create Component" }) {
  const nav = useNav();
  // Active section + click handling come from nav when inside the app; the
  // `active` prop is the fallback for standalone/gallery rendering.
  const current = nav ? nav.subTab : active;
  // Both header CTAs (Create Component + Install & verify) require a taken plan
  // (free or paid). Until then they're disabled with a "subscribe first" tooltip.
  const hasPlan = !nav || nav.registered;

  // CTA → save the banner customization to the backend for the current site.
  // (No site publish, no component creation — just persists the settings.)
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState({ message: "", type: "error" });
  const handleSave = async () => {
    if (saving || !nav || !nav.registered) return; // no plan taken → no save
    setToast({ message: "", type: "error" });
    setSaving(true);
    try {
      const res = await saveBanner(nav);
      if (res?.success) {
        nav.setBannerCreated && nav.setBannerCreated(true); // CTA → "Update Banner"
        analytics.bannerCustomized(); // debounced — one event per edit session
        setToast({ message: "Banner saved.", type: "success" });
      } else setToast({ message: res?.error || "Couldn't save the banner. Please try again.", type: "error" });
    } catch (e) {
      setToast({ message: e?.message || "Network error saving the banner.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const items = [
  { id: "general", label: "General" },
  { id: "content", label: "Content" },
  { id: "layout", label: "Layout" },
  { id: "colors", label: "Colors" },
  { id: "type", label: "Type" }];

  return (
    <WPage scroll={false} className="cb-scroll-page" style={{ display: "flex", flexDirection: "column" }}>
      <WToast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "error" })} />
      <WTopBar />
      <WMainTabs active="cookie" right={
      <>
          <button
            className="btn btn-secondary btn-sm"
            style={{ height: "38px", ...(hasPlan ? {} : { opacity: 0.5, cursor: "not-allowed" }) }}
            disabled={!hasPlan}
            title={hasPlan ? undefined : "Subscribe to a plan first to install & verify"}
            onClick={hasPlan && nav ? () => nav.goToInstallVerify() : undefined}
          >Install &amp; verify</button>
          <button
            className="btn btn-primary btn-sm"
            style={{ height: "38px", minWidth: "122px", ...(hasPlan ? {} : { opacity: 0.5, cursor: "not-allowed" }) }}
            disabled={saving || !hasPlan}
            title={hasPlan ? undefined : "Subscribe to a plan first to create your banner"}
            onClick={handleSave}
          >{saving ? "Saving…" : (nav && nav.bannerCreated ? "Update Banner" : cta)}</button>
        </>
      } />
      <div className="cb-section-tabs" style={{ padding: "0 32px", margin: "14px 0 14px" }}>
        {items.map((it) => {
          // The Content tab is disabled while IAB TCF is enabled.
          const disabled = it.id === "content" && nav && nav.iab;
          return (
          <button
            key={it.id}
            disabled={disabled}
            title={disabled ? "Disabled while IAB TCF is enabled" : undefined}
            onClick={disabled || !nav ? undefined : () => nav.setSubTab(it.id)}
            className={"cb-section-tab " + (current === it.id ? "active" : "")}
            style={disabled ? { opacity: 0.4, cursor: "not-allowed" } : undefined}>{it.label}</button>
          );
        })}
      </div>
      {/* Scrolls independently of the fixed header above. */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 32px 18px" }}>{children}</div>
    </WPage>);

}

export { WEdShell };
