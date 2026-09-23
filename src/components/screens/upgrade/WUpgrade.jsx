import React from "react";
import "./WUpgrade.css";
import "../../kit/modal.css";
import { WMainTabs } from "../../kit/WMainTabs.jsx";
import { WPage } from "../../kit/WPage.jsx";
import { WTopBar } from "../../kit/WTopBar.jsx";
import { Page } from "../../primitives/Page.jsx";
import { WToast } from "../../kit/WToast.jsx";
import { startCheckout, getWebflowSiteContext, getWebflowSiteStatus, getWebflowBilling, switchWebflowInterval, registerWebflowFree, previewWebflowUpgrade, commitWebflowUpgrade, resumeWebflowSubscription } from "../../../lib/api.js";
import { useNav } from "../../../nav.jsx";
import { TERMINAL_STATUSES, subscriptionHasEnded } from "../../../lib/subscriptionState.js";

// Plan column name → worker plan id.
const PLAN_ID = { Basic: "basic", Essential: "essential", Growth: "growth" };

// An in-place tier change failed because the subscription no longer exists to change:
//  - Stripe's own "No such subscription: 'sub_…'" (the row is live in D1 but Stripe has
//    no such object for the worker's key), or
//  - the worker's terminal-status guard (changeTier.js), whose 409 carries
//    TERMINAL_SUBSCRIPTION_MESSAGE from utils/subscriptionStatus.js.
// Both mean the only way forward is a new subscription via checkout.
function subscriptionIsGone(message) {
  const m = String(message || "").toLowerCase();
  return m.includes("no such subscription") || m.includes("has ended and can no longer be changed");
}
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
  // Paid period lapsed (resolved once in AppExtension from THIS site's billing row).
  const subEnded = !!nav?.subEnded;
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
  // True once this screen's own billing call has answered (or failed). Until then
  // `subStatus` is null, which reads as NOT cancelled — so plan buttons stay disabled
  // rather than letting an early click take the live-subscriber (prorate) path.
  const [billingLoaded, setBillingLoaded] = React.useState(false);
  // Scheduled cancellation + period end from this site's billing row. Together with
  // subStatus they separate "cancelled but still running" (Resume, or change plan in
  // place) from "ended" (new checkout).
  const [cancelFlag, setCancelFlag] = React.useState(false);
  const [periodEndIso, setPeriodEndIso] = React.useState(null);
  const [resuming, setResuming] = React.useState(false);
  // Definite answer from a failed resume, mirroring the Profile panel: 'ended' = Stripe
  // confirms it is over (treat the whole tab as ended), 'notFound' = billing cannot find
  // it. Either way the Resume button is withdrawn instead of staying clickable next to its
  // own error.
  const [resumeOutcome, setResumeOutcome] = React.useState(null);
  // Manual refresh of the live billing/payment details (status, interval, plan).
  const [refreshing, setRefreshing] = React.useState(false);
  const [refreshTip, setRefreshTip] = React.useState(false);
  const [switching, setSwitching] = React.useState(false);
  const [confirmSwitch, setConfirmSwitch] = React.useState(false);
  const [switchMsg, setSwitchMsg] = React.useState("");
  // ── In-app upgrade popup ─────────────────────────────────────────────────
  // Set to { planName, planId, interval } when a plan CTA is clicked on a site that
  // already has a paid subscription. The popup then previews the prorated amount and
  // (on Confirm) commits the change against the saved card. Sites with no paid
  // subscription never open it — they have nothing to prorate and keep going through
  // the hosted checkout / dashboard.
  const [upgradeTarget, setUpgradeTarget] = React.useState(null);
  const [previewing, setPreviewing] = React.useState(false);
  const [previewData, setPreviewData] = React.useState(null);
  const [previewError, setPreviewError] = React.useState("");
  const [confirming, setConfirming] = React.useState(false);
  // Once the user picks a toggle, stop auto-syncing it to the live interval.
  const userPickedBilling = React.useRef(false);
  const pickBilling = (v) => { userPickedBilling.current = true; setBilling(v); };

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { wfSiteId: sid } = await getWebflowSiteContext();
        if (cancelled) return;
        if (!sid) { setBillingLoaded(true); return; }
        setWfSiteId(sid);
        // Billing and free-plan availability are independent — fetch them together
        // instead of back to back, so the status the buttons wait on arrives sooner.
        const [st, b] = await Promise.all([
          getWebflowSiteStatus(sid).catch(() => null),
          getWebflowBilling(sid).catch(() => null),
        ]);
        if (cancelled) return;
        if (st) setFreeUsed(!!st.freeUsed);
        if (b?.status) setSubStatus(String(b.status).toLowerCase());
        setCancelFlag(!!b?.cancelAtPeriodEnd);
        setPeriodEndIso(b?.currentPeriodEnd || null);
        setBillingLoaded(true);
        if (b?.interval) {
          const iv = String(b.interval).toLowerCase();
          setCurrentInterval(iv);
          // Default the Monthly/Yearly toggle to the current plan's interval
          // (unless the user has already picked one).
          if ((iv === "monthly" || iv === "yearly") && !userPickedBilling.current) setBilling(iv);
        }
      } catch { /* not in Designer */ if (!cancelled) setBillingLoaded(true); }
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
      setCancelFlag(!!b?.cancelAtPeriodEnd);
      setPeriodEndIso(b?.currentPeriodEnd || null);
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

  // A terminal subscription can't switch interval or change tier in place. Detect it
  // from the live status so the confirm popup offers "resubscribe via checkout" instead
  // of a prorated in-place switch (the worker also returns { canceled:true } as a backstop).
  //
  // This list must match TERMINAL_SUBSCRIPTION_STATUSES in the worker's
  // src/utils/subscriptionStatus.js. It previously held only "canceled" and
  // "incomplete_expired", so a site whose D1 status is "deleted" — which is what
  // syncEvent.js writes on EVERY cancellation — read as live: `canUpgradeInApp` stayed
  // true, clicking a plan opened the in-app prorate popup, and the worker's 409 landed
  // in `previewError` as a dead end instead of routing to the hosted checkout.
  // "deleted" is not a real Stripe status; it only ever comes from our own D1.
  // `|| subEnded`: AppExtension resolves the lapsed-period flag at launch, before this
  // screen's own billing call returns. The headline already reads it, so the button
  // routing must too — otherwise the page says "Your plan has ended" while an early
  // click still takes the live-subscriber prorate path.
  //
  // Three cases (decided 2026-09-18):
  //   ended            — period over → only a NEW checkout can bring the plan back.
  //   scheduledCancel  — cancelled but the paid period is still running → the current
  //                      plan offers Resume, and any other plan changes IN PLACE (the worker
  //                      clears the cancellation in the same call). Never a new checkout —
  //                      that would be a second subscription on top of a paid-up one.
  //   otherwise        — live subscription, normal in-place change.
  const ownEnded = billingLoaded
    ? subscriptionHasEnded({ status: subStatus, cancelAtPeriodEnd: cancelFlag, currentPeriodEnd: periodEndIso })
    : false;
  const ended = subEnded || ownEnded || resumeOutcome === "ended";
  const scheduledCancel = !ended && (cancelFlag || subStatus === "canceled" || subStatus === "cancelled");
  const isCanceled = ended || (TERMINAL_STATUSES.includes(subStatus) && !scheduledCancel);

  // Undo the scheduled cancellation on the SAME subscription (no checkout, no charge now).
  const handleResume = async () => {
    if (resuming || !wfSiteId) return;
    setResuming(true);
    setError("");
    setSwitchMsg("");
    try {
      const res = await resumeWebflowSubscription(wfSiteId);
      if (res?.success) {
        setCancelFlag(false);
        if (res.status) setSubStatus(String(res.status).toLowerCase());
        setSwitchMsg("Your subscription is active again and will renew as normal.");
        refreshBilling();
        nav?.refreshAccount?.();
      } else {
        setError(res?.error || "Couldn't resume the subscription.");
        if (res?.ended) {
          setResumeOutcome("ended");
          // The worker reconciled D1 with Stripe, so re-read it for the real end date.
          refreshBilling();
          nav?.refreshAccount?.();
        } else if (res?.notFound) setResumeOutcome("notFound");
      }
    } catch (e) {
      setError(e?.message || "Network error resuming the subscription.");
    } finally {
      setResuming(false);
    }
  };

  // Resubscribe to the current plan at the selected interval via a fresh Stripe checkout
  // (same flow as a new upgrade) — used when the subscription was canceled.
  const resubscribeCurrentPlan = async () => {
    if (!currentKey || currentKey === "free") {
      setError("Your subscription was canceled. Choose a plan below to resubscribe.");
      return;
    }
    // Resolve the account email and pass it (same as the plan page). Without it the
    // checkout token carries no account identity and the hosted page falls through
    // to /login instead of /checkout-plan.
    const { wfSiteId: sid } = await getWebflowSiteContext();
    const email = await resolveEmail(sid);
    await startCheckout({ plan: currentKey, interval: billing, email });
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
  // `!subEnded`: once the paid period has lapsed no column is the current plan, so the
  // "● Current plan" badge is not shown and every tier offers its normal CTA (which
  // routes to hosted checkout, since canUpgradeInApp is false for a terminal status).
  map((c) => ({ ...c, current: hasPlan && !ended && c.name.toLowerCase() === currentKey }));

  // Free plan blocked when the account already used its free site elsewhere (and no
  // plan is taken here yet) — dim/blur the Free column like the plan page.
  const freeBlocked = freeUsed && !hasPlan;

  // An in-place tier change only works on a LIVE paid subscription: Stripe needs an
  // existing subscription item to prorate against and a saved card to charge. A free
  // (or never-subscribed) site has neither, and a canceled one can't be modified —
  // both keep the hosted-checkout / dashboard hand-off below.
  const canUpgradeInApp = !!wfSiteId && !!currentKey && currentKey !== "free" && !isCanceled;
  // Paid-plan sites must not act until their own status is known: an early click
  // reads subStatus=null as "live" and would open the prorate popup.
  const statusPending = hasPlan && !billingLoaded;

  // Money / date formatting for the popup copy. Amounts arrive from Stripe in the
  // smallest currency unit, so divide by 100 and let Intl place the symbol.
  const fmtAmount = (cents, currency) => {
    if (cents == null) return null;
    const value = Math.abs(cents) / 100;
    const code = String(currency || "usd").toUpperCase();
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: code }).format(value);
    } catch {
      return `${code} ${value.toFixed(2)}`;
    }
  };
  const fmtDate = (iso) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return null;
    }
  };

  const closeUpgradePopup = () => {
    if (confirming) return; // never dismiss mid-charge
    setUpgradeTarget(null);
    setPreviewData(null);
    setPreviewError("");
    setPreviewing(false);
  };

  // Open the popup and immediately ask the worker what this change costs. The preview
  // endpoint makes NO change — it only reads Stripe's proration, so it's safe to call
  // on every open.
  const openUpgradePopup = async (planName, planId) => {
    setUpgradeTarget({ planName, planId, interval: billing });
    setPreviewData(null);
    setPreviewError("");
    setPreviewing(true);
    try {
      const res = await previewWebflowUpgrade(wfSiteId, { planId, interval: billing });
      if (res?.success) setPreviewData(res);
      else if (subscriptionIsGone(res?.error)) {
        // D1 said this subscription was live, but it can't be changed in place: Stripe
        // no longer has it, or the worker's terminal-status guard refused it (409).
        // Either way there is nothing to prorate against — close the popup and send the
        // customer to a fresh checkout instead of stranding them on a raw Stripe error.
        setUpgradeTarget(null);
        setSubStatus("canceled");
        await goToCheckout(planName, planId);
      }
      else setPreviewError(res?.error || "Couldn't work out the amount for this change.");
    } catch (e) {
      setPreviewError(e?.message || "Network error loading the upgrade details.");
    } finally {
      setPreviewing(false);
    }
  };

  // Commit the change previewed above. Upgrades apply now and charge the saved card;
  // downgrades are scheduled for the end of the current period.
  const confirmUpgrade = async () => {
    if (!upgradeTarget || confirming) return;
    setConfirming(true);
    setPreviewError("");
    try {
      const res = await commitWebflowUpgrade(wfSiteId, {
        planId: upgradeTarget.planId,
        interval: upgradeTarget.interval,
      });
      if (!res?.success) {
        setPreviewError(res?.error || "Couldn't complete the change. Please try again.");
        return;
      }
      const label = upgradeTarget.planName;
      if (res.direction === "downgrade") {
        // Scheduled — the current plan stays live until the period ends, so the
        // headline must NOT switch to the new plan yet.
        const on = fmtDate(res.effectiveAt);
        setSwitchMsg(on ? `Your plan changes to ${label} on ${on}.` : `Your change to ${label} is scheduled.`);
      } else {
        nav?.setPlan?.(upgradeTarget.planId);
        setCurrentInterval(upgradeTarget.interval);
        const paid = fmtAmount(res.amountPaidCents, res.currency);
        setSwitchMsg(paid && res.amountPaidCents > 0 ? `You're on ${label}. ${paid} charged.` : `You're on ${label}.`);
      }
      setUpgradeTarget(null);
      setPreviewData(null);
      // Pull the authoritative plan/interval/status back from the worker. The account
      // refresh also clears a cancellation the change just removed (top bar, Profile).
      refreshBilling();
      nav?.refreshAccount?.();
    } catch (e) {
      setPreviewError(e?.message || "Network error completing the change.");
    } finally {
      setConfirming(false);
    }
  };

  // Plan CTA. On a live paid subscription this opens the in-app upgrade popup;
  // otherwise it hands off to the dashboard, where the full checkout lives.
  const handleUpgrade = async (planName) => {
    const plan = PLAN_ID[planName];
    if (!plan || busyPlan || upgradeTarget) return;
    setError("");
    setSwitchMsg("");

    if (canUpgradeInApp) {
      await openUpgradePopup(planName, plan);
      return;
    }

    await goToCheckout(planName, plan);
  };

  // No plan taken yet, on Free, or the subscription was canceled → there is nothing
  // for Stripe to prorate against, so the trial CTA goes to the hosted checkout
  // (same flow as the plan page) rather than the in-app popup. Also the fallback when
  // the popup discovers the subscription is gone (see openUpgradePopup).
  const goToCheckout = async (planName, plan) => {
    setBusyPlan(planName);
    try {
      const { wfSiteId: sid } = await getWebflowSiteContext();
      // Pass the account email so the checkout token carries an identity — without it
      // the hosted page falls through to /login instead of /checkout-plan.
      const email = await resolveEmail(sid);
      await startCheckout({ plan, interval: billing, email });
      // Poll for completion in the panel so the plan updates without a manual reload.
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
  { label: "No. of domains", vals: ["01", "01", "01", "01"] },
  { label: "No. of scans", vals: ["100 scans", "750 scans", "5000 scans", "10000 scans"] },
  { label: "No. of page views", vals: [
    "7500 page views/m",
    "100,000 page views/m",
     <><div>500,000 page views/m</div></>,
     <><div>2 Million page views/m</div></>
    ]
  },
  { label: "IAB / TCF", vals: ["NIL", "NIL", "Yes", "Yes"] },
  { label: "Compliance", vals: ["GDPR/CCPA", "GDPR/CCPA", "GDPR+CCPA", "GDPR+CCPA"] }];

  const accentTint = "rgba(7,118,230,0.10)";
  const accentTintLite = "rgba(7,118,230,0.05)";

  const renderCta = (c) => {
    if (c.current) {
      // Cancelled but still running: the only action on the current plan is Resume —
      // no interval switch, and never a new checkout.
      if (scheduledCancel && !resumeOutcome) {
        return <button className="btn btn-sm cb-upgrade-switch-btn" disabled={resuming || statusPending} onClick={handleResume} style={{ background: ACC }}>
          {resuming ? "Resuming…" : "Resume subscription"}
        </button>;
      }
      // On a paid plan, if the selected toggle differs from the live interval,
      // offer an in-place switch instead of the static "Current plan" badge.
      const canSwitch = currentKey !== "free" && currentInterval && currentInterval !== billing;
      if (canSwitch) {
        return <button className="btn btn-sm cb-upgrade-switch-btn" disabled={switching} onClick={() => setConfirmSwitch(true)} style={{ background: ACC }}>
          {switching ? (isCanceled ? "Opening…" : "Switching…") : isCanceled ? `Subscribe to ${billing === "yearly" ? "yearly" : "monthly"}` : `Switch to ${billing === "yearly" ? "yearly" : "monthly"}`}
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
      return <button className="btn btn-sm cb-upgrade-cta-accent" disabled={!!busyPlan || statusPending} onClick={() => handleUpgrade(c.name)} style={{ background: ACC, opacity: busyPlan && busyPlan !== c.name ? 0.6 : 1 }}>{label}</button>;
    }
    return <button className="btn btn-sm cb-upgrade-cta-secondary" disabled={!!busyPlan || statusPending} onClick={() => handleUpgrade(c.name)} style={{ opacity: busyPlan && busyPlan !== c.name ? 0.6 : 1 }}>{label}</button>;
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
      {/* In-app upgrade popup — prorated amount + confirm. Only reachable on a live
          paid subscription (canUpgradeInApp); everything else hands off to the dashboard. */}
      {upgradeTarget &&
      <div onClick={closeUpgradePopup} className="cb-modal-overlay cb-modal-overlay--soft" style={{ position: "fixed" }}>
        <div onClick={(e) => e.stopPropagation()} className="card cb-upgrade-switch-card">
          <div className="cb-upgrade-switch-title">
            {previewData?.direction === "downgrade"
              ? `Change to ${upgradeTarget.planName} (${upgradeTarget.interval === "yearly" ? "yearly" : "monthly"})?`
              : `Upgrade to ${upgradeTarget.planName} (${upgradeTarget.interval === "yearly" ? "yearly" : "monthly"})?`}
          </div>

          {previewing &&
          <div className="cb-upgrade-switch-text">Checking what you'll be charged…</div>}

          {!previewing && previewError &&
          <div className="cb-upgrade-switch-text cb-upgrade-modal-error">{previewError}</div>}

          {!previewing && !previewError && previewData &&
          <>
            {/* Headline amount — the single number the user is agreeing to. */}
            <div className="cb-upgrade-modal-amount">
              {previewData.isTrialing
                ? fmtAmount(previewData.amountDueCents, previewData.currency)
                : previewData.direction === "downgrade"
                  ? "No charge today"
                  : previewData.amountDueCents > 0
                    ? fmtAmount(previewData.amountDueCents, previewData.currency)
                    : "No charge today"}
            </div>
            <div className="cb-upgrade-switch-text">
              {previewData.isTrialing
                ? `You're on a free trial, so nothing is charged now. Your plan moves to ${upgradeTarget.planName} immediately and this amount is charged when the trial ends${fmtDate(previewData.trialEnd) ? ` on ${fmtDate(previewData.trialEnd)}` : ""}.`
                : previewData.direction === "downgrade"
                  ? `You keep ${currentLabel} until ${fmtDate(previewData.effectiveAt) || "the end of this billing period"}, then move to ${upgradeTarget.planName}. Nothing is charged today.`
                  : previewData.amountDueCents > 0
                    ? `The prorated difference for the rest of this billing period. Stripe charges the card already on file — no card details to re-enter.`
                    : `Your existing credit covers this change, so nothing is charged today. Your plan moves to ${upgradeTarget.planName} straight away.`}
            </div>
            {previewData.resumesCancellation &&
              <div className="cb-upgrade-switch-text">This also cancels your scheduled cancellation — your plan will keep renewing.</div>}
          </>}

          <div className="cb-upgrade-switch-actions">
            <button className="btn btn-secondary btn-sm cb-upgrade-modal-btn" disabled={confirming} onClick={closeUpgradePopup}>
              {previewError ? "Close" : "Cancel"}
            </button>
            {/* Confirm stays disabled until the amount is on screen — the user must
                never be able to authorise a charge whose figure hasn't loaded yet. */}
            {!previewError &&
            <button className="btn btn-primary btn-sm cb-upgrade-modal-btn" disabled={previewing || confirming || !previewData} onClick={confirmUpgrade}>
              {confirming ? "Processing…" : previewing || !previewData ? "Loading…" : "Confirm & Pay"}
            </button>}
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
          {/* A lapsed subscription is not a current plan. `currentKey` still reports the
              old tier (oauth/status falls back to a cancelled row, or to a sibling site's
              active subscription), so every line below is gated on subEnded first. */}
          <div className="cb-upgrade-headline-title">
            {ended
              ? "Your plan has ended. Choose a plan to start again."
              : scheduledCancel
                ? `Your ${currentLabel} plan is cancelled and ends on ${fmtDate(periodEndIso) || "the end of this billing period"}.`
              : !currentKey
                ? "Unlock full compliance with Essential."
                : currentKey === "free"
                  ? "You're on Free. Unlock full compliance with Essential."
                  : currentKey === "growth"
                    ? "You're on the Growth plan — our top plan."
                    : `You're on ${currentLabel}. Manage or change your plan below.`}
          </div>
          <div className="cb-upgrade-headline-sub">
            {scheduledCancel
              ? "Resume it to keep renewing, or choose another plan below — it will keep renewing on that plan."
              : ended
              ? "Your site keeps its banner settings and installed script — resubscribing restores the plan's limits."
              : currentKey === "growth"
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
            >Yearly <span className="cb-upgrade-save-badge">Save 20%</span></button>
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
