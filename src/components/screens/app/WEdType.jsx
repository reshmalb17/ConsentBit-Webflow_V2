import React from "react";
import { WEdPreview } from "../../kit/WEdPreview.jsx";
import { WEdShell } from "../../kit/WEdShell.jsx";
import { Checkbox } from "../../primitives/Checkbox.jsx";
import { FONT_MODES } from "../../../lib/bannerFont.js";
import { useNav } from "../../../nav.jsx";
import "./WEdType.css";

const ALIGNS = ["left", "center", "right"];

function WEdType() {
  const nav = useNav();
  const weight = nav ? nav.bannerWeight : "400";
  const setWeight = (v) => nav && nav.setBannerWeight(v);
  const align = nav ? nav.bannerTextAlign : "left";
  const setAlign = (v) => nav && nav.setBannerTextAlign(v);
  const fontEnabled = nav ? nav.bannerFontEnabled : false;
  const setFontEnabled = (v) => nav && nav.setBannerFontEnabled(v);
  const lines = [70, 50, 62];

  return (
    <WEdShell active="type">
      <div className="cb-edtype-grid">
        <div>
          {/* Font — opt in to the banner's own injected font. Starts unchecked, so
              the banner inherits the host site's typography until it's ticked. */}
          <div className="card cb-edtype-card cb-edtype-font-card">
            <div className="cb-edtype-font-title">Font</div>
            <div className="cb-edtype-font-opts">
              {FONT_MODES.map((m) => (
                <label key={m.id} onClick={() => setFontEnabled(!fontEnabled)} className="cb-edtype-font-opt">
                  <Checkbox on={fontEnabled} />
                  <span>
                    <span className="cb-edtype-font-opt-label">{m.label}</span>
                    <span className="cb-edtype-font-opt-hint">{m.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="card cb-edtype-card">
            <div className="field-label cb-edtype-label">Weight</div>
            <select className="select cb-edtype-weight-select" value={weight} onChange={(e) => setWeight(e.target.value)}>
              <option value="100">Thin</option>
              <option value="300">Light</option>
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semi bold</option>
              <option value="700">Bold</option>
              <option value="800">Extra bold</option>
              <option value="900">Black</option>
            </select>

            <div className="cb-edtype-align-row">
              <div className="field-label cb-edtype-align-label">Alignment</div>
              <div className="cb-edtype-align-btns">
                {ALIGNS.map((al, i) => {
                  const on = align === al;
                  return (
                  <button key={al} onClick={() => setAlign(al)} style={{
                    width: 34, height: 30, borderRadius: 7,
                    border: "1px solid " + (on ? "var(--purple)" : "var(--border)"),
                    background: on ? "var(--purple)" : "var(--surface)",
                    display: "flex", flexDirection: "column", alignItems: i === 1 ? "center" : i === 2 ? "flex-end" : "flex-start",
                    justifyContent: "center", gap: 3, padding: "0 7px", cursor: "pointer"
                  }}>
                    {lines.map((w, j) =>
                  <div key={j} style={{ width: w + "%", height: 2, borderRadius: 2, background: on ? "#fff" : "var(--text-muted)" }} />
                  )}
                  </button>);

                })}
              </div>
            </div>
          </div>
        </div>
        <div>
          <WEdPreview />
        </div>
      </div>
    </WEdShell>);

}

export { WEdType };
