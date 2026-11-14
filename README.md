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
Suggestion destinations must resolve against the current origin to HTTP(S) URLs
on that same origin, without credentials. Relative post links remain supported;
invalid destinations (including executable schemes and foreign origins) reject
the whole response before caching or rendering, leaving ordinary search usable.
Suggestion IDs must be positive safe integers and unique within each response,
so keyboard focus always identifies exactly one option. Invalid identities reject
the whole response before caching or rendering.
Each suggestion request accumulates at most 64 KiB of response-body bytes through a
standard stream reader before JSON parsing, independently of Content-Length
(including absent or understated lengths). Exceeding the budget cancels the body
and uses the same unavailable/fallback behavior; oversized responses are never
cached. This also bounds large suggestion titles and each cached response.
Each suggestion request has a five-second total deadline, including reading the
JSON response. Cancellation also cancels the body reader. A timeout clears the loading indicator and announces that
suggestions are unavailable; ordinary Enter and submit-button searches remain
usable. Superseded requests are cancelled silently. Removing the modal element from
the page disconnects typeahead and cancels its request and deadline timer.
Closing the modal cancels queued and in-flight facet and suggestion requests,
clears loading indicators and closes the suggestion list. Late responses cannot
change filters or announce results. Reopening reconnects suggestions once and
preserves the current query and selected filters. Interrupted facet updates and
suggestions refresh on reopening without needing another input event. Suggestion status messages are
announced only while the search input has focus. As with other endpoint failures,
two consecutive timeouts suspend suggestions until the modal is reopened.
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

## Podlove player loading and retry

The shared embed script load has a ten-second deadline. If it times out, fails
to load or register, or the player initializer throws synchronously,
the loading indicator clears, a visible failure message is announced, and the
player offers a button labelled “Retry
loading player”. Activate it with a pointer or keyboard to try again; hover and
focus do not automatically retry failed loads while the facade remains connected.
Keyboard focus returns to the retry action when its button triggered the load
and focus has not moved to another element in the meantime; focus is never
taken away from elsewhere on the page. If a theme change reinitializes a facade
player that was still being revealed and that attempt fails, the facade is shown
again with the retry action. Both facade modes allow one
initialization at a time. Failed or unusable embed scripts are discarded so the
next attempt can fetch them again. A timeout fails every waiting player and
removes the attempt's script and event handlers; late events from it cannot
settle or remove a retry's script. A failed initializer discards its partial
player host, and recovery from an older attempt cannot reset a newer player.

## HTMX pagination with Podlove players

On HTMX history restoration, the theme queues a scroll to the top after HTMX's
own deferred saved-position scroll. A later restoration cancels the previous
theme scroll, and `destroyPagingContentVisibility()` cancels it during teardown.
The callback only scrolls while its original paging area is still connected and
current in the same initialized lifecycle; removing or replacing that area
makes the queued callback a no-op.

While an HTMX pagination request for `#paging-area` is running, a list that
contains Podlove players is masked so the players do not flash during the swap.
The mask and the fade state are removed again when the new content has settled.
Each request owns its state through HTMX's public `detail.xhr` identity. A late
transition, settle, error or unmask timer from an older request cannot clear the
newer request's state, even after the paging element is replaced.

If the request does not complete, the current content is restored at once: the
mask, the fade state and the pending unmask timer are cleared for an HTTP error
response, a network failure (`htmx:sendError`), a timeout (`htmx:timeout`), an
aborted request and a failed swap. The reader keeps the page they were on and
can try again. Failures of HTMX requests that target other elements leave the
paging state alone.

## Post link prefetching

Links marked `data-cast-prefetch` request a speculative document fetch on hover,
focus or touch. Only same-origin HTTP(S) URLs without a username or password
are eligible; the current page is excluded. Prefetch identity ignores fragments
(including when checking existing prefetch links), while paths and query strings
remain distinct. Anchor destinations, including fragments, and ordinary browser
navigation are unchanged. The theme retains at most 32 owned prefetch nodes/cache
entries across HTMX swaps, evicting the oldest entry before admitting a new URL.
Eviction and teardown remove only theme-owned nodes; foreign head links stay in
place and are reused without adding cache entries. Revisiting an evicted URL may
prefetch it again. A failed owned fetch removes its node and allows one further
user-triggered attempt, with no automatic retry. After two attempts, failures
remain suppressed until eviction or teardown resets that URL's budget. In-flight
and successful retained nodes deduplicate further triggers.
The focused regressions run with
`cd javascript && npx vitest run src/tests/post-link-prefetch.test.ts src/tests/paging-content-visibility.test.ts`.

