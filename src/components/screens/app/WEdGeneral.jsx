import React from "react";
import { WEdPreview } from "../../kit/WEdPreview.jsx";
import { WEdShell } from "../../kit/WEdShell.jsx";
import { Toggle } from "../../primitives/Toggle.jsx";
import { useNav } from "../../../nav.jsx";

function WEdGeneral({ cta }) {
  const nav = useNav();
  const iab = nav ? nav.iab : false;
  const setIab = (fn) => nav && nav.setIab((v) => (typeof fn === "function" ? fn(v) : fn));
  // IAB TCF + Google Consent Mode are included on Essential/Growth — hide the
  // "Upgrade to Pro" upsell for those plans.
  const planKey = String(nav?.plan || "free").toLowerCase();
  const canUseTcf = planKey === "essential" || planKey === "growth";
  const showProUpsell = !canUseTcf;
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
              {/* Enable IAB TCF only on Essential/Growth (gated via props — no wrapper,
                  so the toggle keeps its original design). */}
              <Toggle on={canUseTcf && iab} onClick={canUseTcf ? () => {
                const next = !iab;
                setIab(next);
                // Google Additional Consent depends on IAB TCF — turn it off too.
                if (!next && nav) nav.setGac(false);
              } : undefined} />
            </div>
            {/* Google Consent Mode toggles are only accessible when IAB TCF is on (and allowed by plan). */}
            <div style={{ opacity: (canUseTcf && iab) ? 1 : 0.45, pointerEvents: (canUseTcf && iab) ? "auto" : "none" }} title={(canUseTcf && iab) ? undefined : "Enable IAB TCF v2.3 first"}>
            <div
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
                Support Google's Additional Consent Mode
              </div>
              <Toggle
                on={nav ? nav.gac : false}
                onClick={() => nav && nav.setGac((v) => !v)}
              />
            </div>
            </div>
            {showProUpsell &&
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
                onClick={nav ? () => nav.setMainTab("upgrade") : undefined}
              >
                Get Pro Plan
              </button>
            </div>
            }
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
