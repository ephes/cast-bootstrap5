# Changelog

## Unreleased

- Stream translation source fingerprints and reject oversized inputs before
  staging, with an 8 MiB file limit and a 64 MiB total limit per pass.

- Retain and report the original catalog when rollback of an owned translation
  publication fails.

- Release the scroll-to-top focus tabindex on blur and teardown while preserving
  later changes to its value.

- Keep theme switching active after a body replacement and remove delegated
  document listeners on teardown.

- Keep a newer Bootstrap modal show locked when an earlier cancelled show of the
  same element rolls back, preserving shared search locks and removal cleanup.

- Cancel unread suggestion and facet response bodies when rejecting their status
  or endpoint, without waiting for cancellation or replacing the original failure.

- Batch Podlove observer rebinding across synchronous player removals, keeping
  list cleanup linear while preserving queued sibling records and fencing stale
  deliveries across reconnection.
- Offer the deliberate Play control when IntersectionObserver is unavailable or
  its constructor is refused, retaining keyboard activation, retry and clean
  disconnect/reconnect behavior without automatic playback. A source change
  while playing in that fallback restarts without leaving an inert Play button.
- Index native radio groups once per Tab keypress to avoid quadratic focus work,
  preserving focused/checked/fallback order, external checked members and form
  and shadow-root ownership.

- Reject duplicate decoded JSON member names in suggestion and facet responses
  before caching or rendering, retaining ordinary search and current filters.

- Serialize catalog checks/updates and refuse stale source generations before
  publication; roll back only outputs still owned by the failed attempt so
  concurrent translator saves survive generation and publication failures.

- Rebuild purged Bootstrap CSS from the pristine, exactly pinned 5.3.8 package
  input so newly used classes return on subsequent runs without restoring files.

- Release removed Bootstrap modal scroll owners at HTMX cleanup or DOM removal,
  retaining other owners and disconnecting unused removal observation.
- Preserve newer search overlay focus when closing older instances and restore
  focus only to an eligible connected trigger within the remaining trap.
- Preserve native facet/Clear link gestures and give search shortcuts and Escape
  one eligible overlay owner, respecting already handled key events. Disabled
  links also ignore middle clicks (auxclick), and a backdrop click that moved
  focus to the page body still returns focus to the trigger.
- Reset connected Podlove players once for synchronous source/config/template/embed
  changes, fencing old initialization and iframe work while retaining the
  document's embed implementation identity. Attributes delivered during
  custom-element upgrade are the initial source, not a change.
- Retire stale player intersection deliveries across removal/reconnection while
  preserving queued records and observation for other players.

- Keep named radio groups to one effective modal Tab stop, respecting form
  ownership, checked state, eligibility and positive tabindex order; preserve
  native arrow-key selection and independent unnamed radios. Tab from a focused
  unchecked member leaves its group, and traps inside a shadow root read the
  checked member and the focused control from that shadow root.
- Give overlapping theme focus traps one active keyboard owner; closing the
  current trap resumes the previous connected container without older traps
  stealing Tab or retaining listeners after deactivation.

- Reconcile native search-form resets after defaults apply, cancel obsolete work
  and defer refresh while closed; preserve cancelled resets.
- Preserve gallery footer controls and keyboard focus through navigation and
  loading failures, with native disabled controls and endpoint focus fallback.

- Bind suggestions to Cast-normalized queries and retire pending publications on
  Escape; deliberate input or arrow navigation can resume suggestions. Arrow keys
  never restart a pending debounce or in-flight request for the current query.

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
