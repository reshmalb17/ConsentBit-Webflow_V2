import React from "react";
import { cookieCategories } from "../../lib/bannerContent.js";
import { addCustomCookieRule } from "../../lib/api.js";
import { WToast } from "./WToast.jsx";
import "./modal.css";
import "./WAddCookie.css";

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

  const optional = <span className="cb-addck-optional">(optional)</span>;

  return (
    <div onClick={onClose} className="cb-modal-overlay cb-modal-overlay--soft cb-addck-overlay">
      <div onClick={(e) => e.stopPropagation()} className="cb-addck-card">
        <div className="cb-addck-title">Add Cookie</div>

        <WToast message={error} type="error" onClose={() => setError(null)} />

        <div className="cb-addck-grid">
          <div>
            <div className="field-label cb-addck-label">Cookie ID <span className="cb-addck-req">*</span></div>
            <input className="input" placeholder="e.g. _ga" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <div className="field-label cb-addck-label">Domain</div>
            <input className="input cb-addck-readonly" value={domain} readOnly />
          </div>
          <div>
            <div className="field-label cb-addck-label">Provider {optional}</div>
            <input className="input" placeholder="e.g. Google Analytics" value={form.provider} onChange={(e) => set("provider", e.target.value)} />
          </div>
          <div>
            <div className="field-label cb-addck-label">Duration {optional}</div>
            <input className="input" placeholder="e.g. 1 year" value={form.duration} onChange={(e) => set("duration", e.target.value)} />
          </div>
          <div>
            <div className="field-label cb-addck-label">Category</div>
            <select className="select" value={form.category} onChange={(e) => set("category", e.target.value)}>
              {cookieCategories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="cb-addck-mt">
          <div className="field-label cb-addck-label">Script URL Pattern <span className="cb-addck-optional">(optional — match scripts that set this cookie)</span></div>
          <input className="input" placeholder="e.g. google-analytics.com/analytics.js" value={form.scriptUrlPattern} onChange={(e) => set("scriptUrlPattern", e.target.value)} />
        </div>

        <div className="cb-addck-mt">
          <div className="field-label cb-addck-label">Description {optional}</div>
          <textarea className="input" rows="4" placeholder="What does this cookie do?" value={form.description} onChange={(e) => set("description", e.target.value)} />
        </div>

        <div className="cb-addck-footer">
          <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
          <button onClick={save} disabled={busy} className="btn btn-primary btn-sm">{busy ? "Saving…" : "Save draft"}</button>
        </div>
      </div>
    </div>
  );
}

export { WAddCookie };
