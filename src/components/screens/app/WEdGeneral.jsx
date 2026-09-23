import React from "react";
import { WEdPreview } from "../../kit/WEdPreview.jsx";
import { WEdShell } from "../../kit/WEdShell.jsx";
import { WTemplateSelect } from "../../kit/WTemplateSelect.jsx";
import { Toggle } from "../../primitives/Toggle.jsx";
import { useNav } from "../../../nav.jsx";
import { BOTH_TEMPLATE, DEFAULT_TEMPLATE, TEMPLATE_OPTIONS, canUseBothRegions, canUseTcf as planCanUseTcf } from "../../../lib/planGate.js";
import { IAB_LANGUAGE_OPTIONS } from "../../../lib/iabTranslations.js";
import "./WEdGeneral.css";

function WEdGeneral({ cta }) {
  const nav = useNav();
  const iab = nav ? nav.iab : false;
  const setIab = (fn) => nav && nav.setIab((v) => (typeof fn === "function" ? fn(v) : fn));
  // IAB TCF + Google Consent Mode are included on Essential/Growth — hide the
  // "Upgrade to Pro" upsell for those plans.
  const canUseTcf = planCanUseTcf(nav?.entitlementPlan ?? nav?.plan);
  const showProUpsell = !canUseTcf;
  // CCPA+GDPR (both regimes on one site) is Essential/Growth only. WTemplateSelect
  // shows the "Upgrade to Pro" popover on hover and refuses the pick.
  const canUseBoth = canUseBothRegions(nav?.entitlementPlan ?? nav?.plan);
  return (
    <WEdShell active="general" cta={cta}>
      <div className="cb-edgeneral-grid">
        <div>
          <div className="card cb-edgeneral-card" style={{ opacity: iab ? 0.5 : 1, pointerEvents: iab ? "none" : "auto" }} title={iab ? "Disabled while IAB TCF is enabled" : undefined}>
            <div className="cb-edgeneral-title">
              Consent template
            </div>
            <WTemplateSelect
              value={nav ? nav.template : DEFAULT_TEMPLATE}
              onChange={(v) => nav && nav.setTemplate(v)}
              options={TEMPLATE_OPTIONS}
              disabled={iab}
              gatedValue={BOTH_TEMPLATE}
              gateAllowed={canUseBoth}
            />
            <div className="cb-edgeneral-hint">
              The selected template (opt-out banner) supports CCA/CPRA
              (California), VCDPA (Virginia), CPA (Colorado), CTDPA
              (Connecticut), &amp; UCPA (Utah)
            </div>
          </div>

          {/* IAB TCF v2.3 — locked behind Pro */}
          <div className="card cb-edgeneral-card-rel">
            <div className="cb-edgeneral-toggle-row">
              <div className="cb-edgeneral-label">
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
            <div className="cb-edgeneral-gac-row">
              <div className="cb-edgeneral-gac-label">
                Support Google's Additional Consent Mode
              </div>
              <Toggle
                on={nav ? nav.gac : false}
                onClick={() => nav && nav.setGac((v) => !v)}
              />
            </div>
            </div>
            {/* IAB banner language. It lives here rather than on the Content tab
                because that tab is disabled while IAB is on — and because an IAB
                banner has no editable copy, so the language is the only thing
                there is to choose. Changing it never touches the GDPR/CCPA copy
                (that has its own picker on the Content tab); it just selects the
                string table and the GVL language the preview renders, and the
                language the live banner is published in. */}
            <div className="cb-edgeneral-lang" style={{ opacity: (canUseTcf && iab) ? 1 : 0.45, pointerEvents: (canUseTcf && iab) ? "auto" : "none" }} title={(canUseTcf && iab) ? undefined : "Enable IAB TCF v2.3 first"}>
              <div className="cb-edgeneral-lang-label">
                Banner language
              </div>
              <select
                className="select"
                disabled={!(canUseTcf && iab)}
                value={nav ? nav.iabLang : "en"}
                onChange={(e) => nav && nav.setIabLang(e.target.value)}
              >
                {IAB_LANGUAGE_OPTIONS.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>
            {showProUpsell &&
            <div className="cb-edgeneral-upsell">
              <div className="cb-edgeneral-upsell-title">
                Upgrade to Pro
              </div>
              <div className="cb-edgeneral-upsell-text">
                IAB TCF and Google Consent Mode are available on the Pro plan.
              </div>
              <button
                className="btn btn-primary btn-sm cb-edgeneral-upsell-btn"
                onClick={nav ? () => nav.setMainTab("upgrade") : undefined}
              >
                Get Pro plan
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
