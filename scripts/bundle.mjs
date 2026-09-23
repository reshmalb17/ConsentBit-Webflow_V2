// Bundles the extension for upload to Webflow.
//
// Wraps `webflow extension bundle` for two reasons:
//
// 1. DO_NOT_TRACK=1 — without it the CLI injects a `telemetry` block into
//    webflow.json on every run, which then ships inside bundle.zip. The env
//    var makes the CLI short-circuit before it ever writes the manifest.
//    (npm scripts can't set env vars portably on Windows, hence this file.)
//
// 2. The zip is verified afterwards. A hand-made zip (Explorer "Send to →
//    Compressed folder", PowerShell Compress-Archive) writes BACKSLASH path
//    separators, which the ZIP spec forbids. Webflow extracts on Linux, so
//    "assets\index-*.js" becomes a flat file instead of an assets/ directory,
//    index.html 404s on its script + stylesheet, and the panel renders blank.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const zipPath = path.join(root, "bundle.zip");

const fail = (msg) => {
  console.error(`\n  ✖ ${msg}\n`);
  process.exit(1);
};

// Other CLI commands (`webflow extension serve`, run by `npm run dev`) can still
// leave a telemetry block behind. Strip it before bundling so a stale one never
// ships inside the zip.
const manifestPath = path.join(root, "webflow.json");
const before = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
if ("telemetry" in before) {
  delete before.telemetry;
  fs.writeFileSync(manifestPath, JSON.stringify(before, null, 2) + "\n");
  console.log("  ℹ removed a stale `telemetry` block from webflow.json");
}

const result = spawnSync("webflow", ["extension", "bundle", "--skip-update-check"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: { ...process.env, DO_NOT_TRACK: "1" },
});
if (result.status !== 0) fail("webflow extension bundle failed");

// --- verify the manifest on disk ---------------------------------------
const manifest = JSON.parse(fs.readFileSync(path.join(root, "webflow.json"), "utf8"));
if ("telemetry" in manifest) fail("webflow.json still contains a `telemetry` block");

// `npm run dev:test` adds the test backend origins to dataConnections (see
// scripts/testOrigins.mjs). The wf:bundle script removes them again, but a
// hand-edited manifest could still carry them into review — refuse to ship one.
const TEST_ORIGIN_RE = /workers\.dev|pages\.dev|localhost|127\.0\.0\.1/i;
const testConnections = (manifest.dataConnections || [])
  .map((c) => c && c.url)
  .filter((u) => u && TEST_ORIGIN_RE.test(u));
// ALLOW_TEST_ORIGINS is set only by scripts/bundleTest.mjs (bundle-test.zip).
if (testConnections.length && process.env.ALLOW_TEST_ORIGINS !== "1") {
  fail(
    `webflow.json still lists TEST origins in dataConnections — remove them before submitting:\n` +
      testConnections.map((u) => `      ${u}`).join("\n") +
      `\n\n    Run: node scripts/testOrigins.mjs remove`
  );
}

// --- verify the zip ----------------------------------------------------
// Walk the local file headers (PK\x03\x04) and read each entry name.
const zip = fs.readFileSync(zipPath);
const SIG = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const names = [];
for (let i = 0; (i = zip.indexOf(SIG, i)) !== -1; i += 4) {
  const nameLen = zip.readUInt16LE(i + 26);
  names.push(zip.slice(i + 30, i + 30 + nameLen).toString("utf8"));
}

const backslashed = names.filter((n) => n.includes("\\"));
if (backslashed.length) {
  fail(
    `bundle.zip uses backslash path separators — Webflow will serve a blank panel:\n` +
      backslashed.map((n) => `      ${n}`).join("\n")
  );
}
if (!names.includes("index.html")) fail("bundle.zip has no index.html at its root");
if (!names.some((n) => n.startsWith("assets/"))) fail("bundle.zip has no assets/ directory");

// Every asset index.html references must actually be in the zip.
const html = fs.readFileSync(path.join(root, "public", "index.html"), "utf8");
const referenced = [...html.matchAll(/(?:src|href)="\.\/([^"]+)"/g)].map((m) => m[1]);
const missing = referenced.filter((r) => !names.includes(r));
if (missing.length) fail(`index.html references files not in the bundle: ${missing.join(", ")}`);

console.log(`\n  ✓ bundle.zip verified — ${names.length} entries, ${referenced.length} assets resolved`);
console.log(`  ✓ no telemetry block in webflow.json\n`);
