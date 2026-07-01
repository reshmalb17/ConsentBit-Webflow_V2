import React from "react";
import { WMainTabs } from "../../kit/WMainTabs.jsx";
import { WPage } from "../../kit/WPage.jsx";
import { WTopBar } from "../../kit/WTopBar.jsx";
import { cookieCategories } from "../../../lib/bannerContent.js";
import { WScheduleScan } from "../../kit/WScheduleScan.jsx";
import { WAddCookie } from "../../kit/WAddCookie.jsx";
import { WToast } from "../../kit/WToast.jsx";
import {
  getWebflowSiteContext,
  getWebflowSiteStatus,
  scanSiteNow,
  getScanHistory,
  getSiteCookies,
  getScheduledScans,
  deleteScheduledScan,
  getCustomCookieRules,
  publishCustomCookieRules,
  deleteCustomCookieRule,
} from "../../../lib/api.js";

const SITE_DOMAIN = "testsite123.com";

// Canonical scanner categories (count is filled in live from the scan results).
const SCAN_CATS = cookieCategories.map((c) => ({ id: c.name, key: c.id, desc: c.description }));

// A scan row is terminal when it's no longer pending/scanning.
const isTerminalStatus = (s) => {
  const v = String(s || "").toLowerCase();
  return v === "completed" || v === "complete" || v === "success" || v === "failed" || v === "error";
};

// Format an ISO timestamp like "11 Feb 2026 19:35:12".
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

