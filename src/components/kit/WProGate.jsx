import React from "react";
import { createPortal } from "react-dom";
import { useNav } from "../../nav.jsx";
import "./WProGate.css";

const WIDTH = 260;
const GAP = 8;
const EDGE = 8; // min distance from the viewport edge

// Small "Upgrade to Pro" popover shown when the user picks a plan-gated choice —
// currently the CCPA+GDPR consent template, which is Essential/Growth only (see
// lib/planGate.js).
//
// Rendered in a portal on document.body with position:fixed, positioned from the
// anchor control's live bounding rect. That's deliberate: the editor column is 300px
// with overflow-y:auto (which computes overflow-x to auto), so an in-flow popover
// placed to the RIGHT of the dropdown would be clipped or add a scrollbar. A portal
// escapes every clipping ancestor.
//
// Flips to the left of the anchor when the right side has no room, and clamps
// vertically so it never runs off-screen.
//
// `anchorRef` is a ref to the control, NOT a captured rect: committing a native
// <select> inside a scroll container makes the browser scroll the focused element
// into view, so the popover has to follow the control rather than sit at a stale
// position (an earlier version closed on scroll instead, which dismissed the popover
// the instant it opened).
function WProGate({
  open,
  anchorRef,
  onClose,
  title = "Upgrade to Pro",
  text = "To add the GDPR+CCPA banner, please switch to the Essential or Growth plan.",
  cta = "Get Pro Plan",
}) {
  const nav = useNav();
  const ref = React.useRef(null);
  const [pos, setPos] = React.useState(null);

  const reposition = React.useCallback(() => {
    const el = anchorRef && anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = rect.right + GAP;
    if (left + WIDTH > vw - EDGE) {
      // No room on the right — flip to the left of the anchor.
      left = Math.max(EDGE, rect.left - GAP - WIDTH);
    }

    // The portal is committed before layout effects run, so the card is already in
    // the DOM here and its height can be measured on the very first pass.
    const height = ref.current ? ref.current.offsetHeight : 0;
    let top = rect.top;
    if (height && top + height > vh - EDGE) top = Math.max(EDGE, vh - EDGE - height);

    setPos({ left, top });
  }, [anchorRef]);

  React.useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    reposition();
  }, [open, reposition]);

  React.useEffect(() => {
    if (!open) return undefined;

    // Arm the outside-click handler a frame late. The click that opened the popover
    // is still in flight, and on some platforms a native <select> commit dispatches a
    // trailing mousedown to the document — which would close the popover instantly.
    let armed = false;
    const armId = requestAnimationFrame(() => { armed = true; });

    const onKey = (e) => {
      if (e.key === "Escape") onClose && onClose();
    };
    const onDocDown = (e) => {
      if (!armed) return;
      if (ref.current && !ref.current.contains(e.target)) onClose && onClose();
    };
    // Follow the anchor instead of dismissing — `true` catches scrolls on the inner
    // editor column, which doesn't bubble to window.
    const onReflow = () => reposition();

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDocDown, true);
    window.addEventListener("scroll", onReflow, true);
    window.addEventListener("resize", onReflow);
    return () => {
      cancelAnimationFrame(armId);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDocDown, true);
      window.removeEventListener("scroll", onReflow, true);
      window.removeEventListener("resize", onReflow);
    };
  }, [open, onClose, reposition]);

  if (!open) return null;

  const goToUpgrade = () => {
    onClose && onClose();
    if (nav) nav.setMainTab("upgrade");
  };

  // First paint runs with pos===null so the card can be measured before placement;
  // keep it invisible until then to avoid a flash at the wrong spot.
  return createPortal(
    <div
      ref={ref}
      className="cb-progate"
      role="dialog"
      aria-label={title}
      style={{
        left: pos ? `${pos.left}px` : "-9999px",
        top: pos ? `${pos.top}px` : "0px",
        visibility: pos ? "visible" : "hidden",
      }}
    >
      <div className="cb-progate-title">{title}</div>
      {text ? <div className="cb-progate-text">{text}</div> : null}
      {/* cta={null} → message only, no action button. */}
      {cta ? <button className="btn btn-primary btn-sm cb-progate-btn" onClick={goToUpgrade}>
        {cta}
        <svg className="cb-progate-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      </button> : null}
    </div>,
    document.body
  );
}

export { WProGate };
