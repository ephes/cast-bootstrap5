export function getConnectedSwapRoot(event: Event): Element | null {
  const target = (event as CustomEvent<{ target?: Element }>).detail?.target;
  if (target instanceof Element && target.isConnected) {
    return target;
  }

  // HTMX dispatches afterSwap on the inserted element after an outerHTML swap.
  const inserted = event.target;
  return inserted instanceof Element && inserted.isConnected ? inserted : null;
}
