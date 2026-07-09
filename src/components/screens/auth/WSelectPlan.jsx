import React from "react";
import "./WSelectPlan.css";
import { WAuthShell } from "../../kit/WAuthShell.jsx";
import { Page } from "../../primitives/Page.jsx";
import { WToast } from "../../kit/WToast.jsx";
import { getWebflowSiteContext, getWebflowSiteStatus, registerWebflowFree } from "../../../lib/api.js";
import { startCheckout } from "../../../lib/webflowAuth.js";
import { useNav } from "../../../nav.jsx";

function WSelectPlan({ freeDisabled = false, onSelectPlan, onFreeRegistered, onFreeLimitReached, onSkip }) {
  const nav = useNav();
  // Billing cycle: "monthly" shows the full monthly rate; "yearly" shows the
  // per-month equivalent at a 20% discount (billed annually).
  const [billing, setBilling] = React.useState("monthly");
  // Free-plan registration state (the live API call).
  const [busyPlan, setBusyPlan] = React.useState(null); // plan name currently registering
  const [error, setError] = React.useState("");
  const cols = [
  { name: "Free", monthly: "$0", yearly: "$0", cta: "Continue free", ctaStyle: "secondary" },
  { name: "Basic", monthly: "$9", yearly: "$7", cta: "14 day free trial", ctaStyle: "secondary" },
  { name: "Essential", monthly: "$20", yearly: "$16", cta: "14 day free trial", ctaStyle: "primary", best: true },
  { name: "Growth", monthly: "$56", yearly: "$45", cta: "14 day free trial", ctaStyle: "secondary" }];

  const priceSuffix = billing === "yearly" ? " /mo billed yearly" : " /month";

  const rows = [
  { label: "No of Domains", vals: ["01", "01", "01", "01"] },
  { label: "No of Scans", vals: ["100", "750", "5000 scans", "100,000 pages views/m"] },
  { label: "No of Page views", vals: [
    "PAID",
    "100,000 page views/m",
    <><div>500,000 page views/m</div><div className="cb-selplan-pageview-note">+ $0.05 / additional 1000 page views</div></>,
    <><div>2 Million page views/m</div><div className="cb-selplan-pageview-note">+ $0.05 / additional 1000 page views</div></>]
  },
  { label: "IAB / TCF", vals: ["NIL", "NIL", "Yes", "Yes"] },
  { label: "Compliance", vals: ["GDPR/CCPA", "GDPR/CCPA", "GDPR+CCPA", "GDPR+CCPA"] }];
  // Free plan → create a free webapp account + site via the worker. The email is
  // resolved server-side from the OAuth record, so we only send the site context.
  // Account email is kept in state after OAuth (nav.accountEmail, from the launch
  // status call). Fall back to a fresh status fetch if it isn't in state yet.
  const resolveEmail = async (wfSiteId) => {
    if (nav?.accountEmail) return nav.accountEmail;
    try { const st = await getWebflowSiteStatus(wfSiteId); return st?.email || ""; } catch { return ""; }
  };

  const registerFree = async () => {
    setError("");
    setBusyPlan("Free");
    try {
      const { wfSiteId, domain } = await getWebflowSiteContext();
      if (!wfSiteId || !domain) {
        setError("Couldn't read your Webflow site. Open this inside the Designer and try again.");
        return;
      }
      const email = await resolveEmail(wfSiteId);
      const result = await registerWebflowFree({ wfSiteId, domain, email });
      if (result?.success) {
        if (onFreeRegistered) onFreeRegistered(result);
        else if (onSelectPlan) onSelectPlan("Free"); // fall back to normal navigation
      } else if (result?.code === "SITE_LIMIT_REACHED") {
        if (onFreeLimitReached) onFreeLimitReached(result);
        else setError(`Your account already has a free site on ${result.existingDomain || "another domain"}.`);
      } else {
        setError(result?.error || "Couldn't register the free plan. Please try again.");
      }
    } catch (e) {
      setError(e?.message || "Network error registering the free plan.");
    } finally {
      setBusyPlan(null);
    }
  };

  const handleInstallClick = async (plan) => {
    if (plan === "Free") {
      registerFree();
      return;
    }
    // Paid plans → open the webapp /checkoutplan page with the selected plan +
    // billing interval and the site context (platform=webflow, version=v2).
    // Do NOT advance to install-verify here — payment happens in the opened tab;
    // on the next launch the status call routes the (now paid) site to the app.
    if (busyPlan) return;
    setError("");
    setBusyPlan(plan);
    try {
      const { wfSiteId } = await getWebflowSiteContext();
      const email = await resolveEmail(wfSiteId);
      // Use the read-only checkout-plan page (same as the upgrade flow) — the plan +
      // interval are already chosen here in the plugin, so both flows share one page.
      await startCheckout({ plan, interval: billing, email, dest: "checkout-plan" });
      // Stripe checkout opened in a new tab — show the payment-processing popup
      // here, which polls until the subscription lands then routes to install.
      if (nav?.startPaymentFlow) await nav.startPaymentFlow();
    } catch (e) {
      setError(e?.message || "Couldn't start checkout. Please try again.");
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <WAuthShell step={2} topAlign noScroll title="Choose your plan">
      <div className="cb-selplan-toolbar">
        <div className="cb-selplan-billing-toggle">
          <button
            className={"btn btn-sm cb-selplan-toggle-btn " + (billing === "monthly" ? "btn-primary" : "btn-ghost")}
            onClick={() => setBilling("monthly")}
            aria-pressed={billing === "monthly"}
          >Monthly</button>
          <button
            className={"btn btn-sm cb-selplan-toggle-btn-yearly " + (billing === "yearly" ? "btn-primary" : "btn-ghost")}
            onClick={() => setBilling("yearly")}
            aria-pressed={billing === "yearly"}
          >Yearly <span className="cb-selplan-save-badge">Save 20%</span></button>
        </div>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); if (onSkip) onSkip(); }}
          className="cb-selplan-skip"
        >Skip for now<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cb-selplan-skip-icon"><path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg></a>
      </div>

      <WToast message={error} type="error" onClose={() => setError("")} />

      <div className="card cb-selplan-table">
        {freeDisabled &&
        <div className="cb-free-col-tip cb-selplan-free-tip">
          <span className="cb-selplan-free-tip-bubble">You've already taken a free subscription for this account.
            <span className="cb-selplan-free-tip-arrow" />
          </span>
        </div>
        }
        {/* Header row: plan name, price, CTA */}
        <div className="cb-selplan-grid-head">
          <div />
          {cols.map((c, i) => {
            const dim = freeDisabled && c.name === "Free";
            return (
              <div key={i} className="cb-selplan-col-head" style={{
                opacity: dim ? 0.45 : 1,
                filter: dim ? "blur(2px)" : "none",
                pointerEvents: dim ? "none" : "auto",
                background: c.best ? "rgba(124, 92, 252, 0.10)" : "transparent",
                borderLeft: i > 0 ? "1px solid var(--border)" : "none",
                borderTop: c.best ? "1px solid var(--purple)" : "none",
                borderTopLeftRadius: c.best ? 12 : 0,
                borderTopRightRadius: c.best ? 12 : 0
              }}>
              {c.best &&
                <div className="cb-selplan-reco-badge">Recommended</div>
                }
              <div className="cb-selplan-col-name">{c.name}</div>
              <div className="cb-selplan-col-price">
                {c[billing]}<span className="cb-selplan-price-suffix">{priceSuffix}</span>
              </div>
              <button className={"btn btn-" + c.ctaStyle + " btn-sm cb-selplan-cta"} disabled={!!busyPlan} style={{ opacity: busyPlan && busyPlan !== c.name ? 0.6 : 1, ...(c.ctaStyle === "secondary" ? { background: "var(--surface-3)", border: "1px solid var(--border-2)", color: "var(--text)" } : {}) }} onClick={() => {handleInstallClick(c.name)}}>
                {busyPlan === c.name ? "Creating…" : c.cta}
              </button>
            </div>);

          })}
        </div>
        {/* Feature rows */}
        {rows.map((r, i) =>
        <div key={i} className="cb-selplan-grid-row" style={{
          borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none"
        }}>
            <div className="cb-selplan-row-label">{r.label}</div>
            {r.vals.map((v, j) =>
          <div key={j} className="cb-selplan-cell" style={{
            opacity: freeDisabled && cols[j].name === "Free" ? 0.45 : 1,
            filter: freeDisabled && cols[j].name === "Free" ? "blur(2px)" : "none",
            background: cols[j].best ? "rgba(124, 92, 252, 0.06)" : "transparent"
          }}>{v}</div>
          )}
          </div>
        )}
      </div>
    </WAuthShell>);

}

// ---------- UPGRADE PAGE ----------

export { WSelectPlan };
