import React from "react";
import { getPaymentSubscription } from "../../../lib/api.js";
import "./WPaymentProcessing.css";

// Payment-processing popup. Opened when the user clicks a paid-plan checkout
// link; Stripe checkout opens in a separate tab while this overlay polls the
// worker for the payment to land.
//
// Polling lifecycle is OWNED by this component — it starts when the popup mounts
// (i.e. opens) and stops when it unmounts (close/cancel/success). Nothing polls
// while the popup is closed.
//
//   • First poll fires immediately (t=0) so an already-completed payment resolves
//     instantly; then every 30s, for up to 10 polls = 5 minutes.
//   • After 5 minutes with no payment → "timeout" phase shows a Retry button,
//     which restarts a fresh 10-poll / 5-minute cycle.
//   • Cancel ("Cancel") stops polling and closes.
//   • On success → onPaid({ plan }) (parent closes the popup + updates the UI).

const POLL_INTERVAL_MS = 30000; // 30s between polls
const MAX_POLLS = 4;            // TESTING: 4 × 30s = 2 minutes (set to 10 for the 5-minute production window)

function isPaidPlan(plan) {
  const p = String(plan || "").toLowerCase();
  return p === "basic" || p === "essential" || p === "growth";
}

export function WPaymentProcessing({ siteId, baseline, onPaid, onCancel }) {
  const [phase, setPhase] = React.useState("processing"); // "processing" | "timeout"

  const attemptsRef = React.useRef(0);
  const timerRef = React.useRef(null);
  const stoppedRef = React.useRef(false);
  const onPaidRef = React.useRef(onPaid);
  onPaidRef.current = onPaid;
  // Pre-payment snapshot — so we count only a CHANGE as success, never a plan the
  // account already had before this checkout (prevents an instant false success
  // when upgrading from one paid plan to another).
  const baselineRef = React.useRef(baseline);
  baselineRef.current = baseline;

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  // Fetch the latest subscription from the payment worker ONCE and, if it shows a
  // paid plan that DIFFERS from the pre-payment baseline (new/upgraded plan or a
  // newer timestamp), report success via onPaid and return true. Shared by the
  // background polling loop AND the Cancel button's final reconcile so a payment
  // that landed late is never missed. Returns false on no-change / error.
  const checkBackendOnce = React.useCallback(async () => {
    let result = { isSubscribed: false, plan: null };
    try {
      result = await getPaymentSubscription(siteId);
    } catch {
      return false; // network hiccup — caller decides whether to keep waiting
    }
    if (stoppedRef.current) return false;

    const base = baselineRef.current;
    const changedFromBaseline =
      !base ||
      !base.isSubscribed ||
      result?.plan !== base.plan ||
      result?.updatedAt !== base.updatedAt;
    if (result?.isSubscribed && isPaidPlan(result?.plan) && changedFromBaseline) {
      clearTimer();
      stoppedRef.current = true;
      onPaidRef.current?.({ plan: result.plan, isSubscribed: true });
      return true;
    }
    return false;
  }, [siteId]);

  // One poll attempt. Schedules the next one (30s later) unless we've hit the
  // poll ceiling, found a paid subscription, or the popup was stopped.
  const runPoll = React.useCallback(async () => {
    if (stoppedRef.current) return;
    attemptsRef.current += 1;
    const attempt = attemptsRef.current;

    const paid = await checkBackendOnce();
    if (stoppedRef.current || paid) return;

    if (attempt >= MAX_POLLS) {
      setPhase("timeout");
      return;
    }
    timerRef.current = setTimeout(runPoll, POLL_INTERVAL_MS);
  }, [checkBackendOnce]);

  // Start (or restart on Retry) a fresh 10-poll / 5-minute cycle. Poll #1 fires
  // immediately so a payment that already landed resolves without a 30s wait.
  const startCycle = React.useCallback(() => {
    clearTimer();
    attemptsRef.current = 0;
    stoppedRef.current = false;
    setPhase("processing");
    void runPoll();
  }, [runPoll]);

  // Polling is tied to the popup being open: begin on mount, stop on unmount.
  React.useEffect(() => {
    startCycle();
    return () => { stoppedRef.current = true; clearTimer(); };
  }, [startCycle]);

  // Cancel does a FINAL backend check before closing — silently, with no UI
  // change: if the payment landed (e.g. the user paid after the timeout appeared)
  // we update the plan instead of closing empty-handed. Only if nothing changed
  // do we actually close.
  const handleCancel = async () => {
    clearTimer(); // stop any scheduled poll; keep stoppedRef false so the check runs
    let paid = false;
    if (siteId) {
      try { paid = await checkBackendOnce(); } catch { /* fall through to close */ }
    }
    if (paid) return; // onPaid already fired → parent closes + updates the UI
    stoppedRef.current = true;
    onCancel?.();
  };

  const handleRetry = () => { startCycle(); };

  const isTimeout = phase === "timeout";

  return (
    <div
      role="status"
      aria-live="polite"
      className="cb-pay-overlay"
    >
      {/* dimmed click-blocking backdrop */}
      <div className="cb-pay-backdrop" />

      <div className="cb-pay-card">
        {isTimeout ? (
          // ── Timeout state — payment not confirmed within 5 minutes ──
          <>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" className="cb-pay-icon">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            <div className="cb-pay-title">Still waiting for payment</div>
            <div className="cb-pay-desc">
              We couldn't confirm your payment yet. If you've completed checkout in
              the other tab, click Retry — otherwise you can close this.
            </div>
          </>
        ) : (
          // ── Processing state — spinner + polling ──
          <>
            <svg width="44" height="44" viewBox="0 0 56 56" className="cb-pay-icon">
              <circle cx="28" cy="14" r="4" fill="#7C5CFC"><animate attributeName="opacity" values="1;.3;1" dur="1s" begin="0s" repeatCount="indefinite" /></circle>
              <circle cx="40" cy="28" r="4" fill="#8E72FF"><animate attributeName="opacity" values="1;.3;1" dur="1s" begin="0.2s" repeatCount="indefinite" /></circle>
              <circle cx="28" cy="42" r="4" fill="#A78BFA"><animate attributeName="opacity" values="1;.3;1" dur="1s" begin="0.4s" repeatCount="indefinite" /></circle>
              <circle cx="16" cy="28" r="4" fill="#7C5CFC"><animate attributeName="opacity" values="1;.3;1" dur="1s" begin="0.6s" repeatCount="indefinite" /></circle>
            </svg>
            <div className="cb-pay-title">Payment processing…</div>
            <div className="cb-pay-desc">
              Complete your payment in the checkout tab.
            </div>
          </>
        )}

        <div className="cb-pay-actions">
          {isTimeout && (
            <button
              className="btn btn-primary btn-sm cb-pay-btn"
              onClick={handleRetry}
            >Retry</button>
          )}
          <button
            className="btn btn-ghost btn-sm cb-pay-btn-cancel"
            onClick={handleCancel}
          >Cancel</button>
        </div>
      </div>
    </div>
  );
}
