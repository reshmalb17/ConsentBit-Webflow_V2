import React from "react";

// A click-to-expand image. Clicking the thumbnail pops the enlarged image into
// a SEPARATE browser window (window.open) that can be dragged anywhere on
// screen — fully outside the Webflow Designer panel frame.
//
// The extension runs inside an iframe, so a normal DOM overlay can never leave
// the panel rectangle. A real OS window is the only way "outside the frame".
// If the browser blocks the popup (sandboxed Designer iframe), we fall back to
// a draggable in-panel popup so the feature still works.
//
// Reusable: replace an <img …/> with <WImageZoom src=… alt=… /> using the same
// style for the inline thumbnail.
function WImageZoom({ src, alt = "", style, className }) {
  const [fallback, setFallback] = React.useState(false);

  // Absolute URL — a separate window doesn't share this page's base path.
  const absSrc = React.useMemo(() => {
    try { return new URL(src, window.location.href).href; } catch { return src; }
  }, [src]);

  const openSeparateWindow = () => {
    const w = window.open("", "cb-image-zoom", "width=900,height=640,scrollbars=yes,resizable=yes");
    if (!w) { setFallback(true); return; } // popup blocked → in-panel fallback
    w.document.title = alt || "Image";
    w.document.body.style.cssText = "margin:0;background:#0b0916;display:grid;place-items:center;min-height:100vh";
    const img = w.document.createElement("img");
    img.src = absSrc;
    img.alt = alt;
    img.style.cssText = "max-width:100%;max-height:100vh;display:block";
    w.document.body.appendChild(img);
  };

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={className}
        onClick={openSeparateWindow}
        style={{ cursor: "zoom-in", ...style }} />

      {fallback &&
      <DraggablePopup src={src} alt={alt} onClose={() => setFallback(false)} />
      }
    </>);

}

// In-panel fallback: a small floating card you can drag by its header. Clipped
// to the panel bounds (an iframe can't escape its own frame), but movable.
function DraggablePopup({ src, alt, onClose }) {
  const [pos, setPos] = React.useState({ x: 40, y: 40 });
  const drag = React.useRef(null);

  React.useEffect(() => {
    const onMove = (e) => {
      if (!drag.current) return;
      setPos({ x: e.clientX - drag.current.dx, y: e.clientY - drag.current.dy });
    };
    const onUp = () => { drag.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const startDrag = (e) => {
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
  };

  return (
    <div
      style={{ position: "fixed", left: pos.x, top: pos.y, zIndex: 90, width: 360, maxWidth: "90%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 24px 60px rgba(0,0,0,0.55)", overflow: "hidden" }}>
      {/* drag handle */}
      <div
        onMouseDown={startDrag}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", cursor: "move", background: "var(--bg-2)", borderBottom: "1px solid var(--border)", userSelect: "none" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{alt || "Image"}</span>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ width: 22, height: 22, border: "none", borderRadius: 6, cursor: "pointer", display: "grid", placeItems: "center", background: "transparent", color: "var(--text-muted)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>
      <img src={src} alt={alt} style={{ display: "block", width: "100%" }} />
    </div>);

}

export { WImageZoom };
