import React from "react";
import iro from "@jaames/iro";
import { WEdPreview } from "../../kit/WEdPreview.jsx";
import { WEdReset } from "../../kit/WEdReset.jsx";
import { WEdShell } from "../../kit/WEdShell.jsx";
import { useNav } from "../../../nav.jsx";

const groups = [
{ title: "General Colors", rows: [
  { id: "bannerBg", l: "Banners background" },
  { id: "textColor", l: "Text color" },
  { id: "headingColor", l: "Heading color" }] },

{ title: "Buttons colors", subgroups: [
  { sub: "Accept/Reject/Cancel", rows: [
    { id: "btnBg", l: "Background" },
    { id: "btnText", l: "Text" }] },
  { sub: "Preferences", rows: [
    { id: "prefBtnBg", l: "Background" },
    { id: "prefBtnText", l: "Text" }] }] }];

// Fallback colors when there's no NavContext (e.g. gallery).
const DEFAULT_COLORS = { bannerBg: "#FFFFFF", textColor: "#374151", headingColor: "#0F1B2E", btnBg: "#007AFF", btnText: "#FFFFFF", prefBtnBg: "#FFFFFF", prefBtnText: "#0284C7" };

const isHex = (v) => /^#[0-9A-Fa-f]{6}$/.test(v);

// A single color row: swatch (opens a compact iro.js picker) + editable hex box.
function ColorField({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const [dropUp, setDropUp] = React.useState(false);
  const wrapRef = React.useRef(null);
  const pickerRef = React.useRef(null);
  const instRef = React.useRef(null);

  const safe = isHex(value) ? value : "#000000";

  // Mount the iro picker while the popover is open; tear it down on close.
  React.useEffect(() => {
    if (!open || !pickerRef.current) return;
    const inst = iro.ColorPicker(pickerRef.current, {
      width: 132, color: safe, borderWidth: 2, borderColor: "var(--border)"
    });
    inst.on("color:change", (c) => onChange(c.hexString.toUpperCase()));
    instRef.current = inst;
    return () => {
      if (pickerRef.current) pickerRef.current.innerHTML = "";
      instRef.current = null;
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the picker in sync when the hex is typed in the text box.
  React.useEffect(() => {
    if (instRef.current && isHex(value)) {
      try { instRef.current.color.set(value); } catch { /* ignore */ }
    }
  }, [value]);

  // Close on outside click.
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const toggle = () => {
    if (!open && wrapRef.current) {
      // Flip the popover up when there isn't room below — keeps it in-frame.
      const rect = wrapRef.current.getBoundingClientRect();
      setDropUp(window.innerHeight - rect.bottom < 220);
    }
    setOpen((o) => !o);
  };

  const onHex = (raw) => {
    let v = raw.startsWith("#") ? raw : "#" + raw.replace(/#/g, "");
    if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v.toUpperCase());
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: 7, overflow: "hidden", background: "var(--bg-2)" }}>
        <div onClick={toggle} title="Pick a color" style={{ width: 26, height: 24, background: safe, cursor: "pointer", flexShrink: 0 }} />
        <input
          type="text" className="mono" value={value} onChange={(e) => onHex(e.target.value)}
          maxLength={7} spellCheck={false}
          style={{ width: 72, fontSize: 11, color: "var(--text-muted)", padding: "0 10px", background: "transparent", border: "none", outline: "none" }} />
      </div>
      {open &&
      <div style={{
        position: "absolute", right: 0, zIndex: 50,
        ...(dropUp ? { bottom: "calc(100% + 6px)" } : { top: "calc(100% + 6px)" }),
        background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10,
        padding: 10, boxShadow: "0 18px 36px rgba(0,0,0,0.5)"
      }}>
        <div ref={pickerRef} />
      </div>
      }
    </div>);

}

function WEdColors() {
  const nav = useNav();
  const [localColors, setLocalColors] = React.useState(DEFAULT_COLORS);
  const colors = nav ? nav.bannerColors : localColors;
  const setColor = (id, v) =>
    nav ? nav.setBannerColors((c) => ({ ...c, [id]: v })) : setLocalColors((c) => ({ ...c, [id]: v }));

  const resetColors = () =>
    nav ? nav.setBannerColors({ ...DEFAULT_COLORS }) : setLocalColors({ ...DEFAULT_COLORS });

  const Row = (r) =>
    <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
      <span style={{ fontSize: 12 }}>{r.l}</span>
      <ColorField value={colors[r.id]} onChange={(v) => setColor(r.id, v)} />
    </div>;

  return (
    <WEdShell active="colors">
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18 }}>
        <div>
          {groups.map((g, gi) =>
          <div key={gi} className="card" style={{ padding: 14, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 12.5 }}>{g.title}</div>
                {gi === 0 && <WEdReset onClick={resetColors} />}
              </div>
              {g.rows && g.rows.map(Row)}
              {g.subgroups && g.subgroups.map((sg, si) =>
              <div key={si} style={{ marginTop: si ? 14 : 0 }}>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>{sg.sub}</div>
                {sg.rows.map(Row)}
              </div>
              )}
            </div>
          )}
        </div>
        <div>
          <WEdPreview />
        </div>
      </div>
    </WEdShell>);

}

export { WEdColors };
