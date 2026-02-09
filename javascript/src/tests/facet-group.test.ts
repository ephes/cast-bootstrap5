import { describe, expect, it } from "vitest";

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
