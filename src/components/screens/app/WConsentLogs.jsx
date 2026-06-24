import React from "react";
import { WMainTabs } from "../../kit/WMainTabs.jsx";
import { WPage } from "../../kit/WPage.jsx";
import { WTopBar } from "../../kit/WTopBar.jsx";
import { Icon } from "../../lib/icons.jsx";

const PER_PAGE = 6; // max rows per page

// Up to 20 consent log entries (mock data).
const logs = [
  { time: "6/16/2026, 9:14:39 PM", status: "Partial", type: "GDPR", a: "Rejected", m: "Rejected", p: "Accepted" },
  { time: "6/16/2026, 9:13:32 PM", status: "Partial", type: "GDPR", a: "Rejected", m: "Accepted", p: "Accepted" },
  { time: "6/16/2026, 9:13:04 PM", status: "Partial", type: "GDPR", a: "Rejected", m: "Accepted", p: "Rejected" },
  { time: "6/16/2026, 9:12:34 PM", status: "Rejected", type: "GDPR", a: "Rejected", m: "Rejected", p: "Rejected" },
  { time: "6/16/2026, 7:19:39 PM", status: "Partial", type: "GDPR", a: "Accepted", m: "Accepted", p: "Accepted" },
  { time: "6/16/2026, 7:19:13 PM", status: "Partial", type: "GDPR", a: "Rejected", m: "Rejected", p: "Accepted" },
  { time: "6/16/2026, 7:19:13 PM", status: "Partial", type: "GDPR", a: "Accepted", m: "Rejected", p: "Accepted" },
  { time: "6/16/2026, 7:17:43 PM", status: "Partial", type: "GDPR", a: "Accepted", m: "Rejected", p: "Rejected" },
  { time: "6/15/2026, 5:42:10 PM", status: "Partial", type: "GDPR", a: "Accepted", m: "Accepted", p: "Rejected" },
  { time: "6/15/2026, 5:41:02 PM", status: "Accepted", type: "GDPR", a: "Accepted", m: "Accepted", p: "Accepted" },
  { time: "6/15/2026, 3:30:55 PM", status: "Rejected", type: "GDPR", a: "Rejected", m: "Rejected", p: "Rejected" },
  { time: "6/15/2026, 1:12:20 PM", status: "Partial", type: "GDPR", a: "Rejected", m: "Accepted", p: "Accepted" },
  { time: "6/14/2026, 11:05:48 AM", status: "Partial", type: "GDPR", a: "Accepted", m: "Rejected", p: "Accepted" },
  { time: "6/14/2026, 10:58:33 AM", status: "Partial", type: "GDPR", a: "Rejected", m: "Accepted", p: "Rejected" },
  { time: "6/14/2026, 9:47:19 AM", status: "Accepted", type: "GDPR", a: "Accepted", m: "Accepted", p: "Accepted" },
  { time: "6/13/2026, 8:22:07 PM", status: "Partial", type: "GDPR", a: "Accepted", m: "Accepted", p: "Rejected" },
  { time: "6/13/2026, 6:15:44 PM", status: "Rejected", type: "GDPR", a: "Rejected", m: "Rejected", p: "Rejected" },
  { time: "6/13/2026, 4:09:31 PM", status: "Partial", type: "GDPR", a: "Rejected", m: "Accepted", p: "Accepted" },
  { time: "6/12/2026, 2:55:12 PM", status: "Partial", type: "GDPR", a: "Accepted", m: "Rejected", p: "Accepted" },
  { time: "6/12/2026, 12:40:00 PM", status: "Accepted", type: "GDPR", a: "Accepted", m: "Accepted", p: "Accepted" },
  { time: "6/11/2026, 6:30:18 PM", status: "Partial", type: "GDPR", a: "Rejected", m: "Accepted", p: "Rejected" },
  { time: "6/11/2026, 4:18:52 PM", status: "Partial", type: "GDPR", a: "Accepted", m: "Rejected", p: "Accepted" },
  { time: "6/10/2026, 2:05:41 PM", status: "Rejected", type: "GDPR", a: "Rejected", m: "Rejected", p: "Rejected" },
  { time: "6/10/2026, 11:22:09 AM", status: "Accepted", type: "GDPR", a: "Accepted", m: "Accepted", p: "Accepted" }
].slice(0, 24).map((r, i) => ({ id: consentId(i), ...r })); // max 24 entries

// Stable random-looking consent id per row (deterministic so it doesn't change
// on every render).
function consentId(i) {
  const h = (((i + 1) * 2654435761) >>> 0).toString(16).toUpperCase().padStart(8, "0");
  return `CNS-${h.slice(0, 4)}-${h.slice(4, 8)}`;
}

function WConsentLogs() {
  const [page, setPage] = React.useState(1);
  const pageCount = Math.max(1, Math.ceil(logs.length / PER_PAGE));
  const start = (page - 1) * PER_PAGE;
  const rows = logs.slice(start, start + PER_PAGE);

  return (
    <WPage>
      <WTopBar />
      <WMainTabs active="logs" left />
      <div className="cb-page" style={{ width: "698px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Consent Logs</div>
          <div style={{ display: "flex", gap: 8 }}>
            <select className="select cb-dd" style={{ width: "auto" }}><option>All categories</option></select>
            <select className="select cb-dd" style={{ width: "auto" }}><option>All years</option><option>2026</option><option>2025</option><option>2024</option></select>
            <select className="select cb-dd" style={{ width: "auto" }}><option>All months</option><option>January</option><option>February</option><option>March</option><option>April</option><option>May</option><option>June</option><option>July</option><option>August</option><option>September</option><option>October</option><option>November</option><option>December</option></select>
            <button className="btn btn-secondary btn-sm">Export CSV</button>
          </div>
        </div>
        <div className="card" style={{ overflow: "hidden", width: "662px" }}>
          <table className="tbl cb-logs-tbl">
            <thead>
              <tr>
                <th>Consent ID</th>
                <th>Time (UTC)</th>
                <th>Status</th>
                <th>Banner Type</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) =>
              <tr key={i}>
                  <td className="mono" style={{ color: "var(--purple-hi)" }}>{r.id}</td>
                  <td style={{ fontWeight: 500 }}>{r.time}</td>
                  <td>{r.status}</td>
                  <td><span className="badge badge-blue">{r.type}</span></td>
                  <td>
                    <button className="btn btn-secondary btn-sm" title="Download Pdf" aria-label="Download Pdf" style={{ padding: "6px 8px" }}><Icon.download /></button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
            Showing {logs.length === 0 ? 0 : start + 1}–{Math.min(start + PER_PAGE, logs.length)} of {logs.length}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) =>
            <button key={n} className={"btn btn-sm " + (n === page ? "btn-primary" : "btn-secondary")} onClick={() => setPage(n)}>{n}</button>
            )}
            <button className="btn btn-secondary btn-sm" disabled={page === pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>Next</button>
          </div>
        </div>
      </div>
    </WPage>);

}

// ---------- COOKIE BANNER EDITOR ----------

export { WConsentLogs };
