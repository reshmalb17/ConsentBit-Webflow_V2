import React from "react";
import { getPaymentSubscription } from "../../../lib/api.js";

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

  // One poll attempt. Schedules the next one (30s later) unless we've hit the
  // 10-poll ceiling, found a paid subscription, or the popup was stopped.
  const runPoll = React.useCallback(async () => {
    if (stoppedRef.current) return;
    attemptsRef.current += 1;
    const attempt = attemptsRef.current;

    let result = { isSubscribed: false, plan: null };
    try {
      result = await getPaymentSubscription(siteId);
    } catch {
      /* network hiccup — treat as not-yet-paid and keep polling */
    }
    if (stoppedRef.current) return;

    // Success = an active paid plan that DIFFERS from the pre-payment baseline
    // (new subscription, upgraded plan, or a newer subscription timestamp).
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
      return;
    }

    if (attempt >= MAX_POLLS) {
      setPhase("timeout");
      return;
    }
    timerRef.current = setTimeout(runPoll, POLL_INTERVAL_MS);
  }, [siteId]);

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

  const handleCancel = () => {
    stoppedRef.current = true;
    clearTimer();
    onCancel?.();
  };

  const handleRetry = () => { startCycle(); };

  const isTimeout = phase === "timeout";

  return (
    <div
      role="status"
      aria-live="polite"
      style={{ position: "absolute", inset: 0, zIndex: 80 }}
    >
      {/* dimmed click-blocking backdrop */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }} />

      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: 300, background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 14, padding: 26, textAlign: "center"
      }}>
        {isTimeout ? (
          // ── Timeout state — payment not confirmed within 5 minutes ──
          <>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Still waiting for payment</div>
            <div style={{ color: "var(--text-muted)", fontSize: 11.5, lineHeight: 1.5, marginBottom: 18 }}>
              We couldn't confirm your payment yet. If you've completed checkout in
              the other tab, click Retry — otherwise you can close this.
            </div>
          </>
        ) : (
          // ── Processing state — spinner + polling ──
          <>
            <svg width="44" height="44" viewBox="0 0 56 56" style={{ marginBottom: 12 }}>
              <circle cx="28" cy="14" r="4" fill="#7C5CFC"><animate attributeName="opacity" values="1;.3;1" dur="1s" begin="0s" repeatCount="indefinite" /></circle>
              <circle cx="40" cy="28" r="4" fill="#8E72FF"><animate attributeName="opacity" values="1;.3;1" dur="1s" begin="0.2s" repeatCount="indefinite" /></circle>
              <circle cx="28" cy="42" r="4" fill="#A78BFA"><animate attributeName="opacity" values="1;.3;1" dur="1s" begin="0.4s" repeatCount="indefinite" /></circle>
              <circle cx="16" cy="28" r="4" fill="#7C5CFC"><animate attributeName="opacity" values="1;.3;1" dur="1s" begin="0.6s" repeatCount="indefinite" /></circle>
            </svg>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Payment processing…</div>
            <div style={{ color: "var(--text-muted)", fontSize: 11.5, lineHeight: 1.5, marginBottom: 18 }}>
              Complete your payment in the checkout tab. We'll update your plan here
              automatically once it's confirmed.
            </div>
          </>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {isTimeout && (
            <button
              className="btn btn-primary btn-sm"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={handleRetry}
            >Retry</button>
          )}
          <button
            className="btn btn-ghost btn-sm"
            style={{ width: "100%", justifyContent: "center", color: "var(--text-muted)" }}
            onClick={handleCancel}
          >Cancel</button>
        </div>
      </div>
    </div>
  );
}
