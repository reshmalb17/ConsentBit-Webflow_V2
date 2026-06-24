import React from "react";
import { WMainTabs } from "../../kit/WMainTabs.jsx";
import { WPage } from "../../kit/WPage.jsx";
import { WTopBar } from "../../kit/WTopBar.jsx";
import { cookieCategories } from "../../../lib/bannerContent.js";
import { WScheduleScan } from "../../kit/WScheduleScan.jsx";
import { WAddCookie } from "../../kit/WAddCookie.jsx";

const SITE_DOMAIN = "testsite123.com";

// Scanner category list derives from the shared cookieCategories. Each row shows
// a live cookie count (0 in the mockup) appended to the canonical category name.
const SCAN_CATS = cookieCategories.map((c) => ({ id: c.name, label: `${c.name} (0 Cookie)`, desc: c.description }));

function WScan() {
  const [active, setActive] = React.useState(SCAN_CATS[0].id);
  const [scanning, setScanning] = React.useState(false);
  const [schedule, setSchedule] = React.useState(false);
  const [addCookie, setAddCookie] = React.useState(false);
  // Manually-added cookie rules. Each starts as a DRAFT until "Publish Changes".
  const [rules, setRules] = React.useState([]);
  const [bottomTab, setBottomTab] = React.useState("history"); // "history" | "rules"
  const cats = SCAN_CATS;

  const sel = cats.find((c) => c.id === active) || cats[0];
  return (
    <WPage scroll={false} className="cb-scroll-page" style={{ display: "flex", flexDirection: "column" }}>
      <WTopBar />
      <WMainTabs active="scan" left />
      <div className="cb-page" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden", paddingTop: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div className="card" style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--purple-soft)", borderColor: "rgba(124,92,252,0.3)" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Last successful scan</div>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>February 11, 2026 19:35:12 (UTC)</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setScanning(true)}>Scan Now</button>
          </div>
          <div className="card" style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--purple-soft)", borderColor: "rgba(124,92,252,0.3)" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Next scan</div>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>Not scheduled</div>
            </div>
            <button className="btn btn-primary btn-sm" style={{ padding: "6px 10px 5px" }} onClick={() => setSchedule(true)}>Schedule Scan</button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Cookie List</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary btn-sm" style={{ padding: "6px 10px 5px" }} onClick={() => setAddCookie(true)}>Add Cookie <span style={{ color: "var(--purple-hi)", marginLeft: 2, fontWeight: 600 }}>+</span></button>
            <button className="btn btn-success btn-sm" style={{ padding: "6px 10px 5px" }} onClick={() => setRules((rs) => rs.map((r) => ({ ...r, status: "published" })))}>Publish Changes</button>
          </div>
        </div>
        <div className="card" style={{ overflow: "hidden", marginBottom: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr" }}>
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
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.55 }}>{sel.desc}</div>
            </div>
          </div>
        </div>

        {/* Tab bar — Scan History / My Cookie Rules */}
        <div style={{ display: "flex", alignItems: "center", gap: 22, borderBottom: "1px solid var(--border)", marginBottom: 12 }}>
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
                  {t.id === "rules" && rules.length > 0 &&
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "#F5A623", borderRadius: 999, minWidth: 16, height: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>{rules.length}</span>
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
              {[
              { date: "11 Feb 2026 19:35:12", urls: "2" },
              { date: "11 Feb 2026 19:35:12", urls: "1 (Homepage)" },
              { date: "11 Feb 2026 19:35:12", urls: "2" },
              { date: "11 Feb 2026 19:35:12", urls: "1 (Homepage)" }].
              map((r, i) =>
              <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{r.date}</td>
                  <td><span className="badge badge-green"><span className="badge-dot" />Completed</span></td>
                  <td>{r.urls}</td>
                  <td style={{ color: "var(--text-muted)" }}>NA</td>
                  <td style={{ color: "var(--text-muted)" }}>NA</td>
                  <td style={{ color: "var(--text-muted)" }}>NA</td>
                  <td style={{ textAlign: "right" }}><a href="#" style={{ color: "var(--purple-hi)", fontSize: 11 }}>More info</a></td>
                </tr>
              )}
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
                {rules.map((r, i) =>
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                      {r.name}
                      {r.status === "draft" &&
                        <span className="badge badge-yellow" style={{ textTransform: "uppercase", fontSize: 9, letterSpacing: "0.04em" }}>Draft</span>
                      }
                    </span>
                  </td>
                  <td>{r.domain}{r.provider ? ` (${r.provider})` : ""}</td>
                  <td>{r.category}</td>
                  <td style={{ color: r.duration ? "var(--text)" : "var(--text-muted)" }}>{r.duration || "—"}</td>
                  <td style={{ color: r.scriptUrlPattern ? "var(--text)" : "var(--text-muted)" }}>{r.scriptUrlPattern || "—"}</td>
                  <td style={{ textAlign: "right" }}>
                    <button onClick={() => setRules((rs) => rs.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#FF8888", fontSize: 11, fontWeight: 600 }}>Delete</button>
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
      {schedule && <WScheduleScan onClose={() => setSchedule(false)} />}

      {/* Add cookie popup */}
      {addCookie &&
        <WAddCookie
          domain={SITE_DOMAIN}
          onClose={() => setAddCookie(false)}
          onSaveDraft={(rule) => { setRules((rs) => [...rs, rule]); setBottomTab("rules"); }}
        />
      }
    </WPage>);

}

export { WScan };
