import React from "react";
import { WEdPreview } from "../../kit/WEdPreview.jsx";
import { WEdShell } from "../../kit/WEdShell.jsx";
import { Toggle } from "../../primitives/Toggle.jsx";
import { useNav } from "../../../nav.jsx";

function WEdGeneral({ cta }) {
  const nav = useNav();
  const iab = nav ? nav.iab : false;
  const setIab = (fn) => nav && nav.setIab((v) => (typeof fn === "function" ? fn(v) : fn));
  const [subs, setSubs] = React.useState([false, false]); // the two Google consent toggles
  return (
    <WEdShell active="general" cta={cta}>
      <div
        style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18 }}
      >
        <div>
          <div className="card" style={{ padding: 14, marginBottom: 12, opacity: iab ? 0.5 : 1, pointerEvents: iab ? "none" : "auto" }} title={iab ? "Disabled while IAB TCF is enabled" : undefined}>
            <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 10 }}>
              Consent template
            </div>
            <select className="select" disabled={iab} value={nav ? nav.template : "CCPA+GDPR"} onChange={(e) => nav && nav.setTemplate(e.target.value)}>
              <option>CCPA (USA)</option>
              <option>GDPR (EU)</option>
              <option>CCPA+GDPR</option>
            </select>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                lineHeight: 1.55,
                marginTop: 10,
              }}
            >
              The selected template (opt-out banner) supports CCA/CPRA
              (California), VCDPA (Virginia), CPA (Colorado), CTDPA
              (Connecticut), &amp; UCPA (Utah)
            </div>
          </div>

          {/* IAB TCF v2.3 — locked behind Pro */}
          <div className="card" style={{ padding: 14, position: "relative" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: 12,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 12.5 }}>
                Support IAB TCF v2.3
              </div>
              <Toggle on={iab} onClick={() => setIab((v) => !v)} />
            </div>
            {[
              "Support Google's Additional Consent Mode",
              "Enable Google's Advertiser Consent Mode",
            ].map((l, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 0",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                  {l}
                </div>
                <Toggle
                  on={i === 0 ? (nav ? nav.gac : false) : subs[i]}
                  onClick={
                    i === 0
                      ? () => nav && nav.setGac((v) => !v)
                      : () => setSubs((s) => s.map((v, j) => (j === i ? !v : v)))
                  }
                />
              </div>
            ))}
            <div
              style={{
                marginTop: 12,
                background: "var(--purple-soft)",
                border: "1px solid var(--purple)",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
                Upgrade to Pro
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  color: "var(--text-muted)",
                  lineHeight: 1.5,
                  marginBottom: 10,
                }}
              >
                IAB TCF and Google Consent Mode are available on the Pro plan.
              </div>
              <button
                className="btn btn-primary btn-sm"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Get Pro Plan
              </button>
            </div>
          </div>
        </div>

        <div>
          <WEdPreview />
        </div>
      </div>
    </WEdShell>
  );
}

export { WEdGeneral };
