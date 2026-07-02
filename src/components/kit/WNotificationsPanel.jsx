import React from "react";
import { getWebflowSiteContext, getWebflowBilling } from "../../lib/api.js";
import { buildNotifications } from "../../lib/notifications.js";

// Dot color per notification severity.
const DOT = { error: "#F0553E", warning: "#E0A83E", info: "var(--purple)" };

// The notifications dropdown card. Fetches the site's real billing/usage on open
// and derives the notification list (scan/page-view limits, plan ending, cancel).
function WNotificationsPanel() {
  const [state, setState] = React.useState({ loading: true, items: [] });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { wfSiteId } = await getWebflowSiteContext();
        if (!wfSiteId) { if (!cancelled) setState({ loading: false, items: [] }); return; }
        const billing = await getWebflowBilling(wfSiteId);
        if (!cancelled) setState({ loading: false, items: buildNotifications(billing, Date.now()) });
      } catch {
        if (!cancelled) setState({ loading: false, items: [] });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const { loading, items } = state;

  return (
    <div style={{
      width: 320,
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 10, padding: 8, boxShadow: "0 18px 36px rgba(0,0,0,0.5)"
    }}>
      <div style={{ padding: "4px 8px 8px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 600, fontSize: 12.5 }}>Notifications</div>
        {items.length > 0 && <span style={{ color: "var(--text-faint)", fontSize: 11 }}>{items.length}</span>}
      </div>

      {loading &&
        <div style={{ padding: 16, textAlign: "center", fontSize: 11, color: "var(--text-muted)" }}>Loading…</div>}

      {!loading && items.length === 0 &&
        <div style={{ padding: 18, textAlign: "center" }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, marginBottom: 2 }}>You're all caught up</div>
          <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>No new notifications.</div>
        </div>}

      {!loading && items.map((n, i) =>
        <div key={n.id} style={{ display: "flex", gap: 8, padding: 9, borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "none" }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: DOT[n.kind] || "var(--purple)", marginTop: 6, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, marginBottom: 2 }}>{n.title}</div>
            <div style={{ fontSize: 10.5, color: "var(--text-muted)", lineHeight: 1.4 }}>{n.body}</div>
          </div>
        </div>
      )}
    </div>);

}

export { WNotificationsPanel };
