# Changelog

## Unreleased

- Reconcile native search-form resets after defaults apply, cancel obsolete work
  and defer refresh while closed; preserve cancelled resets.
- Preserve gallery footer controls and keyboard focus through navigation and
  loading failures, with native disabled controls and endpoint focus fallback.

- Bind suggestions to Cast-normalized queries and retire pending publications on
  Escape; deliberate input or arrow navigation can resume suggestions.

- Reject malformed UTF-8 and redirected or foreign-endpoint search responses before
  caching suggestions or changing facets; keep ordinary form search available.

- Preserve initialized Podlove playback through theme changes, retaining the
  instance's original skin; bind script loading/retries to one canonical embed
  URL per document and show a retryable error for conflicting implementations.
- Fence delayed player observation by connection generation and remove retired
  iframe hosts on disconnect so reconnect starts with one fresh instance;
  revealed facade players restore their original facade markup and play button.
- Refresh facet ownership after inner swaps, release old listeners, and keep all
  native links visible when a usable toggle is absent or removed.
- Preserve unwrapped tails of partially enhanced blockquotes during merging.
- Generate translation catalogs in isolation: checks never modify source PO/MO
  files, and updates stage the complete set before publication with rollback on
  caught publication failures.

- Fence HTMX paging masks and transitions by request identity, including replaced
  paging elements and late errors or settle timers; requests cancelled in
  `htmx:beforeRequest` do not take ownership.
- Keep enhanced ordering menus synchronized with live native options and release
  their listeners, observers and reset work during HTMX cleanup.
- Preserve gallery image loading when Bootstrap hide is vetoed, isolate retiring
  modal nodes on reconnect, and respect native arrow-key ownership.
- Bound facet responses to 256 KiB, 500 options per group and 1,000 total before
  caching or changing filters, and preserve keyboard focus across facet refresh.
- Preserve ordinary gallery links for unusable markup or modal targets, resolve
  image navigation IDs literally within their gallery, and share search/Bootstrap
  body scroll ownership while restoring the prior inline overflow value; shown
  modals removed without hiding no longer keep the page scroll locked.
