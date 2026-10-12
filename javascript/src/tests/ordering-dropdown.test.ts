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
  it("leaves disabled native controls visible, including disabled fieldsets", () => {
    for (const markup of [buildOrderingMarkup().replace('<select ', '<select disabled '),
      `<fieldset disabled>${buildOrderingMarkup()}</fieldset>`]) {
      document.body.innerHTML = markup;
      initOrderingDropdowns();
      expect(document.querySelector('.dropdown')).toBeNull();
      expect(document.querySelector('select')?.getAttribute('aria-hidden')).toBeNull();
    }
  });

  it("refuses disabled options and optgroups, including synthetic clicks", () => {
    document.body.innerHTML = buildOrderingMarkup().replace(
      '<option value="visible_date">Date asc</option>',
      '<option value="visible_date" disabled>Date asc</option><optgroup disabled><option value="group">Group</option></optgroup>');
    initOrderingDropdowns();
    const select = document.querySelector('select') as HTMLSelectElement;
    for (const value of ['visible_date', 'group']) {
      const item = document.querySelector(`[data-order-value="${value}"]`) as HTMLButtonElement;
      expect(item.disabled).toBe(true);
      item.click();
      item.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(select.value).toBe('-visible_date');
    }
  });

  it("emits bubbling input/change once only for real changes and preserves submission", () => {
    document.body.innerHTML = `<form>${buildOrderingMarkup()}</form>`;
    initOrderingDropdowns();
    initOrderingDropdowns();
    const form = document.querySelector('form')!;
    const events: string[] = [];
    for (const type of ['input', 'change']) form.addEventListener(type, () => events.push(type));
    const item = document.querySelector('[data-order-value="visible_date"]') as HTMLButtonElement;
    item.click();
    item.click();
    expect(events).toEqual(['input', 'change']);
    expect(new FormData(form).get('o')).toBe('visible_date');
  });

  it("syncs external changes and resets after the native reset completes", async () => {
    document.body.innerHTML = `<form>${buildOrderingMarkup()}</form>`;
    initOrderingDropdowns();
    const select = document.querySelector('select') as HTMLSelectElement;
    select.value = 'visible_date';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(document.querySelector('.dropdown-toggle')?.textContent).toBe('Date asc');
    expect(document.querySelector('.active')?.getAttribute('data-order-value')).toBe('visible_date');
    const form = document.querySelector('form')!;
    form.reset();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(select.value).toBe('-visible_date');
    expect(document.querySelector('.dropdown-toggle')?.textContent).toBe('Date desc');
    expect(document.querySelector('.active')?.getAttribute('data-order-value')).toBe('-visible_date');
    select.value = 'visible_date';
    select.dispatchEvent(new Event('change'));
    form.addEventListener('reset', event => event.preventDefault());
    form.reset();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(document.querySelector('.dropdown-toggle')?.textContent).toBe('Date asc');
  });
  it("refreshes disabled attributes on native change and guards clicks immediately", () => {
    document.body.innerHTML = buildOrderingMarkup();
    initOrderingDropdowns();
    const select = document.querySelector('select') as HTMLSelectElement;
    select.disabled = true;
    (document.querySelector('[data-order-value="visible_date"]') as HTMLButtonElement).click();
    expect(select.value).toBe('-visible_date');
    select.dispatchEvent(new Event('change'));
    expect((document.querySelector('.dropdown-toggle') as HTMLButtonElement).disabled).toBe(true);
    select.disabled = false;
    select.dispatchEvent(new Event('change'));
    expect((document.querySelector('.dropdown-toggle') as HTMLButtonElement).disabled).toBe(false);
  });

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
