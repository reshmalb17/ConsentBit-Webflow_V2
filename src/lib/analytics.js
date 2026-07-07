// Product analytics for the Webflow Designer extension.
//
// Matches the CURRENTLY-LIVE ConsentBit plugin's PostHog setup (src/util/analytics.ts +
// index.tsx) — NOT the standalone webapp's. The config is deliberately privacy-hardened
// for Webflow app review: `persistence: "memory"` (no localStorage), autocapture off, no
// session recording / surveys / web experiments, and no external dependency loading. So
// PostHog only ever POSTs the explicit capture() events below to us.i.posthog.com.
//
// Every event is tagged `platform: "webflow"` and — once the account is known — the
// account `email`, so the plugin's activity is distinguishable and attributable.
import posthog from "posthog-js";

let started = false;
let customizeTimer = null;
let currentEmail = null; // remembered from identify()/appOpened() → attached to every event
const PLATFORM = "webflow";

// Common properties on every event: platform + (once known) the account email.
function base(extra = {}) {
  return { platform: PLATFORM, ...(currentEmail ? { email: currentEmail } : {}), ...extra };
}

export const analytics = {
  // Idempotent — safe to call on every mount.
  init() {
    if (started || typeof window === "undefined") return;
    started = true;
    try {
      posthog.init("phc_pACPAPjdZRJRopr5EkE4AEHMwS9qqYdQC4pvEVMYdLzJ", {
        api_host: "https://us.i.posthog.com",
        defaults: "2026-01-30",
        persistence: "memory",
        capture_pageview: false,
        autocapture: false,
        disable_session_recording: true,
        disable_surveys: true,
        disable_web_experiments: true,
        disable_external_dependency_loading: true,
        advanced_disable_decide: true,
        capture_exceptions: false,
      });
    } catch (_) { /* analytics is best-effort — never break the app */ }
  },

  identify(email, name) {
    try {
      if (email) {
        currentEmail = email;
        posthog.identify(email, { email, name, platform: PLATFORM });
      }
    } catch (_) {}
  },

  reset() {
    try { currentEmail = null; posthog.reset(); } catch (_) {}
  },

  // Fired when the app launches inside the Designer for an authorized Webflow site.
  appOpened(siteId, email) {
    if (email) currentEmail = email;
    try { posthog.capture("app_opened", base({ site_id: siteId })); } catch (_) {}
  },

  // Debounced 5s — a customization session fires many edits; count it once.
  bannerCustomized() {
    try {
      if (customizeTimer) clearTimeout(customizeTimer);
      customizeTimer = setTimeout(() => {
        try { posthog.capture("banner_customized", base()); } catch (_) {}
        customizeTimer = null;
      }, 5000);
    } catch (_) {}
  },

  bannerPublished(domain, props = {}) {
    try {
      const isStaging = !domain || domain === "staging" || String(domain).includes(".webflow.io");
      posthog.capture(
        isStaging ? "banner_published_staging" : "banner_published_custom_domain",
        base({ domain, ...props }),
      );
    } catch (_) {}
  },
};
