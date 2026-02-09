import { afterEach, describe, expect, it } from "vitest";

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
  afterEach(() => {
    destroyFilterEnhancementsBootstrap();
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
