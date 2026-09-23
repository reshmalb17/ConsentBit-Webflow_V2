// Render the small amount of markup carried inside the IAB banner's translated
// copy as React elements.
//
// Four strings in iabTranslations.js keep markup the copy can't do without: the
// vendors link in the notice, <strong> labels, the <code> spans around cookie and
// storage key names, and the empty <span>s a generated list is dropped into. Each
// language puts them where its own grammar needs them, so the markup has to travel
// with the string rather than being wrapped around it here.
//
// The live banner and the Framer plugin set these with innerHTML. This app doesn't:
// it ships as a Webflow Designer Extension, reviewed on the basis that it uses no
// innerHTML and does no direct DOM injection (see WEBFLOW_SECURITY_PRIVACY_URL.md),
// and that claim is worth more than the few lines this parser costs. So the markup
// is parsed into React elements, which also means the anchor gets a real React
// handler instead of a delegated click listener.
//
// Only the tags the copy actually uses are understood, and ATTRIBUTES ARE DROPPED
// WHOLESALE — the ids and data-tags in the strings exist for the runtime banner's
// own DOM lookups and mean nothing in a preview. Nothing here can emit an href, an
// event handler or a style, so even a future string that arrived from somewhere
// less trusted than our own table could not turn into script.

import React from "react";

/** Tags the copy uses. Anything else is unwrapped: children kept, tag discarded. */
const ELEMENT_FOR_TAG = {
  strong: "strong",
  b: "strong",
  em: "em",
  i: "em",
  code: "code",
  span: "span",
  a: "a",
};

const VOID_TAGS = new Set(["br"]);

const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g;

/**
 * Undo the escaping fillSpan() applies. The generated lists are IAB purpose names,
 * which can legitimately contain an ampersand, and they are escaped on the way in
 * so a name can never introduce markup.
 */
function decodeEntities(text) {
  if (text.indexOf("&") === -1) return text;
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    // Ampersand last, so "&amp;lt;" decodes to the literal "&lt;" and not to "<".
    .replace(/&amp;/g, "&");
}

/**
 * Parse a copy string into React nodes.
 *
 * @param {string} html   one of the *Html strings from iabTranslations.js
 * @param {object} [opts]
 * @param {object} [opts.linkProps] props for <a> nodes (the notice's vendors link
 *   is inert in a preview, so the caller passes its own onClick).
 * @returns {React.ReactNode[]}
 */
export function renderIabRichText(html, opts = {}) {
  const source = String(html == null ? "" : html);
  const linkProps = opts.linkProps || {};

  // Each frame is one open element; frame 0 collects the finished top-level nodes.
  const stack = [{ tag: null, children: [] }];
  let keySeed = 0;
  const push = (node) => stack[stack.length - 1].children.push(node);
  const pushText = (raw) => {
    if (!raw) return;
    const text = decodeEntities(raw);
    if (text) push(text);
  };

  let lastIndex = 0;
  let match;
  TAG_RE.lastIndex = 0;
  while ((match = TAG_RE.exec(source)) !== null) {
    const [full, closing, rawName, selfClosing] = match;
    const tag = rawName.toLowerCase();

    pushText(source.slice(lastIndex, match.index));
    lastIndex = match.index + full.length;

    if (VOID_TAGS.has(tag)) {
      push(React.createElement("br", { key: `br-${keySeed++}` }));
      continue;
    }
    // An unknown tag is dropped, but its children are kept: a string that gains a
    // wrapper we don't know about should lose the styling, never the words.
    const known = Object.prototype.hasOwnProperty.call(ELEMENT_FOR_TAG, tag);

    if (!closing) {
      if (selfClosing) continue; // self-closing non-void tag carries no content
      stack.push({ tag, known, children: [] });
      continue;
    }

    // Closing tag: unwind to the matching open frame. A stray close with no open
    // frame (never true of our own strings) is ignored rather than throwing.
    let depth = -1;
    for (let i = stack.length - 1; i >= 1; i -= 1) {
      if (stack[i].tag === tag) { depth = i; break; }
    }
    if (depth === -1) continue;
    while (stack.length - 1 >= depth) {
      const frame = stack.pop();
      const children = frame.children;
      if (!frame.known) {
        // Unwrapped: splice the children into the parent as-is.
        for (const child of children) stack[stack.length - 1].children.push(child);
        continue;
      }
      const type = ELEMENT_FOR_TAG[frame.tag];
      const props = { key: `${frame.tag}-${keySeed++}` };
      if (frame.tag === "a") Object.assign(props, linkProps);
      stack[stack.length - 1].children.push(
        React.createElement(type, props, children.length ? children : null),
      );
    }
  }
  pushText(source.slice(lastIndex));

  // Unclosed tags (again, never true of our own strings): keep the words.
  while (stack.length > 1) {
    const frame = stack.pop();
    for (const child of frame.children) stack[stack.length - 1].children.push(child);
  }
  return stack[0].children;
}
