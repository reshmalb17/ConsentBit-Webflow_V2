import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In `--watch` (dev) mode, do NOT empty public/ on each rebuild: the Webflow
// serve reads files from public/, and a momentary empty dir makes it crash
// (exit code 1). For one-shot build/bundle we DO want a clean dir.
const isWatch = process.argv.includes("--watch");

// Build output goes straight into `public/` so the Webflow CLI
// (publicDir: "public") can serve/bundle it. publicDir is disabled
// to avoid a conflict with the build target.
export default defineConfig({
  // Relative asset paths — the Webflow Designer Extension iframe does NOT serve
  // from the origin root, so absolute "/assets/..." URLs 404 (blank panel).
  base: "./",
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: "public",
    emptyOutDir: !isWatch,
  },
});
