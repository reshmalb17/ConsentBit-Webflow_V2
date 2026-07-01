import React from "react";
import { WMainTabs } from "../../kit/WMainTabs.jsx";
import { WPage } from "../../kit/WPage.jsx";
import { WTopBar } from "../../kit/WTopBar.jsx";
import { Field } from "../../primitives/Field.jsx";
import { Page } from "../../primitives/Page.jsx";
import { useNav } from "../../../nav.jsx";
import { getWebflowSiteContext, getWebflowBilling, cancelWebflowSubscription } from "../../../lib/api.js";

// Per-tier plan facts (limits shown on the "Your Current plan" card) keyed by
// the live plan from status. Not per-account live data — these are the product's
// plan definitions; the LIVE bit is which tier the account is on (nav.plan).
const PLAN_FEATURES = {
  free:      { label: "Free",      domains: "01", scans: "100",    pageviews: "—",          compliance: "GDPR/CCPA" },
  basic:     { label: "Basic",     domains: "01", scans: "750",    pageviews: "100,000/mo", compliance: "GDPR/CCPA" },
  essential: { label: "Essential", domains: "01", scans: "5,000",  pageviews: "500,000/mo", compliance: "GDPR+CCPA" },
  growth:    { label: "Growth",    domains: "01", scans: "10,000", pageviews: "2,000,000/mo", compliance: "GDPR+CCPA" },
};
const NEXT_PLAN = { free: "Basic", basic: "Essential", essential: "Growth", growth: null };

