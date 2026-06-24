import React from "react";
import { WMainTabs } from "../../kit/WMainTabs.jsx";
import { WPage } from "../../kit/WPage.jsx";
import { WTopBar } from "../../kit/WTopBar.jsx";
import { cookieCategories } from "../../../lib/bannerContent.js";

// Scanner category list derives from the shared cookieCategories. Each row shows
// a live cookie count (0 in the mockup) appended to the canonical category name.
const SCAN_CATS = cookieCategories.map((c) => ({ id: c.name, label: `${c.name} (0 Cookie)`, desc: c.description }));

function WScan() {
  const [active, setActive] = React.useState(SCAN_CATS[0].id);
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
            <button className="btn btn-primary btn-sm">Scan Now</button>
          </div>
          <div className="card" style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--purple-soft)", borderColor: "rgba(124,92,252,0.3)" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Next scan</div>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>Not scheduled</div>
            </div>
            <button className="btn btn-primary btn-sm" style={{ padding: "6px 10px 5px" }}>Schedule Scan</button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Cookie List</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary btn-sm" style={{ padding: "6px 10px 5px" }}>Add Cookie <span style={{ color: "var(--purple-hi)", marginLeft: 2, fontWeight: 600 }}>+</span></button>
            <button className="btn btn-success btn-sm" style={{ padding: "6px 10px 5px" }}>Publish Changes</button>
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

        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>Scan History</div>
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
      </div>
    </WPage>);

}

export { WScan };
