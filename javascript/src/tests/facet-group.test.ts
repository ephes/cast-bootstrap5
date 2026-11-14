import { describe, expect, it } from "vitest";

import { runFilterEnhancements } from "@/filters/filter-enhancements-bootstrap";
import { initFacetGroups } from "@/facets/facet-group";

function buildFacetGroup(selectedIndex?: number): string {
  return `
    <div data-cast-facet-group data-limit="2">
      <ul>
        <li class="cast-date-facet-item"><a class="${selectedIndex === 0 ? "selected" : ""}" href="#">Item 1</a></li>
        <li class="cast-date-facet-item"><a class="${selectedIndex === 1 ? "selected" : ""}" href="#">Item 2</a></li>
        <li class="cast-date-facet-item"><a class="${selectedIndex === 2 ? "selected" : ""}" href="#">Item 3</a></li>
        <li class="cast-date-facet-item"><a class="${selectedIndex === 3 ? "selected" : ""}" href="#">Item 4</a></li>
      </ul>
      <button type="button" data-cast-facet-toggle data-cast-count-label="more">
        <span data-cast-facet-more>Show all</span>
      </button>
    </div>
  `;
}

describe("facet-group", () => {
  it("is a no-op when markup is missing", () => {
    document.body.innerHTML = "<div>No facets</div>";
    expect(() => initFacetGroups()).not.toThrow();
  });

  it("hides items beyond the limit", () => {
    document.body.innerHTML = buildFacetGroup();

    initFacetGroups();

    const hiddenItems = document.querySelectorAll(".cast-facet-item-hidden");
    expect(hiddenItems).toHaveLength(2);

    const toggle = document.querySelector("[data-cast-facet-toggle]") as HTMLButtonElement;
    expect(toggle.hidden).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.querySelector("[data-cast-facet-more]")?.textContent).toBe("Show all (2 more)");
  });

  it("keeps selected items visible even when over the limit", () => {
    document.body.innerHTML = buildFacetGroup(3);

    initFacetGroups();

    const items = Array.from(document.querySelectorAll<HTMLElement>(".cast-date-facet-item"));
    expect(items[3].classList.contains("cast-facet-item-hidden")).toBe(false);
  });

  it("toggles expanded and collapsed state", () => {
    document.body.innerHTML = buildFacetGroup();

    initFacetGroups();

    const toggle = document.querySelector("[data-cast-facet-toggle]") as HTMLButtonElement;
    toggle.click();

    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(document.querySelectorAll(".cast-facet-item-hidden")).toHaveLength(0);
    expect(toggle.querySelector("[data-cast-facet-more]")?.textContent).toBe("Show all");

    toggle.click();
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelectorAll(".cast-facet-item-hidden")).toHaveLength(2);
  });

  it("is idempotent when initialized repeatedly", () => {
    document.body.innerHTML = buildFacetGroup();

    initFacetGroups();
    initFacetGroups();

    const toggle = document.querySelector("[data-cast-facet-toggle]") as HTMLButtonElement;
    toggle.click();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");

    toggle.click();
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("refreshes child ownership through the real filter entry point", () => {
    document.body.innerHTML = buildFacetGroup();
    runFilterEnhancements();
    const group = document.querySelector<HTMLElement>("[data-cast-facet-group]")!;
    const oldToggle = group.querySelector<HTMLButtonElement>("button")!;
    const oldItems = Array.from(group.querySelectorAll("li"));
    group.innerHTML = buildFacetGroup(3);
    const replacement = group.firstElementChild!;
    group.replaceChildren(...Array.from(replacement.childNodes));
    runFilterEnhancements(group.querySelector("ul")!);
    const toggle = group.querySelector<HTMLButtonElement>("button")!;
    expect(group.querySelectorAll(".cast-facet-item-hidden")).toHaveLength(1);
    expect(group.querySelectorAll("li")[3].classList.contains("cast-facet-item-hidden")).toBe(false);
    oldToggle.click();
    expect(group.dataset.expanded).toBeUndefined();
    expect(oldItems.every((item) => !item.classList.contains("cast-facet-item-hidden"))).toBe(true);
    runFilterEnhancements(group);
    toggle.click();
    expect(group.querySelectorAll(".cast-facet-item-hidden")).toHaveLength(0);
    toggle.click();
    expect(group.querySelectorAll(".cast-facet-item-hidden")).toHaveLength(1);
  });

  it.each(['absent', 'disabled', 'noninteractive'])('keeps native links visible with %s toggle and enhances later', (kind) => {
    document.body.innerHTML = buildFacetGroup();
    const group = document.querySelector<HTMLElement>("[data-cast-facet-group]")!;
    const original = group.querySelector<HTMLButtonElement>("button")!;
    if (kind === 'absent') original.remove();
    if (kind === 'disabled') original.disabled = true;
    if (kind === 'noninteractive') original.outerHTML = '<span data-cast-facet-toggle>Show all</span>';
    runFilterEnhancements(group);
    expect(group.querySelectorAll(".cast-facet-item-hidden")).toHaveLength(0);
    group.querySelector("[data-cast-facet-toggle]")?.remove();
    original.disabled = false;
    group.append(original);
    runFilterEnhancements(group);
    expect(group.querySelectorAll(".cast-facet-item-hidden")).toHaveLength(2);
    original.click();
    expect(group.querySelectorAll(".cast-facet-item-hidden")).toHaveLength(0);
  });

  it("restores native links when the toggle is removed after enhancement", async () => {
    document.body.innerHTML = buildFacetGroup();
    runFilterEnhancements();
    document.querySelector("[data-cast-facet-toggle]")!.remove();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.querySelectorAll(".cast-facet-item-hidden")).toHaveLength(0);
  });

  it("observes replaced children, preserves expansion, and releases ownership on cleanup", async () => {
    document.body.innerHTML = buildFacetGroup();
    runFilterEnhancements();
    const group = document.querySelector<HTMLElement>("[data-cast-facet-group]")!;
    const toggle = group.querySelector<HTMLButtonElement>("button")!;
    toggle.click();
    group.querySelector("ul")!.innerHTML = '<li class="cast-date-facet-item"><a href="#">New 1</a></li><li class="cast-date-facet-item"><a href="#">New 2</a></li><li class="cast-date-facet-item"><a href="#">New 3</a></li>';
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(group.dataset.expanded).toBe("true");
    toggle.click();
    expect(group.querySelectorAll(".cast-facet-item-hidden")).toHaveLength(1);
    toggle.disabled = true;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(group.querySelectorAll(".cast-facet-item-hidden")).toHaveLength(0);
    toggle.disabled = false;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(group.querySelectorAll(".cast-facet-item-hidden")).toHaveLength(1);
    group.dispatchEvent(new CustomEvent("htmx:beforeCleanupElement", { bubbles: true }));
    toggle.click();
    expect(group.querySelectorAll(".cast-facet-item-hidden")).toHaveLength(0);
    expect(group.dataset.castFacetReady).toBeUndefined();
    runFilterEnhancements(group);
    expect(group.querySelectorAll(".cast-facet-item-hidden")).toHaveLength(1);
  });

  it("skips groups inside search modal", () => {
    document.body.innerHTML = `
      <div class="cast-search-modal">
        ${buildFacetGroup()}
      </div>
    `;

    initFacetGroups();

    const group = document.querySelector("[data-cast-facet-group]") as HTMLElement;
    expect(group.dataset.castFacetReady).toBeUndefined();
    expect(document.querySelectorAll(".cast-facet-item-hidden")).toHaveLength(0);
  });
});
