import React from "react";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
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
function WScheduleScan({ onClose, onConfirm }) {
  const today = new Date();
  const [view, setView] = React.useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selDay, setSelDay] = React.useState(today.getDate());
  const [selMonth, setSelMonth] = React.useState({ y: today.getFullYear(), m: today.getMonth() });
  const [time, setTime] = React.useState("9:00 AM");
  const [freq, setFreq] = React.useState("One time only");

  const cells = monthGrid(view.y, view.m);
  const prevMonth = () => setView((v) => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 });
  const nextMonth = () => setView((v) => v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 });
  const dateLabel = `${MONTHS[selMonth.m]} ${selDay}`;

  const summaryBtn = (active) => ({ flex: 1, padding: "11px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "var(--bg-2)", color: "var(--text)", border: "1px solid " + (active ? "var(--purple)" : "var(--border)") });

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(8,6,20,0.65)", backdropFilter: "blur(2px)", display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 420, maxWidth: "100%", maxHeight: "92%", overflowY: "auto", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 22, boxShadow: "0 24px 60px rgba(0,0,0,0.55)" }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Schedule scan</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55, marginBottom: 16 }}>
          Set the date and time for your next automated cookie scan. Use <b style={{ color: "var(--text)" }}>How often</b> for a one-off run or to repeat daily, weekly, or monthly from that moment.
        </div>

        {/* Summary chips */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={summaryBtn(true)}>{dateLabel}</div>
          <div style={summaryBtn(true)}>{time}</div>
        </div>

        <div style={{ display: "flex", gap: 12, border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
          {/* Calendar */}
          <div style={{ flex: 1, padding: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <button onClick={prevMonth} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, padding: "0 6px" }}>‹</button>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{MONTHS[view.m]} {view.y}</div>
              <button onClick={nextMonth} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, padding: "0 6px" }}>›</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {DOW.map((d) => <div key={d} style={{ textAlign: "center", fontSize: 10.5, color: "var(--text-muted)", padding: "4px 0" }}>{d}</div>)}
              {cells.map((c, i) => {
                const selected = c.cur && c.day === selDay && view.y === selMonth.y && view.m === selMonth.m;
                return (
                <div key={i}
                  onClick={() => { if (c.cur) { setSelDay(c.day); setSelMonth({ y: view.y, m: view.m }); } }}
                  style={{ textAlign: "center", fontSize: 11.5, padding: "6px 0", borderRadius: 7, cursor: c.cur ? "pointer" : "default", color: c.cur ? (selected ? "#fff" : "var(--text)") : "var(--text-faint)", background: selected ? "var(--purple)" : "transparent", fontWeight: selected ? 700 : 400 }}>
                  {c.day}
                </div>);
              })}
            </div>
          </div>
          {/* Time list */}
          <div style={{ width: 92, borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, textAlign: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>Time</div>
            <div style={{ overflowY: "auto", maxHeight: 200 }}>
              {TIMES.map((t) =>
              <div key={t} onClick={() => setTime(t)} style={{ padding: "7px 10px", fontSize: 11.5, cursor: "pointer", textAlign: "center", color: t === time ? "#fff" : "var(--text-muted)", background: t === time ? "var(--purple)" : "transparent" }}>{t}</div>
              )}
            </div>
          </div>
        </div>

        {/* How often */}
        <div style={{ marginTop: 16 }}>
          <div className="field-label" style={{ marginBottom: 6 }}>How often</div>
          <select className="select" value={freq} onChange={(e) => setFreq(e.target.value)}>
            <option>One time only</option>
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
          </select>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => { onConfirm && onConfirm({ date: dateLabel, time, freq }); onClose(); }}>Schedule scan</button>
        </div>
      </div>
    </div>
  );
}

export { WScheduleScan };
