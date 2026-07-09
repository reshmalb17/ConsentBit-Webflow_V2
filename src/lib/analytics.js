// Product analytics for the Webflow Designer extension.
//
// Privacy-hardened for Webflow Marketplace review:
//   • No third-party analytics LIBRARY is bundled. Events are sent with a single
//     first-party fetch() to PostHog's capture endpoint — so none of posthog-js's
//     autocapture, session recording, heatmap, device-metadata, or external-script
//     loading code ships in the bundle or ever runs.
//   • No raw PII leaves the app. The account email is SHA-256 hashed and used only
//     as an opaque distinct_id; email/name are never sent as event properties.
//   • app_opened is DEFERRED until the first explicit user interaction — it is never
//     fired automatically on load.
//   • The project key below is a PUBLIC (publishable) PostHog key; nothing secret
//     depends on it.
const POSTHOG_KEY = "phc_pACPAPjdZRJRopr5EkE4AEHMwS9qqYdQC4pvEVMYdLzJ";
const CAPTURE_URL = "https://us.i.posthog.com/capture/";
const PLATFORM = "webflow";

let distinctId = null;   // SHA-256(email) once known, else a random per-load id
let pendingOpen = null;  // { site_id } queued until the first user interaction
let armed = false;       // first-interaction listener attached?
let customizeTimer = null;

// Hash the email so we get stable per-account attribution WITHOUT sending PII.
async function sha256Hex(input) {
  try {
    const data = new TextEncoder().encode(String(input).trim().toLowerCase());
    const buf = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch { return null; }
}

function anonId() {
  try { return crypto.randomUUID(); } catch { return `anon-${PLATFORM}`; }
}

// Fire-and-forget a single capture event. Best-effort — never throws into the app.
function send(event, properties = {}) {
  try {
    const id = distinctId || (distinctId = anonId());
    fetch(CAPTURE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event,
        properties: { distinct_id: id, platform: PLATFORM, ...properties },
      }),
    }).catch(() => {});
  } catch { /* analytics is best-effort */ }
}

export const analytics = {
  // No library to initialise — kept so existing call sites stay unchanged.
  init() {},

  // Store an OPAQUE, non-PII account id (hash of the email). Async & best-effort.
  identify(email) {
    if (!email) return;
    sha256Hex(email).then((h) => { if (h) distinctId = h; });
  },

  reset() { distinctId = null; pendingOpen = null; },

  // Deferred: queue the open and send it on the FIRST explicit user interaction
  // (pointer or key), never automatically on load.
  appOpened(siteId, email) {
    if (email) this.identify(email);
    pendingOpen = { site_id: siteId };
    if (armed || typeof window === "undefined") return;
    armed = true;
    const fire = () => {
      window.removeEventListener("pointerdown", fire);
      window.removeEventListener("keydown", fire);
      if (pendingOpen) { send("app_opened", pendingOpen); pendingOpen = null; }
    };
    window.addEventListener("pointerdown", fire, { once: true });
    window.addEventListener("keydown", fire, { once: true });
  },

  // Debounced 5s — a customization session fires many edits; count it once.
  bannerCustomized() {
    if (customizeTimer) clearTimeout(customizeTimer);
    customizeTimer = setTimeout(() => { send("banner_customized"); customizeTimer = null; }, 5000);
  },

  bannerPublished(domain, props = {}) {
    const isStaging = !domain || domain === "staging" || String(domain).includes(".webflow.io");
    send(isStaging ? "banner_published_staging" : "banner_published_custom_domain", { domain, ...props });
  },
  
};
