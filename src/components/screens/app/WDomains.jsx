import React from "react";
import { WMainTabs } from "../../kit/WMainTabs.jsx";
import { WPage } from "../../kit/WPage.jsx";
import { WTopBar } from "../../kit/WTopBar.jsx";

function WDomains() {
  const rows = [
  { url: "acne.com", status: "Active", plan: "Basic", expires: "Mar 17, 2026" },
  { url: "shop.acne.com", status: "Active", plan: "Free", expires: "—" },
  { url: "blog.acne.com", status: "Paused", plan: "Free", expires: "—" },
  { url: "docs.acne.com", status: "Active", plan: "Essential", expires: "Jun 02, 2026" }];

  return (
    <WPage>
      <WTopBar />
      <WMainTabs active="dashboard" left />
      <div className="cb-page">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Your domains</div>
          <button className="btn btn-primary">+ Add Domain</button>
        </div>
        <div className="card" style={{ overflow: "hidden" }}>
          <table className="tbl">
            <thead><tr><th>Domain</th><th>Status</th><th>Plan</th><th>Expires</th><th></th></tr></thead>
            <tbody>
              {rows.map((r, i) =>
              <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{r.url}</td>
                  <td><span className={"badge " + (r.status === "Active" ? "badge-green" : "badge-yellow")}><span className="badge-dot" />{r.status}</span></td>
                  <td><span className={"badge " + (r.plan === "Free" ? "badge-grey" : "badge-purple")}>{r.plan}</span></td>
                  <td style={{ color: "var(--text-muted)" }}>{r.expires}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn btn-secondary btn-sm">Manage</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </WPage>);

}

export { WDomains };
