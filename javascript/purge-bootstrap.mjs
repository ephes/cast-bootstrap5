import { PurgeCSS } from "purgecss";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const cssPath = resolve(
  root,
  "cast_bootstrap5/static/cast_bootstrap5/css/bootstrap5/bootstrap.min.css",
);

// Content sources: local (required) and sibling repos (optional).
// Sibling repos are validated — missing ones emit a warning so the
// output is never silently partial.
const localContent = [
  `${root}/cast_bootstrap5/templates/**/*.html`,
  `${root}/javascript/src/**/*.ts`,
];

const siblingRepos = [
  {
    name: "django-cast",
    globs: [
      `${root}/../django-cast/src/cast/templates/**/*.html`,
      `${root}/../django-cast/javascript/src/**/*.ts`,
    ],
    // Directories that must exist for the globs to resolve to files
    expectedDirs: [
      resolve(root, "../django-cast/src/cast/templates"),
      resolve(root, "../django-cast/javascript/src"),
    ],
    dir: resolve(root, "../django-cast"),
    required: true,
  },
  {
    name: "homepage",
    globs: [`${root}/../homepage/homepage/templates/**/*.html`],
    expectedDirs: [resolve(root, "../homepage/homepage/templates")],
    dir: resolve(root, "../homepage"),
    required: false,
  },
  {
    name: "python-podcast",
    globs: [`${root}/../python-podcast/python_podcast/templates/**/*.html`],
    expectedDirs: [
      resolve(root, "../python-podcast/python_podcast/templates"),
    ],
    dir: resolve(root, "../python-podcast"),
    required: false,
  },
];

const contentGlobs = [...localContent];
let missing = [];

for (const repo of siblingRepos) {
  if (!existsSync(repo.dir)) {
    if (repo.required) {
      console.error(`ERROR: required sibling repo missing: ${repo.dir}`);
      process.exit(1);
    }
    missing.push(repo.name);
    continue;
  }
  // Verify expected content directories exist inside the repo
  for (const dir of repo.expectedDirs) {
    if (!existsSync(dir)) {
      console.error(
        `ERROR: ${repo.name} exists but expected path missing: ${dir}`,
      );
      process.exit(1);
    }
  }
  contentGlobs.push(...repo.globs);
}

if (missing.length > 0) {
  console.warn(
    `WARNING: optional sibling repos not found: ${missing.join(", ")}`,
  );
  console.warn(
    `  Classes only used in those repos may be incorrectly purged.`,
  );
}

const originalSize = readFileSync(cssPath).length;

const result = await new PurgeCSS().purge({
  css: [{ raw: readFileSync(cssPath, "utf-8") }],
  content: contentGlobs,
  safelist: {
    standard: [
      // Bootstrap JS dynamic states
      "show",
      "fade",
      "active",
      "disabled",
      "collapse",
      "collapsing",
      // Modal dynamic classes
      "modal-open",
      "modal-backdrop",
      "modal-static",
      // Gallery JS
      "spinner-border",
      // Accessibility
      "visually-hidden",
      "visually-hidden-focusable",
      // crispy_bootstrap5 comment form layout (from Python: appsettings.py)
      "form-horizontal",
    ],
    greedy: [
      // crispy_bootstrap5 form classes (generated server-side from Python)
      /^form-/,
      /^is-/,
      /^was-/,
      // crispy_bootstrap5 grid classes for form layout (col-sm-2, col-sm-10, etc.)
      /^col-/,
      // HTMX dynamic classes
      /^htmx-/,
    ],
  },
});

const purgedCss = result[0].css;
writeFileSync(cssPath, purgedCss);

const newSize = Buffer.byteLength(purgedCss);
const savings = ((1 - newSize / originalSize) * 100).toFixed(1);

console.log(`PurgeCSS complete:`);
console.log(`  Before: ${(originalSize / 1024).toFixed(1)} KB`);
console.log(`  After:  ${(newSize / 1024).toFixed(1)} KB`);
console.log(`  Saved:  ${savings}%`);
