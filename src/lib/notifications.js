// Build the real notification list from the site's billing/usage data
// (GET /api/webflow/billing → { plan, status, interval, currentPeriodEnd,
//  cancelAtPeriodEnd, scansUsed, scansLimit, pageviewsUsed, pageviewsLimit }).
//
// Pure function — no fetching, no Date.now() inside (the caller passes `nowMs`)
// so it stays easy to test. Returns an array of:
//   { id, kind: 'error'|'warning'|'info', title, body, when? }

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const cap = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : s);
const fmtNum = (n) => num(n).toLocaleString();

function planLabel(plan) {
  return plan && String(plan).toLowerCase() !== "free" ? cap(plan) : "Free";
}

function fmtDate(d) {
  try {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

export function buildNotifications(billing, nowMs) {
  if (!billing || billing.success === false) return [];
  const items = [];
  const plan = planLabel(billing.plan);

  // ── Scan usage ────────────────────────────────────────────────────────────
  const scansUsed = num(billing.scansUsed);
  const scansLimit = num(billing.scansLimit);
  if (scansLimit > 0) {
    if (scansUsed >= scansLimit) {
      items.push({
        id: "scan-exceeded", kind: "error", title: "Scan limit reached",
        body: `You've used all ${fmtNum(scansLimit)} scans this month on your ${plan} plan. Upgrade to run more scans.`,
      });
    } else if (scansUsed / scansLimit >= 0.8) {
      items.push({
        id: "scan-near", kind: "warning", title: "Approaching scan limit",
        body: `You've used ${fmtNum(scansUsed)} of ${fmtNum(scansLimit)} scans this month.`,
      });
    }
  }

  // ── Page-view usage ───────────────────────────────────────────────────────
  const pvUsed = num(billing.pageviewsUsed);
  const pvLimit = num(billing.pageviewsLimit);
  if (pvLimit > 0) {
    if (pvUsed >= pvLimit) {
      items.push({
        id: "pv-exceeded", kind: "error", title: "Page view limit reached",
        body: `You've reached your ${fmtNum(pvLimit)} monthly page views on your ${plan} plan. Upgrade for a higher limit.`,
      });
    } else if (pvUsed / pvLimit >= 0.8) {
      items.push({
        id: "pv-near", kind: "warning", title: "Approaching page view limit",
        body: `You've used ${fmtNum(pvUsed)} of ${fmtNum(pvLimit)} page views this month.`,
      });
    }
  }

  // ── Subscription: cancellation / ending / renewing soon ───────────────────
  const end = billing.currentPeriodEnd ? new Date(billing.currentPeriodEnd) : null;
  const endMs = end && !isNaN(end.getTime()) ? end.getTime() : null;
  const isPaid = billing.plan && String(billing.plan).toLowerCase() !== "free";

  if (billing.cancelAtPeriodEnd && endMs) {
    items.push({
      id: "sub-cancel", kind: "warning", title: "Subscription ending",
      body: `Your ${plan} subscription is set to cancel on ${fmtDate(end)}. You'll keep access until then.`,
      when: endMs,
    });
  } else if (isPaid && endMs) {
    const days = Math.ceil((endMs - nowMs) / 86400000);
    if (days >= 0 && days <= 7) {
      items.push({
        id: "sub-renew", kind: "info", title: "Plan renews soon",
        body: `Your ${plan} plan renews on ${fmtDate(end)}.`,
        when: endMs,
      });
    }
  }

  // ── Subscription status problems ──────────────────────────────────────────
  const st = String(billing.status || "").toLowerCase();
  if (st === "past_due" || st === "unpaid") {
    items.push({
      id: "past-due", kind: "error", title: "Payment past due",
      body: `Your last payment for the ${plan} plan failed. Update your payment method to keep your banner active.`,
    });
  } else if (st === "canceled") {
    items.push({
      id: "canceled", kind: "error", title: "Subscription canceled",
      body: `Your ${plan} subscription has been canceled.`,
    });
  }

  return items;
}
