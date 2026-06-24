import React from "react";
import { WEdChevron } from "../../kit/WEdChevron.jsx";
import { WEdPreview } from "../../kit/WEdPreview.jsx";
import { WEdReset } from "../../kit/WEdReset.jsx";
import { WEdRow } from "../../kit/WEdRow.jsx";
import { WEdShell } from "../../kit/WEdShell.jsx";
import { Field } from "../../primitives/Field.jsx";
import { Radio } from "../../primitives/Radio.jsx";
import { Toggle } from "../../primitives/Toggle.jsx";
import { useNav } from "../../../nav.jsx";
import { localization as T, languageCodes as codes, editorDefaults } from "../../../lib/bannerContent.js";

function WEdContent() {
  const nav = useNav();
  const [tab, setTab] = React.useState("default");
  const [floating, setFloating] = React.useState(false);
  const [floatPos, setFloatPos] = React.useState("left");

  // Per-language banner copy + ISO codes come from the shared content source.
  const langs = Object.keys(T);

  const [lang, setLang] = React.useState("English");
  const [fields, setFields] = React.useState({ title: T.English.title, message: T.English.message, accept: T.English.accept });
  // languages that have been auto-translated this session
  const [translated, setTranslated] = React.useState({});
  // per-language set of manually edited field keys
  const [edited, setEdited] = React.useState({});
  const [pendingLang, setPendingLang] = React.useState(null); // for re-translate modal

  const isAuto = lang !== "English" && translated[lang];
  const langEdited = edited[lang] || {};

  const applyTranslation = (l) => {
    setFields({ ...T[l] });
    setLang(l);
    if (l !== "English") setTranslated((p) => ({ ...p, [l]: true }));
    setEdited((p) => ({ ...p, [l]: {} }));
  };

  const onPickLang = (l) => {
    if (l === lang) return;
    // switching INTO a language whose fields were manually edited → warn before overwrite
    if (edited[l] && Object.keys(edited[l]).length > 0) {
      setPendingLang({ type: "switch", lang: l });
      return;
    }
    if (translated[l] || l === "English") {
      // already translated & untouched (or English) → just load without re-translate
      setFields(l === "English" ? { ...T.English } : { ...T[l] });
      setLang(l);
    } else {
      applyTranslation(l); // first-time → auto-translate
    }
  };

  const onReTranslate = () => {
    if (Object.keys(langEdited).length > 0) {
      setPendingLang({ type: "retranslate", lang });
    } else {
      applyTranslation(lang);
    }
  };

  const editField = (k, v) => {
    setFields((p) => ({ ...p, [k]: v }));
    if (lang !== "English") setEdited((p) => ({ ...p, [lang]: { ...(p[lang] || {}), [k]: true } }));
  };

  const editedChip = (k) => langEdited[k] ?
  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: "9px", lineHeight: 1, fontWeight: 600, color: "#FFC178", background: "rgba(245,166,35,0.14)", border: "1px solid rgba(245,166,35,0.4)", borderRadius: 999, padding: "2px 6px", whiteSpace: "nowrap", verticalAlign: "middle" }}>
      <span style={{ width: 4, height: 4, borderRadius: 999, background: "#F5A623", flexShrink: 0 }} />Edited
    </span> : null;

  return (
    <WEdShell active="content">
      <div style={{ position: "relative" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ width: "300px" }}>
          {/* Consent template + Language (two-up) */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 12.5 }}>Localization</div>
              <WEdReset />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <div className="field-label" style={{ marginBottom: 5 }}>Consent template</div>
                <select className="select" value={nav ? nav.template : "CCPA+GDPR"} onChange={(e) => nav && nav.setTemplate(e.target.value)}><option>CCPA (USA)</option><option>GDPR (EU)</option><option>CCPA+GDPR</option></select>
              </div>
              <div>
                <div className="field-label" style={{ marginBottom: 5 }}>Language</div>
                <div style={{ position: "relative" }}>
                  <select className="select" value={lang} onChange={(e) => onPickLang(e.target.value)} style={{ paddingLeft: 38 }}>
                    {langs.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 9, fontWeight: 700, letterSpacing: "0.04em", color: "var(--purple-hi)", background: "var(--purple-soft)", borderRadius: 5, padding: "2px 5px", pointerEvents: "none" }}>{codes[lang]}</span>
                </div>
              </div>
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 10.5, marginTop: 7, lineHeight: 1.45 }}>Edit your banner content per language. Translations are editable.</div>
          </div>

          {/* Banner type sub-tabs */}
          <div style={{ display: "flex", gap: 6, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 9, padding: 3, margin: "14px 0" }}>
            {[
              { id: "default", label: "Default Banner" },
              { id: "pref", label: "Preference Banner" }].
              map((t) =>
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                padding: "7px 0", borderRadius: 7, border: "none",
                background: tab === t.id ? "var(--purple)" : "transparent",
                color: tab === t.id ? "#fff" : "var(--text-muted)"
              }}>{t.label}</button>
              )}
          </div>

          {tab === "default" &&
            <div className="card" style={{ padding: 14, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 12.5 }}>Cookie Notice</div>
                {isAuto &&
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600, color: "var(--purple-hi)", background: "var(--purple-soft)", border: "1px solid rgba(124,92,252,0.4)", borderRadius: 999, fontSize: "9px", lineHeight: 1, padding: "2px 7px", whiteSpace: "nowrap" }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                  Auto-translated · editable
                </span>
                  }
              </div>
              {lang !== "English" &&
                <button onClick={onReTranslate} className="cb-ed-reset" style={{ padding: "4px 9px", fontSize: 10.5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
                Re-translate
              </button>
                }
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span className="field-label" style={{ marginBottom: 0, display: "inline-flex", alignItems: "center", gap: 6 }}>Title {editedChip("title")}</span>
            </div>
            <input className="input" style={{ marginBottom: 12 }} value={fields.title} onChange={(e) => editField("title", e.target.value)} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span className="field-label" style={{ marginBottom: 0, display: "inline-flex", alignItems: "center", gap: 6 }}>Message {editedChip("message")}</span>
              <span className="material-symbols-rounded" style={{ fontSize: 16, color: "var(--purple-hi)" }}>code</span>
            </div>
            <textarea className="input" rows="4" style={{ marginBottom: 12 }} value={fields.message} onChange={(e) => editField("message", e.target.value)} />

            <WEdRow label="Close button" on={false} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span className="field-label" style={{ marginBottom: 0, display: "inline-flex", alignItems: "center", gap: 6 }}>Accept All {editedChip("accept")}</span>
            </div>
            <input className="input" style={{ marginBottom: 12 }} value={fields.accept} onChange={(e) => editField("accept", e.target.value)} />

            <WEdRow label={'"Reject All" button'} on={false} />
            <input className="input" defaultValue={editorDefaults.default.rejectLabel} style={{ marginBottom: 12 }} />

            <WEdRow label={'"Customize" button'} on={false} />
            <input className="input" defaultValue={editorDefaults.default.customizeLabel} style={{ marginBottom: 12 }} />

            <WEdRow label={'"Cookie policy" Link'} on={false} />
            <input className="input" defaultValue={editorDefaults.default.policyLinkLabel} style={{ marginBottom: 12 }} />

            <Field label="URL" help={false}><input className="input" defaultValue={editorDefaults.default.policyUrl} /></Field>
          </div>
            }

          {tab === "pref" && <>
          {/* Preference Banner — expanded */}
          <div className="card" style={{ padding: 14, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 12.5 }}>Preference Banner</div>
            </div>
            <Field label="Title"><input className="input" defaultValue={editorDefaults.preference.title} /></Field>
            <Field label="Privacy overview" help={false}>
              <textarea className="input" rows="4" defaultValue={editorDefaults.preference.overview} />
            </Field>
            <Field label={'"Save My Preferences" button'} help={false}><input className="input" defaultValue={editorDefaults.preference.saveLabel} /></Field>
          </div>

          {/* Cookie List — collapsed */}
          <div className="card" style={{ padding: 14, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 600, fontSize: 12.5 }}>Cookie List</div>
            <WEdChevron />
          </div>
          </>}

          {/* Floating button */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 12.5 }}>Floating button</div>
              <Toggle on={floating} onClick={() => setFloating((v) => !v)} />
            </div>
            {floating && <>
            <div className="field-label" style={{ marginBottom: 8 }}>Position</div>
            <div style={{ display: "flex", gap: 24 }}>
              <label onClick={() => setFloatPos("left")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12.5 }}>
                <Radio on={floatPos === "left"} /> Bottom left
              </label>
              <label onClick={() => setFloatPos("right")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12.5 }}>
                <Radio on={floatPos === "right"} /> Bottom right
              </label>
            </div>
            </>}
          </div>
        </div>
        <div>
          <WEdPreview variant={tab === "pref" ? "pref" : "default"} />
        </div>
      </div>

      {/* Re-translate / overwrite warning modal */}
      {pendingLang &&
        <div style={{ position: "absolute", inset: 0, background: "rgba(8,6,20,0.7)", backdropFilter: "blur(2px)", display: "grid", placeItems: "center", zIndex: 20, borderRadius: 8 }}>
        <div className="card" style={{ width: 340, padding: 22, textAlign: "center", boxShadow: "0 24px 60px rgba(0,0,0,0.55)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 999, margin: "0 auto 14px", display: "grid", placeItems: "center", background: "rgba(245,159,69,0.14)", color: "#F49F45" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /></svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Overwrite your edits?</div>
          <div style={{ color: "var(--text-muted)", fontSize: 12, lineHeight: 1.55, marginBottom: 20 }}>
            You've made manual edits to this language's content. Re-translating will replace them with a fresh translation. This can't be undone.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button className="btn btn-primary btn-sm" style={{ justifyContent: "center" }} onClick={() => {
                if (pendingLang.type === "switch") {setFields({ ...T[pendingLang.lang] });setLang(pendingLang.lang);}
                setPendingLang(null);
              }}>Keep my edits</button>
            <button className="btn btn-sm" style={{ justifyContent: "center", background: "transparent", color: "#FF8A8A", border: "1px solid rgba(255,107,107,0.4)" }} onClick={() => {
                applyTranslation(pendingLang.lang);
                setPendingLang(null);
              }}>Re-translate anyway</button>
          </div>
        </div>
      </div>
        }
      </div>
    </WEdShell>);

}

// ---------- PROFILE ----------

export { WEdContent };
