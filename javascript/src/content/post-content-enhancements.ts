const LINE_CLASS = "cast-blockquote-line";
let afterSwapBound = false;
let afterSwapHandler: ((event: Event) => void) | null = null;

function ensureLineWrapper(blockquote: HTMLElement): void {
  if (blockquote.firstElementChild?.classList.contains(LINE_CLASS)) {
    return;
  }

  const line = document.createElement("div");
  line.className = LINE_CLASS;
  line.style.whiteSpace = "pre-line";

  while (blockquote.firstChild) {
    line.appendChild(blockquote.firstChild);
  }

  blockquote.appendChild(line);
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
  return Boolean(element) && element.tagName.toLowerCase() === "blockquote";
}

function findBlockquotes(root: ParentNode | Element): HTMLElement[] {
  const blockquotes: HTMLElement[] = [];
  if (root instanceof Element && isBlockquote(root)) {
    blockquotes.push(root);
  }

  blockquotes.push(...Array.from(root.querySelectorAll<HTMLElement>("blockquote")));
  return blockquotes;
}

export function mergeConsecutiveBlockquotes(root: ParentNode | Element = document): void {
  const blockquotes = findBlockquotes(root);

  blockquotes.forEach((blockquote) => {
    if (blockquote.dataset.castBlockquoteMerged === "true") {
      return;
    }

    let next = blockquote.nextElementSibling;
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
      next = next.nextElementSibling;
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

  afterSwapHandler = (event: Event) => {
    const detail = (event as CustomEvent<{ target?: Element }>).detail;
    const target = detail?.target;
    if (target instanceof Element) {
      mergeConsecutiveBlockquotes(target);
    }
  };
  document.body.addEventListener("htmx:afterSwap", afterSwapHandler);
  afterSwapBound = true;
}

export function initPostContentEnhancements(): void {
  if (typeof document === "undefined") {
    return;
  }

  const initialize = (): void => {
    mergeConsecutiveBlockquotes();
    bindAfterSwapHandler();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
    return;
  }

  initialize();
}

export function destroyPostContentEnhancements(): void {
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
  initPostContentEnhancements();
}
