import React from "react";
import { WMainTabs } from "../../kit/WMainTabs.jsx";
import { WPage } from "../../kit/WPage.jsx";
import { WTopBar } from "../../kit/WTopBar.jsx";
import { Page } from "../../primitives/Page.jsx";
import { WToast } from "../../kit/WToast.jsx";
import { startCheckout, getWebflowSiteContext, getWebflowSiteStatus, getWebflowBilling, switchWebflowInterval, registerWebflowFree } from "../../../lib/api.js";
import { useNav } from "../../../nav.jsx";

// Plan column name → worker plan id.
const PLAN_ID = { Basic: "basic", Essential: "essential", Growth: "growth" };
const PLAN_LABELS = { free: "Free", basic: "Basic", essential: "Essential", growth: "Growth" };

function WUpgrade() {
  const nav = useNav();
  const ACC = "#0777E6";
  // Current plan from live status (set in AppExtension via the launch status call
  // / payment-success handler). Drives the "Current plan" marker + headline.
  // `nav.plan` stays null until a plan is actually taken. Keep currentKey null in
  // that case so the Free column isn't falsely marked "Current plan" for users who
  // haven't selected any plan yet.
  const hasPlan = !!nav?.plan;
  const currentKey = hasPlan ? String(nav.plan).toLowerCase() : null;
  const currentLabel = (currentKey && PLAN_LABELS[currentKey]) || "Free";
  // Billing cycle: "monthly" shows the full monthly rate; "yearly" shows the
  // per-month equivalent at a 20% discount (billed annually).
  const [billing, setBilling] = React.useState("monthly");
  const [busyPlan, setBusyPlan] = React.useState(null);
  const [error, setError] = React.useState("");
  // Current subscription interval (for switching monthly↔yearly in place).
  const [wfSiteId, setWfSiteId] = React.useState(null);
  // Account already has a free site elsewhere → block the Free plan (matches the plan page).
  const [freeUsed, setFreeUsed] = React.useState(false);
  const [currentInterval, setCurrentInterval] = React.useState(null);
  // Live subscription status ("active" | "trialing" | "canceled" | …). A canceled sub
  // can't switch interval in place — it must resubscribe via a fresh checkout.
  const [subStatus, setSubStatus] = React.useState(null);
  // Manual refresh of the live billing/payment details (status, interval, plan).
  const [refreshing, setRefreshing] = React.useState(false);
  const [refreshTip, setRefreshTip] = React.useState(false);
  const [switching, setSwitching] = React.useState(false);
  const [confirmSwitch, setConfirmSwitch] = React.useState(false);
  const [switchMsg, setSwitchMsg] = React.useState("");
  // Once the user picks a toggle, stop auto-syncing it to the live interval.
  const userPickedBilling = React.useRef(false);
  const pickBilling = (v) => { userPickedBilling.current = true; setBilling(v); };

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { wfSiteId: sid } = await getWebflowSiteContext();
        if (cancelled || !sid) return;
        setWfSiteId(sid);
        // Account-level free-plan availability (already used a free site elsewhere).
        try { const st = await getWebflowSiteStatus(sid); if (!cancelled) setFreeUsed(!!st.freeUsed); } catch { /* ignore */ }
        const b = await getWebflowBilling(sid);
        if (cancelled) return;
        if (b?.status) setSubStatus(String(b.status).toLowerCase());
        if (b?.interval) {
          const iv = String(b.interval).toLowerCase();
          setCurrentInterval(iv);
          // Default the Monthly/Yearly toggle to the current plan's interval
          // (unless the user has already picked one).
          if ((iv === "monthly" || iv === "yearly") && !userPickedBilling.current) setBilling(iv);
        }
      } catch { /* not in Designer */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // Manually pull the latest billing/payment details (status, interval, plan) from the
  // worker — wired to the refresh icon so users can sync after a payment without a reload.
  const refreshBilling = async () => {
    if (refreshing || !wfSiteId) return;
    setRefreshing(true);
    try {
      const b = await getWebflowBilling(wfSiteId);
      if (b?.status) setSubStatus(String(b.status).toLowerCase());
      if (b?.interval) {
        const iv = String(b.interval).toLowerCase();
        setCurrentInterval(iv);
        if ((iv === "monthly" || iv === "yearly") && !userPickedBilling.current) setBilling(iv);
      }
      // Reflect a newly-taken/changed plan in the headline + column markers.
      if (b?.plan && nav?.setPlan) nav.setPlan(String(b.plan).toLowerCase());
    } catch { /* ignore — keep the current values */ } finally {
      setRefreshing(false);
    }
  };

  // A canceled subscription can't switch interval in place. Detect it from the live
  // status so the confirm popup offers "resubscribe via checkout" instead of a prorated
  // in-place switch (the worker also returns { canceled:true } as a backstop).
  const isCanceled = subStatus === "canceled" || subStatus === "incomplete_expired";

  // Resubscribe to the current plan at the selected interval via a fresh Stripe checkout
  // (same flow as a new upgrade) — used when the subscription was canceled.
  const resubscribeCurrentPlan = async () => {
    if (!currentKey || currentKey === "free") {
      setError("Your subscription was canceled. Choose a plan below to resubscribe.");
      return;
    }
    await startCheckout({ plan: currentKey, interval: billing, dest: "checkout-plan" });
    if (nav?.startPaymentFlow) await nav.startPaymentFlow();
  };

  // Switch the current plan's billing interval to the selected toggle (in place).
  const handleSwitchInterval = async () => {
    if (switching || !wfSiteId) return;
    setConfirmSwitch(false);
    // Canceled sub → skip the in-place switch entirely and go straight to checkout.
    if (isCanceled) {
      setSwitching(true);
      setError("");
      setSwitchMsg("");
      try {
        await resubscribeCurrentPlan();
      } catch (e) {
        setError(e?.message || "Couldn't start checkout. Please try again.");
      } finally {
        setSwitching(false);
      }
      return;
    }
    setSwitching(true);
    setError("");
    setSwitchMsg("");
    try {
      const res = await switchWebflowInterval(wfSiteId, billing);
      if (res?.success) {
        setCurrentInterval(billing);
        setSwitchMsg(`Billing switched to ${billing === "yearly" ? "yearly" : "monthly"}.`);
      } else if (res?.canceled) {
        // D1 status was stale but Stripe reports the sub canceled — resubscribe via checkout.
        setSubStatus("canceled");
        await resubscribeCurrentPlan();
      } else {
        setError(res?.error || "Couldn't switch billing interval.");
      }
    } catch (e) {
      setError(e?.message || "Network error switching interval.");
    } finally {
      setSwitching(false);
    }
  };
  const cols = [
  { name: "Free", monthly: "$0", yearly: "$0", cta: "Continue free", ctaStyle: "secondary" },
  { name: "Basic", monthly: "$9", yearly: "$7", cta: "14-day free trial", ctaStyle: "outline" },
  { name: "Essential", monthly: "$20", yearly: "$16", cta: "14-day free trial", ctaStyle: "accent", best: true },
  { name: "Growth", monthly: "$56", yearly: "$45", cta: "14-day free trial", ctaStyle: "outline" }].
  map((c) => ({ ...c, current: hasPlan && c.name.toLowerCase() === currentKey }));

  // Free plan blocked when the account already used its free site elsewhere (and no
  // plan is taken here yet) — dim/blur the Free column like the plan page.
  const freeBlocked = freeUsed && !hasPlan;

  // Paid plan → create a checkout token and open the hosted /checkout-plan page
  // (the read-only variant that shows the plan chosen here). startCheckout opens
  // the top-level tab itself and returns the href.
  const handleUpgrade = async (planName) => {
    const plan = PLAN_ID[planName];
    if (!plan || busyPlan) return;
    setError("");
    setBusyPlan(planName);
    try {
      await startCheckout({ plan, interval: billing, dest: "checkout-plan" });
      // Stripe checkout opened in a new tab — show the payment-processing popup
      // here, which polls until the subscription lands then routes to install.
      if (nav?.startPaymentFlow) await nav.startPaymentFlow();
    } catch (e) {
      setError(e?.message || "Couldn't start checkout. Please try again.");
    } finally {
      setBusyPlan(null);
    }
  };

  // Free plan → register the free webapp site in place (mirrors the plan page's
  // "Continue free"). On success, mark the site as on the Free plan.
  const resolveEmail = async (sid) => {
    if (nav?.accountEmail) return nav.accountEmail;
    try { const st = await getWebflowSiteStatus(sid); return st?.email || ""; } catch { return ""; }
  };
  const handleContinueFree = async () => {
    if (busyPlan) return;
    setError("");
    setSwitchMsg("");
    setBusyPlan("Free");
    try {
      const { wfSiteId: sid, domain } = await getWebflowSiteContext();
      if (!sid || !domain) { setError("Couldn't read your Webflow site. Open this inside the Designer and try again."); return; }
      const email = await resolveEmail(sid);
      const result = await registerWebflowFree({ wfSiteId: sid, domain, email });
      if (result?.success) {
        nav?.setPlan?.("free");
        nav?.setRegistered?.(true);
        setSwitchMsg("You're on the Free plan.");
      } else if (result?.code === "SITE_LIMIT_REACHED") {
        setError(`Your account already has a free site on ${result.existingDomain || "another domain"}.`);
      } else {
        setError(result?.error || "Couldn't register the free plan. Please try again.");
      }
    } catch (e) {
      setError(e?.message || "Network error registering the free plan.");
    } finally {
      setBusyPlan(null);
    }
  };

  const priceSuffix = billing === "yearly" ? " /mo billed yearly" : " /month";

  const rows = [
  { label: "No of Domains", vals: ["01", "01", "01", "01"] },
  { label: "No of Scans", vals: ["100", "750", "5000 scans", "100,000 pages views/m"] },
  { label: "No of Page views", vals: [
    "PAID",
    "100,000 page views/m",
    <><div>500,000 page views/m</div><div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 1 }}>+ $0.05 / additional 1000 page views</div></>,
    <><div>2 Million page views/m</div><div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 1 }}>+ $0.05 / additional 1000 page views</div></>]
  },
  { label: "IAB / TCF", vals: ["NIL", "NIL", "Yes", "Yes"] },
  { label: "Compliance", vals: ["GDPR/CCPA", "GDPR/CCPA", "GDPR+CCPA", "GDPR+CCPA"] }];

  const accentTint = "rgba(7,118,230,0.10)";
  const accentTintLite = "rgba(7,118,230,0.05)";

  const renderCta = (c) => {
    if (c.current) {
      // On a paid plan, if the selected toggle differs from the live interval,
      // offer an in-place switch instead of the static "Current plan" badge.
      const canSwitch = currentKey !== "free" && currentInterval && currentInterval !== billing;
      if (canSwitch) {
        return <button className="btn btn-sm" disabled={switching} onClick={() => setConfirmSwitch(true)} style={{ width: "100%", justifyContent: "center", background: ACC, color: "#fff", fontWeight: 700, fontSize: 11, padding: "8px 10px" }}>
          {switching ? (isCanceled ? "Opening…" : "Switching…") : isCanceled ? `Subscribe to ${billing === "yearly" ? "Yearly" : "Monthly"}` : `Switch to ${billing === "yearly" ? "Yearly" : "Monthly"}`}
        </button>;
      }
      return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 999, padding: "6px 12px" }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: "#5AE497" }} />Current plan
      </span>;
    }
    // No button for a plan with no CTA — e.g. when a paid plan is active.
    if (!c.cta) return null;
    const label = busyPlan === c.name ? "Starting…" : c.cta;
    // Free plan → register the free site in place (not a Stripe checkout). Only
    // offered when no plan is taken yet; a paid plan is current-plan handled above
    // and shouldn't see a "downgrade to free" button.
    if (c.name === "Free") {
      if (hasPlan) return null;
      return <button className="btn btn-sm" disabled={!!busyPlan || freeBlocked} onClick={handleContinueFree} style={{ width: "100%", justifyContent: "center", background: "var(--surface-3)", color: "var(--text)", border: "1px solid var(--border-2)", fontWeight: 600, fontSize: 12, padding: "9px 10px", opacity: busyPlan && busyPlan !== "Free" ? 0.6 : 1 }}>{label}</button>;
    }
    if (c.ctaStyle === "accent") {
      return <button className="btn btn-sm" disabled={!!busyPlan} onClick={() => handleUpgrade(c.name)} style={{ width: "100%", justifyContent: "center", background: ACC, color: "#fff", fontWeight: 700, fontSize: 12, padding: "9px 10px", boxShadow: "0 6px 16px rgba(7,118,230,0.45)", opacity: busyPlan && busyPlan !== c.name ? 0.6 : 1 }}>{label}</button>;
    }
    return <button className="btn btn-sm" disabled={!!busyPlan} onClick={() => handleUpgrade(c.name)} style={{ width: "100%", justifyContent: "center", background: "var(--surface-3)", color: "var(--text)", border: "1px solid var(--border-2)", fontWeight: 600, fontSize: 12, padding: "9px 10px", opacity: busyPlan && busyPlan !== c.name ? 0.6 : 1 }}>{label}</button>;
  };

  return (
    <WPage scroll={false} className="cb-scroll-page" style={{ display: "flex", flexDirection: "column" }}>
      <WToast message={error} type="error" onClose={() => setError("")} />
      <WToast message={switchMsg} type="success" onClose={() => setSwitchMsg("")} />
      {confirmSwitch &&
      <div onClick={() => setConfirmSwitch(false)} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(8,6,20,0.65)", backdropFilter: "blur(2px)", display: "grid", placeItems: "center", padding: 20 }}>
        <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 360, maxWidth: "100%", padding: 22, background: "var(--surface)", textAlign: "center", boxShadow: "0 24px 60px rgba(0,0,0,0.55)" }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
            {isCanceled
              ? `Subscribe to ${currentLabel} (${billing === "yearly" ? "yearly" : "monthly"})?`
              : `Switch to ${billing === "yearly" ? "yearly" : "monthly"} billing?`}
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 12.5, lineHeight: 1.55, marginBottom: 20 }}>
            {isCanceled
              ? `Your ${currentLabel} plan was canceled, so it can't be switched in place. Continue to checkout to subscribe with ${billing === "yearly" ? "yearly" : "monthly"} billing.`
              : `Your ${currentLabel} plan will move to ${billing === "yearly" ? "yearly" : "monthly"} billing. Stripe prorates the difference and charges your saved card — no re-entering card details.`}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => setConfirmSwitch(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: "center" }} disabled={switching} onClick={handleSwitchInterval}>{switching ? (isCanceled ? "Opening…" : "Switching…") : (isCanceled ? "Continue to checkout" : "Confirm")}</button>
          </div>
        </div>
      </div>
      }
      <WTopBar />
      <WMainTabs active="upgrade" left />
      <div className="cb-page" style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingTop: 16 }}>
        {/* Tight headline block */}
        <div className="card" style={{ position: "relative", background: "var(--surface)", padding: "14px 16px", marginBottom: 16 }}>
          {/* Refresh the live billing/payment details */}
          <div
            style={{ position: "absolute", top: 10, right: 12 }}
            onMouseEnter={() => setRefreshTip(true)}
            onMouseLeave={() => setRefreshTip(false)}
          >
            <button
              type="button"
              onClick={refreshBilling}
              disabled={refreshing}
              aria-label="Refresh to get the latest payment details"
              style={{ background: "none", border: "none", padding: 4, display: "inline-flex", alignItems: "center", color: "var(--text-muted)", cursor: refreshing ? "default" : "pointer", opacity: refreshing ? 0.6 : 1 }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <g>
                  <path d="M23 4v6h-6" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  {refreshing &&
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />}
                </g>
              </svg>
            </button>
            {refreshTip &&
              <span style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, whiteSpace: "nowrap", background: "#0a0a14", color: "#fff", fontSize: 10.5, lineHeight: 1.4, padding: "5px 8px", borderRadius: 6, boxShadow: "0 8px 20px rgba(0,0,0,0.5)", zIndex: 10, pointerEvents: "none" }}>
                Refresh to get the latest payment details
              </span>}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 4, paddingRight: 26 }}>
            {!currentKey
              ? "Unlock full compliance with Essential."
              : currentKey === "free"
                ? "You're on Free. Unlock full compliance with Essential."
                : currentKey === "growth"
                  ? "You're on the Growth plan — our top plan."
                  : `You're on ${currentLabel}. Manage or change your plan below.`}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.5 }}>
            {currentKey === "growth"
              ? "You have access to every feature — IAB/TCF, Google Consent Mode, and GDPR+CCPA."
              : currentKey === "essential"
                ? "Your plan includes 500,000 pageviews, IAB/TCF, and GDPR+CCPA."
                : "Most teams pick Essential — 500,000 pageviews, IAB/TCF, and GDPR+CCPA in one plan."}
          </div>
        </div>

        {/* Billing toggle */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 999, padding: 3, alignItems: "center" }}>
            <button
              className={"btn btn-sm " + (billing === "monthly" ? "btn-primary" : "btn-ghost")}
              style={{ borderRadius: 999 }}
              onClick={() => pickBilling("monthly")}
              aria-pressed={billing === "monthly"}
            >Monthly</button>
            <button
              className={"btn btn-sm " + (billing === "yearly" ? "btn-primary" : "btn-ghost")}
              style={{ borderRadius: 999, display: "flex", alignItems: "center", gap: 6 }}
              onClick={() => pickBilling("yearly")}
              aria-pressed={billing === "yearly"}
            >
              Yearly <span style={{ fontSize: 9.5, fontWeight: 700, color: "#5AE497", background: "var(--green-soft)", padding: "2px 7px", borderRadius: 999 }}>Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing table */}
        <div className="card" style={{ padding: 0, overflow: "visible", marginTop: 6, position: "relative" }}>
          {/* Free plan blocked — hover tip over the Free column (matches the plan page). */}
          {freeBlocked &&
          <div className="cb-free-col-tip" style={{ position: "absolute", top: 0, bottom: 0, left: "120px", width: "calc((100% - 120px) / 4)", zIndex: 6, cursor: "not-allowed" }}>
            <span style={{ position: "absolute", bottom: "calc(100% - 64px)", left: "50%", transform: "translateX(-50%)", width: 180, background: "#0a0a14", color: "#fff", fontSize: 11, lineHeight: 1.45, textAlign: "center", padding: "8px 10px", borderRadius: 8, boxShadow: "0 10px 24px rgba(0,0,0,0.55)", opacity: 0, pointerEvents: "none", transition: "opacity 0.15s", zIndex: 7 }}>You've already taken a free subscription for this account.
              <span style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid #0a0a14" }} />
            </span>
          </div>
          }
          {/* Header row */}
          <div style={{ display: "grid", gridTemplateColumns: "120px repeat(4, 1fr)", borderBottom: "1px solid var(--border)" }}>
            <div />
            {cols.map((c, i) =>
            <div key={i} style={{
              padding: "12px 10px 10px",
              textAlign: "center",
              position: "relative",
              opacity: freeBlocked && c.name === "Free" ? 0.45 : 1,
              filter: freeBlocked && c.name === "Free" ? "blur(2px)" : "none",
              pointerEvents: freeBlocked && c.name === "Free" ? "none" : "auto",
              background: c.best ? accentTint : "transparent",
              borderLeft: i > 0 && !c.best ? "1px solid var(--border)" : "none",
              border: c.best ? "2px solid " + ACC : undefined,
              borderRadius: c.best ? 14 : 0,
              boxShadow: c.best ? "0 12px 30px rgba(7,118,230,0.4)" : "none",
              zIndex: c.best ? 3 : 1,
              display: "flex", flexDirection: "column", alignItems: "center"
            }}>
                {c.best &&
              <div style={{
                position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                background: ACC, color: "white",
                fontSize: 10, fontWeight: 700,
                padding: "4px 14px", borderRadius: 999, whiteSpace: "nowrap",
                zIndex: 4,
                boxShadow: "0 4px 12px rgba(7,118,230,0.5)"
              }}>Recommended</div>
              }
                <div style={{ fontSize: 12, color: c.best ? ACC : "var(--text)", marginBottom: 4, fontWeight: c.best ? 700 : 500 }}>{c.name}</div>
                <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1, marginBottom: 8, color: "var(--text)" }}>
                  {c[billing]}<span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 400 }}>{priceSuffix}</span>
                </div>
                <div style={{ marginTop: "auto", width: "100%", display: "flex", justifyContent: "center" }}>{renderCta(c)}</div>
              </div>
            )}
          </div>
          {/* Feature rows */}
          {rows.map((r, i) =>
          <div key={i} style={{
            display: "grid",
            gridTemplateColumns: "120px repeat(4, 1fr)",
            borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none"
          }}>
              <div style={{ padding: "7px 12px", fontSize: 11, color: "var(--text)", fontWeight: 500, display: "flex", alignItems: "center" }}>{r.label}</div>
              {r.vals.map((v, j) =>
            <div key={j} style={{
              padding: "7px 10px",
              fontSize: 11,
              textAlign: "center",
              color: "var(--text)",
              opacity: freeBlocked && cols[j].name === "Free" ? 0.45 : 1,
              filter: freeBlocked && cols[j].name === "Free" ? "blur(2px)" : "none",
              borderLeft: cols[j].best ? "2px solid " + ACC : "1px solid var(--border)",
              borderRight: cols[j].best ? "2px solid " + ACC : "none",
              fontWeight: cols[j].best ? 600 : 400,
              background: cols[j].best ? accentTintLite : "transparent",
              display: "flex", flexDirection: "column", justifyContent: "center"
            }}>{v}</div>
            )}
            </div>
          )}
        </div>

        {/* Trust line */}
        <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", marginTop: 14 }}>
          Trusted by 4,200+ websites · 30-day money-back guarantee
        </div>
      </div>
    </WPage>);

}

export { WUpgrade };
