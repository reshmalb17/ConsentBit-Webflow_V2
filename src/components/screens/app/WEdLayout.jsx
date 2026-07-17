import React from "react";
import { WEdPreview } from "../../kit/WEdPreview.jsx";
import { WEdReset } from "../../kit/WEdReset.jsx";
import { WEdShell } from "../../kit/WEdShell.jsx";
import { Radio } from "../../primitives/Radio.jsx";
import { useNav } from "../../../nav.jsx";
import "./WEdLayout.css";

function WEdLayout() {
  const nav = useNav();
  const pos = nav ? nav.bannerPos : "box";       // box | banner | popup
  const setPos = (v) => nav && nav.setBannerPos(v);
  const align = nav ? nav.bannerAlign : "left";  // left | right
  const setAlign = (v) => nav && nav.setBannerAlign(v);
  const radius = nav ? nav.bannerRadius : 12;    // border radius (max 25)
  const setRadius = (v) => nav && nav.setBannerRadius(v);
  const anim = nav ? nav.bannerAnim : "fade-in"; // fade-in | slide-up | slide-down | zoom-in
  const setAnim = (v) => nav && nav.setBannerAnim(v);
  const btnRadius = nav ? nav.bannerBtnRadius : 4; // button border radius (max 24)
  const setBtnRadius = (v) => nav && nav.setBannerBtnRadius(v);

  const [animOpen, setAnimOpen] = React.useState(false);
  const animLabels = { "fade-in": "Fade In", "slide-up": "Slide Up", "slide-down": "Slide In", "zoom-in": "Zoom In" };

  // Reset all Layout settings to their defaults.
  const resetLayout = () => {
    setPos("box");
    setAlign("left");
    setRadius(12);
    setBtnRadius(4);
    setAnim("fade-in");
  };
  return (
    <WEdShell active="layout">
      <div className="cb-edlayout-grid">
        <div>
          {/* Banner position */}
          <div className="cb-edlayout-pos-head">
            <div className="cb-edlayout-heading">Banner position</div>
            <WEdReset onClick={resetLayout} />
          </div>
          <div className="cb-edlayout-pos-grid">
            {[
            { l: "Box", kind: "box" },
            { l: "Banner", kind: "banner" },
            { l: "Bottom Center", kind: "popup" }].
            map((p, i) => {
              const selected = pos === p.kind;
              return (
              <div key={i} onClick={() => setPos(p.kind)} className="cb-edlayout-pos-item">
                <div className="cb-edlayout-pos-box" style={{
                border: "1px solid " + (selected ? "var(--purple)" : "var(--border)")
              }}>
                  {selected &&
                <div className="cb-edlayout-check">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#0A081B" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                }
                  {p.kind === "box" &&
                <div className="cb-edlayout-bar-box" />
                }
                  {p.kind === "banner" &&
                <div className="cb-edlayout-bar-banner" />
                }
                  {p.kind === "popup" &&
                <div className="cb-edlayout-bar-popup" />
                }
                </div>
                <div className="cb-edlayout-pos-label">{p.l}</div>
              </div>);

            })}
          </div>

          {/* Alignment — only relevant for the Box position */}
          {pos === "box" && <>
          <div className="cb-edlayout-align-title">Alignment</div>
          <div className="cb-edlayout-align-row">
            <label onClick={() => setAlign("left")} className="cb-edlayout-radio">
              <Radio on={align === "left"} /> Bottom left
            </label>
            <label onClick={() => setAlign("right")} className="cb-edlayout-radio">
              <Radio on={align === "right"} /> Bottom right
            </label>
          </div>
          </>}

          {/* Border Radius — editable value field (0–25) */}
          <div className="card cb-edlayout-card">
            <div className="cb-edlayout-card-title">Border Radius</div>
            <input
              type="number" min={0} max={25} value={radius} className="input"
              onChange={(e) => setRadius(Math.min(25, Math.max(0, Number(e.target.value) || 0)))} />
          </div>

          {/* Button Radius — editable value field (0–24) */}
          <div className="card cb-edlayout-card">
            <div className="cb-edlayout-card-title">Button Radius</div>
            <input
              type="number" min={0} max={24} value={btnRadius} className="input"
              onChange={(e) => setBtnRadius(Math.min(24, Math.max(0, Number(e.target.value) || 0)))} />
          </div>

          {/* Animation — custom dropdown that opens upward so it stays in-frame */}
          <div className="card cb-edlayout-card-last">
            <div className="cb-edlayout-card-title">Animation</div>
            <div className="cb-edlayout-rel">
              <button type="button" className="select cb-edlayout-select-btn" onClick={() => setAnimOpen((o) => !o)}>
                {animLabels[anim]}
                <span className="cb-edlayout-caret" style={{ transform: animOpen ? "rotate(180deg)" : "none" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </span>
              </button>
              {animOpen && <>
                <div onClick={() => setAnimOpen(false)} className="cb-edlayout-overlay" />
                <div className="cb-edlayout-dropdown">
                  {Object.entries(animLabels).map(([v, l]) =>
                  <div key={v} onClick={() => { setAnim(v); setAnimOpen(false); }} className="cb-edlayout-option" style={{ background: anim === v ? "var(--surface-3)" : "transparent" }}>{l}</div>
                  )}
                </div>
              </>}
            </div>
          </div>
        </div>
        <div>
          <WEdPreview />
        </div>
      </div>
    </WEdShell>);

}

export { WEdLayout };
