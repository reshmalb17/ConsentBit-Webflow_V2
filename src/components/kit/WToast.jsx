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

  // Solid gradient background + white text — matches the dashboard toast
  // (consentbitwebapp/components/auth/Toast.tsx) so messages stay readable on
  // the dark app panel instead of low-contrast translucent tints.
  const palette =
    type === "success" ? { bg: "linear-gradient(90deg, #16a34a 41.8%, #4ade80 98%)", border: "rgba(34,197,94,0.55)", fg: "#ffffff" } :
    type === "info"    ? { bg: "linear-gradient(90deg, #6d5cf5 41.8%, #a78bfa 98%)", border: "rgba(124,92,252,0.55)", fg: "#ffffff" } :
                         { bg: "linear-gradient(90deg, #b03240 41.8%, #ff6374 98%)", border: "rgba(239,68,68,0.55)", fg: "#ffffff" };

  return (
    <div
      role="alert"
      style={{
        position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)",
        zIndex: 99999, width: "min(640px, calc(100% - 32px))",
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 12px 10px 14px", borderRadius: 10,
        background: palette.bg, border: `1px solid ${palette.border}`, color: palette.fg,
        fontSize: 12, lineHeight: 1.45, fontWeight: 600,
        boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
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
