// Search overlays and Bootstrap's public show/hidden lifecycle share one
// baseline. Bootstrap still owns its backdrop, scrollbar padding and focus trap.
const searchOwners = new Set<object>();
const bootstrapOwners = new Set<Element>();
let priorOverflow: string | null = null;
let observedDocument: Document | null = null;

function capture(): void {
  if (priorOverflow === null) priorOverflow = document.body.style.overflow;
}

function restore(): void {
  // A shown modal removed without hiding never fires hidden.bs.modal.
  for (const modal of bootstrapOwners) {
    if (!modal.isConnected) bootstrapOwners.delete(modal);
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
    capture();
    bootstrapOwners.add(modal);
    // Do not write overflow here: Bootstrap snapshots it after the show event.
    queueMicrotask(() => {
      if (event.defaultPrevented) {
        bootstrapOwners.delete(modal);
        restore();
      }
    });
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
