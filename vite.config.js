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
    // Inline assets up to 12 kB as data URIs. The default (4 kB) leaves logo.svg
    // (8.66 kB) as a separate file, so the launch splash could not paint its logo
    // until a SECOND request completed — after the 367 kB bundle had already
    // downloaded and executed. Inlining removes that round-trip entirely.
    // The PNGs (34–47 kB) stay as files; they are below-the-fold help images.
    assetsInlineLimit: 12288,
  },
});