## Dynamic search facets

Dynamic facet requests have a five-second total deadline covering both fetch and
JSON body reading and parsing. Facets share the suggestion stream reader, with
an independent 256 KiB limit on actual response bytes, regardless of
Content-Length. Oversized or cancelled bodies are cancelled before JSON parsing
and never cached. Expiry clears loading and announces “Could not refresh filters.
You can still search.” The current filters and ordinary form submission remain
usable, and a later filter or query change can retry. Superseding a request,
closing the modal or removing it cancels pending work silently.

Before caching or changing any filter selection, the modal validates the entire
response: `mode` must be `"modal"`, `result_count` must be finite and nonnegative,
and `groups` must be an object containing only `date_facets`, `tag_facets` and
`category_facets` (configured subsets, including an empty object, are supported).
Each group requires a string `selected`, a finite nonnegative `all_count`, and an
`options` array whose entries have string `slug`/`name` and finite nonnegative
`count`. An invalid response leaves every group and hidden form input unchanged,
is never cached, and uses the same failure announcement. Valid responses update
all selections before building facet links so the links share the new state.
Responses may contain at most 500 options per group and 1,000 options total,
counting duplicate, zero-count and otherwise hidden rows before normalization.
These limits are checked before caching, changing selections or building DOM.
A refused update retains all current filters and ordinary form search; it does
not silently truncate the result. A refreshed facet link keeps keyboard focus
when that group still owns focus at commit. If the option disappears, focus
returns to its “All” link. Focus moved to search or another control is preserved.

Collapsed facet groups keep selected options visible even past the configured
limit (twelve by default), including after a dynamic refresh. Use “All” to remove
the group's selected filter. “Show all” / “Show fewer” controls only the remaining
overflow options, with matching `aria-expanded`; the toggle is hidden when no
options need collapsing.

Search overlays acquire and release a shared body scroll lock. The first owner
saves the previous inline overflow value; closing or disconnecting releases only
that instance. Overlapping search instances and Bootstrap modals keep scrolling
locked until the last owner closes, then restore the saved value. Bootstrap
coordination uses its public `show.bs.modal` and `hidden.bs.modal` lifecycle;
Bootstrap continues to own its backdrops, scrollbar padding and focus traps.

## Keyboard focus in the search modal

While the search modal is open, Tab and Shift+Tab stay inside it and wrap
between its first and last control. The controls that count are the visible,
enabled `input` (except `type="hidden"`), `button`, `select` and `textarea`
elements, links with an `href`, `summary` elements and elements with a
non-negative `tabindex`. Hidden controls, disabled controls (including those
inside a disabled `fieldset`) and controls with a negative `tabindex` are
skipped, along with inert descendants and CSS visibility-hidden controls. Visible
fixed-position controls are included. Positive tabindex values come first in
ascending order (ties retain DOM order), then zero/default controls. When positive
values are present, every Tab step follows this modal-local order so outside
controls cannot intrude. In this mode, each enabled radio input is a separate
stop; radio groups are not collapsed to a single stop. Controls in closed
details content are skipped. The trap
rechecks layout, disabled state and tabindex on each keypress. A template override may therefore
end the modal with any of these controls, including a textarea. This is a bounded
control set, not a general focus manager for shadow DOM or embedded documents.
If replacement, hiding, or disabling leaves focus outside the current set, the
next Tab enters the first control (Shift+Tab enters the last). If no supported
stops remain, Tab stays on the modal container until controls return. The trap
makes an otherwise non-focusable container temporarily focusable while active
and removes that attribute on deactivation. Focus on the dialog background
also restarts at the first/last control on the next Tab/Shift+Tab.

## Development
### Install javascript dependencies

All javascript stuff lives in the `javascript` folder. So the first thing
to do is to change to that folder.
```shell
cd javascript
```

Use Node.js 24.15 or newer in the 24.x line, matching CI, then install the
locked dependencies:

```shell
npm ci
npm run audit  # full locked tree, including developer dependencies; moderate or higher fails
```

