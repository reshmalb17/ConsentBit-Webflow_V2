import React from "react";
import { createScheduledScan } from "../../lib/api.js";
import { WToast } from "./WToast.jsx";
import "./modal.css";
import "./WScheduleScan.css";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// "One time only" → 'once', etc. (the worker's frequency vocabulary).
const FREQ_TO_API = { "One time only": "once", "Daily": "daily", "Weekly": "weekly", "Monthly": "monthly" };

// "9:00 AM" → { h: 9, m: 0 } in 24h.
function parseTime(t) {
  const m = String(t).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return { h: 9, m: 0 };
  let h = Number(m[1]) % 12;
  if (/PM/i.test(m[3])) h += 12;
  return { h, m: Number(m[2]) };
}
const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const TIMES = [];
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    const ampm = h < 12 ? "AM" : "PM";
    const hh = h % 12 === 0 ? 12 : h % 12;
    TIMES.push(`${hh}:${String(m).padStart(2, "0")} ${ampm}`);
  }
}

function monthGrid(year, month) {
  const startDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = startDow - 1; i >= 0; i--) cells.push({ day: prevDays - i, cur: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, cur: true });
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - (startDow + daysInMonth) + 1, cur: false });
  return cells;
}

// Schedule scan modal — matches the project's dark theme + purple accents.
function WScheduleScan({ siteId, onClose, onConfirm }) {
  const today = new Date();
  const [view, setView] = React.useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selDay, setSelDay] = React.useState(today.getDate());
  const [selMonth, setSelMonth] = React.useState({ y: today.getFullYear(), m: today.getMonth() });
  const [time, setTime] = React.useState("9:00 AM");
  const [freq, setFreq] = React.useState("One time only");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  // Build the ISO scheduledAt from the picked date + time, POST it, then close.
  const submit = async () => {
    if (busy) return;
    if (!siteId) { setError("This site isn't registered yet. Select a plan and publish first."); return; }
    const { h, m } = parseTime(time);
    const when = new Date(selMonth.y, selMonth.m, selDay, h, m, 0);
    if (when.getTime() < Date.now()) { setError("Pick a date and time in the future."); return; }
    setError("");
    setBusy(true);
    try {
      const result = await createScheduledScan(siteId, when.toISOString(), FREQ_TO_API[freq] || "once");
      if (result?.success) {
        if (onConfirm) onConfirm(result);
        onClose();
      } else if (result?.code === "SCAN_LIMIT_REACHED") {
        setError(`You've reached your scan limit${result.scansLimit ? ` (${result.scansLimit})` : ""}. Upgrade to schedule more scans.`);
      } else {
        setError(result?.error || "Couldn't schedule the scan. Please try again.");
      }
    } catch (e) {
      setError(e?.message || "Network error scheduling the scan.");
    } finally {
      setBusy(false);
    }
  };

  const cells = monthGrid(view.y, view.m);
  const prevMonth = () => setView((v) => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 });
  const nextMonth = () => setView((v) => v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 });
  const dateLabel = `${MONTHS[selMonth.m]} ${selDay}`;

  const summaryBtn = (active) => ({ flex: 1, padding: "11px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "var(--bg-2)", color: "var(--text)", border: "1px solid " + (active ? "var(--purple)" : "var(--border)") });

  return (
    <div onClick={onClose} className="cb-modal-overlay cb-modal-overlay--soft cb-sched-overlay">
      <div onClick={(e) => e.stopPropagation()} className="cb-sched-card">
        <div className="cb-sched-title">Schedule scan</div>
        <div className="cb-sched-intro">
          Set the date and time for your next automated cookie scan. Use <b className="cb-sched-strong">How often</b> for a one-off run or to repeat daily, weekly, or monthly from that moment.
        </div>

        {/* Summary chips */}
        <div className="cb-sched-chips">
          <div style={summaryBtn(true)}>{dateLabel}</div>
          <div style={summaryBtn(true)}>{time}</div>
        </div>

        <div className="cb-sched-picker">
          {/* Calendar */}
          <div className="cb-sched-cal">
            <div className="cb-sched-cal-head">
              <button onClick={prevMonth} className="cb-sched-navbtn">‹</button>
              <div className="cb-sched-cal-month">{MONTHS[view.m]} {view.y}</div>
              <button onClick={nextMonth} className="cb-sched-navbtn">›</button>
            </div>
            <div className="cb-sched-grid">
              {DOW.map((d) => <div key={d} className="cb-sched-dow">{d}</div>)}
              {cells.map((c, i) => {
                const selected = c.cur && c.day === selDay && view.y === selMonth.y && view.m === selMonth.m;
                return (
                <div key={i}
                  onClick={() => { if (c.cur) { setSelDay(c.day); setSelMonth({ y: view.y, m: view.m }); } }}
                  className="cb-sched-day"
                  style={{ cursor: c.cur ? "pointer" : "default", color: c.cur ? (selected ? "#fff" : "var(--text)") : "var(--text-faint)", background: selected ? "var(--purple)" : "transparent", fontWeight: selected ? 700 : 400 }}>
                  {c.day}
                </div>);
              })}
            </div>
          </div>
          {/* Time list */}
          <div className="cb-sched-times">
            <div className="cb-sched-times-head">Time</div>
            <div className="cb-sched-times-list">
              {TIMES.map((t) =>
              <div key={t} onClick={() => setTime(t)} className="cb-sched-time" style={{ color: t === time ? "#fff" : "var(--text-muted)", background: t === time ? "var(--purple)" : "transparent" }}>{t}</div>
              )}
            </div>
          </div>
        </div>

        {/* How often */}
        <div className="cb-sched-freq">
          <div className="field-label cb-sched-freq-label">How often</div>
          <select className="select" value={freq} onChange={(e) => setFreq(e.target.value)}>
            <option>One time only</option>
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
          </select>
        </div>

        <WToast message={error} type="error" onClose={() => setError("")} />

        {/* Footer */}
        <div className="cb-sched-footer">
          <button onClick={onClose} className="cb-sched-cancel">Cancel</button>
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={submit}>{busy ? "Scheduling…" : "Schedule scan"}</button>
        </div>
      </div>
    </div>
  );
}

export { WScheduleScan };
