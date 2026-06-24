import React from "react";
import { WAuthShell } from "../../kit/WAuthShell.jsx";
import { Page } from "../../primitives/Page.jsx";

function WSelectPlan({ freeDisabled = false, onSelectPlan }) {
  // Billing cycle: "monthly" shows the full monthly rate; "yearly" shows the
  // per-month equivalent at a 20% discount (billed annually).
  const [billing, setBilling] = React.useState("monthly");
  const cols = [
  { name: "Free", monthly: "$0", yearly: "$0", cta: "Continue free", ctaStyle: "secondary" },
  { name: "Basic", monthly: "$9", yearly: "$7", cta: "14 day free trial", ctaStyle: "secondary" },
  { name: "Essential", monthly: "$20", yearly: "$16", cta: "14 day free trial", ctaStyle: "primary", best: true },
  { name: "Growth", monthly: "$56", yearly: "$45", cta: "14 day free trial", ctaStyle: "secondary" }];

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
  const handleInstallClick = (plan) => {
    // Navigation is owned by the parent (AppExtension), which swaps the screen
    // to WInstallVerify. We just notify it which plan was chosen.
    if (onSelectPlan) onSelectPlan(plan);
  };

  return (
    <WAuthShell step={2} topAlign title="Choose your plan">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 999, padding: 3 }}>
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
          >Yearly <span style={{ fontSize: 9.5, fontWeight: 700, color: "#5AE497", background: "var(--green-soft)", padding: "2px 7px", borderRadius: 999 }}>Save 20%</span></button>
        </div>
        <a href="#" style={{ color: "var(--text-muted)", fontSize: 12 }}>Skip for now<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 5, flexShrink: 0 }}><path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg></a>
      </div>

      <div className="card" style={{ padding: 0, overflow: "visible", marginTop: 14, position: "relative" }}>
        {freeDisabled &&
        <div className="cb-free-col-tip" style={{
          position: "absolute", top: 0, bottom: 0,
          left: "120px", width: "calc((100% - 120px) / 4)",
          zIndex: 6, cursor: "not-allowed"
        }}>
          <span style={{
            position: "absolute", bottom: "calc(100% - 64px)", left: "50%", transform: "translateX(-50%)",
            width: 180, background: "#0a0a14", color: "#fff", fontSize: 11, lineHeight: 1.45,
            textAlign: "center", padding: "8px 10px", borderRadius: 8, boxShadow: "0 10px 24px rgba(0,0,0,0.55)",
            opacity: 0, pointerEvents: "none", transition: "opacity 0.15s", zIndex: 7
          }}>You've already used a free account on this site.
            <span style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid #0a0a14" }} />
          </span>
        </div>
        }
        {/* Header row: plan name, price, CTA */}
        <div style={{ display: "grid", gridTemplateColumns: "120px repeat(4, 1fr)", borderBottom: "1px solid var(--border)" }}>
          <div />
          {cols.map((c, i) => {
            const dim = freeDisabled && c.name === "Free";
            return (
              <div key={i} style={{
                padding: "18px 10px 14px",
                textAlign: "center",
                position: "relative",
                opacity: dim ? 0.45 : 1,
                filter: dim ? "blur(2px)" : "none",
                pointerEvents: dim ? "none" : "auto",
                background: c.best ? "rgba(124, 92, 252, 0.10)" : "transparent",
                borderLeft: i > 0 ? "1px solid var(--border)" : "none",
                borderTop: c.best ? "1px solid var(--purple)" : "none",
                borderTopLeftRadius: c.best ? 12 : 0,
                borderTopRightRadius: c.best ? 12 : 0
              }}>
              {c.best &&
                <div style={{
                  position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                  background: "var(--purple)", color: "white",
                  fontSize: 10, fontWeight: 500,
                  padding: "4px 12px", borderRadius: 999, whiteSpace: "nowrap",
                  zIndex: 2,
                  boxShadow: "0 4px 12px rgba(124,92,252,0.4)"
                }}>Recommended</div>
                }
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, fontWeight: 500 }}>{c.name}</div>
              <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, marginBottom: 10 }}>
                {c[billing]}<span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 400 }}>{priceSuffix}</span>
              </div>
              <button className={"btn btn-" + c.ctaStyle + " btn-sm"} style={{ width: "100%", justifyContent: "center", ...(c.ctaStyle === "secondary" ? { background: "var(--surface-3)", border: "1px solid var(--border-2)", color: "var(--text)" } : {}) }} onClick={() => {handleInstallClick(c.name)}}>
                {c.cta}
              </button>
            </div>);

          })}
        </div>
        {/* Feature rows */}
        {rows.map((r, i) =>
        <div key={i} style={{
          display: "grid",
          gridTemplateColumns: "120px repeat(4, 1fr)",
          borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none"
        }}>
            <div style={{ padding: "10px 12px", fontSize: 11.5, color: "var(--text-muted)", display: "flex", alignItems: "center" }}>{r.label}</div>
            {r.vals.map((v, j) =>
          <div key={j} style={{
            padding: "10px",
            fontSize: 11.5,
            textAlign: "center",
            opacity: freeDisabled && cols[j].name === "Free" ? 0.45 : 1,
            filter: freeDisabled && cols[j].name === "Free" ? "blur(2px)" : "none",
            borderLeft: "1px solid var(--border)",
            background: cols[j].best ? "rgba(124, 92, 252, 0.06)" : "transparent",
            display: "flex", flexDirection: "column", justifyContent: "center"
          }}>{v}</div>
          )}
          </div>
        )}
      </div>
    </WAuthShell>);

}

// ---------- UPGRADE PAGE ----------

export { WSelectPlan };