TypeScript is pinned in `javascript/package.json`. The strict typecheck uses
bundler module resolution to match Vite, includes Vitest globals and Node types,
and checks dependency declarations without `skipLibCheck`. Run it before
committing frontend changes; it does not emit or rebuild assets.

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
just test                   # strict TypeScript, JavaScript and Python/template tests
just js-audit               # full-lock moderate/high/critical advisory gate
just js-browser-test        # native Chromium keyboard/layout regressions
# First install the browser: cd javascript && npx playwright install chromium
just js-typecheck           # strict sources, tests and Vite config (tsc --noEmit)
# Or, from javascript/: npm run typecheck
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

CI (`.github/workflows/ci.yml`) runs `just js-audit` immediately after the locked
install, then `just js-typecheck`, `just js-test`, `just check-assets`,
`just js-browser-test`, the pytest suite and `just check-messages` on every push and pull request.

The audit includes build/test dependencies, even packages that never ship in the
browser bundle. Registry or scanner failures also fail the job; no lockfile is
rewritten by the audit. The tooling refresh requires Vitest 4.1.12 or newer and jsdom 30.1.3 or newer;
the lock resolves mocker 4.1.12 and undici 8.12.4. The unused Vue test utilities
were removed, including their vulnerable formatting dependencies; this theme
uses Vitest and DOM fixtures. The audit addresses development tooling exposure.

Rendered metadata behavior and JSON-LD parsing are covered by django-cast's
post and episode detail tests; this theme's tests guard the shared-template and
minimum-version contract.

### Translations

The theme ships a German catalog in `cast_bootstrap5/locale/de/LC_MESSAGES/`.
Both `django.po` and the compiled `django.mo` are committed and included in the
package, so sites with `USE_I18N = True` and a German active language render the
translated theme strings without running `compilemessages` themselves. Strings
without a German translation fall back to English.

The `<html lang>` attribute of `base.html` follows the active language
(`get_current_language`), so a German request renders `lang="de"`. With
`USE_I18N = False` it is the site's `LANGUAGE_CODE`.

After adding or changing `{% translate %}` / `{% blocktranslate %}` strings in
the templates, regenerate the catalog with GNU gettext installed:

```shell
just messages        # makemessages + compilemessages for the theme package
just check-messages  # fail if django.po no longer matches the templates (CI)
```

`just messages` keeps existing translations, adds new msgids untranslated (no
fuzzy guesses) and drops strings the templates no longer use. The pytest suite
checks that `django.mo` matches the translated entries in `django.po`.

### Run development server

```shell
npx vite
```

## Ordering dropdown outside the search modal

Outside the search modal, the enhanced ordering dropdown preserves the native select's disabled options
and disabled optgroups. Disabled selects (including those in disabled fieldsets)
remain visible as native controls when disabled at initialization. The dropdown
observes live option/optgroup additions,
removals, reordering, labels, values, selected attributes and disabled attributes.
It also rechecks native option node identity before every selection, so a stale
menu item cannot select a replacement option. Programmatic selectedIndex/value
changes still require native `input` or `change` events. Changes to an enclosing
fieldset's disabled state are rechecked on native events and before selection.
A select disabled at initialization stays native until
enhancement is run again.
Search-modal ordering pills share the same disabled-option policy and native
event/reset synchronization. A disabled select remains native at initialization;
after enhancement, disabled attributes are refreshed through native `input` or
`change` events, and click handling always checks the current disabled state.
Establish the option list before enhancement. An empty native value defaults to
newest first only when that option is enabled. Clear all also preserves disabled
selects and skips unavailable reset choices. Enabled selections retain ordinary form
submission and emit one bubbling `input` followed by `change` when the selection
changes. External changes dispatched through `input` or `change`, and form
resets, synchronize the displayed label and active option. Initialization is
idempotent. The replacement button's accessible name includes both the field
label and the current selected value, including after selection changes and reset.

`initFilterEnhancementsBootstrap()` owns one pending DOMContentLoaded callback
and one HTMX swap listener. `destroyFilterEnhancementsBootstrap()` cancels pending
initialization and removes the swap listener, leaving already rendered controls
in place. Reinitialization is supported after teardown.
Each ordering enhancement separately owns an `htmx:beforeCleanupElement`
listener. HTMX cleanup disconnects its observer, removes form/control/menu
listeners, cancels pending reset work and restores the native select. Reusing
the container can then enhance it exactly once.

