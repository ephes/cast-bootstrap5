const FACET_GROUP_SELECTOR = "[data-cast-facet-group]";
const FACET_ITEM_SELECTOR = ".cast-date-facet-item";
const HIDDEN_CLASS = "cast-facet-item-hidden";

function findFacetGroups(root: ParentNode | Element): HTMLElement[] {
  const groups: HTMLElement[] = [];

  if (root instanceof Element && root.matches(FACET_GROUP_SELECTOR)) {
    groups.push(root as HTMLElement);
  }

  groups.push(...Array.from(root.querySelectorAll<HTMLElement>(FACET_GROUP_SELECTOR)));
  return groups;
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

export function enhanceFacetGroup(group: HTMLElement): void {
  if (group.dataset.castFacetReady === "true") {
    return;
  }

  if (group.closest(".cast-search-modal")) {
    return;
  }

  const items = Array.from(group.querySelectorAll<HTMLElement>(FACET_ITEM_SELECTOR));
  const limit = parseLimit(group);

  const toggle = group.querySelector<HTMLElement>("[data-cast-facet-toggle]");
  const toggleMore = toggle?.querySelector<HTMLElement>("[data-cast-facet-more]") ?? null;
  const baseMoreLabel = toggle?.dataset.castMoreLabel ?? toggleMore?.textContent ?? "Show all";
  const countLabel = toggle?.dataset.castCountLabel ?? "more";

  if (!limit || items.length <= limit) {
    if (toggle) {
      toggle.hidden = true;
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

  applyCollapsed();

  if (toggle) {
    toggle.hidden = false;
    toggle.addEventListener("click", () => {
      if (group.dataset.expanded === "true") {
        applyCollapsed();
      } else {
        applyExpanded();
      }
    });
  }

  group.dataset.castFacetReady = "true";
}

export function initFacetGroups(root: ParentNode | Element = document): void {
  findFacetGroups(root).forEach((group) => {
    enhanceFacetGroup(group);
  });
}
