import React from "react";
import { WMainTabs } from "../../kit/WMainTabs.jsx";
import { WPage } from "../../kit/WPage.jsx";
import { WTopBar } from "../../kit/WTopBar.jsx";
import { Page } from "../../primitives/Page.jsx";

function WUpgrade() {
  const ACC = "#0777E6";
  // Billing cycle: "monthly" shows the full monthly rate; "yearly" shows the
  // per-month equivalent at a 20% discount (billed annually).
  const [billing, setBilling] = React.useState("monthly");
  const cols = [
  { name: "Free", monthly: "$0", yearly: "$0", current: true },
  { name: "Basic", monthly: "$9", yearly: "$7", cta: "14-day free trial", ctaStyle: "outline" },
  { name: "Essential", monthly: "$20", yearly: "$16", cta: "14-day free trial", ctaStyle: "accent", best: true },
  { name: "Growth", monthly: "$56", yearly: "$45", cta: "14-day free trial", ctaStyle: "outline" }];

  const priceSuffix = billing === "yearly" ? " /mo billed yearly" : " /month";

  const rows = [
  { label: "No of Domains", vals: ["01", "01", "01", "01"] },
  { label: "No of Scans", vals: ["100", "750", "5000 scans", "100,000 pages views/m"] },
  { label: "No of Page views", vals: [
    "PAID",
    "100,000 page views/m",
    <><div>500,000 page views/m</div><div style={{ fontSize: 11, color: "var(--text)", marginTop: 2 }}>+ $0.05 / additional 1000 page views</div></>,
    <><div>2 Million page views/m</div><div style={{ fontSize: 11, color: "var(--text)", marginTop: 2 }}>+ $0.05 / additional 1000 page views</div></>]
  },
  { label: "IAB / TCF", vals: ["NIL", "NIL", "Yes", "Yes"] },
  { label: "Compliance", vals: ["GDPR/CCPA", "GDPR/CCPA", "GDPR+CCPA", "GDPR+CCPA"] }];

  const accentTint = "rgba(7,118,230,0.10)";
  const accentTintLite = "rgba(7,118,230,0.05)";

  const renderCta = (c) => {
    if (c.current) {
      return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 999, padding: "6px 12px" }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: "#5AE497" }} />Current plan
      </span>;
    }
    if (c.ctaStyle === "accent") {
      return <button className="btn btn-sm" style={{ width: "100%", justifyContent: "center", background: ACC, color: "#fff", fontWeight: 700, fontSize: 12, padding: "9px 10px", boxShadow: "0 6px 16px rgba(7,118,230,0.45)" }}>{c.cta}</button>;
    }
    return <button className="btn btn-sm" style={{ width: "100%", justifyContent: "center", background: "var(--surface-3)", color: "var(--text)", border: "1px solid var(--border-2)", fontWeight: 600, fontSize: 12, padding: "9px 10px" }}>{c.cta}</button>;
  };

  return (
    <WPage>
      <WTopBar />
      <WMainTabs active="upgrade" left />
      <div className="cb-page" style={{ paddingTop: 16 }}>
        {/* Tight headline block */}
        <div className="card" style={{ background: "var(--surface)", padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 5 }}>You're on Free. Unlock full compliance with Essential.</div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 }}>Most teams pick Essential — 500,000 pageviews, IAB/TCF, and GDPR+CCPA in one plan.</div>
        </div>

        {/* Billing toggle */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 999, padding: 3, alignItems: "center" }}>
            <button
              className={"btn btn-sm " + (billing === "monthly" ? "btn-primary" : "btn-ghost")}
              style={{ borderRadius: 999 }}
              onClick={() => setBilling("monthly")}
              aria-pressed={billing === "monthly"}
            >Monthly</button>
            <button
              className={"btn btn-sm " + (billing === "yearly" ? "btn-primary" : "btn-ghost")}
              style={{ borderRadius: 999, display: "flex", alignItems: "center", gap: 6 }}
              onClick={() => setBilling("yearly")}
              aria-pressed={billing === "yearly"}
            >
              Yearly <span style={{ fontSize: 9.5, fontWeight: 700, color: "#5AE497", background: "var(--green-soft)", padding: "2px 7px", borderRadius: 999 }}>Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing table */}
        <div className="card" style={{ padding: 0, overflow: "visible", marginTop: 6 }}>
          {/* Header row */}
          <div style={{ display: "grid", gridTemplateColumns: "120px repeat(4, 1fr)", borderBottom: "1px solid var(--border)" }}>
            <div />
            {cols.map((c, i) =>
            <div key={i} style={{
              padding: "20px 10px 16px",
              textAlign: "center",
              position: "relative",
              opacity: c.current ? 0.6 : 1,
              background: c.best ? accentTint : "transparent",
              borderLeft: i > 0 && !c.best ? "1px solid var(--border)" : "none",
              border: c.best ? "2px solid " + ACC : undefined,
              borderRadius: c.best ? 14 : 0,
              boxShadow: c.best ? "0 12px 30px rgba(7,118,230,0.4)" : "none",
              zIndex: c.best ? 3 : 1,
              display: "flex", flexDirection: "column", alignItems: "center"
            }}>
                {c.best &&
              <div style={{
                position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                background: ACC, color: "white",
                fontSize: 10, fontWeight: 700,
                padding: "4px 14px", borderRadius: 999, whiteSpace: "nowrap",
                zIndex: 4,
                boxShadow: "0 4px 12px rgba(7,118,230,0.5)"
              }}>Recommended</div>
              }
                <div style={{ fontSize: 12, color: c.best ? ACC : "var(--text-muted)", marginBottom: 4, fontWeight: c.best ? 700 : 500 }}>{c.name}</div>
                <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, marginBottom: 12 }}>
                  {c[billing]}<span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 400 }}>{priceSuffix}</span>
                </div>
                <div style={{ marginTop: "auto", width: "100%", display: "flex", justifyContent: "center" }}>{renderCta(c)}</div>
              </div>
            )}
          </div>
          {/* Feature rows */}
          {rows.map((r, i) =>
          <div key={i} style={{
            display: "grid",
            gridTemplateColumns: "120px repeat(4, 1fr)",
            borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none"
          }}>
              <div style={{ padding: "12px", fontSize: 12.5, color: "var(--text)", fontWeight: 500, display: "flex", alignItems: "center" }}>{r.label}</div>
              {r.vals.map((v, j) =>
            <div key={j} style={{
              padding: "12px 10px",
              fontSize: 12.5,
              textAlign: "center",
              color: cols[j].current ? "var(--text-muted)" : "var(--text)",
              borderLeft: cols[j].best ? "2px solid " + ACC : "1px solid var(--border)",
              borderRight: cols[j].best ? "2px solid " + ACC : "none",
              fontWeight: cols[j].best ? 600 : 400,
              background: cols[j].best ? accentTintLite : "transparent",
              display: "flex", flexDirection: "column", justifyContent: "center"
            }}>{v}</div>
            )}
            </div>
          )}
        </div>

        {/* Trust line */}
        <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", marginTop: 14 }}>
          Trusted by 4,200+ websites · 30-day money-back guarantee
        </div>
      </div>
    </WPage>);

}

export { WUpgrade };
