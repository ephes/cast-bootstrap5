import { getConnectedSwapRoot } from "@/utils/htmx-swap-root";

const LINE_CLASS = "cast-blockquote-line";
const settledSwapQuotes = new WeakSet<Element>();
let afterSwapBound = false;
let pendingInitialize: (() => void) | null = null;
let swapHandler: ((event: Event) => void) | null = null;

function ensureLineWrapper(blockquote: HTMLElement): void {
  let line: HTMLDivElement | null = null;
  for (const child of Array.from(blockquote.childNodes)) {
    if (child instanceof HTMLElement && child.classList.contains(LINE_CLASS)) {
      line = null;
      continue;
    }
    if (!line) {
      line = document.createElement("div");
      line.className = LINE_CLASS;
      line.style.whiteSpace = "pre-line";
      blockquote.insertBefore(line, child);
    }
    line.appendChild(child);
  }
}

function applyLineSpacing(blockquote: HTMLElement): void {
  const lines = Array.from(blockquote.children).filter((child) =>
    child.classList.contains(LINE_CLASS)
  );

  lines.forEach((line, index) => {
    const htmlLine = line as HTMLElement;
    htmlLine.style.display = "block";
    htmlLine.style.marginTop = index === 0 ? "0" : "0.35rem";
    htmlLine.style.marginBottom = "0";
  });
}

function isBlockquote(element: Element | null): element is HTMLElement {
  return element !== null && element.tagName.toLowerCase() === "blockquote";
}

// Editor bookkeeping and our own marker do not carry quote semantics.
function isPlainBlockquote(blockquote: HTMLElement): boolean {
  return Array.from(blockquote.attributes).every((attribute) =>
    attribute.name === "data-block-key" || attribute.name === "data-cast-blockquote-merged" ||
    (attribute.name === "class" && attribute.value === "" && settledSwapQuotes.has(blockquote))
  );
}

function plainBlockquoteSibling(
  blockquote: HTMLElement,
  direction: "previousSibling" | "nextSibling",
): HTMLElement | null {
  let sibling = blockquote[direction];
  while (sibling?.nodeType === Node.TEXT_NODE && /^[\t\n\f\r ]*$/.test(sibling.textContent ?? "")) {
    sibling = sibling[direction];
  }
  return sibling instanceof Element && isBlockquote(sibling) && isPlainBlockquote(sibling)
    ? sibling : null;
}

function findBlockquotes(root: ParentNode | Element): HTMLElement[] {
  const blockquotes: HTMLElement[] = [];
  if (root instanceof Element && isBlockquote(root) && isPlainBlockquote(root)) {
    let first = root;
    let previous = plainBlockquoteSibling(first, "previousSibling");
    while (previous) {
      first = previous;
      previous = plainBlockquoteSibling(first, "previousSibling");
    }
    blockquotes.push(first);
  }

  blockquotes.push(...Array.from(root.querySelectorAll<HTMLElement>("blockquote")));
  return blockquotes;
}

export function mergeConsecutiveBlockquotes(root: ParentNode | Element = document): void {
  const blockquotes = findBlockquotes(root);

  blockquotes.forEach((blockquote) => {
    if (!isPlainBlockquote(blockquote)) {
      return;
    }

    let next = plainBlockquoteSibling(blockquote, "nextSibling");
    if (!isBlockquote(next)) {
      return;
    }

    ensureLineWrapper(blockquote);

    while (isBlockquote(next)) {
      ensureLineWrapper(next);

      const lines = Array.from(next.children).filter((child) => child.classList.contains(LINE_CLASS));
      lines.forEach((line) => {
        blockquote.appendChild(line);
      });

      const toRemove = next;
      next = plainBlockquoteSibling(next, "nextSibling");
      toRemove.remove();
    }

    applyLineSpacing(blockquote);
    blockquote.dataset.castBlockquoteMerged = "true";
  });
}

function bindAfterSwapHandler(): void {
  if (afterSwapBound || typeof document === "undefined") {
    return;
  }

  swapHandler = (event: Event) => {
    const root = getConnectedSwapRoot(event);
    if (!root) {
      return;
    }
    if (event.type === "htmx:afterSettle") {
      const target = (event as CustomEvent<{ target?: Element }>).detail?.target;
      if (!isBlockquote(root) || !(target instanceof Element) || target.isConnected) {
        return;
      }
      // HTMX can leave class="" on an inserted quote after dropping its settling class.
      if (root.getAttribute("class") === "") {
        settledSwapQuotes.add(root);
      }
    }
    mergeConsecutiveBlockquotes(root);
  };
  document.body.addEventListener("htmx:afterSwap", swapHandler);
  document.body.addEventListener("htmx:afterSettle", swapHandler);
  afterSwapBound = true;
}

export function initPostContentEnhancements(): void {
  if (typeof document === "undefined" || afterSwapBound || pendingInitialize) {
    return;
  }

  const initialize = (): void => {
    pendingInitialize = null;
    mergeConsecutiveBlockquotes();
    bindAfterSwapHandler();
  };

  if (document.readyState === "loading") {
    pendingInitialize = initialize;
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
    return;
  }

  initialize();
}

export function destroyPostContentEnhancements(): void {
  if (pendingInitialize && typeof document !== "undefined") {
    document.removeEventListener("DOMContentLoaded", pendingInitialize);
  }
  pendingInitialize = null;
  if (!afterSwapBound || typeof document === "undefined") {
    afterSwapBound = false;
    swapHandler = null;
    return;
  }

  if (swapHandler) {
    document.body.removeEventListener("htmx:afterSwap", swapHandler);
    document.body.removeEventListener("htmx:afterSettle", swapHandler);
  }
  afterSwapBound = false;
  swapHandler = null;
}

if (typeof document !== "undefined") {
  initPostContentEnhancements();
}
