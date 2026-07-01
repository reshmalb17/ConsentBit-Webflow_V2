import React from "react";
import { cookieCategories } from "../../lib/bannerContent.js";
import { addCustomCookieRule } from "../../lib/api.js";
import { WToast } from "./WToast.jsx";

// Add Cookie modal — matches the project's dark theme + purple accents
// (mirrors WScheduleScan). On save it creates a DRAFT rule on the backend
// (published=0) via /api/custom-cookie-rules, then the parent reloads the list.
function WAddCookie({ siteId, domain = "testsite123.com", onClose, onSaved }) {
  const [form, setForm] = React.useState({
    name: "",
    provider: "",
    duration: "",
    category: cookieCategories[0].name,
    scriptUrlPattern: "",
    description: "",
  });
  const [error, setError] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  const set = (k, v) => { setError(null); setForm((s) => ({ ...s, [k]: v })); };

  const save = async () => {
    if (busy) return;
    if (!form.name.trim()) { setError("Cookie ID is required."); return; }
    if (!siteId) { setError("This site isn't registered yet. Select a plan and publish first."); return; }
    setError(null);
    setBusy(true);
    try {
      const result = await addCustomCookieRule({
        siteId,
        name: form.name.trim(),
        domain,
        category: form.category,
        provider: form.provider || undefined,
        duration: form.duration || undefined,
        scriptUrlPattern: form.scriptUrlPattern || undefined,
        description: form.description || undefined,
      });
      if (result?.success) {
        if (onSaved) onSaved(result);
        onClose && onClose();
      } else {
        setError(result?.error || "Couldn't save the cookie rule. Please try again.");
      }
    } catch (e) {
      setError(e?.message || "Network error saving the cookie rule.");
    } finally {
      setBusy(false);
    }
  };

  const labelStyle = { display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 5 };
  const optional = <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>(optional)</span>;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(8,6,20,0.65)", backdropFilter: "blur(2px)", display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 560, maxWidth: "100%", maxHeight: "92%", overflowY: "auto", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 22, boxShadow: "0 24px 60px rgba(0,0,0,0.55)" }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Add Cookie</div>

        <WToast message={error} type="error" onClose={() => setError(null)} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div className="field-label" style={labelStyle}>Cookie ID <span style={{ color: "#FF8888" }}>*</span></div>
            <input className="input" placeholder="e.g. _ga" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <div className="field-label" style={labelStyle}>Domain</div>
            <input className="input" value={domain} readOnly style={{ opacity: 0.6, cursor: "not-allowed" }} />
          </div>
          <div>
            <div className="field-label" style={labelStyle}>Provider {optional}</div>
            <input className="input" placeholder="e.g. Google Analytics" value={form.provider} onChange={(e) => set("provider", e.target.value)} />
          </div>
          <div>
            <div className="field-label" style={labelStyle}>Duration {optional}</div>
            <input className="input" placeholder="e.g. 1 year" value={form.duration} onChange={(e) => set("duration", e.target.value)} />
          </div>
          <div>
            <div className="field-label" style={labelStyle}>Category</div>
            <select className="select" value={form.category} onChange={(e) => set("category", e.target.value)}>
              {cookieCategories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div className="field-label" style={labelStyle}>Script URL Pattern <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>(optional — match scripts that set this cookie)</span></div>
          <input className="input" placeholder="e.g. google-analytics.com/analytics.js" value={form.scriptUrlPattern} onChange={(e) => set("scriptUrlPattern", e.target.value)} />
        </div>

        <div style={{ marginTop: 12 }}>
          <div className="field-label" style={labelStyle}>Description {optional}</div>
          <textarea className="input" rows="4" placeholder="What does this cookie do?" value={form.description} onChange={(e) => set("description", e.target.value)} />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, marginTop: 18 }}>
          <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
          <button onClick={save} disabled={busy} className="btn btn-primary btn-sm">{busy ? "Saving…" : "Save draft"}</button>
        </div>
      </div>
    </div>
  );
}

export { WAddCookie };
