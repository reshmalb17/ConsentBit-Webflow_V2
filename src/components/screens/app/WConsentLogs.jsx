import React from "react";
import "./WConsentLogs.css";
import { WMainTabs } from "../../kit/WMainTabs.jsx";
import { WPage } from "../../kit/WPage.jsx";
import { WTopBar } from "../../kit/WTopBar.jsx";
import { WToast } from "../../kit/WToast.jsx";
import { Icon } from "../../lib/icons.jsx";
import {
  getWebflowSiteContext,
  getWebflowSiteStatus,
  getConsentHistory,
  downloadConsentCsv,
  downloadConsentPdf,
} from "../../../lib/api.js";

const PER_PAGE = 6; // rows per page

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = ["2026", "2025", "2024"];

// status string → display label (same mapping as consentbitwebapp).
function displayStatus(status) {
  if (!status) return "—";
  const s = String(status).toLowerCase();
  if (s === "given" || s === "accepted") return "Accepted";
  if (s === "rejected") return "Rejected";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// Banner type — categories-independent: prefer regulation, fall back to bannerType.
function bannerTypeOf(row) {
  return String(row.bannerType ?? row.regulation ?? "").toUpperCase() || "—";
}

function fmtTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleString();
}

function WConsentLogs() {
  const [siteId, setSiteId] = React.useState(null);
  const [page, setPage] = React.useState(1);
  const [year, setYear] = React.useState("");   // "" = all
  const [month, setMonth] = React.useState("");  // "" = all (value is "01".."12")
  const [consents, setConsents] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [csvBusy, setCsvBusy] = React.useState(false);
  const [pdfBusyId, setPdfBusyId] = React.useState(null);
  const [refreshKey, setRefreshKey] = React.useState(0); // bump to re-fetch current page

  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const start = (page - 1) * PER_PAGE;

  // Collapse duplicate rows: a single accept/reject can write two identical
  // Consent records within the same second (overlapping client handlers), which
  // otherwise show up as two identical rows. De-dupe by content so they render
  // as one. Duplicates land adjacently here (ORDER BY createdAt DESC).
  const visibleConsents = React.useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const r of consents) {
      const key = `${r.createdAt}|${r.status}|${bannerTypeOf(r)}|${r.deviceId ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(r);
    }
    return out;
  }, [consents]);

  // Resolve the webapp site id once.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { wfSiteId } = await getWebflowSiteContext();
        if (!wfSiteId) return;
        const status = await getWebflowSiteStatus(wfSiteId);
        if (!cancelled && status.webappSiteId) setSiteId(status.webappSiteId);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Couldn't load this site.");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Fetch a page of logs whenever site / page / filters change (server-side paging).
  React.useEffect(() => {
    if (!siteId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await getConsentHistory(siteId, { limit: PER_PAGE, offset: start, year, month });
        if (cancelled) return;
        if (data?.success) {
          setConsents(Array.isArray(data.consents) ? data.consents : []);
          setTotal(Number(data.total ?? 0));
        } else {
          setError(data?.error || "Couldn't load consent logs.");
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || "Network error loading consent logs.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [siteId, page, year, month, start, refreshKey]);

  // Reset to page 1 when the filters change.
  const onYear = (v) => { setYear(v); setPage(1); };
  const onMonth = (v) => { setMonth(v); setPage(1); };

  // Manual refresh — re-fetch the current page/filters without a full reload.
  const refresh = () => { if (siteId && !loading) setRefreshKey((k) => k + 1); };

  const exportCsv = async () => {
    if (!siteId || csvBusy) return;
    setCsvBusy(true);
    try {
      await downloadConsentCsv(siteId, { year, month });
    } catch (e) {
      setError(e?.message || "Couldn't export CSV.");
    } finally {
      setCsvBusy(false);
    }
  };

  const exportPdf = async (consentId) => {
    if (!siteId || pdfBusyId) return;
    setPdfBusyId(consentId);
    try {
      await downloadConsentPdf(siteId, consentId);
    } catch (e) {
      setError(e?.message || "Couldn't download PDF.");
    } finally {
      setPdfBusyId(null);
    }
  };

  return (
    <WPage>
      <WToast message={error} type="error" onClose={() => setError("")} />
      <WTopBar />
      <WMainTabs active="logs" left />
      <div className="cb-page cb-logs-page">
        <div className="cb-logs-head">
          <div className="cb-logs-title">Consent Logs</div>
          <div className="cb-logs-toolbar">
            <select className="select cb-dd cb-logs-select" value={year} onChange={(e) => onYear(e.target.value)}>
              <option value="">All years</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className="select cb-dd cb-logs-select" value={month} onChange={(e) => onMonth(e.target.value)}>
              <option value="">All months</option>
              {MONTHS.map((m, i) => <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>)}
            </select>
            <button className="btn btn-secondary btn-sm" title="Refresh" aria-label="Refresh consent logs" disabled={!siteId || loading} onClick={refresh}>
              {loading ? "…" : <Icon.refresh />}
            </button>
            <button className="btn btn-secondary btn-sm" disabled={csvBusy || !consents.length} onClick={exportCsv}>{csvBusy ? "Exporting…" : "Export CSV"}</button>
          </div>
        </div>
        <div className="card cb-logs-table-card">
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
              {loading && visibleConsents.length === 0 ?
              <tr><td colSpan={5} className="cb-logs-empty-cell">Loading…</td></tr> :
              visibleConsents.length === 0 ?
              <tr><td colSpan={5} className="cb-logs-empty-cell">No consent logs yet.</td></tr> :
              visibleConsents.map((r) =>
              <tr key={r.id}>
                  <td className="mono cb-logs-id">{String(r.id).slice(0, 12)}</td>
                  <td className="cb-logs-td-medium">{fmtTime(r.createdAt)}</td>
                  <td>{displayStatus(r.status)}</td>
                  <td><span className="badge badge-grey">{bannerTypeOf(r)}</span></td>
                  <td>
                    <button className="btn btn-secondary btn-sm cb-logs-dl-btn" title="Download PDF" aria-label="Download PDF" disabled={pdfBusyId === r.id} onClick={() => exportPdf(r.id)}>
                      {pdfBusyId === r.id ? "…" : <Icon.download />}
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="cb-logs-pagination">
          <div className="cb-logs-page-info">
            Showing {total === 0 ? 0 : start + 1}–{Math.min(start + PER_PAGE, total)} of {total}
          </div>
          <div className="cb-logs-page-btns">
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5).map((n) =>
            <button key={n} className={"btn btn-sm " + (n === page ? "btn-primary" : "btn-secondary")} onClick={() => setPage(n)}>{n}</button>
            )}
            <button className="btn btn-secondary btn-sm" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>Next</button>
          </div>
        </div>
      </div>
    </WPage>);

}

export { WConsentLogs };
