# Installing Bootstrap5 Theme for Django-Cast

This document provides the instructions on how to install the Bootstrap5 theme for Django-Cast. Please follow the steps below.

## Installation

### 1. Install the theme

To install the Bootstrap5 theme, you will need to run the following command in your command line:

```shell
pip install cast-bootstrap5
```

### 2. Add to INSTALLED_APPS and set CRISPY_TEMPLATE_PACK

You will need to add `crispy_bootstrap5` and `cast_bootstrap5.apps.CastBootstrap5Config`
to your INSTALLED_APPS in your Django settings. Also, if `crispy_forms` is not
yet added, add it to INSTALLED_APPS.

Then, set the CRISPY_TEMPLATE_PACK and CRISPY_ALLOWED_TEMPLATE_PACKS like so:

```python
INSTALLED_APPS = [
    ...,
    'crispy_forms',
    'crispy_bootstrap5',
    'cast_bootstrap5.apps.CastBootstrap5Config',
    ...
]

CRISPY_TEMPLATE_PACK = "bootstrap5"
CRISPY_ALLOWED_TEMPLATE_PACKS = "bootstrap5"
```
### 3. Set the theme in Wagtail admin

You can set the theme to `bootstrap5` in the Wagtail admin for the
complete site or just one blog.

### End

That's it! You have successfully installed and set up the Bootstrap5 theme
for [`django-cast`](https://github.com/ephes/django-cast).

The metadata-sharing template contract requires django-cast 0.2.62 or newer.
Release and deploy django-cast before upgrading cast-bootstrap5; older versions
do not ship `cast/includes/post_social_meta.html`.

With django-cast 0.2.64 or newer, the search modal progressively enhances the
existing GET search form with recent-first title suggestions. The destination
list supports pointer, touch, and keyboard navigation and leaves ordinary form
submission available when JavaScript or the suggestion endpoint fails, or when
the current filter combination has no matching posts. While destinations are
visible, they take visual priority over the live full-text no-results message.
When a longer query refreshes an open list, the settled destinations remain
visible but temporarily non-selectable until the matching response arrives.
IME input is supported: suggestions wait until composition ends, and composition
keys retain their input-method behavior. This also means keyboards that keep
Latin words in an active composition session show suggestions after the word
is committed (for example, by a space), rather than while composing it.
Plain suggestion clicks open in the
current page; Ctrl/Meta and middle clicks open a new tab, and Shift clicks request
a separate window (the browser controls the final presentation).
With an older django-cast version the endpoint URL is absent and the modal
keeps its submit-only search behavior.

## Gallery captions

Gallery thumbnails display an optional plain-text caption for each gallery entry,
using semantic `figure`/`figcaption` markup with HTML escaping. Both the JavaScript
and HTMX gallery templates accept django-cast’s `gallery_entries` context
(`image` and `caption` per entry), while continuing to render the legacy `images`
context without captions. The core must supply `gallery_entries`, `images`, and
`image_pks` in the same order and length, retaining duplicate occurrences; HTMX
uses each entry’s position to select its modal image, and passes django-cast’s
signed `gallery_token` with every modal request (required since django-cast
0.2.61; the modal endpoint answers 400 without it). Repeated uses of one image can have different captions;
the shared image itself is unchanged. Captions appear below thumbnails, not in
the enlarged-image modal.

## Page transitions

With django-cast 0.2.67 or newer (the minimum this theme requires), ordinary
same-origin page loads use cross-document view transitions of the `cast-page`
type shared with django-cast's built-in themes. The page crossfades while the
sticky navbar stays in place, and a post's title and first overview image morph
between the post list and its detail page in both directions. The theme loads
django-cast's `cast/js/post-view-transition.js` in the `<head>` of `base.html`
for the morph; audio player cover art is never used as the post image. The post
list is rendered during these transitions so a post can morph back into it
despite `content-visibility: auto`.

Readers who prefer reduced motion, and browsers without cross-document view
transitions, get plain page loads. HTMX pagination keeps its own fade. Sites
that override `post_body.html` keep the morph as long as each post is an
`<article>` whose direct `<header>` contains a heading and a link to the post,
and whose overview section has the `block-overview` class; see django-cast's
frontend documentation for the full contract.

## Development
### Install javascript dependencies

All javascript stuff lives in the `javascript` folder. So the first thing
to do is to change to that folder.
```shell
cd javascript
```

Then install the dependencies:

```shell
npm install
```

### Build javascript

```shell
npx vite build
```

After that you have to copy the contents of the `dist` folder
to the `cast_bootstrap5/static/cast_bootstrap5/vite` folder. Including
the manifest file from `dist/.vite/manifest.json`.

```shell
cp dist/* ../cast_bootstrap5/static/cast_bootstrap5/vite
cp dist/.vite/manifest.json ../cast_bootstrap5/static/cast_bootstrap5/vite
```

### Purge unused Bootstrap CSS

After upgrading `bootstrap.min.css`, re-run PurgeCSS to strip unused rules:

```shell
npm run purge:bootstrap
```

This scans templates and JS from cast-bootstrap5 plus sibling repos to
determine which Bootstrap classes are actually used. Requirements:

- **Required**: `../django-cast` must be cloned alongside cast-bootstrap5
- **Optional**: `../homepage` and `../python-podcast` — if missing, a warning
  is printed (classes only used in those repos may be incorrectly purged)

The purged CSS is written back to
`cast_bootstrap5/static/cast_bootstrap5/css/bootstrap5/bootstrap.min.css`.

### Run tests

```shell
just test                   # JavaScript and Python/template tests
uv run --extra test pytest  # Python/template contract tests only
npx vitest run              # JavaScript tests once
npx vitest watch            # JavaScript tests in watch mode
just check-assets           # rebuild Vite bundle and cast.css, fail on drift
# Testing against a sibling django-cast worktree instead of the develop branch:
PYTHONPATH=../django-cast/src uv run --extra test pytest
```

django-cast 0.2.67 is not on PyPI yet, so `[tool.uv.sources]` in
`pyproject.toml` tracks the django-cast `develop` branch for uv, matching the
source used by homepage and python-podcast. A commit-specific source here
conflicts with those consumers' branch source when uv resolves Git dependencies.
Published package metadata keeps the plain `django-cast>=0.2.67` requirement.
Remove the source block once 0.2.67 is released.

Sites can upgrade the theme by setting their cast-bootstrap5 Git `rev` to the
new theme commit and running `uv lock --upgrade-package cast-bootstrap5`; keep
their django-cast source at `branch = "develop"`.

CI (`.github/workflows/ci.yml`) runs `just js-test`, `just check-assets`, and
the pytest suite on every push and pull request.

Rendered metadata behavior and JSON-LD parsing are covered by django-cast's
post and episode detail tests; this theme's tests guard the shared-template and
minimum-version contract.

### Run development server

```shell
npx vite
```

## Theme preference

The color mode (Auto, Light, or Dark) is persisted in localStorage when available.
If storage is denied, the choice remains active for this page session, including
system color-scheme changes and HTMX swaps; a full page load may lose it.
Auto follows the system color scheme. Cross-tab localStorage updates for
`cast-theme` apply valid modes immediately; removing the preference or clearing
storage restores Auto. Invalid modes and unrelated storage events are ignored.
