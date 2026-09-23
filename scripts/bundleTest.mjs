// Builds a TEST bundle: every backend URL points at the test environment.
//
//   npm run wf:bundle:test   →  bundle-test.zip
//
// For uploading to Webflow while testing against the Test worker. NOT for submission —
// the production bundle is still `npm run wf:bundle` → bundle.zip, which refuses any
// test URL (scripts/bundle.mjs).
//
// Steps:
//   1. Put ONLY test data connections in webflow.json (the Designer enforces this list
//      as the app's connect-src allowlist).
//   2. `vite build --mode test` → reads .env.test (Test worker + test checkout frontend).
//   3. Package + verify with scripts/bundle.mjs (ALLOW_TEST_ORIGINS=1 lets it accept the
//      test manifest), then rename the result to bundle-test.zip.
//   4. ALWAYS restore the original webflow.json and any existing bundle.zip, so the
//      production bundle command is unaffected.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const manifestPath = path.join(root, "webflow.json");
const prodZip = path.join(root, "bundle.zip");
const prodZipBackup = path.join(root, "bundle.zip.prod-backup");
const testZip = path.join(root, "bundle-test.zip");

// Keep in sync with .env.test. www.consentbit.com has no test copy: it is only the
// public website (privacy-policy link), not an API the app calls.
const TEST_CONNECTIONS = [
  "https://consent-webapp-manager.web-8fb.workers.dev",
  "https://consentbit-webapp-frontend-test.pages.dev",
  "https://www.consentbit.com",
];

const run = (cmd, args, extraEnv = {}) =>
  spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: true, env: { ...process.env, DO_NOT_TRACK: "1", ...extraEnv } });

const fail = (msg) => { console.error(`\n  ✖ ${msg}\n`); process.exitCode = 1; };

const originalManifest = fs.readFileSync(manifestPath, "utf8");
let movedProdZip = false;

try {
  // Keep an existing production bundle.zip safe — `webflow extension bundle` overwrites it.
  if (fs.existsSync(prodZip)) {
    fs.renameSync(prodZip, prodZipBackup);
    movedProdZip = true;
  }

  const manifest = JSON.parse(originalManifest);
  manifest.dataConnections = TEST_CONNECTIONS.map((url) => ({ url }));
  delete manifest.telemetry;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`  ℹ webflow.json → test connections only (${TEST_CONNECTIONS.length})`);

  if (run("npx", ["vite", "build", "--mode", "test"]).status !== 0) throw new Error("vite build --mode test failed");
  if (run("node", ["scripts/bundle.mjs"], { ALLOW_TEST_ORIGINS: "1" }).status !== 0) throw new Error("bundle step failed");

  if (fs.existsSync(testZip)) fs.rmSync(testZip);
  fs.renameSync(prodZip, testZip);

  // Verify the built app calls ONLY test backends.
  const html = fs.readFileSync(path.join(root, "public", "index.html"), "utf8");
  const jsRel = (html.match(/assets\/index-[\w-]+\.js/) || [])[0];
  const js = jsRel ? fs.readFileSync(path.join(root, "public", jsRel), "utf8") : "";
  const prodApis = ["https://manager.consentbit.com", "https://accounts.consentbit.com"].filter((u) => js.includes(u));
  if (!js) throw new Error("could not find the built app script to verify");
  if (prodApis.length) throw new Error(`test bundle still calls production: ${prodApis.join(", ")}`);
  if (!js.includes(TEST_CONNECTIONS[0]) || !js.includes(TEST_CONNECTIONS[1])) throw new Error("test URLs missing from the built app");

  console.log(`\n  ✓ bundle-test.zip ready — calls only the Test worker + test checkout`);
  console.log(`  ⚠ TEST bundle: do not submit it for Webflow review\n`);
} catch (e) {
  fail(e.message);
} finally {
  fs.writeFileSync(manifestPath, originalManifest);
  if (movedProdZip) {
    if (fs.existsSync(prodZip)) fs.rmSync(prodZip);
    fs.renameSync(prodZipBackup, prodZip);
  }
  console.log("  ℹ webflow.json and bundle.zip restored");
}
