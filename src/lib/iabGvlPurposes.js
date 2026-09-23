// Purposes & Features data for the IAB preview, in the selected language.
//
// This half of the banner's text is NOT ours to translate: IAB owns the purpose,
// special-purpose, feature and special-feature declarations, and publishes them
// per language in the Global Vendor List. The runtime banner gets them through
// GVL.changeLanguage(); the preview reads the bundled copy of the same list
// (iabGvlDeclarations.js) so the two show identical wording.
//
// Copy we author ourselves (section headings, toggle labels, the vendor-count
// line) lives in iabTranslations.js instead.

import { useMemo } from "react";
import { GVL_DECLARATIONS } from "./iabGvlDeclarations.js";
import { iabT, resolveIabLang } from "./iabTranslations.js";

/**
 * Which legal bases each purpose may be declared under.
 *
 * At runtime this is derived from the vendor list — a purpose offers a
 * legitimate-interest toggle when at least one vendor declares it that way. The
 * preview does not load the ~5 MB vendor list, so the TCF v2.2 policy split is
 * hardcoded: purposes 1 and 3-6 are consent-only, the rest also permit
 * legitimate interest. Special purposes carry no toggle at all, and special
 * features are consent-only.
 */
const LEGITIMATE_INTEREST_PURPOSE_IDS = new Set([2, 7, 8, 9, 10, 11]);

/**
 * Illustrative vendor counts, carried over from the runtime banner's static
 * table. The real numbers come from the vendor list, which the preview does not
 * fetch; these are stable enough to show the shape of the line and never change
 * with language.
 */
const VENDOR_COUNTS = {
  purposes: { 1: 777, 2: 734, 3: 594, 4: 596, 5: 267, 6: 238, 7: 847, 8: 404, 9: 548, 10: 633, 11: 174 },
  specialPurposes: { 1: 595, 2: 594, 3: 445 },
  features: { 1: 436, 2: 369, 3: 558 },
  specialFeatures: { 1: 280, 2: 157 },
};

const SECTION_SPECS = [
  // `id` / `itemPrefix` match the runtime accordion ids; `labelKey` is the
  // heading key in the IAB string table.
  { kind: "purposes", id: "purposes", itemPrefix: "purpose", labelKey: "section.purposes", hasToggle: true },
  { kind: "specialPurposes", id: "special_purposes", itemPrefix: "specialPurpose", labelKey: "section.specialPurposes", hasToggle: false },
  { kind: "features", id: "features", itemPrefix: "feature", labelKey: "section.features", hasToggle: false },
  { kind: "specialFeatures", id: "special-features", itemPrefix: "special-feature", labelKey: "section.specialFeatures", hasToggle: true },
];

function sortedIds(map) {
  return Object.keys(map || {})
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .sort((a, b) => a - b);
}

/** Build the accordion sections the preview renders from a set of GVL declarations. */
export function buildPurposeSections(declarations, lang) {
  return SECTION_SPECS.map((spec) => {
    const map = (declarations && declarations[spec.kind]) || {};
    const ids = sortedIds(map);
    const items = ids.map((id) => {
      const entry = map[id];
      return {
        id: `${spec.itemPrefix}${id}`,
        title: (entry && entry.name) || "",
        description: (entry && entry.description) || "",
        vendorCount: VENDOR_COUNTS[spec.kind]?.[id] ?? 0,
        // Special purposes are disclosure-only — no legal basis for the user to set.
        hasConsent: spec.kind === "purposes" || spec.kind === "specialFeatures",
        hasLegitimate: spec.kind === "purposes" && LEGITIMATE_INTEREST_PURPOSE_IDS.has(id),
      };
    });
    return {
      id: spec.id,
      title: `${iabT(lang, spec.labelKey)} (${items.length})`,
      hasToggle: spec.hasToggle,
      items,
    };
  });
}

/**
 * Purposes & Features for the active language.
 *
 * Every supported language is bundled, so a switch renders on the next frame with
 * no request and no loading state. A language without a table falls back to
 * English rather than rendering an empty tab — degraded copy beats no copy, and
 * resolveIabLang already narrows anything unexpected to a language we have.
 */
export function useIabPurposeSections(lang) {
  const resolved = resolveIabLang(lang);
  return useMemo(() => {
    const declarations = GVL_DECLARATIONS[resolved] || GVL_DECLARATIONS.en;
    return buildPurposeSections(declarations, resolved);
  }, [resolved]);
}
