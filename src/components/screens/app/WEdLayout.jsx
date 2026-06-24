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
  return (
    <WEdShell active="layout">
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18 }}>
        <div>
          {/* Banner position */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 12.5 }}>Banner position</div>
            <WEdReset />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 22 }}>
            {[
            { l: "Box", kind: "box" },
            { l: "Banner", kind: "banner" },
            { l: "Popup", kind: "popup" }].
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
            <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 10 }}>Border Radius</div>
            <input className="input" defaultValue="12" />
          </div>

          {/* Animation */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 10 }}>Animation</div>
            <select className="select"><option>Fade In</option><option>Slide Up</option><option>None</option></select>
          </div>
        </div>
        <div>
          <WEdPreview />
        </div>
      </div>
    </WEdShell>);

}

export { WEdLayout };
