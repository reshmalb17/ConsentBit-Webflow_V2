import React from "react";
import "./WProfile.css";
import { WMainTabs } from "../../kit/WMainTabs.jsx";
import { WPage } from "../../kit/WPage.jsx";
import { WTopBar } from "../../kit/WTopBar.jsx";
import { Page } from "../../primitives/Page.jsx";
import { useNav } from "../../../nav.jsx";
import { getWebflowSiteContext, getWebflowSiteStatus, getWebflowBilling, cancelWebflowSubscription, requestOwnershipTransfer, updateOwnerProfile, trackWebflowEvent } from "../../../lib/api.js";

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
  const nav = useNav();

  // Only show plan/billing details once a plan is actually taken — no "Free"
  // fallback card for unregistered/skipped users.
  const hasPlan = !!(nav && nav.registered);
  const planKey = String(nav?.plan || "free").toLowerCase();
  const feat = PLAN_FEATURES[planKey] || PLAN_FEATURES.free;
  const nextPlan = NEXT_PLAN[planKey];
  const isPaid = planKey !== "free";
  const accountEmail = nav?.accountEmail || "";
  // No dedicated name field exists in the account data — derive a readable name
  // from the email local-part (e.g. "john.doe@x.com" → "John Doe"). Editable.
  const accountName = React.useMemo(() => {
    const local = (accountEmail.split("@")[0] || "").trim();
    if (!local) return "";
    return local
      .replace(/[._-]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }, [accountEmail]);

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

  // Refresh the account owner on profile open so the card + transfer intro always
  // show the CURRENT owner (not a value cached from app launch — which can be stale
  // if a transfer was authorized in another session).
  React.useEffect(() => {
    nav?.refreshAccount?.();
    // profile_settings_viewed — funnel step 11. Fired once on open via the first-party
    // /api/wf/track endpoint; the worker emits it to PostHog server-side (no client key).
    trackWebflowEvent("profile_settings_viewed");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const invoices = Array.isArray(billing?.invoices) ? billing.invoices : [];
  const cancelAtPeriodEnd = !!billing?.cancelAtPeriodEnd;
  // When cancelled, the plan stays active until the end of the current billing period.
  const periodEndDate = billing?.currentPeriodEnd
    ? new Date(billing.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    : null;

  // Live usage (scans + page views completed this billing month) from the billing API.
  const fmtNum = (n) => (typeof n === "number" ? n.toLocaleString() : "—");
  const scansUsed = loadingBilling ? "…" : fmtNum(billing?.scansUsed);
  const pageviewsUsed = loadingBilling ? "…" : fmtNum(billing?.pageviewsUsed);

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

  // ── Transfer ownership ─────────────────────────────────────────────────────
  // Moves the whole account (sites, subscription, consent data) to a new owner.
  // We email an authorization link to the CURRENT owner; nothing changes until
  // they click it. The backend resolves the current owner from this site's org.
  const [transferOpen, setTransferOpen] = React.useState(false);
  const [tNewEmail, setTNewEmail] = React.useState("");
  const [tNewName, setTNewName] = React.useState("");
  const [tConfirm, setTConfirm] = React.useState(false);
  const [tSaving, setTSaving] = React.useState(false);
  const [tError, setTError] = React.useState("");        // general/API error
  const [tNameErr, setTNameErr] = React.useState("");    // per-field errors
  const [tEmailErr, setTEmailErr] = React.useState("");
  const [tConfirmErr, setTConfirmErr] = React.useState("");
  const [tSentTo, setTSentTo] = React.useState("");
  const [tDevLink, setTDevLink] = React.useState("");

  const tEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tNewEmail.trim());
  const tIsSameEmail = tEmailValid && tNewEmail.trim().toLowerCase() === accountEmail.toLowerCase();
  const canSubmitTransfer = tEmailValid && !tIsSameEmail && tNewName.trim().length > 0 && tConfirm && !tSaving;

  const resetTransfer = () => {
    setTransferOpen(false); setTNewEmail(""); setTNewName(""); setTConfirm(false);
    setTError(""); setTNameErr(""); setTEmailErr(""); setTConfirmErr(""); setTSentTo(""); setTDevLink("");
  };

  const handleSubmitTransfer = async () => {
    if (tSaving) return;
    // Per-field validation — surface each error next to its own field.
    let ok = true;
    setTError(""); setTNameErr(""); setTEmailErr(""); setTConfirmErr("");
    if (!tNewName.trim()) { setTNameErr("Please enter the new owner's name."); ok = false; }
    if (!tNewEmail.trim()) { setTEmailErr("Please enter the new owner's email."); ok = false; }
    else if (!tEmailValid) { setTEmailErr("Enter a valid email address."); ok = false; }
    else if (tIsSameEmail) { setTEmailErr("Must be different from the current owner."); ok = false; }
    if (!tConfirm) { setTConfirmErr("Please tick the confirmation to continue."); ok = false; }
    if (!ok) return;
    setTSaving(true);
    try {
      const res = await requestOwnershipTransfer({ newEmail: tNewEmail.trim().toLowerCase(), newName: tNewName.trim() });
      if (res?.success) { setTSentTo(res.sentTo || accountEmail); if (res.authorizeLink) setTDevLink(res.authorizeLink); }
      else setTError(res?.error || "Failed to start ownership transfer.");
    } catch (e) {
      setTError(e?.message || "Failed to start ownership transfer.");
    } finally {
      setTSaving(false);
    }
  };

  // ── Edit profile (billing email) ───────────────────────────────────────────
  // Mirrors the webapp's Edit: the only persisted field is the billing email
  // (the account/login email changes only via Transfer Ownership).
  const [editOpen, setEditOpen] = React.useState(false);
  const [eBilling, setEBilling] = React.useState("");
  const [eSaving, setESaving] = React.useState(false);
  const [eError, setEError] = React.useState("");
  const [eSaved, setESaved] = React.useState(false);

  const eBillingValid = eBilling.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eBilling.trim());

  const openEdit = async () => {
    setEBilling(billing?.billingEmail || "");
    setEError(""); setESaved(false); setEditOpen(true);
    // The billing response doesn't carry the billing email — resolve it from the
    // status call (which returns it for the authenticated site) to pre-fill.
    try {
      const sid = wfSiteId || (await getWebflowSiteContext()).wfSiteId;
      if (sid) {
        const status = await getWebflowSiteStatus(sid);
        if (status?.billingEmail) setEBilling(status.billingEmail);
      }
    } catch { /* leave whatever we have */ }
  };
  const closeEdit = () => { setEditOpen(false); setEError(""); setESaved(false); };

  const handleSaveProfile = async () => {
    if (!eBillingValid || eSaving) return;
    setESaving(true); setEError(""); setESaved(false);
    try {
      const res = await updateOwnerProfile({ billingEmail: eBilling.trim().toLowerCase() });
      if (res?.success) { setESaved(true); await loadBilling(wfSiteId); }
      else setEError(res?.error || "Couldn't save your profile.");
    } catch (e) {
      setEError(e?.message || "Network error saving your profile.");
    } finally {
      setESaving(false);
    }
  };

  return (
    <WPage className="cb-profile-page">
      <WTopBar />
      {/* Navbar (Cookie Banner / Scan / Consent Logs / Upgrade) hidden in the profile section */}
      {/* <WMainTabs active="" left /> */}
      <div className="cb-profile-body">
        <div className="cb-profile-header">
          <div className="cb-profile-title">Profile Settings</div>
          <div className="cb-profile-header-actions">
            <button className="btn btn-dark btn-sm" onClick={nav ? () => nav.setProfileOpen(false) : undefined}>← Back</button>
          </div>
        </div>

        {/* Account owner */}
        <div className="card cb-profile-owner-card">
          <div>
            <div className="cb-profile-owner-label">Account Owner</div>
            <div className="cb-profile-owner-email">{accountEmail || "—"}</div>
          </div>
          <div className="cb-profile-header-actions">
            {hasPlan &&
              <button className="btn btn-primary btn-sm" onClick={() => { resetTransfer(); setTransferOpen(true); }}>Transfer Ownership</button>
            }
          </div>
        </div>

        {/* Current plan — hidden until a plan is taken (no "Free" fallback card) */}
        {hasPlan &&
        <div className="card cb-profile-plan-card">
          <div className="cb-profile-plan-head">
            <div className="cb-profile-plan-title">Your Current plan</div>
            <div className="cb-profile-plan-label">{feat.label}</div>
          </div>
          <div className="cb-profile-plan-grid">
            {[
            ["Domains", feat.domains],
            ["Scans used", scansUsed, `of ${feat.scans}`],
            ["Page views used", pageviewsUsed, feat.pageviews !== "—" ? `of ${feat.pageviews}` : null],
            ["Compliance", feat.compliance]].
            map((r, i) =>
            <div key={i}>
                <div className="cb-profile-stat-label">{r[0]}</div>
                <div className="cb-profile-stat-value">{r[1]}</div>
                {r[2] && <div className="cb-profile-stat-sub">{r[2]}</div>}
              </div>
            )}
          </div>
          <div className="cb-profile-plan-actions">
            {nextPlan &&
              <button className="btn btn-primary btn-sm" onClick={nav ? () => { nav.setProfileOpen(false); nav.setMainTab("upgrade"); } : undefined}>Upgrade to {nextPlan}</button>
            }
            {isPaid && !loadingBilling && !cancelAtPeriodEnd &&
              <button className="btn btn-secondary btn-sm" disabled={cancelling} onClick={() => setConfirmCancel(true)}>{cancelling ? "Cancelling…" : "Cancel Subscription"}</button>
            }
          </div>
          {isPaid && cancelAtPeriodEnd &&
            <div className="cb-profile-cancel-note">
              <span className="cb-profile-muted">Your subscription is cancelled{periodEndDate ? ` and will end on ${periodEndDate}` : ""}. </span>
              <a href="#" onClick={(e) => { e.preventDefault(); if (nav) { nav.setProfileOpen(false); nav.setMainTab("upgrade"); } }} className="cb-profile-link">Subscribe Now</a>
            </div>
          }
          {cancelMsg && !cancelAtPeriodEnd &&
            <div className="cb-profile-cancel-msg">{cancelMsg}</div>
          }
        </div>
        }

        {/* Invoices — billing history, also hidden until a plan is taken */}
        {hasPlan &&
        <div className="card cb-profile-invoices-card">
          <div className="cb-profile-invoices-title">Invoices</div>
          <div className="cb-scroll-table cb-scroll-table-tall">
          <table className="tbl">
            <thead><tr><th>Date</th><th>Number</th><th>Amount</th><th>Status</th><th className="cb-profile-th-invoice">Invoice</th></tr></thead>
            <tbody>
              {loadingBilling ?
                <tr><td colSpan={5} className="cb-profile-empty-cell">Loading invoices…</td></tr> :
              invoices.length === 0 ?
                <tr><td colSpan={5} className="cb-profile-empty-cell">No invoices yet.</td></tr> :
              invoices.map((inv) => {
                const amt = ((inv.amountPaid || inv.amountDue || 0) / 100).toFixed(2);
                const date = inv.created ? new Date(inv.created).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "—";
                const paid = String(inv.status || "").toLowerCase() === "paid";
                const url = inv.invoicePdf || inv.hostedInvoiceUrl;
                return (
                <tr key={inv.id}>
                  <td>{date}</td>
                  <td className="mono cb-profile-inv-number">{inv.number || "—"}</td>
                  <td>{amt} {inv.currency || "USD"}</td>
                  <td><span className={"badge " + (paid ? "badge-green" : "badge-yellow")}><span className="badge-dot" />{inv.status || "—"}</span></td>
                  <td className="cb-profile-td-right">
                    {url ?
                    <a href={url} target="_blank" rel="noopener noreferrer" className="cb-inv-dl" aria-label="Download invoice">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M12 15V3m9 12v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10l5 5l5-5" /></g></svg>
                    </a> : <span className="cb-profile-faint">—</span>}
                  </td>
                </tr>);
              })}
            </tbody>
          </table>
          </div>
        </div>
        }

      </div>

      {/* Transfer-ownership modal — opened by the Account Owner card button */}
      {transferOpen &&
      <div className="cb-profile-cancel-overlay" onClick={resetTransfer}>
        <div className="card cb-profile-cancel-card cb-profile-transfer-modal" onClick={(e) => e.stopPropagation()}>
          {tSentTo ? (
            <>
              <div className="cb-profile-cancel-heading">Authorization email sent</div>
              <div className="cb-profile-cancel-text">
                We sent an authorization link to <b className="cb-profile-strong">{tSentTo}</b>. Open that email and click “Authorize transfer” to complete the change. The link expires shortly for your security.
              </div>
              {tDevLink &&
                <div className="cb-profile-transfer-devlink">
                  Dev link: <a href={tDevLink} target="_blank" rel="noopener noreferrer">{tDevLink}</a>
                </div>
              }
              <div className="cb-profile-cancel-buttons">
                <button className="btn btn-primary btn-sm cb-profile-btn-flex" onClick={() => { resetTransfer(); nav?.refreshAccount?.(); }}>Done</button>
              </div>
            </>
          ) : (
            <>
              <div className="cb-profile-cancel-heading">Transfer ownership</div>
              <div className="cb-profile-cancel-text">
                Transfer complete ownership of this account, including all of its sites, subscription, and consent data, to a new owner. An authorization link will be sent to <b className="cb-profile-strong">{accountEmail || "the current owner"}</b> to confirm this change.
              </div>
              <div className="cb-profile-transfer-form">
                <div>
                  <label className="cb-profile-transfer-label">New owner name</label>
                  <input type="text" value={tNewName} placeholder="Jane Doe"
                    onChange={(e) => { setTNewName(e.target.value); setTNameErr(""); }}
                    className="cb-profile-transfer-input" />
                  {tNameErr && <div className="cb-profile-transfer-err">{tNameErr}</div>}
                </div>
                <div>
                  <label className="cb-profile-transfer-label">New owner email</label>
                  <input type="email" value={tNewEmail} placeholder="jane@example.com"
                    onChange={(e) => { setTNewEmail(e.target.value); setTEmailErr(""); }}
                    className="cb-profile-transfer-input" />
                  {tEmailErr
                    ? <div className="cb-profile-transfer-err">{tEmailErr}</div>
                    : (tNewEmail.trim() && !tEmailValid && <div className="cb-profile-transfer-err">Enter a valid email address.</div>)}
                </div>
                <div>
                  <label className="cb-profile-transfer-check">
                    <input type="checkbox" checked={tConfirm} onChange={(e) => { setTConfirm(e.target.checked); setTConfirmErr(""); }} />
                    <span>I understand this transfers the entire account to the new owner and I will lose access.</span>
                  </label>
                  {tConfirmErr && <div className="cb-profile-transfer-err">{tConfirmErr}</div>}
                </div>
                {tError && <div className="cb-profile-transfer-err">{tError}</div>}
              </div>
              <div className="cb-profile-cancel-buttons">
                <button className="btn btn-secondary btn-sm cb-profile-btn-flex" style={{ padding: "10px 16px" }} disabled={tSaving} onClick={resetTransfer}>Cancel</button>
                <button className="btn btn-primary btn-sm cb-profile-btn-flex" style={{ padding: "10px 16px" }} disabled={tSaving} onClick={handleSubmitTransfer}>{tSaving ? "Confirming…" : "Confirm"}</button>
              </div>
            </>
          )}
        </div>
      </div>
      }

      {/* Edit profile modal — opened by the Account Owner card Edit button */}
      {editOpen &&
      <div className="cb-profile-cancel-overlay" onClick={closeEdit}>
        <div className="card cb-profile-cancel-card cb-profile-transfer-modal" onClick={(e) => e.stopPropagation()}>
          <div className="cb-profile-cancel-heading">Edit profile</div>
          <div className="cb-profile-cancel-text">
            Update the billing email for this account. Your account (login) email is <b className="cb-profile-strong">{accountEmail || "—"}</b> — to change the owner, use Transfer Ownership.
          </div>
          <div className="cb-profile-transfer-form">
            <div>
              <label className="cb-profile-transfer-label">Account email (login)</label>
              <input type="email" value={accountEmail} disabled className="cb-profile-transfer-input" />
            </div>
            <div>
              <label className="cb-profile-transfer-label">Billing email</label>
              <input type="email" value={eBilling} placeholder="billing@example.com"
                onChange={(e) => { setEBilling(e.target.value); setEError(""); setESaved(false); }}
                className="cb-profile-transfer-input" />
              {!eBillingValid && <div className="cb-profile-transfer-err">Enter a valid email address.</div>}
            </div>
            {eError && <div className="cb-profile-transfer-err">{eError}</div>}
            {eSaved && <div className="cb-profile-muted" style={{ fontSize: 11.5, color: "#4ade80" }}>Saved.</div>}
          </div>
          <div className="cb-profile-cancel-buttons">
            <button className="btn btn-secondary btn-sm cb-profile-btn-flex" disabled={eSaving} onClick={closeEdit}>Close</button>
            <button className="btn btn-primary btn-sm cb-profile-btn-flex" disabled={!eBillingValid || eSaving} onClick={handleSaveProfile}>{eSaving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      </div>
      }

      {/* Cancel-subscription confirmation popup */}
      {confirmCancel &&
      <div className="cb-profile-cancel-overlay" onClick={() => setConfirmCancel(false)}>
        <div className="card cb-profile-cancel-card" onClick={(e) => e.stopPropagation()}>
          <div className="cb-profile-cancel-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /></svg>
          </div>
          <div className="cb-profile-cancel-heading">Cancel subscription?</div>
          <div className="cb-profile-cancel-text">
            You'll keep access to your <b className="cb-profile-strong">{feat.label}</b> plan until the end of the current billing period, then it won't renew.
          </div>
          <div className="cb-profile-cancel-buttons">
            <button className="btn btn-secondary btn-sm cb-profile-btn-flex" onClick={() => setConfirmCancel(false)}>Keep subscription</button>
            <button className="btn btn-sm cb-profile-btn-danger" disabled={cancelling} onClick={handleCancelSubscription}>{cancelling ? "Cancelling…" : "Yes, cancel"}</button>
          </div>
        </div>
      </div>
      }

    </WPage>);

}

// ---------- MODALS ----------

export { WProfile };
