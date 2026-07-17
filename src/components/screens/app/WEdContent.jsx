import React from "react";
import "./WEdContent.css";
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
  // Floating button/logo — shared via nav so the preview can render the logo.
  const floating = nav ? nav.floating : true;
  const setFloating = (v) => nav && nav.setFloating(v);
  const floatPos = nav ? nav.floatPos : "left";
  const setFloatPos = (v) => nav && nav.setFloatPos(v);
  // Content character limits (match the consentwebapp project).
  const LIMITS = { title: 50, message: 320, button: 20, policyLabel: 30, name: 20, desc: 300, label: 20 };
  const [cookieListOpen, setCookieListOpen] = React.useState(false);
  // Seed from the already-loaded banner content (synced from the webapp on launch)
  // so opening this tab doesn't overwrite it with defaults — fall back to the
  // editor defaults only when a field isn't present.
  const [rejectLabel, setRejectLabel] = React.useState(nav?.bannerContent?.reject ?? editorDefaults.default.rejectLabel);
  const [customizeLabel, setCustomizeLabel] = React.useState(nav?.bannerContent?.customize ?? editorDefaults.default.customizeLabel);
  const [policyLabel, setPolicyLabel] = React.useState(nav?.bannerContent?.policy ?? editorDefaults.default.policyLinkLabel);
  const [policyUrl, setPolicyUrl] = React.useState(nav?.bannerContent?.policyUrl ?? editorDefaults.default.policyUrl);
  // Preference Banner content (shared with the preview's preference modal).
  const prefContent = nav ? nav.prefContent : { title: preferenceBanner.title, overview: preferenceBanner.overview, save: preferenceBanner.buttons.save };
  const setPref = (patch) => { if (nav) nav.setPrefContent((c) => ({ ...c, ...patch })); markEditedKeys(patch, "pref_"); };
  const setCat = (i, patch) => { if (nav) nav.setPrefContent((c) => ({ ...c, cats: c.cats.map((cat, j) => j === i ? { ...cat, ...patch } : cat) })); markEditedKeys(patch, `cat${i}_`); };
  // Active region: CCPA shows CCPA-specific content in this editor.
  const isCCPA = nav ? nav.activeRegion === "CCPA" : false;
  const ccpaContent = nav ? nav.ccpaContent : { doNotShare: "", optOutTitle: "", optOutBody: "", cancel: "", save: "" };
  const setCcpa = (patch) => { if (nav) nav.setCcpaContent((c) => ({ ...c, ...patch })); markEditedKeys(patch, "ccpa_"); };

  // Per-language banner copy + ISO codes come from the shared content source.
  const langs = Object.keys(T);

  // Selected language is stored in NavContext (not local state) so it survives
  // tab switches — otherwise this component remounts and the dropdown snaps back
  // to English while the already-committed content stays in the chosen language.
  const lang = nav?.language ?? "English";
  const setLang = nav?.setLanguage ?? (() => {});
  const [fields, setFields] = React.useState(() => ({
    title: nav?.bannerContent?.title ?? T.English.title,
    message: nav?.bannerContent?.message ?? T.English.message,
    accept: nav?.bannerContent?.accept ?? T.English.accept,
  }));
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
  // Per-language defaults for the default-banner buttons (reject/customize).
  // Mirrors applyLangButtons() so a localized label (e.g. German "Ablehnen") is
  // NOT falsely flagged as "Edited" just because it differs from the English
  // default — only a real manual change shows the chip.
  const Tcur = T[lang] || T.English;
  const rejectDefault = Tcur.reject ?? editorDefaults.default.rejectLabel;
  const customizeDefault = Tcur.customize ?? editorDefaults.default.customizeLabel;

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
    nav.setCcpaContent((c) => ({ ...c, ...(cc.message ? { message: cc.message } : {}), optOutTitle: cc.optOutTitle, optOutBody: cc.optOutBody, doNotShare: cc.doNotShare, cancel: cc.cancel, save: cc.save }));
  };

  // Apply a language's button labels (reject/customize) — these live in their own
  // state, so they must be updated alongside `fields` on every language change.
  const applyLangButtons = (src) => {
    setRejectLabel(src?.reject ?? editorDefaults.default.rejectLabel);
    setCustomizeLabel(src?.customize ?? editorDefaults.default.customizeLabel);
  };

  const applyTranslation = (l) => {
    setFields({ ...T[l] });
    applyLangButtons(T[l]);
    setLang(l);
    if (l !== "English") setTranslated((p) => ({ ...p, [l]: true }));
    setEdited((p) => ({ ...p, [l]: {} }));
    applyLangToPref(l);
  };

  // Load a language's default content (translation, or English source).
  const loadLang = (l) => {
    if (translated[l] || l === "English") {
      const src = l === "English" ? T.English : T[l];
      setFields({ ...src });
      applyLangButtons(src);
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
    markEdited(k);
  };

  // Mark a field key as manually edited for the current language, so the "Edited"
  // chip only appears on ACTUAL edits — not when loaded/localized content happens to
  // differ from the (possibly wrong-language) default.
  const markEdited = (k) => {
    setEdited((p) => ({ ...p, [lang]: { ...(p[lang] || {}), [k]: true } }));
  };
  // Mark every key in a patch as edited, under a namespace prefix so pref/ccpa/cat
  // keys (e.g. both have `save`) don't collide with each other or with `fields`.
  const markEditedKeys = (patch, prefix) => {
    setEdited((p) => {
      const cur = { ...(p[lang] || {}) };
      for (const k of Object.keys(patch || {})) cur[prefix + k] = true;
      return { ...p, [lang]: cur };
    });
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
    setFloating(true);   // matches the launch default (floating icon ON)
    setFloatPos("left");
    setRejectLabel(editorDefaults.default.rejectLabel);
    setCustomizeLabel(editorDefaults.default.customizeLabel);
    setPolicyLabel(editorDefaults.default.policyLinkLabel);
    setPolicyUrl(editorDefaults.default.policyUrl);
    if (nav) {
      nav.setCloseBtn(false);
      nav.setShowReject(true);
      nav.setShowCustomize(true);
      nav.setShowPolicy(false);  // matches the launch default (policy link OFF)
      nav.setPrefContent({ title: preferenceBanner.title, overview: preferenceBanner.overview, save: preferenceBanner.buttons.save, alwaysActive: "Always Active", cats: prefCategories.map((c) => ({ name: c.l, desc: c.desc, always: !!c.always })) });
      nav.setCcpaContent({ doNotShare: ccpaBanner.doNotShare, optOutTitle: ccpaBanner.optOutTitle, optOutBody: ccpaBanner.optOutBody, cancel: ccpaBanner.buttons.cancel, save: ccpaBanner.buttons.save });
    }
  };

  const EDITED_CHIP =
  <span className="cb-edcontent-chip">
      <span className="cb-edcontent-chip-dot" />Edited
    </span>;
  // Localized fields use the per-language edit tracking; other fields compare to their default.
  const editedChip = (k) => langEdited[k] ? EDITED_CHIP : null;
  const diffChip = (v, d) => v !== d ? EDITED_CHIP : null;

  return (
    <WEdShell active="content">
      <div className="cb-edcontent-relative">
      <div className="cb-edcontent-grid-2">
        <div className="cb-edcontent-col">
          {/* Consent template + Language (two-up) */}
          <div className="cb-edcontent-mb6">
            <div className="cb-edcontent-row-between-mb8">
              <div className="cb-edcontent-heading">Localization</div>
              <WEdReset onClick={resetContent} />
            </div>
            <div className="cb-edcontent-grid-2-sm">
              <div>
                <div className="field-label cb-edcontent-mb5">Consent template</div>
                <select className="select" value={nav ? nav.template : "CCPA+GDPR"} onChange={(e) => nav && nav.setTemplate(e.target.value)}><option>CCPA (USA)</option><option>GDPR (EU)</option><option>CCPA+GDPR</option></select>
              </div>
              <div>
                <div className="field-label cb-edcontent-mb5">Language</div>
                <div className="cb-edcontent-relative">
                  <select className="select cb-edcontent-select-lang" value={lang} onChange={(e) => onPickLang(e.target.value)}>
                    {langs.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <span className="cb-edcontent-lang-badge">{codes[lang]}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Banner type sub-tabs */}
          <div className="cb-edcontent-subtabs">
            {[
              { id: "default", label: "Default Banner" },
              { id: "pref", label: "Preference Banner" }].
              map((t) =>
              <button key={t.id} onClick={() => setTab(t.id)} className="cb-edcontent-subtab-btn" style={{
                background: tab === t.id ? "var(--purple)" : "transparent",
                color: tab === t.id ? "#fff" : "var(--text-muted)"
              }}>{t.label}</button>
              )}
          </div>

          {tab === "default" &&
            <div className="card cb-edcontent-card">
            <div className="cb-edcontent-row-center-mb12">
              <div className="cb-edcontent-heading">Cookie Notice</div>
            </div>
            <div className="cb-edcontent-row-between-mb4">
              <span className="field-label cb-edcontent-field-label-chip">Title {editedChip("title")}</span>
              <span className="cb-edcontent-counter">{fields.title.length}/{LIMITS.title}</span>
            </div>
            <input className="input cb-edcontent-mb12" maxLength={LIMITS.title} value={fields.title} onChange={(e) => editField("title", e.target.value)} />
            <div className="cb-edcontent-row-between-mb4">
              <span className="field-label cb-edcontent-field-label-chip">Message {editedChip("message")}</span>
              <span className="cb-edcontent-counter">{fields.message.length}/{LIMITS.message}</span>
            </div>
            <textarea className="input cb-edcontent-mb12" rows="4" maxLength={LIMITS.message} value={fields.message} onChange={(e) => editField("message", e.target.value)} />

            <WEdRow label="Close button" checked={nav ? nav.closeBtn : false} onChange={(v) => nav && nav.setCloseBtn(v)} />

            {isCCPA ?
            <>
            <Field label={<>{'"Do Not Share" link'} {editedChip("ccpa_doNotShare")}</>} help={false}><input className="input" maxLength={50} value={ccpaContent.doNotShare} onChange={(e) => setCcpa({ doNotShare: e.target.value })} /></Field>

            <WEdRow label={<>{'"Cookie policy" Link'} {editedChip("policy")}</>} checked={nav ? nav.showPolicy : false} onChange={(v) => nav && nav.setShowPolicy(v)} />
            <input className="input cb-edcontent-mb12" maxLength={LIMITS.policyLabel} value={policyLabel} onChange={(e) => { setPolicyLabel(e.target.value); markEdited("policy"); }} />

            <Field label={<>URL {editedChip("policyUrl")}</>} help={false}><input className="input" value={policyUrl} onChange={(e) => { setPolicyUrl(e.target.value); markEdited("policyUrl"); }} /></Field>
            </>
            : <>
            <div className="cb-edcontent-row-between-mb4">
              <span className="field-label cb-edcontent-field-label-chip">Accept All {editedChip("accept")}</span>
              <span className="cb-edcontent-counter">{fields.accept.length}/{LIMITS.button}</span>
            </div>
            <input className="input cb-edcontent-mb12" maxLength={LIMITS.button} value={fields.accept} onChange={(e) => editField("accept", e.target.value)} />

            <WEdRow label={<>{'"Reject All" button'} {editedChip("reject")}</>} checked={nav ? nav.showReject : true} onChange={(v) => nav && nav.setShowReject(v)} />
            <input className="input cb-edcontent-mb12" maxLength={LIMITS.button} value={rejectLabel} onChange={(e) => { setRejectLabel(e.target.value); markEdited("reject"); }} />

            <WEdRow label={<>{'"Customize" button'} {editedChip("customize")}</>} checked={nav ? nav.showCustomize : true} onChange={(v) => nav && nav.setShowCustomize(v)} />
            <input className="input cb-edcontent-mb12" maxLength={LIMITS.button} value={customizeLabel} onChange={(e) => { setCustomizeLabel(e.target.value); markEdited("customize"); }} />

            <WEdRow label={<>{'"Cookie policy" Link'} {editedChip("policy")}</>} checked={nav ? nav.showPolicy : false} onChange={(v) => nav && nav.setShowPolicy(v)} />
            <input className="input cb-edcontent-mb12" maxLength={LIMITS.policyLabel} value={policyLabel} onChange={(e) => { setPolicyLabel(e.target.value); markEdited("policy"); }} />

            <Field label={<>URL {editedChip("policyUrl")}</>} help={false}><input className="input" value={policyUrl} onChange={(e) => { setPolicyUrl(e.target.value); markEdited("policyUrl"); }} /></Field>
            </>
            }
          </div>
            }

          {tab === "pref" && (isCCPA ?
          /* CCPA · Opt-out Preference editor */
          <div className="card cb-edcontent-card">
            <div className="cb-edcontent-heading-mb12">Opt-out Preference</div>
            <Field label={<>Title {editedChip("ccpa_optOutTitle")}</>} help={false}><input className="input" maxLength={LIMITS.title} value={ccpaContent.optOutTitle} onChange={(e) => setCcpa({ optOutTitle: e.target.value })} /></Field>
            <Field label={<>Description {editedChip("ccpa_optOutBody")}</>} help={false}><textarea className="input" rows="4" maxLength={LIMITS.message} value={ccpaContent.optOutBody} onChange={(e) => setCcpa({ optOutBody: e.target.value })} /></Field>
            <Field label={<>{'"Do Not Share" checkbox label'} {editedChip("ccpa_doNotShare")}</>} help={false}><input className="input" maxLength={50} value={ccpaContent.doNotShare} onChange={(e) => setCcpa({ doNotShare: e.target.value })} /></Field>
            <Field label={<>{'"Cancel" button'} {editedChip("ccpa_cancel")}</>} help={false}><input className="input" maxLength={LIMITS.button} value={ccpaContent.cancel} onChange={(e) => setCcpa({ cancel: e.target.value })} /></Field>
            <Field label={<>{'"Save my preferences" button'} {editedChip("ccpa_save")}</>} help={false}><input className="input" maxLength={LIMITS.button} value={ccpaContent.save} onChange={(e) => setCcpa({ save: e.target.value })} /></Field>
          </div>
          : <>
          {/* Preference Banner — expanded */}
          <div className="card cb-edcontent-card">
            <div className="cb-edcontent-row-between-mb12">
              <div className="cb-edcontent-heading">Preference Banner</div>
            </div>
            <Field label={<>Title {editedChip("pref_title")}</>} help={false}><input className="input" maxLength={LIMITS.title} value={prefContent.title} onChange={(e) => setPref({ title: e.target.value })} /></Field>
            <Field label={<>Privacy overview {editedChip("pref_overview")}</>} help={false}>
              <textarea className="input" rows="4" maxLength={LIMITS.message} value={prefContent.overview} onChange={(e) => setPref({ overview: e.target.value })} />
            </Field>
            <Field label={<>{'"Save My Preferences" button'} {editedChip("pref_save")}</>} help={false}><input className="input" maxLength={LIMITS.button} value={prefContent.save} onChange={(e) => setPref({ save: e.target.value })} /></Field>
            <Field label={<>{'"Always Active" label'} {editedChip("pref_alwaysActive")}</>} help={false}><input className="input" maxLength={LIMITS.label} value={prefContent.alwaysActive} onChange={(e) => setPref({ alwaysActive: e.target.value })} /></Field>
          </div>

          {/* Cookie List — accordion with editable category name + description */}
          <div className="card cb-edcontent-card">
            <div onClick={() => setCookieListOpen((o) => !o)} className="cb-edcontent-accordion-head">
              <div className="cb-edcontent-heading">Cookie List</div>
              <span className="cb-edcontent-chevron" style={{ transform: cookieListOpen ? "rotate(90deg)" : "none" }}>›</span>
            </div>
            {cookieListOpen &&
            <div className="cb-edcontent-mt12">
              {prefContent.cats.map((c, i) =>
              <div key={i} className="cb-edcontent-cat-row" style={{ marginTop: i ? 10 : 0 }}>
                <div className="cb-edcontent-cat-label">{prefCategories[i].l}</div>
                <Field label={<>Name {editedChip(`cat${i}_name`)}</>} help={false}><input className="input" maxLength={LIMITS.name} value={c.name} onChange={(e) => setCat(i, { name: e.target.value })} /></Field>
                <Field label={<>Description {editedChip(`cat${i}_desc`)}</>} help={false}><textarea className="input" rows="3" maxLength={LIMITS.desc} value={c.desc} onChange={(e) => setCat(i, { desc: e.target.value })} /></Field>
              </div>
              )}
            </div>
            }
          </div>
          </>)}

          {/* Floating button */}
          <div className="card cb-edcontent-card-pad">
            <div className="cb-edcontent-row-between-mb12">
              <div className="cb-edcontent-heading">Floating button</div>
              <Toggle on={floating} onClick={() => setFloating((v) => !v)} />
            </div>
            {floating && <>
            <div className="field-label cb-edcontent-mb8">Position</div>
            <div className="cb-edcontent-radio-group">
              <label onClick={() => setFloatPos("left")} className="cb-edcontent-radio-label">
                <Radio on={floatPos === "left"} /> Bottom left
              </label>
              <label onClick={() => setFloatPos("right")} className="cb-edcontent-radio-label">
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
        <div className="cb-edcontent-modal-overlay">
        <div className="card cb-edcontent-modal-card">
          <div className="cb-edcontent-modal-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /></svg>
          </div>
          {pendingLang.type === "switch" ? <>
          <div className="cb-edcontent-modal-title">Change language?</div>
          <div className="cb-edcontent-modal-body">
            The content you edited will be replaced with the default content of the selected language. This can't be undone.
          </div>
          <div className="cb-edcontent-modal-actions">
            <button className="btn btn-primary btn-sm cb-edcontent-btn-center" onClick={confirmSwitch}>Change language</button>
            <button className="btn btn-secondary btn-sm cb-edcontent-btn-center" onClick={() => setPendingLang(null)}>Cancel</button>
          </div>
          </> : <>
          <div className="cb-edcontent-modal-title">Overwrite your edits?</div>
          <div className="cb-edcontent-modal-body">
            You've made manual edits to this language's content. Re-translating will replace them with a fresh translation. This can't be undone.
          </div>
          <div className="cb-edcontent-modal-actions">
            <button className="btn btn-primary btn-sm cb-edcontent-btn-center" onClick={() => setPendingLang(null)}>Keep my edits</button>
            <button className="btn btn-sm cb-edcontent-btn-danger" onClick={() => {
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
