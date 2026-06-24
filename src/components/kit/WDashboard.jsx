import React from "react";
import { Page } from "../primitives/Page.jsx";
import { WMainTabs } from "./WMainTabs.jsx";
import { WPage } from "./WPage.jsx";
import { WStat } from "./WStat.jsx";
import { WTopBar } from "./WTopBar.jsx";

function WDashboard() {
  return (
    <WPage>
      <WTopBar />
      <WMainTabs active="dashboard" />
      <div className="cb-page">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
          <WStat label="Cookies detected" value="42" sub="↑ 4 since last scan" accent="var(--purple-hi)" />
          <WStat label="Page views (30d)" value="84.2K" sub="↑ 12%" />
          <WStat label="Consent rate" value="68%" sub="↓ 2%" accent="#5AE497" />
          <WStat label="Compliance" value="GDPR" sub="US State Laws" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10 }}>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Consent activity</div>
              <select className="select" style={{ width: "auto", maxWidth: 110 }}><option>Last 30 days</option></select>
            </div>
            <svg viewBox="0 0 320 110" style={{ width: "100%", height: 110 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C5CFC" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#7C5CFC" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,80 C40,60 80,70 120,50 C160,35 200,55 240,40 C280,30 300,45 320,30 L320,110 L0,110 Z" fill="url(#g1)" />
              <path d="M0,80 C40,60 80,70 120,50 C160,35 200,55 240,40 C280,30 300,45 320,30" fill="none" stroke="#8E72FF" strokeWidth="1.5" />
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-faint)", marginTop: 6 }}>
              <span>Apr 1</span><span>Apr 8</span><span>Apr 15</span><span>Apr 22</span><span>Apr 30</span>
            </div>
          </div>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Cookie categories</div>
            {[
            { l: "Necessary", v: 12, c: "#5AE497" },
            { l: "Analytics", v: 14, c: "#8E72FF" },
            { l: "Marketing", v: 9, c: "#FF9F45" },
            { l: "Functional", v: 7, c: "#5AA8FF" }].
            map((r, i) =>
            <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: 999, background: r.c }} />{r.l}</span>
                  <span style={{ color: "var(--text-muted)" }}>{r.v}</span>
                </div>
                <div style={{ height: 5, background: "var(--surface-3)", borderRadius: 99 }}>
                  <div style={{ width: r.v / 14 * 100 + "%", height: "100%", background: r.c, borderRadius: 99 }} />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="card" style={{ padding: 14, marginTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Recent scans</div>
            <a href="#" style={{ color: "var(--purple-hi)", fontSize: 11 }}>View all<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 5, flexShrink: 0 }}><path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg></a>
          </div>
          <table className="tbl">
            <thead><tr><th>URL</th><th>Status</th><th>Cookies</th><th>Date</th></tr></thead>
            <tbody>
              {[
              ["/", "ok", 28, "Apr 30, 14:02"],
              ["/pricing", "ok", 24, "Apr 30, 14:01"],
              ["/blog", "warn", 36, "Apr 30, 14:00"],
              ["/contact", "ok", 22, "Apr 29, 22:11"]].
              map((r, i) =>
              <tr key={i}>
                  <td>acne.com{r[0]}</td>
                  <td><span className={"badge " + (r[1] === "ok" ? "badge-green" : "badge-yellow")}><span className="badge-dot" />{r[1] === "ok" ? "Healthy" : "Review"}</span></td>
                  <td>{r[2]}</td>
                  <td style={{ color: "var(--text-muted)" }}>{r[3]}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </WPage>);

}

export { WDashboard };
