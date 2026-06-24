import React from "react";
import { WEdPreview } from "../../kit/WEdPreview.jsx";
import { WEdReset } from "../../kit/WEdReset.jsx";
import { WEdShell } from "../../kit/WEdShell.jsx";
import { Radio } from "../../primitives/Radio.jsx";
import { useNav } from "../../../nav.jsx";

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
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18 }}>
        <div>
          {/* Banner position */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 12.5 }}>Banner position</div>
            <WEdReset onClick={resetLayout} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 22 }}>
            {[
            { l: "Box", kind: "box" },
            { l: "Banner", kind: "banner" },
            { l: "Bottom Center", kind: "popup" }].
            map((p, i) => {
              const selected = pos === p.kind;
              return (
              <div key={i} onClick={() => setPos(p.kind)} style={{ cursor: "pointer" }}>
                <div style={{
                position: "relative",
                border: "1px solid " + (selected ? "var(--purple)" : "var(--border)"),
                background: "var(--bg-2)", borderRadius: 8, height: 64
              }}>
                  {selected &&
                <div style={{ position: "absolute", top: 5, right: 5, width: 14, height: 14, borderRadius: 999, background: "#5AE497", display: "grid", placeItems: "center" }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#0A081B" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                }
                  {p.kind === "box" &&
                <div style={{ position: "absolute", left: 8, bottom: 8, width: 26, height: 9, borderRadius: 3, background: "var(--purple)" }} />
                }
                  {p.kind === "banner" &&
                <div style={{ position: "absolute", left: 8, right: 8, bottom: 8, height: 9, borderRadius: 3, background: "var(--purple)" }} />
                }
                  {p.kind === "popup" &&
                <div style={{ position: "absolute", left: "50%", bottom: 8, transform: "translateX(-50%)", width: 26, height: 9, borderRadius: 3, background: "var(--purple)" }} />
                }
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 6 }}>{p.l}</div>
              </div>);

            })}
          </div>

          {/* Alignment — only relevant for the Box position */}
          {pos === "box" && <>
          <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 12 }}>Alignment</div>
          <div style={{ display: "flex", gap: 24, marginBottom: 18 }}>
            <label onClick={() => setAlign("left")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12.5 }}>
              <Radio on={align === "left"} /> Bottom left
            </label>
            <label onClick={() => setAlign("right")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12.5 }}>
              <Radio on={align === "right"} /> Bottom right
            </label>
          </div>
          </>}

          {/* Border Radius */}
          <div className="card" style={{ padding: 14, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 12.5 }}>Border Radius</div>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{radius}px</span>
            </div>
            <input
              type="range" min={0} max={25} value={radius}
              onChange={(e) => setRadius(Math.min(25, Math.max(0, Number(e.target.value) || 0)))}
              style={{ width: "100%", accentColor: "var(--purple)" }} />
          </div>

          {/* Button Radius */}
          <div className="card" style={{ padding: 14, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 12.5 }}>Button Radius</div>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{btnRadius}px</span>
            </div>
            <input
              type="range" min={0} max={24} value={btnRadius}
              onChange={(e) => setBtnRadius(Math.min(24, Math.max(0, Number(e.target.value) || 0)))}
              style={{ width: "100%", accentColor: "var(--purple)" }} />
          </div>

          {/* Animation — custom dropdown that opens upward so it stays in-frame */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 10 }}>Animation</div>
            <div style={{ position: "relative" }}>
              <button type="button" className="select" onClick={() => setAnimOpen((o) => !o)} style={{ width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                {animLabels[anim]}
                <span style={{ fontSize: 10, opacity: 0.7, transform: animOpen ? "rotate(180deg)" : "none" }}>▾</span>
              </button>
              {animOpen && <>
                <div onClick={() => setAnimOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
                <div style={{ position: "absolute", bottom: "calc(100% + 4px)", left: 0, right: 0, zIndex: 41, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", boxShadow: "0 -10px 28px rgba(0,0,0,0.45)" }}>
                  {Object.entries(animLabels).map(([v, l]) =>
                  <div key={v} onClick={() => { setAnim(v); setAnimOpen(false); }} style={{ padding: "8px 12px", fontSize: 12.5, cursor: "pointer", color: "var(--text)", background: anim === v ? "var(--surface-3)" : "transparent" }}>{l}</div>
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
