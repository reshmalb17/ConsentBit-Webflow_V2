import React from "react";
import "./WScan.css";
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

// Known category keys (every canonical category except Uncategorized). Any scanned
// cookie whose category doesn't match one of these falls into the Uncategorized bucket.
const KNOWN_CAT_KEYS = new Set(
  cookieCategories.map((c) => c.id.toLowerCase()).filter((k) => k !== "uncategorized")
);

// Does a cookie's category belong to the given canonical category key?
// Uncategorized catches empty/unknown categories (i.e. anything with no known match).
const catMatches = (cookieCat, key) => {
  const cc = String(cookieCat || "").toLowerCase();
  if (String(key).toLowerCase() === "uncategorized") {
    return cc === "" || cc === "uncategorized" || !KNOWN_CAT_KEYS.has(cc);
  }
  return cc === String(key).toLowerCase();
};

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
  // `scanning` keeps the Scan button disabled/"Scanning…" for the whole scan.
  // `scanPopup` shows the loading popup only briefly, then we drop the user into the
  // Scan History table where the live "Scanning" row takes over.
  const [scanning, setScanning] = React.useState(false);
  const [scanPopup, setScanPopup] = React.useState(false);
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
    cookies.filter((c) => catMatches(c.category, cat.key)).length;
  const cats = SCAN_CATS.map((c) => ({ ...c, label: `${c.id} (${countFor(c)} Cookie)` }));

  const sel = cats.find((c) => c.id === active) || cats[0];
  const selCookies = cookies.filter((c) => catMatches(c.category, sel.key));

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

  // Scan Now — trigger → briefly show popup → drop into the live History table →
  // poll scan-history until terminal → refresh cookies → reset.
  const handleScanNow = async () => {
    if (scanning) return; // guard: ignore extra clicks while a scan is running (no dup rows)
    if (!siteId) { setScanError("This site isn't registered yet. Select a plan and publish first."); return; }
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } // no leaked pollers
    setScanError("");
    setScanning(true);
    setScanPopup(true);
    try {
      const result = await scanSiteNow(siteId); // 1 API call (POST)
      if (!result?.success) {
        setScanError(result?.error || "Scan failed. Please try again.");
        setScanning(false);
        setScanPopup(false);
        return;
      }
      if (!result.scanning) {
        // Synchronous scan — results are ready.
        await loadData(siteId);
        setScanning(false);
        setScanPopup(false);
        scrollToHistory();
        return;
      }
      // Background scan.
      const targetId = result.scanHistoryId ? String(result.scanHistoryId) : null;
      // Show the new "Scanning" row right away (1 call), then move to the History table.
      try { const h0 = await getScanHistory(siteId); if (Array.isArray(h0?.scans)) setScans(h0.scans); } catch { /* ignore */ }
      setTimeout(() => { setScanPopup(false); scrollToHistory(); }, 1600);
      // Poll scan-history every 5s (1 call/tick) until this row is terminal.
      let elapsed = 0;
      pollRef.current = setInterval(async () => {
        elapsed += 5000;
        try {
          const hist = await getScanHistory(siteId);
          if (Array.isArray(hist?.scans)) setScans(hist.scans); // keep the row live
          const row = (hist?.scans || []).find((s) => !targetId || String(s.id) === targetId);
          if ((row && isTerminalStatus(row.scanStatus)) || elapsed >= 120000) {
            clearInterval(pollRef.current);
            pollRef.current = null;
            // Scan done — refresh cookies only (history is already live above).
            try { const ck = await getSiteCookies(siteId); if (ck?.success && Array.isArray(ck.cookies)) setCookies(ck.cookies); } catch { /* ignore */ }
            setScanning(false); // button + everything back to normal
          }
        } catch { /* keep polling */ }
      }, 5000);
    } catch (e) {
      setScanError(e?.message || "Scan failed. Please try again.");
      setScanning(false);
      setScanPopup(false);
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
    <WPage scroll={false} className="cb-scroll-page cb-scan-page">
      <WToast message={scanError} type="error" onClose={() => setScanError("")} />
      <WTopBar />
      <WMainTabs active="scan" left />
      <div className="cb-page cb-scan-page-body">
        <div className="cb-scan-cards">
          <div className="card cb-scan-info-card">
            <div>
              <div className="cb-scan-card-title">Last successful scan</div>
              <div className="cb-scan-card-sub">{lastScan ? `${fmtDate(lastScan.createdAt)} (UTC)` : "No scans yet"}</div>
            </div>
            <button className="btn btn-primary btn-sm" disabled={scanning} onClick={handleScanNow}>{scanning ? "Scanning…" : "Scan Now"}</button>
          </div>
          <div className="card cb-scan-info-card">
            <div>
              <div className="cb-scan-card-title">Next scan</div>
              <div className="cb-scan-card-sub">{nextScan ? `${fmtDate(nextScan.when)} (UTC) · ${nextScan.frequency}` : "Not scheduled"}</div>
              {nextScan &&
                <button onClick={handleCancelSchedule} disabled={cancelling} className="cb-scan-cancel-btn">
                  {cancelling ? "Cancelling…" : "Cancel scheduled scan"}
                </button>
              }
            </div>
            <button className="btn btn-primary btn-sm cb-scan-btn-pad" onClick={() => setSchedule(true)}>Schedule Scan</button>
          </div>
        </div>

        <div className="cb-scan-row-head">
          <div className="cb-scan-section-title">Cookie List</div>
          <div className="cb-scan-btn-group">
            <button className="btn btn-secondary btn-sm cb-scan-btn-pad" onClick={() => setAddCookie(true)}>Add Cookie <span className="cb-scan-plus">+</span></button>
            <button className="btn btn-success btn-sm cb-scan-btn-pad" disabled={publishing} onClick={handlePublishRules}>{publishing ? "Publishing…" : "Publish Changes"}</button>
          </div>
        </div>
        <div className="card cb-scan-card-block">
          <div className="cb-scan-grid">
            <div className="cb-scan-cat-list">
              {cats.map((c) =>
              <div
                key={c.id}
                onClick={() => setActive(c.id)}
                className={"cb-sub-item cb-scan-cat-item " + (active === c.id ? "active" : "")}>

                  {c.label}
                </div>
              )}
            </div>
            <div className="cb-scan-cat-body">
              <div className="cb-scan-cat-name">{sel.id}</div>
              <div className="cb-scan-cat-desc" style={{ marginBottom: selCookies.length ? 12 : 0 }}>{sel.desc}</div>
              {selCookies.length > 0 &&
                <div className="cb-scan-cookie-list">
                  {selCookies.map((c) =>
                    <div key={c.id} className="cb-scan-cookie-item">
                      <span className="cb-scan-cookie-name">{c.name}</span>
                      {String(sel.key).toLowerCase() !== "uncategorized" &&
                        <span className="cb-scan-cookie-meta">{c.provider || c.domain || ""}</span>
                      }
                    </div>
                  )}
                </div>
              }
            </div>
          </div>
        </div>

        {/* Tab bar — Scan History / My Cookie Rules */}
        <div ref={historyRef} className="cb-scan-tabbar">
          {[
            { id: "history", label: "Scan History" },
            { id: "rules", label: "My Cookie Rules" }].
            map((t) => {
              const on = bottomTab === t.id;
              return (
                <button key={t.id} onClick={() => setBottomTab(t.id)} className="cb-scan-tab" style={{
                  color: on ? "var(--purple-hi)" : "var(--text-muted)",
                  borderBottom: "2px solid " + (on ? "var(--purple-hi)" : "transparent")
                }}>
                  {t.label}
                  {t.id === "rules" && draftCount > 0 &&
                    <span className="cb-scan-badge">{draftCount}</span>
                  }
                </button>);
            })}
        </div>

        {bottomTab === "history" &&
        <div className="card cb-scan-card-block">
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
              </tr>
            </thead>
            <tbody>
              {scans.length === 0 ?
              <tr><td colSpan={6} className="cb-scan-empty-cell">No scans yet. Click <b role="button" tabIndex={0} onClick={() => !scanning && handleScanNow()} onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !scanning) { e.preventDefault(); handleScanNow(); } }} className="cb-scan-link" style={{ cursor: scanning ? "default" : "pointer", opacity: scanning ? 0.6 : 1 }}>Scan Now</b> to scan your site.</td></tr> :
              scans.map((r) => {
                const failed = String(r.scanStatus || "").toLowerCase() === "failed" || String(r.scanStatus || "").toLowerCase() === "error";
                const done = isTerminalStatus(r.scanStatus);
                return (
                <tr key={r.id}>
                  <td className="cb-scan-td-medium">{fmtDate(r.createdAt)}</td>
                  <td>
                    {failed ?
                      <span className="badge badge-red"><span className="badge-dot" />Failed</span> :
                    done ?
                      <span className="badge badge-green"><span className="badge-dot" />Completed</span> :
                      <span className="badge badge-yellow"><span className="badge-dot" />Scanning</span>}
                  </td>
                  <td className="cb-scan-td-break">{r.scanUrl || "—"}</td>
                  <td>{Array.isArray(r.categories) ? r.categories.length : "—"}</td>
                  <td>{r.cookiesFound ?? 0}</td>
                  <td>{r.scriptsFound ?? 0}</td>
                </tr>);
              })}
            </tbody>
          </table>
          </div>
        </div>
        }

        {bottomTab === "rules" &&
        <div className="cb-scan-rules-wrap">
          <div className="cb-scan-rules-note">
            Rules are applied during scanning to override cookie categories. Publish drafts to activate them.
          </div>
          {rules.length === 0 ?
            <div className="card cb-scan-empty-card">
              No cookie rules yet. Use <b role="button" tabIndex={0} onClick={() => setAddCookie(true)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setAddCookie(true); } }} className="cb-scan-link-static">Add Cookie</b> to create one.
            </div> :
            <div className="card cb-scan-card-ovh">
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
                  <td className="cb-scan-td-bold">
                    <span className="cb-scan-inline-gap">
                      {r.name}
                      {!Number(r.published) &&
                        <span className="badge badge-yellow cb-scan-draft-badge">Draft</span>
                      }
                    </span>
                  </td>
                  <td>{r.domain}{r.provider ? ` (${r.provider})` : ""}</td>
                  <td>{r.category}</td>
                  <td style={{ color: r.duration ? "var(--text)" : "var(--text-muted)" }}>{r.duration || "—"}</td>
                  <td style={{ color: r.scriptUrlPattern ? "var(--text)" : "var(--text-muted)" }}>{r.scriptUrlPattern || "—"}</td>
                  <td className="cb-scan-td-right">
                    <button onClick={() => handleDeleteRule(r.id)} className="cb-scan-delete-btn">Delete</button>
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

      {/* Scanning popup — shown briefly, then the live History row takes over */}
      {scanPopup &&
      <div onClick={() => { setScanPopup(false); scrollToHistory(); }} className="cb-scan-popup-overlay">
        <div onClick={(e) => e.stopPropagation()} className="cb-scan-popup-card">
          <svg width="44" height="44" viewBox="0 0 56 56" className="cb-scan-popup-svg">
            <circle cx="28" cy="14" r="4" fill="#7C5CFC"><animate attributeName="opacity" values="1;.3;1" dur="1s" begin="0s" repeatCount="indefinite" /></circle>
            <circle cx="40" cy="28" r="4" fill="#8E72FF"><animate attributeName="opacity" values="1;.3;1" dur="1s" begin="0.2s" repeatCount="indefinite" /></circle>
            <circle cx="28" cy="42" r="4" fill="#A78BFA"><animate attributeName="opacity" values="1;.3;1" dur="1s" begin="0.4s" repeatCount="indefinite" /></circle>
            <circle cx="16" cy="28" r="4" fill="#7C5CFC"><animate attributeName="opacity" values="1;.3;1" dur="1s" begin="0.6s" repeatCount="indefinite" /></circle>
          </svg>
          <div className="cb-scan-popup-title">Scanning…</div>
          <div className="cb-scan-popup-sub">Your site is scanning</div>
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
