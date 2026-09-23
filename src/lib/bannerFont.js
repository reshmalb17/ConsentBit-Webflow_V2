// Banner font resolution (Type tab → "Font" card).
//
// The card offers a single checkbox, "Default font style" — the font the banner
// itself injects, i.e. the stack the runtime hardcodes (see cdnM.js, which names
// no family on purpose since we load no webfont). It starts unchecked: leaving it
// off injects no font at all, so the banner inherits whatever typography the host
// page already serves. The checkbox IS the setting.
//
// Shared by the Type editor, the preview (WEdPreview) and the saved payload
// (buildCustomizationPayload) so all three agree on what the checkbox means.

export const SYSTEM_FONT_STACK =
  "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

export const FONT_MODES = [
  { id: "default", label: "Default font style", hint: "Uses the font the ConsentBit banner ships with." },
];

// The CSS font-family for a given editor state. Checked pins the banner to its
// injected stack, which is the behaviour every existing site renders today.
export function resolveFontFamily(enabled) {
  return enabled ? SYSTEM_FONT_STACK : "inherit";
}
