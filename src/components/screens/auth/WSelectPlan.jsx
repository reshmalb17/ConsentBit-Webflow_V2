import React from "react";
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
    <><div>500,000 page views/m</div><div style={{ fontSize: 9.5, color: "var(--text-muted)", marginTop: 2 }}>+ $0.05 / additional 1000 page views</div></>,
    <><div>2 Million page views/m</div><div style={{ fontSize: 9.5, color: "var(--text-muted)", marginTop: 2 }}>+ $0.05 / additional 1000 page views</div></>]
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 999, padding: 3 }}>
          <button
            className={"btn btn-sm " + (billing === "monthly" ? "btn-primary" : "btn-ghost")}
            style={{ borderRadius: 999 }}
            onClick={() => setBilling("monthly")}
            aria-pressed={billing === "monthly"}
          >Monthly</button>
          <button
            className={"btn btn-sm " + (billing === "yearly" ? "btn-primary" : "btn-ghost")}
            style={{ borderRadius: 999, display: "flex", alignItems: "center", gap: 6 }}
            onClick={() => setBilling("yearly")}
            aria-pressed={billing === "yearly"}
          >Yearly <span style={{ fontSize: 9.5, fontWeight: 700, color: "#5AE497", background: "var(--green-soft)", padding: "2px 7px", borderRadius: 999 }}>Save 20%</span></button>
        </div>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); if (onSkip) onSkip(); }}
          style={{ color: "var(--text-muted)", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5 }}
        >Skip for now<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg></a>
      </div>

      <WToast message={error} type="error" onClose={() => setError("")} />

      <div className="card" style={{ padding: 0, overflow: "visible", marginTop: 10, position: "relative" }}>
        {freeDisabled &&
        <div className="cb-free-col-tip" style={{
          position: "absolute", top: 0, bottom: 0,
          left: "120px", width: "calc((100% - 120px) / 4)",
          zIndex: 6, cursor: "not-allowed"
        }}>
          <span style={{
            position: "absolute", bottom: "calc(100% - 64px)", left: "50%", transform: "translateX(-50%)",
            width: 180, background: "#0a0a14", color: "#fff", fontSize: 11, lineHeight: 1.45,
            textAlign: "center", padding: "8px 10px", borderRadius: 8, boxShadow: "0 10px 24px rgba(0,0,0,0.55)",
            opacity: 0, pointerEvents: "none", transition: "opacity 0.15s", zIndex: 7
          }}>You've already taken a free subscription for this account.
            <span style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid #0a0a14" }} />
          </span>
        </div>
        }
        {/* Header row: plan name, price, CTA */}
        <div style={{ display: "grid", gridTemplateColumns: "120px repeat(4, 1fr)", borderBottom: "1px solid var(--border)" }}>
          <div />
          {cols.map((c, i) => {
            const dim = freeDisabled && c.name === "Free";
            return (
              <div key={i} style={{
                padding: "14px 10px 10px",
                textAlign: "center",
                position: "relative",
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
                <div style={{
                  position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                  background: "var(--purple)", color: "white",
                  fontSize: 10, fontWeight: 500,
                  padding: "4px 12px", borderRadius: 999, whiteSpace: "nowrap",
                  zIndex: 2,
                  boxShadow: "0 4px 12px rgba(124,92,252,0.4)"
                }}>Recommended</div>
                }
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, fontWeight: 500 }}>{c.name}</div>
              <div style={{ fontSize: 19, fontWeight: 700, lineHeight: 1, marginBottom: 8 }}>
                {c[billing]}<span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 400 }}>{priceSuffix}</span>
              </div>
              <button className={"btn btn-" + c.ctaStyle + " btn-sm"} disabled={!!busyPlan} style={{ width: "100%", justifyContent: "center", opacity: busyPlan && busyPlan !== c.name ? 0.6 : 1, ...(c.ctaStyle === "secondary" ? { background: "var(--surface-3)", border: "1px solid var(--border-2)", color: "var(--text)" } : {}) }} onClick={() => {handleInstallClick(c.name)}}>
                {busyPlan === c.name ? "Creating…" : c.cta}
              </button>
            </div>);

          })}
        </div>
        {/* Feature rows */}
        {rows.map((r, i) =>
        <div key={i} style={{
          display: "grid",
          gridTemplateColumns: "120px repeat(4, 1fr)",
          borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none"
        }}>
            <div style={{ padding: "7px 12px", fontSize: 11.5, color: "var(--text-muted)", display: "flex", alignItems: "center" }}>{r.label}</div>
            {r.vals.map((v, j) =>
          <div key={j} style={{
            padding: "7px 10px",
            fontSize: 11.5,
            textAlign: "center",
            opacity: freeDisabled && cols[j].name === "Free" ? 0.45 : 1,
            filter: freeDisabled && cols[j].name === "Free" ? "blur(2px)" : "none",
            borderLeft: "1px solid var(--border)",
            background: cols[j].best ? "rgba(124, 92, 252, 0.06)" : "transparent",
            display: "flex", flexDirection: "column", justifyContent: "center"
          }}>{v}</div>
          )}
          </div>
        )}
      </div>
    </WAuthShell>);

}

// ---------- UPGRADE PAGE ----------

export { WSelectPlan };
