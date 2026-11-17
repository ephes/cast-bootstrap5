// Search overlays and Bootstrap's public show/hidden lifecycle share one
// baseline. Bootstrap still owns its backdrop, scrollbar padding and focus trap.
const searchOwners = new Set<object>();
const bootstrapOwners = new Map<Element, object>();
let priorOverflow: string | null = null;
let observedDocument: Document | null = null;
let removalObserver: MutationObserver | null = null;

function capture(): void {
  if (priorOverflow === null) priorOverflow = document.body.style.overflow;
}

function restore(): void {
  // A shown modal removed without hiding never fires hidden.bs.modal.
  for (const modal of bootstrapOwners.keys()) {
    if (!modal.isConnected) bootstrapOwners.delete(modal);
  }
  if (bootstrapOwners.size === 0) {
    removalObserver?.disconnect();
    removalObserver = null;
  }
  if (searchOwners.size || bootstrapOwners.size) {
    document.body.style.overflow = "hidden";
  } else if (priorOverflow !== null) {
    document.body.style.overflow = priorOverflow;
    priorOverflow = null;
  }
}

export function observeBootstrapScroll(): void {
  if (observedDocument === document) return;
  observedDocument = document;
  document.addEventListener("show.bs.modal", event => {
    if (!(event.target instanceof Element) || !event.target.matches(".modal")) return;
    const modal = event.target;
    const owner = {};
    capture();
    bootstrapOwners.set(modal, owner);
    if (!removalObserver) {
      removalObserver = new MutationObserver(restore);
      removalObserver.observe(document.body, { childList: true, subtree: true });
    }
    // Do not write overflow here: Bootstrap snapshots it after the show event.
    queueMicrotask(() => {
      // A later show of this same element owns a different acquisition.
      if (event.defaultPrevented && bootstrapOwners.get(modal) === owner) {
        bootstrapOwners.delete(modal);
        restore();
      }
    });
  });
  document.addEventListener("htmx:beforeCleanupElement", event => {
    if (!(event.target instanceof Element)) return;
    let removed = false;
    for (const modal of bootstrapOwners.keys()) {
      if (event.target.contains(modal)) {
        bootstrapOwners.delete(modal);
        removed = true;
      }
    }
    if (removed) restore();
  });
  document.addEventListener("hidden.bs.modal", event => {
    if (!(event.target instanceof Element) || !bootstrapOwners.delete(event.target)) return;
    restore();
  });
}

export function acquireBodyScroll(): () => void {
  observeBootstrapScroll();
  capture();
  const owner = {};
  searchOwners.add(owner);
  document.body.style.overflow = "hidden";
  return () => {
    if (searchOwners.delete(owner)) restore();
  };
}
