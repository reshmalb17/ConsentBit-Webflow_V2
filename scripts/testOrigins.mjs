// Adds / removes the TEST backend origins in webflow.json `dataConnections`.
//
// The Designer enforces `dataConnections` as the extension iframe's connect-src
// allowlist, so a fetch to the test worker is blocked unless its origin is
// listed there. But those origins must never ship to Webflow review, so:
//
//   npm run dev:test    → `add`     (before `webflow extension serve`)
//   npm run wf:bundle   → `remove`  (before `webflow extension bundle`)
//
// Same idea as the telemetry strip in bundle.mjs: the manifest on disk is
// whatever the current task needs, and the bundle path always cleans it.

import fs from "node:fs";
import path from "node:path";

// Keep in sync with .env.test.
const TEST_ORIGINS = [
  "https://consent-webapp-manager.web-8fb.workers.dev",
  "https://consentbit-webapp-frontend-test.pages.dev",
];

const mode = process.argv[2];
if (mode !== "add" && mode !== "remove") {
  console.error("usage: node scripts/testOrigins.mjs <add|remove>");
  process.exit(1);
}

const manifestPath = path.resolve(import.meta.dirname, "..", "webflow.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const connections = Array.isArray(manifest.dataConnections) ? manifest.dataConnections : [];
const urls = connections.map((c) => c && c.url);

let next;
if (mode === "add") {
  next = [...connections, ...TEST_ORIGINS.filter((u) => !urls.includes(u)).map((url) => ({ url }))];
} else {
  // Remove by PATTERN, not just by exact match against TEST_ORIGINS. When a test
  // host is renamed (consentbitfrontend → consentbit-webapp-frontend-test), an exact
  // list leaves the old entry stranded in the manifest, where only the bundle guard
  // would catch it. Same pattern that guard uses in scripts/bundle.mjs.
  const TEST_ORIGIN_RE = /workers\.dev|pages\.dev|localhost|127\.0\.0\.1/i;
  next = connections.filter((c) => !(c && c.url && TEST_ORIGIN_RE.test(c.url)));
}

if (next.length === connections.length && mode === "add") {
  console.log("  ℹ webflow.json already lists the test origins");
} else if (next.length === connections.length) {
  console.log("  ℹ webflow.json has no test origins to remove");
} else {
  manifest.dataConnections = next;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  const verb = mode === "add" ? "added" : "removed";
  console.log(`  ℹ ${verb} the test origins in webflow.json (${next.length} dataConnections)`);
}
