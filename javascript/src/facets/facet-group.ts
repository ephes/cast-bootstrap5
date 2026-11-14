const FACET_GROUP_SELECTOR = "[data-cast-facet-group]";
const FACET_ITEM_SELECTOR = ".cast-date-facet-item";
const HIDDEN_CLASS = "cast-facet-item-hidden";
const owners = new WeakMap<HTMLElement, () => void>();

function findFacetGroups(root: ParentNode | Element): HTMLElement[] {
  const groups: HTMLElement[] = [];

  if (root instanceof Element) {
    const parent = root.closest<HTMLElement>(FACET_GROUP_SELECTOR);
    if (parent) groups.push(parent);
  }

  groups.push(...Array.from(root.querySelectorAll<HTMLElement>(FACET_GROUP_SELECTOR)));
  return [...new Set(groups)];
}

function hasSelectedFacet(item: Element): boolean {
  return Boolean(item.querySelector("a.selected"));
}

function parseLimit(group: HTMLElement): number {
  const raw = group.getAttribute("data-limit") ?? "";
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function updateMoreLabel(toggleMore: HTMLElement | null, baseLabel: string, countLabel: string, hiddenCount: number): void {
  if (!toggleMore) {
    return;
  }

  if (hiddenCount > 0) {
    toggleMore.textContent = `${baseLabel} (${hiddenCount} ${countLabel})`;
    return;
  }

  toggleMore.textContent = baseLabel;
}

function isUsableToggle(toggle: HTMLElement | null): boolean {
  return toggle instanceof HTMLButtonElement && toggle.type === "button" &&
    !toggle.matches(":disabled") && toggle.getAttribute("aria-disabled") !== "true" &&
    !toggle.closest("[inert]");
}

export function enhanceFacetGroup(group: HTMLElement): void {
  owners.get(group)?.();

  if (group.closest(".cast-search-modal")) {
    return;
  }

  const items = Array.from(group.querySelectorAll<HTMLElement>(FACET_ITEM_SELECTOR));
  const limit = parseLimit(group);
  const expanded = group.dataset.expanded === "true";

  const toggle = group.querySelector<HTMLElement>("[data-cast-facet-toggle]");
  const toggleMore = toggle?.querySelector<HTMLElement>("[data-cast-facet-more]") ?? null;
  const baseMoreLabel = toggle?.dataset.castMoreLabel ?? toggleMore?.textContent ?? "Show all";
  const countLabel = toggle?.dataset.castCountLabel ?? "more";
  if (toggle) toggle.dataset.castMoreLabel = baseMoreLabel;
  const usable = isUsableToggle(toggle);
  const currentChildrenMatch = (): boolean => {
    const current = Array.from(group.querySelectorAll<HTMLElement>(FACET_ITEM_SELECTOR));
    return group.querySelector("[data-cast-facet-toggle]") === toggle &&
      (toggle?.querySelector("[data-cast-facet-more]") ?? null) === toggleMore &&
      current.length === items.length && current.every((item, index) => item === items[index]);
  };
  const onClick = (): void => {
    if (!isUsableToggle(toggle) || !currentChildrenMatch()) {
      enhanceFacetGroup(group);
      return;
    }
    if (group.dataset.expanded === "true") applyCollapsed();
    else applyExpanded();
  };
  // Observe only changes that can affect ownership/usability. Label writes
  // produce child mutations too, so compare node identity before refreshing.
  const observer = new MutationObserver(() => {
    if (isUsableToggle(toggle) !== usable || !currentChildrenMatch()) enhanceFacetGroup(group);
  });
  observer.observe(group, { childList: true, subtree: true, attributes: true,
    attributeFilter: ["disabled", "aria-disabled", "inert", "type"] });
  const dispose = (): void => {
    observer.disconnect();
    toggle?.removeEventListener("click", onClick);
    group.removeEventListener("htmx:beforeCleanupElement", onCleanup);
    items.forEach((item) => item.classList.remove(HIDDEN_CLASS));
    owners.delete(group);
    delete group.dataset.castFacetReady;
  };
  const onCleanup = (event: Event): void => {
    if (event.target === group) dispose();
  };
  group.addEventListener("htmx:beforeCleanupElement", onCleanup);
  owners.set(group, dispose);

  if (limit <= 0 || items.length <= limit || !usable) {
    delete group.dataset.expanded;
    items.forEach((item) => item.classList.remove(HIDDEN_CLASS));
    if (toggle) {
      toggle.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
    }
    group.dataset.castFacetReady = "true";
    return;
  }

  const applyCollapsed = (): void => {
    items.forEach((item, index) => {
      const shouldShow = index < limit || hasSelectedFacet(item);
      item.classList.toggle(HIDDEN_CLASS, !shouldShow);
    });

    const hiddenCount = items.filter((item) => item.classList.contains(HIDDEN_CLASS)).length;

    delete group.dataset.expanded;
    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
    }
    updateMoreLabel(toggleMore, baseMoreLabel, countLabel, hiddenCount);
  };

  const applyExpanded = (): void => {
    items.forEach((item) => {
      item.classList.remove(HIDDEN_CLASS);
    });

    group.dataset.expanded = "true";
    if (toggle) {
      toggle.setAttribute("aria-expanded", "true");
    }
    updateMoreLabel(toggleMore, baseMoreLabel, countLabel, 0);
  };

  if (expanded) applyExpanded();
  else applyCollapsed();

  if (toggle) {
    toggle.hidden = false;
    toggle.addEventListener("click", onClick);
  }

  group.dataset.castFacetReady = "true";
}

export function initFacetGroups(root: ParentNode | Element = document): void {
  findFacetGroups(root).forEach((group) => {
    enhanceFacetGroup(group);
  });
}
