// One-shot: split chrome.jsx + widget-pages.jsx into per-component ESM modules,
// organized into primitives / kit / screens subfolders.
// Bodies are preserved verbatim; only import/export wiring is generated.
import fs from "fs";
import path from "path";

const APP = "C:/Seattle/TCF_PRODUCTION/Consentbit-Webflow-App-New -Design";
const SRC = "C:/Seattle/TCF_PRODUCTION/Consentbit webflow App";
const outDir = path.join(APP, "src", "components");
fs.rmSync(outDir, { recursive: true, force: true });

// folder per component (relative to src/components)
const FOLDER = {
  // shared primitives (from chrome.jsx)
  Field: "primitives", HelpQ: "primitives", Checkbox: "primitives", Radio: "primitives",
  Toggle: "primitives", MainTabs: "primitives", Page: "primitives", TopBar: "primitives",
  // reusable widget building blocks
  WPage: "kit", WLogo: "kit", WSteps: "kit", WTopBar: "kit", WMainTabs: "kit",
  WAuthShell: "kit", WSubStep: "kit", WCollapse: "kit", WWebflowHeadMock: "kit",
  WStat: "kit", WDashboard: "kit", WEdShell: "kit", WEdRow: "kit", WEdPreview: "kit",
  WEdReset: "kit", WEdChevron: "kit", WVerifyInstall: "kit", WVerifyResult: "kit",
  WAddDomain: "kit", WAddScript: "kit", WPublishStep: "kit",
  // screens
  WLanding: "screens/auth", WLogin: "screens/auth", WSelectPlan: "screens/auth",
  WSelectPlanFreeUsed: "screens/auth", WCheckoutExternal: "screens/auth",
  WInstallVerify: "screens/auth", WInstallVerifyCompact: "screens/auth",
  WInstallVerifyTwoCol: "screens/auth", WVerifySuccess: "screens/auth", WVerifyError: "screens/auth",
  WEdGeneral: "screens/app", WEdLayout: "screens/app", WEdColors: "screens/app",
  WEdContent: "screens/app", WEdType: "screens/app", WScan: "screens/app",
  WConsentLogs: "screens/app", WEdSimple: "screens/app", WDomains: "screens/app",
  WEdGeneralPublished: "screens/app",
  WProfile: "screens/profile",
  WNotifications: "screens/modals", WInstallCode: "screens/modals",
  WLoading: "screens/modals", WPublish: "screens/modals",
  WUpgrade: "screens/upgrade",
};

const fileOf = (n) =>
  n === "MSym" || n === "Icon" ? "lib/icons.jsx" : `${FOLDER[n]}/${n}.jsx`;

function parseDefs(src) {
  const lines = src.split(/\r?\n/);
  const starts = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    let m;
    if ((m = l.match(/^function\s+(\w+)\s*\(/))) starts.push({ i, name: m[1] });
    else if ((m = l.match(/^const\s+(\w+)\s*=/))) starts.push({ i, name: m[1] });
    else if (/^Object\.assign\s*\(/.test(l)) starts.push({ i, name: "__OBJ__" });
  }
  const defs = [];
  for (let k = 0; k < starts.length; k++) {
    if (starts[k].name === "__OBJ__") continue;
    const start = starts[k].i;
    const end = k + 1 < starts.length ? starts[k + 1].i : lines.length;
    defs.push({ name: starts[k].name, body: lines.slice(start, end).join("\n").replace(/\s+$/, "") });
  }
  return defs;
}

const allDefs = [];
for (const f of ["chrome.jsx", "widget-pages.jsx"]) {
  allDefs.push(...parseDefs(fs.readFileSync(path.join(SRC, f), "utf8")));
}
const names = new Set(allDefs.map((d) => d.name));

function depsOf(def) {
  const found = new Set();
  for (const other of names) {
    if (other === def.name) continue;
    if (new RegExp("\\b" + other + "\\b").test(def.body)) found.add(other);
  }
  return found;
}

function importsFor(name, deps) {
  const selfFile = path.join(outDir, fileOf(name));
  const byMod = {};
  for (const d of deps) {
    const depFile = path.join(outDir, fileOf(d));
    if (depFile === selfFile) continue;
    let rel = path.relative(path.dirname(selfFile), depFile).split(path.sep).join("/");
    if (!rel.startsWith(".")) rel = "./" + rel;
    (byMod[rel] ||= new Set()).add(d);
  }
  return Object.entries(byMod)
    .sort()
    .map(([rel, set]) => `import { ${[...set].sort().join(", ")} } from "${rel}";`)
    .join("\n");
}

function write(relFile, content) {
  const abs = path.join(outDir, relFile);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
}

// icons.jsx (MSym + Icon)
const msym = allDefs.find((d) => d.name === "MSym");
const icon = allDefs.find((d) => d.name === "Icon");
write("lib/icons.jsx", `import React from "react";\n\n${msym.body}\n\n${icon.body}\n\nexport { MSym, Icon };\n`);

let n = 0;
for (const def of allDefs) {
  if (def.name === "MSym" || def.name === "Icon") continue;
  const imports = importsFor(def.name, depsOf(def));
  const head = `import React from "react";` + (imports ? "\n" + imports : "");
  write(fileOf(def.name), `${head}\n\n${def.body}\n\nexport { ${def.name} };\n`);
  n++;
}
console.log("modules written:", n + 1);
