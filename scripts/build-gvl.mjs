// Regenerate src/lib/iabGvlDeclarations.js from the IAB Global Vendor List.
//
//   node scripts/build-gvl.mjs
//
// The preview shows IAB's own purpose / feature wording, which IAB publishes per
// language. The live banner fetches it at runtime (GVL.changeLanguage()); the
// Designer Extension bundles it instead, because a Designer Extension must declare
// every outbound origin in webflow.json and the GVL host is not one of ours.
//
// Run this when IAB revises the list. Nothing else in the app reads the endpoint,
// and a stale table never reaches a visitor — only the preview.

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Same GVL host the runtime TCF manager uses (consent-manager utils/Tcfmanager.js).
const GVL_BASE_URL = "https://weathered-surf-ae57.narendra-3c5.workers.dev/gvl";

// Must stay in step with IAB_SUPPORTED_LANGUAGES in src/lib/iabTranslations.js.
const LANGUAGES = ["en", "nl", "fr", "de", "it", "pl", "pt", "es", "sv"];

// The four declaration sets the preview renders, in the order it renders them.
const BLOCKS = ["purposes", "specialPurposes", "features", "specialFeatures"];

const OUT_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "lib", "iabGvlDeclarations.js");

/** Narrow one `{ "1": { name, description }, ... }` block, dropping illustrations. */
function coerceEntries(raw) {
  const out = [];
  if (!raw || typeof raw !== "object") return out;
  const ids = Object.keys(raw)
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .sort((a, b) => a - b);
  for (const id of ids) {
    const value = raw[id] || {};
    out.push({
      id,
      name: typeof value.name === "string" ? value.name : "",
      description: typeof value.description === "string" ? value.description : "",
    });
  }
  return out;
}

async function fetchLanguage(lang) {
  const response = await fetch(`${GVL_BASE_URL}/purposes-${lang}.json`);
  if (!response.ok) throw new Error(`GVL ${lang}: HTTP ${response.status}`);
  const data = await response.json();
  const blocks = {};
  for (const block of BLOCKS) blocks[block] = coerceEntries(data?.[block]);
  // A response missing the purposes block is not usable — fail loudly rather than
  // writing a table that renders an empty tab.
  if (blocks.purposes.length === 0) throw new Error(`GVL ${lang}: no purposes in response`);
  return { blocks, version: data?.vendorListVersion, policy: data?.tcfPolicyVersion, updated: data?.lastUpdated };
}

const results = [];
for (const lang of LANGUAGES) {
  const result = await fetchLanguage(lang);
  results.push({ lang, ...result });
  const counts = BLOCKS.map((b) => `${b}:${result.blocks[b].length}`).join(" ");
  console.log(`${lang}  v${result.version}  ${counts}`);
}

// Every language is one translation of ONE list revision. If the host served a mix
// mid-update, the table would pair one language's wording with another's ids.
const versions = [...new Set(results.map((r) => String(r.version)))];
if (versions.length > 1) {
  throw new Error(`GVL versions differ across languages (${versions.join(", ")}) — re-run.`);
}

const { version, policy, updated } = results[0];

const body = results
  .map(({ lang, blocks }) => {
    const parts = BLOCKS.map((block) => {
      const rows = blocks[block]
        .map((e) => `      ${e.id}: { name: ${JSON.stringify(e.name)}, description: ${JSON.stringify(e.description)} },`)
        .join("\n");
      return `    ${block}: {\n${rows}\n    },`;
    });
    return `  ${lang}: {\n${parts.join("\n")}\n  },`;
  })
  .join("\n");

const header = `// IAB Global Vendor List declaration text, bundled for every banner language.
//
// GENERATED — do not hand-edit. Regenerate with scripts/build-gvl.mjs, which reads
// the same GVL endpoint the live TCF runtime uses (see consent-manager
// utils/Tcfmanager.js) and rewrites this file:
//   node scripts/build-gvl.mjs
//
// Source: vendor list v${version} (TCF policy v${policy}), ${updated}.
//
// This half of the IAB banner text is NOT ours to write or translate: IAB owns the
// purpose, special-purpose, feature and special-feature declarations and publishes
// them per language. The live banner gets them through GVL.changeLanguage(); the
// preview reads this table so the two show identical wording.
//
// Why bundled rather than fetched (this is where the Webflow app differs from the
// Framer plugin, which fetches at runtime): a Designer Extension must declare every
// outbound origin in webflow.json, and the GVL host is not one of ours. Bundling
// keeps the preview to the origins already declared for review, and makes switching
// language instant and offline-proof. The cost is that this file has to be
// regenerated when IAB revises the list — the wording changes rarely, and a stale
// preview string never reaches a visitor: the live banner always fetches.
//
// Illustrations are deliberately dropped — the preview renders name + description
// only, matching the runtime banner's purpose accordions.
//
// Copy we author ourselves (section headings, toggle labels, the vendor-count line)
// lives in iabTranslations.js instead.

export const GVL_VENDOR_LIST_VERSION = ${version};

export const GVL_DECLARATIONS = {
`;

await writeFile(OUT_PATH, `${header}${body}\n};\n`, "utf8");
console.log(`\nwrote ${OUT_PATH} (vendor list v${version})`);
