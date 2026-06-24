import React from "react";

// The notifications dropdown card (header + list only). Positioning is the
// caller's job, so it can float over the real app content (AppExtension) or sit
// over the dimmed placeholder in the gallery screen (WNotifications).
function WNotificationsPanel() {
  return (
    <div style={{
      width: 320,
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 10, padding: 8, boxShadow: "0 18px 36px rgba(0,0,0,0.5)"
    }}>
      <div style={{ padding: "4px 8px 8px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 600, fontSize: 12.5 }}>Notifications</div>
        <a href="#" style={{ color: "var(--purple-hi)", fontSize: 11 }}>Mark all as read</a>
      </div>
      {Array.from({ length: 5 }).map((_, i) =>
      <div key={i} style={{ display: "flex", gap: 8, padding: 9, borderBottom: i < 4 ? "1px solid var(--border)" : "none" }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: i < 2 ? "var(--purple)" : "transparent", marginTop: 6, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, marginBottom: 2 }}>New scan completed</div>
            <div style={{ fontSize: 10.5, color: "var(--text-muted)", lineHeight: 1.4 }}>Your site acne.com has been scanned. Review 3 new cookies.</div>
          </div>
          <div style={{ fontSize: 10, color: "var(--text-faint)", whiteSpace: "nowrap" }}>2d ago</div>
        </div>
      )}
    </div>);

}

export { WNotificationsPanel };
