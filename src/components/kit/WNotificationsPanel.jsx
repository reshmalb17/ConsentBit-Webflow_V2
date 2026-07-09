import React from "react";
import "./WNotificationsPanel.css";
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
    <div className="cb-notif">
      <div className="cb-notif-head">
        <div className="cb-notif-title">Notifications</div>
        {items.length > 0 && <span className="cb-notif-count">{items.length}</span>}
      </div>

      {loading &&
        <div className="cb-notif-loading">Loading…</div>}

      {!loading && items.length === 0 &&
        <div className="cb-notif-empty">
          <div className="cb-notif-empty-t">You're all caught up</div>
          <div className="cb-notif-empty-s">No new notifications.</div>
        </div>}

      {!loading && items.map((n) =>
        <div key={n.id} className="cb-notif-item">
          <span className="cb-notif-dot" style={{ background: DOT[n.kind] || "var(--purple)" }} />
          <div className="cb-notif-body">
            <div className="cb-notif-item-t">{n.title}</div>
            <div className="cb-notif-item-s">{n.body}</div>
          </div>
        </div>
      )}
    </div>);

}

export { WNotificationsPanel };