function WProfile() {
  const [editing, setEditing] = React.useState(false);
  const nav = useNav();

  const planKey = String(nav?.plan || "free").toLowerCase();
  const feat = PLAN_FEATURES[planKey] || PLAN_FEATURES.free;
  const nextPlan = NEXT_PLAN[planKey];
  const isPaid = planKey !== "free";
  const accountEmail = nav?.accountEmail || "";

  // ── Live billing (real invoices + cancel) ──────────────────────────────────
  const [wfSiteId, setWfSiteId] = React.useState(null);
  const [billing, setBilling] = React.useState(null);
  const [loadingBilling, setLoadingBilling] = React.useState(true);
  const [cancelling, setCancelling] = React.useState(false);
  const [cancelMsg, setCancelMsg] = React.useState("");
  const [confirmCancel, setConfirmCancel] = React.useState(false);

  const loadBilling = React.useCallback(async (sid) => {
    if (!sid) { setLoadingBilling(false); return; }
    setLoadingBilling(true);
    try { setBilling(await getWebflowBilling(sid)); } catch { setBilling(null); }
    finally { setLoadingBilling(false); }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { wfSiteId: sid } = await getWebflowSiteContext();
        if (cancelled) return;
        setWfSiteId(sid);
        await loadBilling(sid);
      } catch { if (!cancelled) setLoadingBilling(false); }
    })();
    return () => { cancelled = true; };
  }, [loadBilling]);

  const invoices = Array.isArray(billing?.invoices) ? billing.invoices : [];
  const cancelAtPeriodEnd = !!billing?.cancelAtPeriodEnd;

  const handleCancelSubscription = async () => {
    if (cancelling || !wfSiteId) return;
    setConfirmCancel(false);
    setCancelling(true);
    setCancelMsg("");
    try {
      const res = await cancelWebflowSubscription(wfSiteId);
      if (res?.success) { setCancelMsg("Your subscription will end at the current period's end."); await loadBilling(wfSiteId); }
      else setCancelMsg(res?.error || "Couldn't cancel the subscription.");
    } catch (e) { setCancelMsg(e?.message || "Network error cancelling the subscription."); }
    finally { setCancelling(false); }
  };

  return (
    <WPage style={{ position: "relative" }}>
      <WTopBar />
      <WMainTabs active="" left />
      <div style={{ padding: "16px 16px", borderTop: "1px solid var(--border)", marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Profile Settings</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-success btn-sm">Save</button>
            <button className="btn btn-dark btn-sm" onClick={nav ? () => nav.setProfileOpen(false) : undefined}>← Back</button>
          </div>
        </div>

        {/* Account owner */}
        <div className="card" style={{ padding: 12, marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--purple-soft)", borderColor: "rgba(124,92,252,0.3)" }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 12.5 }}>Account Owner</div>
            <div style={{ fontSize: 12 }}>{accountEmail || "—"}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Edit</button>
            <button className="btn btn-primary btn-sm">Transfer Ownership</button>
          </div>
        </div>

        {/* Current plan */}
        <div className="card" style={{ padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Your Current plan</div>
            <div style={{ color: "var(--purple-hi)", fontWeight: 600, fontSize: 13 }}>{feat.label}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 12 }}>
            {[
            ["Domains", feat.domains],
            ["Scans", feat.scans],
            ["Page views", feat.pageviews],
            ["Compliance", feat.compliance]].
            map((r, i) =>
            <div key={i}>
                <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{r[0]}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--purple-hi)" }}>{r[1]}</div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {nextPlan &&
              <button className="btn btn-primary btn-sm" onClick={nav ? () => { nav.setProfileOpen(false); nav.setMainTab("upgrade"); } : undefined}>Upgrade to {nextPlan}</button>
            }
            {isPaid && !cancelAtPeriodEnd &&
              <button className="btn btn-secondary btn-sm" disabled={cancelling} onClick={() => setConfirmCancel(true)}>{cancelling ? "Cancelling…" : "Cancel Subscription"}</button>
            }
            {isPaid && cancelAtPeriodEnd &&
              <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>Cancels at the end of the current period</span>
            }
          </div>
          {cancelMsg &&
            <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--text-muted)" }}>{cancelMsg}</div>
          }
        </div>

        {/* Invoices */}
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Invoices</div>
          <div className="cb-scroll-table cb-scroll-table-tall">
          <table className="tbl">
            <thead><tr><th>Date</th><th>Number</th><th>Amount</th><th>Status</th><th style={{ width: 40, textAlign: "right" }}>Invoice</th></tr></thead>
            <tbody>
              {loadingBilling ?
                <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px 12px" }}>Loading invoices…</td></tr> :
              invoices.length === 0 ?
                <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px 12px" }}>No invoices yet.</td></tr> :
              invoices.map((inv) => {
                const amt = ((inv.amountPaid || inv.amountDue || 0) / 100).toFixed(2);
                const date = inv.created ? new Date(inv.created).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "—";
                const paid = String(inv.status || "").toLowerCase() === "paid";
                const url = inv.invoicePdf || inv.hostedInvoiceUrl;
                return (
                <tr key={inv.id}>
                  <td>{date}</td>
                  <td className="mono" style={{ color: "var(--purple-hi)" }}>{inv.number || inv.id}</td>
                  <td>{amt} {inv.currency || "USD"}</td>
                  <td><span className={"badge " + (paid ? "badge-green" : "badge-yellow")}><span className="badge-dot" />{inv.status || "—"}</span></td>
                  <td style={{ textAlign: "right" }}>
                    {url ?
                    <a href={url} target="_blank" rel="noopener noreferrer" className="cb-inv-dl" aria-label="Download invoice">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M12 15V3m9 12v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10l5 5l5-5" /></g></svg>
                    </a> : <span style={{ color: "var(--text-faint)" }}>—</span>}
                  </td>
                </tr>);
              })}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Cancel-subscription confirmation popup */}
      {confirmCancel &&
      <div style={{ position: "absolute", inset: 0, background: "rgba(8,6,20,0.6)", backdropFilter: "blur(2px)", display: "grid", placeItems: "center", zIndex: 30, padding: 20 }} onClick={() => setConfirmCancel(false)}>
        <div className="card" style={{ width: 360, maxWidth: "100%", padding: 22, background: "var(--surface)", textAlign: "center", boxShadow: "0 24px 60px rgba(0,0,0,0.55)" }} onClick={(e) => e.stopPropagation()}>
          <div style={{ width: 52, height: 52, borderRadius: 999, margin: "0 auto 14px", display: "grid", placeItems: "center", background: "rgba(244,159,69,0.14)", color: "#F49F45" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /></svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Cancel subscription?</div>
          <div style={{ color: "var(--text-muted)", fontSize: 12.5, lineHeight: 1.55, marginBottom: 20 }}>
            You'll keep access to your <b style={{ color: "var(--text)" }}>{feat.label}</b> plan until the end of the current billing period, then it won't renew.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => setConfirmCancel(false)}>Keep subscription</button>
            <button className="btn btn-sm" style={{ flex: 1, justifyContent: "center", background: "#E5484D", color: "#fff", border: "none" }} disabled={cancelling} onClick={handleCancelSubscription}>{cancelling ? "Cancelling…" : "Yes, cancel"}</button>
          </div>
        </div>
      </div>
      }

      {/* Edit profile popup */}
      {editing &&
      <div style={{ position: "absolute", inset: 0, background: "rgba(8,6,20,0.6)", display: "grid", placeItems: "center", zIndex: 20 }} onClick={() => setEditing(false)}>
        <div className="card" style={{ width: 360, padding: 18, background: "var(--surface)" }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Edit Profile</div>
            <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 15, cursor: "pointer" }}>✕</button>
          </div>
          <Field label="Name" help={false}><input className="input" defaultValue="John Doe" /></Field>
          <Field label="Email" help={false}><input className="input" defaultValue={accountEmail} /></Field>
          <Field label="Time zone" help={false}><select className="select"><option>UTC+05:30 IST</option><option>UTC+00:00 GMT</option><option>UTC-08:00 PST</option></select></Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={() => setEditing(false)}>Save changes</button>
          </div>
        </div>
      </div>
      }
    </WPage>);

}

// ---------- MODALS ----------

export { WProfile };
