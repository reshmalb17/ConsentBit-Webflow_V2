// Single source for "is this subscription over?" in the Designer app.
//
// Used by the top bar (AppExtension → nav.subEnded), the Profile panel and the Upgrade
// tab. They previously each had their own copy, and the copies disagreed: the Profile
// panel compared dates only (so an active subscription mid-renewal read as ended) and
// hid its Cancel button on `cancelAtPeriodEnd`, which the worker never sets for a
// 'deleted' status (webflowBillingWf.js) — so a deleted plan showed "No active plan"
// next to a "Cancel subscription" button.

// Must match TERMINAL_SUBSCRIPTION_STATUSES in consent-manager/src/utils/subscriptionStatus.js.
// 'deleted' is not a Stripe status — syncEvent.js writes it into D1 on cancellation.
export const TERMINAL_STATUSES = ["canceled", "cancelled", "deleted", "unpaid", "incomplete_expired"];

export function isTerminalStatus(status) {
  return TERMINAL_STATUSES.includes(String(status || "").trim().toLowerCase());
}

// True when the site's paid period has lapsed: a terminal status (or a scheduled
// cancellation) AND a period end in the past. Both halves matter — an active
// subscription whose period date has just passed is mid-renewal, not ended, and a
// cancelled one still inside its paid period keeps its plan until the date.
// `billing` is the /api/wf/billings response for THIS site (its own row, unlike
// oauth/status, which can fall back to a cancelled or sibling subscription).
export function subscriptionHasEnded(billing) {
  if (!billing) return false;
  const ms = billing.currentPeriodEnd ? Date.parse(billing.currentPeriodEnd) : NaN;
  if (!Number.isFinite(ms)) return false;
  return (isTerminalStatus(billing.status) || !!billing.cancelAtPeriodEnd) && ms <= Date.now();
}
