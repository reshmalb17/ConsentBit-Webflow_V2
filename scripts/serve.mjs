// Runs `webflow extension serve` with DO_NOT_TRACK=1 so the dev server does not
// inject a `telemetry` block into webflow.json. Same reason as scripts/bundle.mjs:
// npm scripts can't set env vars portably on Windows.

import { spawn } from "node:child_process";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

const child = spawn("webflow", ["extension", "serve", "--skip-update-check"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: { ...process.env, DO_NOT_TRACK: "1" },
});

child.on("exit", (code) => process.exit(code ?? 0));