## Enlarged gallery images

Ordinary primary clicks and keyboard activation open the enlarged-image modal.
Enhancement first requires an owned thumbnail image/source and an owned modal
with body, footer, source, image and original-image link. Missing or malformed
markup, missing targets and invalid target selectors preserve ordinary link
navigation without changing the last valid modal. Explicit Bootstrap target
selectors must resolve to this gallery's modal. Previous/next image references
are literal IDs scoped to the gallery, including punctuation and leading digits.
Unmodified, noncomposing Left/Right keys navigate only from gallery-owned
noninteractive content. A successful move prevents native scrolling; editing,
interactive controls, modified keys and end-of-gallery keys retain native behavior.
Modified clicks, non-primary clicks, cancelled events, and links with a download
or another browsing target keep their native browser behavior. After Escape or
the close button finishes hiding the modal, focus returns to the opening
thumbnail if it is still connected. Removing the gallery clears that focus
ownership; another active modal keeps its focus.

Each enlarged image has a ten-second loading deadline. A failed or timed-out
load clears the spinner and busy state and announces “Could not load image.”
Use “Retry loading image” to try the selected image again, or “Open original
image” to follow its full-size link. Switching images, closing the modal, or
removing the gallery cancels pending listeners and deadlines; old attempts cannot
change a later image's state. A vetoed Bootstrap hide keeps the pending load,
spinner and deadline active, so error recovery remains available.

The enlarged image copies the selected thumbnail's full-size image metadata,
including empty alternative text. Attributes absent from the selected image are
removed from the shared modal, so navigation cannot reuse another image's
alternative text or responsive sources. Image loading and aspect-ratio sizing
continue to follow the selected thumbnail.

Removing a gallery (including an HTMX swap) closes its owned Bootstrap modal
through the public hide lifecycle, waits for an opening or closing transition
to finish, then disposes the instance and removes the modal. Its backdrop and
focus trap are released and Bootstrap restores scrolling. Without Bootstrap,
the gallery removes its fallback modal and clears the body lock when no other
modal is active. Teardown preserves an active modal's body lock. Reconnecting
during retirement
uses a fresh modal node; the old transition's callbacks only dispose its retired
node and cannot remove the new instance.

## Scroll to top

Activating the scroll-to-top button focuses the first main-content heading,
falling back to the main landmark. It reads the current reduced-motion preference
at activation: reduced motion jumps immediately; otherwise it scrolls smoothly.
Template overrides using a link keep native link navigation. Ordinary scrolling
never moves focus, and a focused scroll-to-top button stays visible and exposed
to assistive technology until focus leaves it.
Viewport updates own at most one animation frame. Teardown or a button
replacement cancels and invalidates that frame; rebinding starts fresh.

## Post content enhancements

Consecutive plain blockquotes merge into one quote with lines in their original
order. Only blockquotes without semantic attributes, separated by ASCII HTML whitespace,
are eligible. The editor’s `data-block-key` and the enhancement’s own
`data-cast-blockquote-merged` marker are allowed; intervening prose, comments, and other quote attributes (including cite,
id, class, and language) keep quotes separate and preserve attribution and anchors.

`initPostContentEnhancements()` initializes once, waiting for DOMContentLoaded
when necessary, and enhances HTMX swap targets. Repeated calls are idempotent.
`destroyPostContentEnhancements()` cancels pending initialization and removes the
swap listener; it leaves already rendered content in place. Initialization can
be called again after teardown.

## Theme preference

The color mode (Auto, Light, or Dark) is stored in localStorage under
`cast-theme`. If the browser refuses the write (private or restricted contexts,
exceeded quota), the choice still applies for the rest of the page session,
including system color-scheme changes and HTMX swaps; the next full page load
falls back to the stored value, or Auto when none is readable. Other open tabs
synchronize on localStorage changes (including clearing storage), updating the
root and all switchers. A denied-write session choice remains authoritative.
Destroying the switcher unregisters storage synchronization.

Every element marked `data-cast-theme-switcher` (the navigation menu and the
styleguide's floating toggle) is driven by `src/theme/theme-switcher.ts`, so all
of them show the same mode. Do not add a second script that reads `cast-theme`.
