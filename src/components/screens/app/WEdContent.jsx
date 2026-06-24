import React from "react";
import { WEdPreview } from "../../kit/WEdPreview.jsx";
import { WEdReset } from "../../kit/WEdReset.jsx";
import { WEdRow } from "../../kit/WEdRow.jsx";
import { WEdShell } from "../../kit/WEdShell.jsx";
import { Field } from "../../primitives/Field.jsx";
import { Radio } from "../../primitives/Radio.jsx";
import { Toggle } from "../../primitives/Toggle.jsx";
import { useNav } from "../../../nav.jsx";
import { localization as T, languageCodes as codes, editorDefaults, preferenceBanner, prefCategories, ccpaBanner, preferenceLocalization as PL, categoryLocalization as CL, ccpaLocalization as CCL } from "../../../lib/bannerContent.js";

function WEdContent() {
  const nav = useNav();
  const [tab, setTab] = React.useState("default");
  const [floating, setFloating] = React.useState(false);
  const [floatPos, setFloatPos] = React.useState("left");
  // Content character limits (match the consentwebapp project).
  const LIMITS = { title: 50, message: 320, button: 20, policyLabel: 30, name: 20, desc: 300, label: 20 };
  const [cookieListOpen, setCookieListOpen] = React.useState(false);
  const [rejectLabel, setRejectLabel] = React.useState(editorDefaults.default.rejectLabel);
  const [customizeLabel, setCustomizeLabel] = React.useState(editorDefaults.default.customizeLabel);
  const [policyLabel, setPolicyLabel] = React.useState(editorDefaults.default.policyLinkLabel);
  const [policyUrl, setPolicyUrl] = React.useState(editorDefaults.default.policyUrl);
  // Preference Banner content (shared with the preview's preference modal).
  const prefContent = nav ? nav.prefContent : { title: preferenceBanner.title, overview: preferenceBanner.overview, save: preferenceBanner.buttons.save };
  const setPref = (patch) => nav && nav.setPrefContent((c) => ({ ...c, ...patch }));
  const setCat = (i, patch) => nav && nav.setPrefContent((c) => ({ ...c, cats: c.cats.map((cat, j) => j === i ? { ...cat, ...patch } : cat) }));
  // Active region: CCPA shows CCPA-specific content in this editor.
  const isCCPA = nav ? nav.activeRegion === "CCPA" : false;
  const ccpaContent = nav ? nav.ccpaContent : { doNotShare: "", optOutTitle: "", optOutBody: "", cancel: "", save: "" };
  const setCcpa = (patch) => nav && nav.setCcpaContent((c) => ({ ...c, ...patch }));

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
  // Per-language defaults used as the "edited" baseline for preference/category fields.
  const PLcur = PL[lang] || PL.English;
  const CLcur = CL[lang] || CL.English;
  const CCcur = CCL[lang] || CCL.English;

  // Translate the preference-banner copy to match the selected language.
  const applyLangToPref = (l) => {
    const p = PL[l] || PL.English;
    const cl = CL[l] || CL.English;
    const cc = CCL[l] || CCL.English;
    if (!nav) return;
    nav.setPrefContent((c) => ({
      ...c,
      title: p.title, overview: p.overview, save: p.save, alwaysActive: p.alwaysActive,
      cats: cl.map((cat, i) => ({ name: cat.name, desc: cat.desc, always: !!prefCategories[i].always })),
    }));
    nav.setCcpaContent((c) => ({ ...c, optOutTitle: cc.optOutTitle, optOutBody: cc.optOutBody, doNotShare: cc.doNotShare, cancel: cc.cancel, save: cc.save }));
  };

  const applyTranslation = (l) => {
    setFields({ ...T[l] });
    setLang(l);
    if (l !== "English") setTranslated((p) => ({ ...p, [l]: true }));
    setEdited((p) => ({ ...p, [l]: {} }));
    applyLangToPref(l);
  };

  // Load a language's default content (translation, or English source).
  const loadLang = (l) => {
    if (translated[l] || l === "English") {
      setFields(l === "English" ? { ...T.English } : { ...T[l] });
      setLang(l);
      applyLangToPref(l);
    } else {
      applyTranslation(l); // first-time → auto-translate
    }
  };

  const onPickLang = (l) => {
    if (l === lang) return;
    // If the CURRENT language has manual edits, warn that switching replaces
    // them with the selected language's default content.
    if (edited[lang] && Object.keys(edited[lang]).length > 0) {
      setPendingLang({ type: "switch", lang: l });
      return;
    }
    loadLang(l);
  };

  // Confirmed language change: discard current edits, load the new language.
  const confirmSwitch = () => {
    setEdited((p) => { const n = { ...p }; delete n[lang]; return n; });
    loadLang(pendingLang.lang);
    setPendingLang(null);
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
    // Mark the field as edited (any language, including English) so the
    // "Edited" chip shows next to it.
    setEdited((p) => ({ ...p, [lang]: { ...(p[lang] || {}), [k]: true } }));
  };

  // Reflect the edited content in the preview banner.
  React.useEffect(() => {
    if (nav) nav.setBannerContent({ title: fields.title, message: fields.message, accept: fields.accept, reject: rejectLabel, customize: customizeLabel, policy: policyLabel, policyUrl });
  }, [fields, rejectLabel, customizeLabel, policyLabel, policyUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset Content/Localization back to defaults (English copy, no edits).
  const resetContent = () => {
    setLang("English");
    setFields({ ...T.English });
    setTranslated({});
    setEdited({});
    setTab("default");
    setFloating(false);
    setFloatPos("left");
    setRejectLabel(editorDefaults.default.rejectLabel);
    setCustomizeLabel(editorDefaults.default.customizeLabel);
    setPolicyLabel(editorDefaults.default.policyLinkLabel);
    setPolicyUrl(editorDefaults.default.policyUrl);
    if (nav) {
      nav.setCloseBtn(false);
      nav.setShowReject(true);
      nav.setShowCustomize(true);
      nav.setShowPolicy(true);
      nav.setPrefContent({ title: preferenceBanner.title, overview: preferenceBanner.overview, save: preferenceBanner.buttons.save, alwaysActive: "Always Active", cats: prefCategories.map((c) => ({ name: c.l, desc: c.desc, always: !!c.always })) });
      nav.setCcpaContent({ doNotShare: ccpaBanner.doNotShare, optOutTitle: ccpaBanner.optOutTitle, optOutBody: ccpaBanner.optOutBody, cancel: ccpaBanner.buttons.cancel, save: ccpaBanner.buttons.save });
    }
  };

  const EDITED_CHIP =
  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: "9px", lineHeight: 1, fontWeight: 600, color: "#FFC178", background: "rgba(245,166,35,0.14)", border: "1px solid rgba(245,166,35,0.4)", borderRadius: 999, padding: "2px 6px", whiteSpace: "nowrap", verticalAlign: "middle" }}>
      <span style={{ width: 4, height: 4, borderRadius: 999, background: "#F5A623", flexShrink: 0 }} />Edited
    </span>;
  // Localized fields use the per-language edit tracking; other fields compare to their default.
  const editedChip = (k) => langEdited[k] ? EDITED_CHIP : null;
  const diffChip = (v, d) => v !== d ? EDITED_CHIP : null;

  return (
    <WEdShell active="content">
      <div style={{ position: "relative" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ width: "300px" }}>
          {/* Consent template + Language (two-up) */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 12.5 }}>Localization</div>
              <WEdReset onClick={resetContent} />
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
              <span style={{ fontSize: 10, color: "var(--text-faint)" }}>{fields.title.length}/{LIMITS.title}</span>
            </div>
            <input className="input" maxLength={LIMITS.title} style={{ marginBottom: 12 }} value={fields.title} onChange={(e) => editField("title", e.target.value)} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span className="field-label" style={{ marginBottom: 0, display: "inline-flex", alignItems: "center", gap: 6 }}>Message {editedChip("message")}</span>
              <span style={{ fontSize: 10, color: "var(--text-faint)" }}>{fields.message.length}/{LIMITS.message}</span>
            </div>
            <textarea className="input" rows="4" maxLength={LIMITS.message} style={{ marginBottom: 12 }} value={fields.message} onChange={(e) => editField("message", e.target.value)} />

            <WEdRow label="Close button" checked={nav ? nav.closeBtn : false} onChange={(v) => nav && nav.setCloseBtn(v)} />

            {isCCPA ?
            <Field label={<>{'"Do Not Share" link'} {diffChip(ccpaContent.doNotShare, CCcur.doNotShare)}</>} help={false}><input className="input" maxLength={50} value={ccpaContent.doNotShare} onChange={(e) => setCcpa({ doNotShare: e.target.value })} /></Field>
            : <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span className="field-label" style={{ marginBottom: 0, display: "inline-flex", alignItems: "center", gap: 6 }}>Accept All {editedChip("accept")}</span>
              <span style={{ fontSize: 10, color: "var(--text-faint)" }}>{fields.accept.length}/{LIMITS.button}</span>
            </div>
            <input className="input" maxLength={LIMITS.button} style={{ marginBottom: 12 }} value={fields.accept} onChange={(e) => editField("accept", e.target.value)} />

            <WEdRow label={<>{'"Reject All" button'} {diffChip(rejectLabel, editorDefaults.default.rejectLabel)}</>} checked={nav ? nav.showReject : true} onChange={(v) => nav && nav.setShowReject(v)} />
            <input className="input" maxLength={LIMITS.button} value={rejectLabel} onChange={(e) => setRejectLabel(e.target.value)} style={{ marginBottom: 12 }} />

            <WEdRow label={<>{'"Customize" button'} {diffChip(customizeLabel, editorDefaults.default.customizeLabel)}</>} checked={nav ? nav.showCustomize : true} onChange={(v) => nav && nav.setShowCustomize(v)} />
            <input className="input" maxLength={LIMITS.button} value={customizeLabel} onChange={(e) => setCustomizeLabel(e.target.value)} style={{ marginBottom: 12 }} />

            <WEdRow label={<>{'"Cookie policy" Link'} {diffChip(policyLabel, editorDefaults.default.policyLinkLabel)}</>} checked={nav ? nav.showPolicy : true} onChange={(v) => nav && nav.setShowPolicy(v)} />
            <input className="input" maxLength={LIMITS.policyLabel} value={policyLabel} onChange={(e) => setPolicyLabel(e.target.value)} style={{ marginBottom: 12 }} />

            <Field label={<>URL {diffChip(policyUrl, editorDefaults.default.policyUrl)}</>} help={false}><input className="input" value={policyUrl} onChange={(e) => setPolicyUrl(e.target.value)} /></Field>
            </>
            }
          </div>
            }

          {tab === "pref" && (isCCPA ?
          /* CCPA · Opt-out Preference editor */
          <div className="card" style={{ padding: 14, marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 12 }}>Opt-out Preference</div>
            <Field label={<>Title {diffChip(ccpaContent.optOutTitle, CCcur.optOutTitle)}</>}><input className="input" maxLength={LIMITS.title} value={ccpaContent.optOutTitle} onChange={(e) => setCcpa({ optOutTitle: e.target.value })} /></Field>
            <Field label={<>Description {diffChip(ccpaContent.optOutBody, CCcur.optOutBody)}</>} help={false}><textarea className="input" rows="4" maxLength={LIMITS.message} value={ccpaContent.optOutBody} onChange={(e) => setCcpa({ optOutBody: e.target.value })} /></Field>
            <Field label={<>{'"Do Not Share" checkbox label'} {diffChip(ccpaContent.doNotShare, CCcur.doNotShare)}</>} help={false}><input className="input" maxLength={50} value={ccpaContent.doNotShare} onChange={(e) => setCcpa({ doNotShare: e.target.value })} /></Field>
            <Field label={<>{'"Cancel" button'} {diffChip(ccpaContent.cancel, CCcur.cancel)}</>} help={false}><input className="input" maxLength={LIMITS.button} value={ccpaContent.cancel} onChange={(e) => setCcpa({ cancel: e.target.value })} /></Field>
            <Field label={<>{'"Save my preferences" button'} {diffChip(ccpaContent.save, CCcur.save)}</>} help={false}><input className="input" maxLength={LIMITS.button} value={ccpaContent.save} onChange={(e) => setCcpa({ save: e.target.value })} /></Field>
          </div>
          : <>
          {/* Preference Banner — expanded */}
          <div className="card" style={{ padding: 14, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 12.5 }}>Preference Banner</div>
            </div>
            <Field label={<>Title {diffChip(prefContent.title, PLcur.title)}</>}><input className="input" maxLength={LIMITS.title} value={prefContent.title} onChange={(e) => setPref({ title: e.target.value })} /></Field>
            <Field label={<>Privacy overview {diffChip(prefContent.overview, PLcur.overview)}</>} help={false}>
              <textarea className="input" rows="4" maxLength={LIMITS.message} value={prefContent.overview} onChange={(e) => setPref({ overview: e.target.value })} />
            </Field>
            <Field label={<>{'"Save My Preferences" button'} {diffChip(prefContent.save, PLcur.save)}</>} help={false}><input className="input" maxLength={LIMITS.button} value={prefContent.save} onChange={(e) => setPref({ save: e.target.value })} /></Field>
            <Field label={<>{'"Always Active" label'} {diffChip(prefContent.alwaysActive, PLcur.alwaysActive)}</>} help={false}><input className="input" maxLength={LIMITS.label} value={prefContent.alwaysActive} onChange={(e) => setPref({ alwaysActive: e.target.value })} /></Field>
          </div>

          {/* Cookie List — accordion with editable category name + description */}
          <div className="card" style={{ padding: 14, marginBottom: 12 }}>
            <div onClick={() => setCookieListOpen((o) => !o)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
              <div style={{ fontWeight: 600, fontSize: 12.5 }}>Cookie List</div>
              <span style={{ display: "inline-block", transform: cookieListOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s", color: "var(--text-muted)" }}>›</span>
            </div>
            {cookieListOpen &&
            <div style={{ marginTop: 12 }}>
              {prefContent.cats.map((c, i) =>
              <div key={i} style={{ borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: i ? 10 : 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--purple-hi)", marginBottom: 8 }}>{prefCategories[i].l}</div>
                <Field label={<>Name {diffChip(c.name, CLcur[i] ? CLcur[i].name : prefCategories[i].l)}</>} help={false}><input className="input" maxLength={LIMITS.name} value={c.name} onChange={(e) => setCat(i, { name: e.target.value })} /></Field>
                <Field label={<>Description {diffChip(c.desc, CLcur[i] ? CLcur[i].desc : prefCategories[i].desc)}</>} help={false}><textarea className="input" rows="3" maxLength={LIMITS.desc} value={c.desc} onChange={(e) => setCat(i, { desc: e.target.value })} /></Field>
              </div>
              )}
            </div>
            }
          </div>
          </>)}

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
        <div style={{ position: "fixed", inset: 0, background: "rgba(8,6,20,0.7)", backdropFilter: "blur(2px)", display: "grid", placeItems: "center", zIndex: 100 }}>
        <div className="card" style={{ width: 340, padding: 22, textAlign: "center", boxShadow: "0 24px 60px rgba(0,0,0,0.55)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 999, margin: "0 auto 14px", display: "grid", placeItems: "center", background: "rgba(245,159,69,0.14)", color: "#F49F45" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /></svg>
          </div>
          {pendingLang.type === "switch" ? <>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Change language?</div>
          <div style={{ color: "var(--text-muted)", fontSize: 12, lineHeight: 1.55, marginBottom: 20 }}>
            The content you edited will be replaced with the default content of the selected language. This can't be undone.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button className="btn btn-primary btn-sm" style={{ justifyContent: "center" }} onClick={confirmSwitch}>Change language</button>
            <button className="btn btn-secondary btn-sm" style={{ justifyContent: "center" }} onClick={() => setPendingLang(null)}>Cancel</button>
          </div>
          </> : <>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Overwrite your edits?</div>
          <div style={{ color: "var(--text-muted)", fontSize: 12, lineHeight: 1.55, marginBottom: 20 }}>
            You've made manual edits to this language's content. Re-translating will replace them with a fresh translation. This can't be undone.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button className="btn btn-primary btn-sm" style={{ justifyContent: "center" }} onClick={() => setPendingLang(null)}>Keep my edits</button>
            <button className="btn btn-sm" style={{ justifyContent: "center", background: "transparent", color: "#FF8A8A", border: "1px solid rgba(255,107,107,0.4)" }} onClick={() => {
                applyTranslation(pendingLang.lang);
                setPendingLang(null);
              }}>Re-translate anyway</button>
          </div>
          </>}
        </div>
      </div>
        }
      </div>
    </WEdShell>);

}

// ---------- PROFILE ----------

export { WEdContent };
