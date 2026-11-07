import { afterEach, describe, expect, it, vi } from "vitest";
import { buildOrderingPills } from "@/search/cast-search-modal";

function fixture(selectAttributes = "", fieldsetAttributes = "") {
  document.body.innerHTML = `<form><fieldset ${fieldsetAttributes}><div id="div_id_o">
    <select name="o" ${selectAttributes}>
      <option value="">Default</option>
      <option value="-visible_date" selected>Newest</option>
      <option value="visible_date">Oldest</option>
      <option value="blocked" disabled>Blocked</option>
      <optgroup label="Unavailable" disabled><option value="grouped">Grouped</option></optgroup>
    </select>
  </div></fieldset></form>`;
  const select = document.querySelector("select")!;
  const form = document.querySelector("form")!;
  buildOrderingPills(form);
  const pill = (value: string) => form.querySelector<HTMLButtonElement>(`[data-order-value="${value}"]`)!;
  return { select, form, pill };
}

afterEach(() => vi.useRealTimers());

describe("modal ordering native parity", () => {
  it("blocks disabled options and optgroups even on dispatched clicks", () => {
    const { select, form, pill } = fixture();
    const events: string[] = [];
    for (const type of ["input", "change"]) form.addEventListener(type, () => events.push(type));
    for (const value of ["blocked", "grouped"]) {
      expect(pill(value).disabled).toBe(true);
      pill(value).dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(select.value).toBe("-visible_date");
    }
    expect(events).toEqual([]);
  });

  it.each([["disabled", ""], ["", "disabled"]])("retains an initially disabled native select (%s, %s)", (selectAttrs, fieldsetAttrs) => {
    const { select, form } = fixture(selectAttrs, fieldsetAttrs);
    expect(form.querySelector(".cast-ordering-pills")).toBeNull();
    expect(select.style.display).not.toBe("none");
    expect(select.getAttribute("aria-hidden")).toBeNull();
  });

  it("emits one bubbling input/change pair for an actual selection and retains form data", () => {
    const { select, form, pill } = fixture();
    buildOrderingPills(form);
    const events: string[] = [];
    for (const type of ["input", "change"]) form.addEventListener(type, (event) => {
      expect(event.target).toBe(select);
      events.push(type);
    });
    pill("visible_date").click();
    expect(events).toEqual(["input", "change"]);
    expect(new FormData(form).get("o")).toBe("visible_date");
    expect(pill("visible_date").getAttribute("aria-pressed")).toBe("true");
    expect(pill("-visible_date").classList.contains("active")).toBe(false);
    pill("visible_date").click();
    expect(events).toEqual(["input", "change"]);
  });

  it("syncs native events, changing disabled state, and form reset", async () => {
    vi.useFakeTimers();
    const { select, form, pill } = fixture();
    for (const type of ["input", "change"]) {
      select.value = "visible_date";
      select.dispatchEvent(new Event(type, { bubbles: true }));
      expect(pill("visible_date").getAttribute("aria-pressed")).toBe("true");
      select.value = "-visible_date";
      select.dispatchEvent(new Event(type, { bubbles: true }));
      expect(pill("-visible_date").getAttribute("aria-pressed")).toBe("true");
    }
    select.disabled = true;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    expect(pill("visible_date").disabled).toBe(true);
    pill("visible_date").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(select.value).toBe("-visible_date");
    select.disabled = false;
    select.dispatchEvent(new Event("input", { bubbles: true }));
    expect(pill("visible_date").disabled).toBe(false);
    pill("visible_date").click();
    form.reset();
    await vi.runAllTimersAsync();
    expect(select.value).toBe("-visible_date");
    expect(pill("-visible_date").getAttribute("aria-pressed")).toBe("true");
    expect(pill("visible_date").getAttribute("aria-pressed")).toBe("false");
  });

  it("does not choose a disabled default when the native value is empty", () => {
    document.body.innerHTML = `<div id="div_id_o"><select name="o">
      <option value="" selected>Default</option><option value="-visible_date" disabled>Newest</option>
      <option value="visible_date">Oldest</option></select></div>`;
    buildOrderingPills(document);
    expect(document.querySelector("select")!.value).toBe("");
    expect(document.querySelector('[aria-pressed="true"]')).toBeNull();
  });
});
