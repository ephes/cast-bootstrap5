import { initFacetGroups } from "@/facets/facet-group";
import { initOrderingDropdowns } from "@/ordering/ordering-dropdown";

let afterSwapBound = false;
let afterSwapHandler: ((event: Event) => void) | null = null;

export function runFilterEnhancements(root: ParentNode | Element = document): void {
  initFacetGroups(root);
  initOrderingDropdowns(root);
}

export function initFilterEnhancementsBootstrap(): void {
  if (typeof document === "undefined") {
    return;
  }

  const initialize = (): void => {
    runFilterEnhancements(document);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }

  if (!afterSwapBound) {
    afterSwapHandler = (event: Event) => {
      const detail = (event as CustomEvent<{ target?: Element }>).detail;
      const target = detail?.target;
      if (!(target instanceof Element)) {
        return;
      }
      runFilterEnhancements(target);
    };
    document.body.addEventListener("htmx:afterSwap", afterSwapHandler);
    afterSwapBound = true;
  }
}

export function destroyFilterEnhancementsBootstrap(): void {
  if (!afterSwapBound || typeof document === "undefined") {
    afterSwapBound = false;
    afterSwapHandler = null;
    return;
  }

  if (afterSwapHandler) {
    document.body.removeEventListener("htmx:afterSwap", afterSwapHandler);
  }
  afterSwapBound = false;
  afterSwapHandler = null;
}

if (typeof document !== "undefined") {
  initFilterEnhancementsBootstrap();
}
