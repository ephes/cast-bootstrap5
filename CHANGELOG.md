# Changelog

## Unreleased

- Fence HTMX paging masks and transitions by request identity, including replaced
  paging elements and late errors or settle timers.
- Keep enhanced ordering menus synchronized with live native options and release
  their listeners, observers and reset work during HTMX cleanup.
- Preserve gallery image loading when Bootstrap hide is vetoed, isolate retiring
  modal nodes on reconnect, and respect native arrow-key ownership.
- Bound facet responses to 256 KiB, 500 options per group and 1,000 total before
  caching or changing filters, and preserve keyboard focus across facet refresh.
- Preserve ordinary gallery links for unusable markup or modal targets, resolve
  image navigation IDs literally within their gallery, and share search/Bootstrap
  body scroll ownership while restoring the prior inline overflow value.
