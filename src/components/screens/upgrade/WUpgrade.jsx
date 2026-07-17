import React from "react";
import "./WUpgrade.css";
import "../../kit/modal.css";
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
    <><div>500,000 page views/m</div><div className="cb-upgrade-pageview-note">+ $0.05 / additional 1000 page views</div></>,
    <><div>2 Million page views/m</div><div className="cb-upgrade-pageview-note">+ $0.05 / additional 1000 page views</div></>]
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
        return <button className="btn btn-sm cb-upgrade-switch-btn" disabled={switching} onClick={() => setConfirmSwitch(true)} style={{ background: ACC }}>
          {switching ? (isCanceled ? "Opening…" : "Switching…") : isCanceled ? `Subscribe to ${billing === "yearly" ? "Yearly" : "Monthly"}` : `Switch to ${billing === "yearly" ? "Yearly" : "Monthly"}`}
        </button>;
      }
      return <span className="cb-upgrade-current-badge">
        <span className="cb-upgrade-current-dot" />Current plan
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
      return <button className="btn btn-sm cb-upgrade-cta-secondary" disabled={!!busyPlan || freeBlocked} onClick={handleContinueFree} style={{ opacity: busyPlan && busyPlan !== "Free" ? 0.6 : 1 }}>{label}</button>;
    }
    if (c.ctaStyle === "accent") {
      return <button className="btn btn-sm cb-upgrade-cta-accent" disabled={!!busyPlan} onClick={() => handleUpgrade(c.name)} style={{ background: ACC, opacity: busyPlan && busyPlan !== c.name ? 0.6 : 1 }}>{label}</button>;
    }
    return <button className="btn btn-sm cb-upgrade-cta-secondary" disabled={!!busyPlan} onClick={() => handleUpgrade(c.name)} style={{ opacity: busyPlan && busyPlan !== c.name ? 0.6 : 1 }}>{label}</button>;
  };

  return (
    <WPage scroll={false} className="cb-scroll-page cb-upgrade-page">
      <WToast message={error} type="error" onClose={() => setError("")} />
      <WToast message={switchMsg} type="success" onClose={() => setSwitchMsg("")} />
      {confirmSwitch &&
      <div onClick={() => setConfirmSwitch(false)} className="cb-modal-overlay cb-modal-overlay--soft" style={{ position: "fixed" }}>
        <div onClick={(e) => e.stopPropagation()} className="card cb-upgrade-switch-card">
          <div className="cb-upgrade-switch-title">
            {isCanceled
              ? `Subscribe to ${currentLabel} (${billing === "yearly" ? "yearly" : "monthly"})?`
              : `Switch to ${billing === "yearly" ? "yearly" : "monthly"} billing?`}
          </div>
          <div className="cb-upgrade-switch-text">
            {isCanceled
              ? `Your ${currentLabel} plan was canceled, so it can't be switched in place. Continue to checkout to subscribe with ${billing === "yearly" ? "yearly" : "monthly"} billing.`
              : `Your ${currentLabel} plan will move to ${billing === "yearly" ? "yearly" : "monthly"} billing. Stripe prorates the difference and charges your saved card — no re-entering card details.`}
          </div>
          <div className="cb-upgrade-switch-actions">
            <button className="btn btn-secondary btn-sm cb-upgrade-modal-btn" onClick={() => setConfirmSwitch(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm cb-upgrade-modal-btn" disabled={switching} onClick={handleSwitchInterval}>{switching ? (isCanceled ? "Opening…" : "Switching…") : (isCanceled ? "Continue to checkout" : "Confirm")}</button>
          </div>
        </div>
      </div>
      }
      <WTopBar />
      <WMainTabs active="upgrade" left />
      <div className="cb-page cb-upgrade-body">
        {/* Tight headline block */}
        <div className="card cb-upgrade-headline">
          {/* Refresh the live billing/payment details */}
          <div
            className="cb-upgrade-refresh-wrap"
            onMouseEnter={() => setRefreshTip(true)}
            onMouseLeave={() => setRefreshTip(false)}
          >
            <button
              type="button"
              onClick={refreshBilling}
              disabled={refreshing}
              aria-label="Refresh to get the latest payment details"
              className="cb-upgrade-refresh-btn"
              style={{ cursor: refreshing ? "default" : "pointer", opacity: refreshing ? 0.6 : 1 }}
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
              <span className="cb-upgrade-refresh-tip">
                Refresh to get the latest payment details
              </span>}
          </div>
          <div className="cb-upgrade-headline-title">
            {!currentKey
              ? "Unlock full compliance with Essential."
              : currentKey === "free"
                ? "You're on Free. Unlock full compliance with Essential."
                : currentKey === "growth"
                  ? "You're on the Growth plan — our top plan."
                  : `You're on ${currentLabel}. Manage or change your plan below.`}
          </div>
          <div className="cb-upgrade-headline-sub">
            {currentKey === "growth"
              ? "You have access to every feature — IAB/TCF, Google Consent Mode, and GDPR+CCPA."
              : currentKey === "essential"
                ? "Your plan includes 500,000 pageviews, IAB/TCF, and GDPR+CCPA."
                : "Most teams pick Essential — 500,000 pageviews, IAB/TCF, and GDPR+CCPA in one plan."}
          </div>
        </div>

        {/* Billing toggle */}
        <div className="cb-upgrade-billing-row">
          <div className="cb-upgrade-billing-toggle">
            <button
              className={"btn btn-sm cb-upgrade-toggle-btn " + (billing === "monthly" ? "btn-primary" : "btn-ghost")}
              onClick={() => pickBilling("monthly")}
              aria-pressed={billing === "monthly"}
            >Monthly</button>
            <button
              className={"btn btn-sm cb-upgrade-toggle-btn-yearly " + (billing === "yearly" ? "btn-primary" : "btn-ghost")}
              onClick={() => pickBilling("yearly")}
              aria-pressed={billing === "yearly"}
            >Yearly</button>
          </div>
        </div>

        {/* Pricing table */}
        <div className="card cb-upgrade-table">
          {/* Free plan blocked — hover tip over the Free column (matches the plan page). */}
          {freeBlocked &&
          <div className="cb-free-col-tip cb-upgrade-free-tip">
            <span className="cb-upgrade-free-tip-bubble">You've already taken a free subscription for this account.
              <span className="cb-upgrade-free-tip-arrow" />
            </span>
          </div>
          }
          {/* Header row */}
          <div className="cb-upgrade-grid-head">
            <div />
            {cols.map((c, i) =>
            <div key={i} className="cb-upgrade-col-head" style={{
              opacity: freeBlocked && c.name === "Free" ? 0.45 : 1,
              filter: freeBlocked && c.name === "Free" ? "blur(2px)" : "none",
              pointerEvents: freeBlocked && c.name === "Free" ? "none" : "auto",
              background: c.best ? accentTint : "transparent",
              borderLeft: i > 0 && !c.best ? "1px solid var(--border)" : "none",
              border: c.best ? "2px solid " + ACC : undefined,
              borderRadius: c.best ? 14 : 0,
              boxShadow: c.best ? "0 12px 30px rgba(7,118,230,0.4)" : "none",
              zIndex: c.best ? 3 : 1
            }}>
                {c.best &&
              <div className="cb-upgrade-reco-badge" style={{ background: ACC }}>Recommended</div>
              }
                <div className="cb-upgrade-col-name" style={{ color: c.best ? ACC : "var(--text)", fontWeight: c.best ? 700 : 500 }}>{c.name}</div>
                <div className="cb-upgrade-col-price">
                  {c[billing]}<span className="cb-upgrade-price-suffix">{priceSuffix}</span>
                </div>
                <div className="cb-upgrade-cta-wrap">{renderCta(c)}</div>
              </div>
            )}
          </div>
          {/* Feature rows */}
          {rows.map((r, i) =>
          <div key={i} className="cb-upgrade-grid-row" style={{
            borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none"
          }}>
              <div className="cb-upgrade-row-label">{r.label}</div>
              {r.vals.map((v, j) =>
            <div key={j} className="cb-upgrade-cell" style={{
              opacity: freeBlocked && cols[j].name === "Free" ? 0.45 : 1,
              filter: freeBlocked && cols[j].name === "Free" ? "blur(2px)" : "none",
              borderLeft: cols[j].best ? "2px solid " + ACC : "1px solid var(--border)",
              borderRight: cols[j].best ? "2px solid " + ACC : "none",
              fontWeight: cols[j].best ? 600 : 400,
              background: cols[j].best ? accentTintLite : "transparent"
            }}>{v}</div>
            )}
            </div>
          )}
        </div>

        {/* Trust line */}
        <div className="cb-upgrade-trust">
          Trusted by 4,200+ websites · 30-day money-back guarantee
        </div>
      </div>
    </WPage>);

}

export { WUpgrade };
