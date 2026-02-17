# CLAUDE.md

## Project Overview

Cast Bootstrap 5 is a Bootstrap 5 theme for django-cast. It provides templates, SCSS styles, and JavaScript modules (built with Vite) for the blogging/podcasting UI.

## Build Commands

```bash
# Build and sync JS bundle to Django static directory
just js-build-sync

# Compile SCSS to CSS (minified, no source map)
just scss

# Run JS tests
just js-test
```

## Critical: Syncing Built Assets

The Django static directory (`cast_bootstrap5/static/cast_bootstrap5/vite/`) serves the production JS bundles. The Vite build output (`javascript/dist/`) is gitignored and NOT deployed directly.

**After every TypeScript change, you MUST run `just js-build-sync`** to copy the built bundle into the Django static directory. Without this step, the deployed JS will be stale — the CSS and JS will be out of sync.

Similarly, **after every SCSS change, you MUST run `just scss`** to compile the updated CSS into `cast_bootstrap5/static/cast_bootstrap5/css/bootstrap5/cast.css`.

This applies to all default themes (cast-bootstrap5, cast-vue, etc.) that follow this pattern.

## Project Structure

- `javascript/src/` — TypeScript source (Vite entry points)
- `javascript/src/tests/` — Vitest tests
- `javascript/dist/` — Vite build output (gitignored)
- `cast_bootstrap5/static/cast_bootstrap5/vite/` — Synced JS bundles (committed, deployed)
- `cast_bootstrap5/static/cast_bootstrap5/css/` — Compiled CSS (committed, deployed)
- `cast_bootstrap5/static/cast_bootstrap5/scss/` — SCSS source
- `cast_bootstrap5/templates/cast/bootstrap5/` — Django/Wagtail templates
