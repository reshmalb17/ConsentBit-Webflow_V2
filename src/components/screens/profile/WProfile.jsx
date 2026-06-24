import React from "react";
import { WMainTabs } from "../../kit/WMainTabs.jsx";
import { WPage } from "../../kit/WPage.jsx";
import { WTopBar } from "../../kit/WTopBar.jsx";
import { Field } from "../../primitives/Field.jsx";
import { Page } from "../../primitives/Page.jsx";
import { useNav } from "../../../nav.jsx";

function WProfile() {
  const [editing, setEditing] = React.useState(false);
  const nav = useNav();

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
            <div style={{ fontSize: 12 }}>web@seattlenewmedia.com</div>
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
            <div style={{ color: "var(--purple-hi)", fontWeight: 600, fontSize: 13 }}>Basic</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 12 }}>
            {[
            ["Domains", "01"],
            ["Scans", "100"],
            ["Page views", "7500"],
            ["Compliance", "GDPR/CCPA"]].
            map((r, i) =>
            <div key={i}>
                <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{r[0]}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--purple-hi)" }}>{r[1]}</div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary btn-sm">Upgrade to Essential</button>
            <button className="btn btn-secondary btn-sm">Cancel Subscription</button>
          </div>
        </div>

        {/* Invoices */}
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Invoices</div>
          <div className="cb-scroll-table cb-scroll-table-tall">
          <table className="tbl">
            <thead><tr><th>Date</th><th>Number</th><th>Amount</th><th>Status</th><th style={{ width: 40, textAlign: "right" }}>Invoice</th></tr></thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) =>
              <tr key={i}>
                  <td>Feb 17, 2026</td>
                  <td className="mono" style={{ color: "var(--purple-hi)" }}>5256BCEE-69{i}920</td>
                  <td>25.00 USD</td>
                  <td><span className="badge badge-green"><span className="badge-dot" />Completed</span></td>
                  <td style={{ textAlign: "right" }}>
                    <button className="cb-inv-dl" aria-label="Download invoice">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M12 15V3m9 12v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10l5 5l5-5" /></g></svg>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Edit profile popup */}
      {editing &&
      <div style={{ position: "absolute", inset: 0, background: "rgba(8,6,20,0.6)", display: "grid", placeItems: "center", zIndex: 20 }} onClick={() => setEditing(false)}>
        <div className="card" style={{ width: 360, padding: 18, background: "var(--surface)" }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Edit Profile</div>
            <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 15, cursor: "pointer" }}>✕</button>
          </div>
          <Field label="Name" help={false}><input className="input" defaultValue="John Doe" /></Field>
          <Field label="Email" help={false}><input className="input" defaultValue="web@seattlenewmedia.com" /></Field>
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