function WScan() {
  const [active, setActive] = React.useState(SCAN_CATS[0].id);
  const [scanning, setScanning] = React.useState(false);
  const [schedule, setSchedule] = React.useState(false);
  const [addCookie, setAddCookie] = React.useState(false);
  // Manually-added cookie rules. Each starts as a DRAFT until "Publish Changes".
  const [rules, setRules] = React.useState([]);
  const [bottomTab, setBottomTab] = React.useState("history"); // "history" | "rules"

  // ── Live scan state ────────────────────────────────────────────────────────
  const [siteId, setSiteId] = React.useState(null);     // webapp Site id
  const [domain, setDomain] = React.useState("");       // site domain (for cookie rules)
  const [scans, setScans] = React.useState([]);         // scan history rows
  const [cookies, setCookies] = React.useState([]);     // flat cookie list
  const [scheduledScans, setScheduledScans] = React.useState([]); // active schedules
  const [scanError, setScanError] = React.useState("");
  const [cancelling, setCancelling] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const pollRef = React.useRef(null);
  const historyRef = React.useRef(null); // scroll target for the Scan History table

  // After a scan finishes, switch to the History tab and scroll it into view.
  const scrollToHistory = React.useCallback(() => {
    setBottomTab("history");
    setTimeout(() => historyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  }, []);

  // Count cookies per canonical category (case-insensitive match on category).
  const countFor = (cat) =>
    cookies.filter((c) => String(c.category || "").toLowerCase() === cat.key.toLowerCase()).length;
  const cats = SCAN_CATS.map((c) => ({ ...c, label: `${c.id} (${countFor(c)} Cookie)` }));

  const sel = cats.find((c) => c.id === active) || cats[0];
  const selCookies = cookies.filter((c) => String(c.category || "").toLowerCase() === (sel.key || "").toLowerCase());

  // Number of unpublished (draft) cookie rules — shown as the tab badge.
  const draftCount = rules.filter((r) => !Number(r.published)).length;

  // Most recent terminal scan → "Last successful scan".
  const lastScan = scans.find((s) => isTerminalStatus(s.scanStatus));

  // Soonest active scheduled scan → "Next scan".
  const nextScan = scheduledScans
    .filter((s) => Number(s.isActive ?? 1) === 1)
    .map((s) => ({ ...s, when: s.nextRunAt || s.scheduledAt }))
    .filter((s) => s.when)
    .sort((a, b) => new Date(a.when) - new Date(b.when))[0];

  // Load scan history + cookies + scheduled scans for the current site.
  const loadData = React.useCallback(async (sid) => {
    if (!sid) return;
    try {
      const [hist, ck, sched, rls] = await Promise.all([
        getScanHistory(sid),
        getSiteCookies(sid),
        getScheduledScans(sid),
        getCustomCookieRules(sid),
      ]);
      if (hist?.success && Array.isArray(hist.scans)) setScans(hist.scans);
      if (ck?.success && Array.isArray(ck.cookies)) setCookies(ck.cookies);
      if (sched?.success && Array.isArray(sched.scheduledScans)) setScheduledScans(sched.scheduledScans);
      if (rls?.success && Array.isArray(rls.rules)) setRules(rls.rules);
    } catch (e) {
      setScanError(e?.message || "Failed to load scan data.");
    }
  }, []);

  // On mount: resolve the webapp site id, then load existing scan data.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { wfSiteId, domain: siteDomain } = await getWebflowSiteContext();
        if (!wfSiteId) return;
        if (siteDomain && !cancelled) setDomain(siteDomain);
        const status = await getWebflowSiteStatus(wfSiteId);
        if (cancelled || !status.webappSiteId) return;
        setSiteId(status.webappSiteId);
        await loadData(status.webappSiteId);
      } catch (e) {
        if (!cancelled) setScanError(e?.message || "Couldn't load this site.");
      }
    })();
    return () => { cancelled = true; if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadData]);

  // Scan Now — same flow as consentbitwebapp: trigger → (poll if async) → reload.
  const handleScanNow = async () => {
    if (!siteId) { setScanError("This site isn't registered yet. Select a plan and publish first."); return; }
    setScanError("");
    setScanning(true);
    try {
      const result = await scanSiteNow(siteId);
      if (!result?.success) {
        setScanError(result?.error || "Scan failed. Please try again.");
        setScanning(false);
        return;
      }
      if (result.scanning) {
        // Background scan — poll scan-history every 4s until this row is terminal.
        const targetId = result.scanHistoryId ? String(result.scanHistoryId) : null;
        let elapsed = 0;
        pollRef.current = setInterval(async () => {
          elapsed += 4000;
          try {
            const hist = await getScanHistory(siteId);
            const row = (hist?.scans || []).find((s) => !targetId || String(s.id) === targetId);
            if ((row && isTerminalStatus(row.scanStatus)) || elapsed >= 120000) {
              clearInterval(pollRef.current);
              pollRef.current = null;
              await loadData(siteId);
              setScanning(false);
              scrollToHistory();
            }
          } catch { /* keep polling */ }
        }, 4000);
      } else {
        // Synchronous scan — results are ready.
        await loadData(siteId);
        setScanning(false);
        scrollToHistory();
      }
    } catch (e) {
      setScanError(e?.message || "Scan failed. Please try again.");
      setScanning(false);
    }
  };

  // Cancel the upcoming scheduled scan.
  const handleCancelSchedule = async () => {
    if (!nextScan?.id || cancelling) return;
    setCancelling(true);
    setScanError("");
    try {
      const res = await deleteScheduledScan(nextScan.id);
      if (res?.success) await loadData(siteId);
      else setScanError(res?.error || "Couldn't cancel the scheduled scan.");
    } catch (e) {
      setScanError(e?.message || "Network error cancelling the scheduled scan.");
    } finally {
      setCancelling(false);
    }
  };

  // Publish all draft cookie rules.
  const handlePublishRules = async () => {
    if (!siteId || publishing) return;
    setPublishing(true);
    setScanError("");
    try {
      const res = await publishCustomCookieRules(siteId);
      if (res?.success) await loadData(siteId);
      else setScanError(res?.error || "Couldn't publish cookie rules.");
    } catch (e) {
      setScanError(e?.message || "Network error publishing cookie rules.");
    } finally {
      setPublishing(false);
    }
  };

  // Delete a single cookie rule.
  const handleDeleteRule = async (id) => {
    if (!id) return;
    try {
      const res = await deleteCustomCookieRule(id);
      if (res?.success) await loadData(siteId);
      else setScanError(res?.error || "Couldn't delete the cookie rule.");
    } catch (e) {
      setScanError(e?.message || "Network error deleting the cookie rule.");
    }
  };
  return (
    <WPage scroll={false} className="cb-scroll-page" style={{ display: "flex", flexDirection: "column" }}>
      <WToast message={scanError} type="error" onClose={() => setScanError("")} />
      <WTopBar />
      <WMainTabs active="scan" left />
      <div className="cb-page" style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingTop: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div className="card" style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--purple-soft)", borderColor: "rgba(124,92,252,0.3)" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Last successful scan</div>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{lastScan ? `${fmtDate(lastScan.createdAt)} (UTC)` : "No scans yet"}</div>
            </div>
            <button className="btn btn-primary btn-sm" disabled={scanning} onClick={handleScanNow}>{scanning ? "Scanning…" : "Scan Now"}</button>
          </div>
          <div className="card" style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--purple-soft)", borderColor: "rgba(124,92,252,0.3)" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Next scan</div>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{nextScan ? `${fmtDate(nextScan.when)} (UTC) · ${nextScan.frequency}` : "Not scheduled"}</div>
              {nextScan &&
                <button onClick={handleCancelSchedule} disabled={cancelling} style={{ background: "none", border: "none", padding: 0, marginTop: 4, color: "#FF8888", fontSize: 10.5, fontWeight: 600, cursor: "pointer" }}>
                  {cancelling ? "Cancelling…" : "Cancel scheduled scan"}
                </button>
              }
            </div>
            <button className="btn btn-primary btn-sm" style={{ padding: "6px 10px 5px" }} onClick={() => setSchedule(true)}>Schedule Scan</button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Cookie List</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary btn-sm" style={{ padding: "6px 10px 5px" }} onClick={() => setAddCookie(true)}>Add Cookie <span style={{ color: "var(--purple-hi)", marginLeft: 2, fontWeight: 600 }}>+</span></button>
            <button className="btn btn-success btn-sm" style={{ padding: "6px 10px 5px" }} disabled={publishing} onClick={handlePublishRules}>{publishing ? "Publishing…" : "Publish Changes"}</button>
          </div>
        </div>
        <div className="card" style={{ overflow: "hidden", marginBottom: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", minHeight: 240 }}>
            <div style={{ borderRight: "1px solid var(--border)", padding: "6px 0" }}>
              {cats.map((c) =>
              <div
                key={c.id}
                onClick={() => setActive(c.id)}
                className={"cb-sub-item " + (active === c.id ? "active" : "")}
                style={{ padding: "10px 14px", fontSize: 11.5, cursor: "pointer" }}>
                
                  {c.label}
                </div>
              )}
            </div>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{sel.id}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.55, marginBottom: selCookies.length ? 12 : 0 }}>{sel.desc}</div>
              {selCookies.length > 0 &&
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {selCookies.map((c) =>
                    <div key={c.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 11, padding: "6px 8px", background: "var(--bg-2)", borderRadius: 6 }}>
                      <span style={{ fontWeight: 600, wordBreak: "break-all" }}>{c.name}</span>
                      <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{c.provider || c.domain || ""}</span>
                    </div>
                  )}
                </div>
              }
            </div>
          </div>
        </div>

        {/* Tab bar — Scan History / My Cookie Rules */}
        <div ref={historyRef} style={{ display: "flex", alignItems: "center", gap: 22, borderBottom: "1px solid var(--border)", marginBottom: 12 }}>
          {[
            { id: "history", label: "Scan History" },
            { id: "rules", label: "My Cookie Rules" }].
            map((t) => {
              const on = bottomTab === t.id;
              return (
                <button key={t.id} onClick={() => setBottomTab(t.id)} style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: "6px 0 10px", fontSize: 13, fontWeight: 600,
                  color: on ? "var(--purple-hi)" : "var(--text-muted)",
                  borderBottom: "2px solid " + (on ? "var(--purple-hi)" : "transparent"),
                  display: "inline-flex", alignItems: "center", gap: 7
                }}>
                  {t.label}
                  {t.id === "rules" && draftCount > 0 &&
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "#F5A623", borderRadius: 999, minWidth: 16, height: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>{draftCount}</span>
                  }
                </button>);
            })}
        </div>

        {bottomTab === "history" &&
        <div className="card" style={{ overflow: "hidden", marginBottom: 18 }}>
          <div className="cb-scroll-table">
          <table className="tbl">
            <thead>
              <tr>
                <th>Scan Date (UTC ± 00:00)</th>
                <th>Scan Status</th>
                <th>Urls Scanned</th>
                <th>Categories</th>
                <th>Cookies</th>
                <th>Scripts</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {scans.length === 0 ?
              <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "22px 12px" }}>No scans yet. Click <b style={{ color: "var(--text)" }}>Scan Now</b> to scan your site.</td></tr> :
              scans.map((r) => {
                const failed = String(r.scanStatus || "").toLowerCase() === "failed" || String(r.scanStatus || "").toLowerCase() === "error";
                const done = isTerminalStatus(r.scanStatus);
                return (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{fmtDate(r.createdAt)}</td>
                  <td>
                    {failed ?
                      <span className="badge badge-red"><span className="badge-dot" />Failed</span> :
                    done ?
                      <span className="badge badge-green"><span className="badge-dot" />Completed</span> :
                      <span className="badge badge-yellow"><span className="badge-dot" />Scanning</span>}
                  </td>
                  <td style={{ wordBreak: "break-all" }}>{r.scanUrl || "—"}</td>
                  <td style={{ color: "var(--text-muted)" }}>{Array.isArray(r.categories) ? r.categories.length : "—"}</td>
                  <td>{r.cookiesFound ?? 0}</td>
                  <td>{r.scriptsFound ?? 0}</td>
                  <td style={{ textAlign: "right", color: "var(--text-muted)", fontSize: 10.5 }}>{r.scanDuration != null ? `${r.scanDuration}ms` : ""}</td>
                </tr>);
              })}
            </tbody>
          </table>
          </div>
        </div>
        }

        {bottomTab === "rules" &&
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 10, lineHeight: 1.5 }}>
            Rules are applied during scanning to override cookie categories. Publish drafts to activate them.
          </div>
          {rules.length === 0 ?
            <div className="card" style={{ padding: "26px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
              No cookie rules yet. Use <b style={{ color: "var(--text)" }}>Add Cookie</b> to create one.
            </div> :
            <div className="card" style={{ overflow: "hidden" }}>
            <div className="cb-scroll-table">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Cookie ID</th>
                  <th>Domain (Provider)</th>
                  <th>Category</th>
                  <th>Duration</th>
                  <th>Script Pattern</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) =>
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                      {r.name}
                      {!Number(r.published) &&
                        <span className="badge badge-yellow" style={{ textTransform: "uppercase", fontSize: 9, letterSpacing: "0.04em" }}>Draft</span>
                      }
                    </span>
                  </td>
                  <td>{r.domain}{r.provider ? ` (${r.provider})` : ""}</td>
                  <td>{r.category}</td>
                  <td style={{ color: r.duration ? "var(--text)" : "var(--text-muted)" }}>{r.duration || "—"}</td>
                  <td style={{ color: r.scriptUrlPattern ? "var(--text)" : "var(--text-muted)" }}>{r.scriptUrlPattern || "—"}</td>
                  <td style={{ textAlign: "right" }}>
                    <button onClick={() => handleDeleteRule(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#FF8888", fontSize: 11, fontWeight: 600 }}>Delete</button>
                  </td>
                </tr>
                )}
              </tbody>
            </table>
            </div>
            </div>
          }
        </div>
        }
      </div>

      {/* Scanning popup */}
      {scanning &&
      <div onClick={() => setScanning(false)} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(8,6,20,0.6)", backdropFilter: "blur(2px)", display: "grid", placeItems: "center", padding: 20 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: 280, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 26, textAlign: "center" }}>
          <svg width="44" height="44" viewBox="0 0 56 56" style={{ marginBottom: 12 }}>
            <circle cx="28" cy="14" r="4" fill="#7C5CFC"><animate attributeName="opacity" values="1;.3;1" dur="1s" begin="0s" repeatCount="indefinite" /></circle>
            <circle cx="40" cy="28" r="4" fill="#8E72FF"><animate attributeName="opacity" values="1;.3;1" dur="1s" begin="0.2s" repeatCount="indefinite" /></circle>
            <circle cx="28" cy="42" r="4" fill="#A78BFA"><animate attributeName="opacity" values="1;.3;1" dur="1s" begin="0.4s" repeatCount="indefinite" /></circle>
            <circle cx="16" cy="28" r="4" fill="#7C5CFC"><animate attributeName="opacity" values="1;.3;1" dur="1s" begin="0.6s" repeatCount="indefinite" /></circle>
          </svg>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Scanning…</div>
          <div style={{ color: "var(--text-muted)", fontSize: 11.5 }}>Your site is scanning</div>
        </div>
      </div>
      }

      {/* Schedule scan popup */}
      {schedule &&
        <WScheduleScan
          siteId={siteId}
          onClose={() => setSchedule(false)}
          onConfirm={() => loadData(siteId)}
        />
      }

      {/* Add cookie popup */}
      {addCookie &&
        <WAddCookie
          siteId={siteId}
          domain={domain || SITE_DOMAIN}
          onClose={() => setAddCookie(false)}
          onSaved={() => { loadData(siteId); setBottomTab("rules"); }}
        />
      }
    </WPage>);

}

export { WScan };
