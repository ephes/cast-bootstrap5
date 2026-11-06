import { afterEach, describe, expect, it, vi } from "vitest";

import {
  destroyFilterEnhancementsBootstrap,
  initFilterEnhancementsBootstrap,
  runFilterEnhancements,
} from "@/filters/filter-enhancements-bootstrap";

function buildOutsideModalMarkup(): string {
  return `
    <div data-cast-facet-group data-limit="1">
      <div class="cast-date-facet-item"><a href="#">One</a></div>
      <div class="cast-date-facet-item"><a href="#">Two</a></div>
      <button type="button" data-cast-facet-toggle>
        <span data-cast-facet-more>Show all</span>
      </button>
    </div>
    <div id="div_id_o">
      <label for="id_o">Order</label>
      <select id="id_o" name="o">
        <option value="-visible_date" selected>Date desc</option>
        <option value="visible_date">Date asc</option>
      </select>
    </div>
  `;
}

describe("filter-enhancements-bootstrap", () => {
  it("cancels initialization when destroyed before DOMContentLoaded", () => {
    destroyFilterEnhancementsBootstrap();
    vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
    document.body.innerHTML = buildOutsideModalMarkup();
    initFilterEnhancementsBootstrap();
    destroyFilterEnhancementsBootstrap();
    document.dispatchEvent(new Event("DOMContentLoaded"));
    expect(document.querySelector(".dropdown")).toBeNull();
    expect(document.querySelector(".cast-facet-item-hidden")).toBeNull();
  });

  it("owns one pending initializer and swap listener across reinitialization", () => {
    destroyFilterEnhancementsBootstrap();
    vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
    document.body.innerHTML = buildOutsideModalMarkup();
    const pending = vi.spyOn(document, "addEventListener");
    const swaps = vi.spyOn(document.body, "addEventListener");
    initFilterEnhancementsBootstrap();
    destroyFilterEnhancementsBootstrap();
    pending.mockClear();
    swaps.mockClear();
    initFilterEnhancementsBootstrap();
    initFilterEnhancementsBootstrap();
    expect(pending.mock.calls.filter(([type]) => type === "DOMContentLoaded")).toHaveLength(1);
    expect(swaps.mock.calls.filter(([type]) => type === "htmx:afterSwap")).toHaveLength(1);
    document.dispatchEvent(new Event("DOMContentLoaded"));
    expect(document.querySelectorAll(".dropdown")).toHaveLength(1);
    expect(document.querySelectorAll(".cast-facet-item-hidden")).toHaveLength(1);
    // A once listener must not enhance replacement content on another event.
    document.body.innerHTML = buildOutsideModalMarkup();
    document.dispatchEvent(new Event("DOMContentLoaded"));
    expect(document.querySelector(".dropdown")).toBeNull();
    document.body.dispatchEvent(new CustomEvent("htmx:afterSwap", { detail: { target: document.body } }));
    expect(document.querySelectorAll(".dropdown")).toHaveLength(1);
  });

  afterEach(() => {
    destroyFilterEnhancementsBootstrap();
    vi.restoreAllMocks();
  });

  it("runs facet and ordering enhancements", () => {
    document.body.innerHTML = buildOutsideModalMarkup();

    runFilterEnhancements();

    expect(document.querySelectorAll(".cast-facet-item-hidden")).toHaveLength(1);
    expect(document.querySelector("#div_id_o .dropdown")).not.toBeNull();
  });

  it("re-applies enhancements to htmx swapped targets", () => {
    document.body.innerHTML = "<div id='swap-root'></div>";
    initFilterEnhancementsBootstrap();

    const target = document.getElementById("swap-root") as HTMLElement;
    target.innerHTML = buildOutsideModalMarkup();

    const event = new CustomEvent("htmx:afterSwap", {
      detail: { target },
      bubbles: true,
    });
    document.body.dispatchEvent(event);

    expect(target.querySelectorAll(".cast-facet-item-hidden")).toHaveLength(1);
    expect(target.querySelector("#div_id_o .dropdown")).not.toBeNull();
  });

  it("is idempotent when bootstrap is initialized repeatedly", () => {
    document.body.innerHTML = buildOutsideModalMarkup();

    initFilterEnhancementsBootstrap();
    initFilterEnhancementsBootstrap();

    expect(document.querySelectorAll("#div_id_o .dropdown")).toHaveLength(1);
  });

  it("removes the htmx listener on destroy", () => {
    document.body.innerHTML = "<div id='swap-root'></div>";
    initFilterEnhancementsBootstrap();
    destroyFilterEnhancementsBootstrap();

    const target = document.getElementById("swap-root") as HTMLElement;
    target.innerHTML = buildOutsideModalMarkup();

    const event = new CustomEvent("htmx:afterSwap", {
      detail: { target },
      bubbles: true,
    });
    document.body.dispatchEvent(event);

    expect(target.querySelector("#div_id_o .dropdown")).toBeNull();
  });
});
