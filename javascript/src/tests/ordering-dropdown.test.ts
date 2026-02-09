import { describe, expect, it } from "vitest";

import { initOrderingDropdowns } from "@/ordering/ordering-dropdown";

function buildOrderingMarkup(withLabelId = false): string {
  return `
    <div id="div_id_o">
      <label for="id_o" ${withLabelId ? 'id="custom-order-label"' : ""}>Order</label>
      <select id="id_o" name="o">
        <option value="">Default</option>
        <option value="-visible_date" selected>Date desc</option>
        <option value="visible_date">Date asc</option>
      </select>
    </div>
  `;
}

describe("ordering-dropdown", () => {
  it("is a no-op when markup is missing", () => {
    document.body.innerHTML = "<div>No ordering</div>";
    expect(() => initOrderingDropdowns()).not.toThrow();
  });

  it("builds dropdown from select options and hides select", () => {
    document.body.innerHTML = buildOrderingMarkup();

    initOrderingDropdowns();

    const dropdown = document.querySelector("#div_id_o .dropdown");
    const select = document.querySelector('select[name="o"]') as HTMLSelectElement;
    const button = document.querySelector("#div_id_o .dropdown-toggle") as HTMLButtonElement;
    const items = document.querySelectorAll("#div_id_o .dropdown-item");

    expect(dropdown).not.toBeNull();
    expect(items).toHaveLength(3);
    expect(button.textContent).toBe("Date desc");
    expect(select.style.display).toBe("none");
    expect(select.getAttribute("aria-hidden")).toBe("true");
  });

  it("syncs dropdown selection back to select element", () => {
    document.body.innerHTML = buildOrderingMarkup();

    initOrderingDropdowns();

    const select = document.querySelector('select[name="o"]') as HTMLSelectElement;
    const ascButton = document.querySelector('[data-order-value="visible_date"]') as HTMLButtonElement;
    ascButton.click();

    expect(select.value).toBe("visible_date");
    expect(ascButton.classList.contains("active")).toBe(true);
    const activeItems = document.querySelectorAll(".dropdown-item.active");
    expect(activeItems).toHaveLength(1);
  });

  it("maintains aria labelling and creates fallback label id", () => {
    document.body.innerHTML = buildOrderingMarkup(false);

    initOrderingDropdowns();

    const label = document.querySelector('label[for="id_o"]') as HTMLLabelElement;
    const button = document.querySelector("#div_id_o .dropdown-toggle") as HTMLButtonElement;

    expect(label.id).toBe("ordering-label");
    expect(button.getAttribute("aria-labelledby")).toBe("ordering-label");
  });

  it("respects existing label id", () => {
    document.body.innerHTML = buildOrderingMarkup(true);

    initOrderingDropdowns();

    const button = document.querySelector("#div_id_o .dropdown-toggle") as HTMLButtonElement;
    expect(button.getAttribute("aria-labelledby")).toBe("custom-order-label");
  });

  it("skips containers inside search modal", () => {
    document.body.innerHTML = `<div class="cast-search-modal">${buildOrderingMarkup()}</div>`;

    initOrderingDropdowns();

    expect(document.querySelector(".dropdown")).toBeNull();
    expect((document.querySelector("#div_id_o") as HTMLElement).dataset.castOrderingEnhanced).toBeUndefined();
  });

  it("is idempotent when initialized repeatedly", () => {
    document.body.innerHTML = buildOrderingMarkup();

    initOrderingDropdowns();
    initOrderingDropdowns();

    expect(document.querySelectorAll("#div_id_o .dropdown")).toHaveLength(1);
  });
});
