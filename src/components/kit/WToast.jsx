import React from "react";

// Floating toast — renders fixed at the top on the highest z-index, above every
// screen/modal. Auto-dismisses after `duration` ms and has a manual close (×).
// Pass an empty/falsy `message` to render nothing.
function WToast({ message, type = "error", onClose, duration = 5000 }) {
  React.useEffect(() => {
    if (!message) return undefined;
    const t = setTimeout(() => { onClose && onClose(); }, duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  if (!message) return null;

  const palette =
    type === "success" ? { bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.45)", fg: "#22c55e" } :
    type === "info"    ? { bg: "rgba(124,92,252,0.12)", border: "rgba(124,92,252,0.45)", fg: "var(--purple-hi)" } :
                         { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.45)", fg: "#ef4444" };

  return (
    <div
      role="alert"
      style={{
        position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)",
        zIndex: 99999, width: "min(640px, calc(100% - 32px))",
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 12px 10px 14px", borderRadius: 10,
        background: palette.bg, border: `1px solid ${palette.border}`, color: palette.fg,
        fontSize: 12, lineHeight: 1.45,
        boxShadow: "0 16px 40px rgba(0,0,0,0.45)", backdropFilter: "blur(2px)",
      }}>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={() => onClose && onClose()}
        aria-label="Dismiss"
        style={{ background: "none", border: "none", cursor: "pointer", color: palette.fg, opacity: 0.8, flexShrink: 0, fontSize: 18, lineHeight: 1, padding: "0 2px" }}>
        ×
      </button>
    </div>
  );
}

export { WToast };
