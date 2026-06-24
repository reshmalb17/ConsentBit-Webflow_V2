import React from "react";
import { WEdPreview } from "../../kit/WEdPreview.jsx";
import { WEdShell } from "../../kit/WEdShell.jsx";
import { useNav } from "../../../nav.jsx";

const ALIGNS = ["left", "center", "right"];

function WEdType() {
  const nav = useNav();
  const weight = nav ? nav.bannerWeight : "400";
  const setWeight = (v) => nav && nav.setBannerWeight(v);
  const align = nav ? nav.bannerTextAlign : "left";
  const setAlign = (v) => nav && nav.setBannerTextAlign(v);
  const lines = [70, 50, 62];

  return (
    <WEdShell active="type">
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18 }}>
        <div>
          <div className="card" style={{ padding: 14 }}>
            <div className="field-label" style={{ marginBottom: 6 }}>Weight</div>
            <select className="select" style={{ marginBottom: 14 }} value={weight} onChange={(e) => setWeight(e.target.value)}>
              <option value="100">Thin</option>
              <option value="300">Light</option>
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semi Bold</option>
              <option value="700">Bold</option>
              <option value="800">Extra Bold</option>
              <option value="900">Black</option>
            </select>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="field-label" style={{ marginBottom: 0 }}>Alignment</div>
              <div style={{ display: "flex", gap: 6 }}>
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
