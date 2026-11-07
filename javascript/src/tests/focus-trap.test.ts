import { afterEach, describe, expect, it, vi } from "vitest";

import { createFocusTrap as createTrap, type FocusTrapController } from "@/utils/focus-trap";

const traps: FocusTrapController[] = [];
function createFocusTrap(container: HTMLElement): FocusTrapController {
  const trap = createTrap(container);
  traps.push(trap);
  return trap;
}

afterEach(() => {
  traps.splice(0).forEach((trap) => trap.deactivate());
  vi.restoreAllMocks();
});

// jsdom has no layout; browser/focus.e2e.ts covers native geometry.
function markVisible(element: HTMLElement): void {
  vi.spyOn(element, "getClientRects").mockReturnValue([{} as DOMRect] as unknown as DOMRectList);
}

describe("focus-trap", () => {
  it("cycles focus forward from last to first", () => {
    document.body.innerHTML = `
      <div id="modal">
        <button id="first" type="button">First</button>
        <button id="last" type="button">Last</button>
      </div>
    `;

    const modal = document.getElementById("modal") as HTMLElement;
    const first = document.getElementById("first") as HTMLButtonElement;
    const last = document.getElementById("last") as HTMLButtonElement;
    markVisible(first);
    markVisible(last);

    const trap = createFocusTrap(modal);
    trap.activate();

    last.focus();
    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
    const preventedSpy = vi.spyOn(event, "preventDefault");
    modal.dispatchEvent(event);

    expect(preventedSpy).toHaveBeenCalled();
    expect(document.activeElement).toBe(first);
  });

  it("cycles focus backward from first to last", () => {
    document.body.innerHTML = `
      <div id="modal">
        <button id="first" type="button">First</button>
        <button id="last" type="button">Last</button>
      </div>
    `;

    const modal = document.getElementById("modal") as HTMLElement;
    const first = document.getElementById("first") as HTMLButtonElement;
    const last = document.getElementById("last") as HTMLButtonElement;
    markVisible(first);
    markVisible(last);

    const trap = createFocusTrap(modal);
    trap.activate();

    first.focus();
    const event = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true });
    const preventedSpy = vi.spyOn(event, "preventDefault");
    modal.dispatchEvent(event);

    expect(preventedSpy).toHaveBeenCalled();
    expect(document.activeElement).toBe(last);
  });

  it("re-queries visible focusables on every keypress", () => {
    document.body.innerHTML = `
      <div id="modal">
        <button id="first" type="button">First</button>
        <button id="second" type="button">Second</button>
        <button id="third" type="button">Third</button>
      </div>
    `;

    const modal = document.getElementById("modal") as HTMLElement;
    const first = document.getElementById("first") as HTMLButtonElement;
    const second = document.getElementById("second") as HTMLButtonElement;
    const third = document.getElementById("third") as HTMLButtonElement;
    markVisible(first);
    markVisible(second);

    const trap = createFocusTrap(modal);
    trap.activate();

    second.focus();
    let event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
    let preventedSpy = vi.spyOn(event, "preventDefault");
    modal.dispatchEvent(event);
    expect(preventedSpy).toHaveBeenCalled();
    expect(document.activeElement).toBe(first);

    markVisible(third);
    third.focus();

    event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
    preventedSpy = vi.spyOn(event, "preventDefault");
    modal.dispatchEvent(event);

    expect(preventedSpy).toHaveBeenCalled();
    expect(document.activeElement).toBe(first);
  });

  function pressTab(target: HTMLElement, shiftKey = false): boolean {
    const event = new KeyboardEvent("keydown", { key: "Tab", shiftKey, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    return event.defaultPrevented;
  }

  it("wraps at a textarea that is the last control", () => {
    document.body.innerHTML = `
      <div id="modal">
        <button id="first" type="button">First</button>
        <textarea id="comment"></textarea>
      </div>
    `;
    const modal = document.getElementById("modal") as HTMLElement;
    const first = document.getElementById("first") as HTMLButtonElement;
    const comment = document.getElementById("comment") as HTMLTextAreaElement;
    markVisible(first);
    markVisible(comment);
    const trap = createFocusTrap(modal);
    trap.activate();

    comment.focus();
    expect(pressTab(comment)).toBe(true);
    expect(document.activeElement).toBe(first);

    expect(pressTab(first, true)).toBe(true);
    expect(document.activeElement).toBe(comment);

    // Leaving the first control forwards is ordinary browser tabbing.
    first.focus();
    expect(pressTab(first)).toBe(false);
    expect(document.activeElement).toBe(first);
  });

  it("skips controls outside the tab order: disabled, in a disabled fieldset, hidden, negative tabindex", () => {
    document.body.innerHTML = `
      <div id="modal">
        <button id="first" type="button">First</button>
        <button id="last" type="button">Last</button>
        <textarea id="disabled" disabled></textarea>
        <textarea id="hidden"></textarea>
        <fieldset disabled>
          <textarea id="in-disabled-fieldset"></textarea>
          <button id="button-in-disabled-fieldset" type="button">Off</button>
        </fieldset>
        <textarea id="negative-tabindex" tabindex="-1"></textarea>
        <input id="negative-input" tabindex="-2">
      </div>
    `;
    const modal = document.getElementById("modal") as HTMLElement;
    const first = document.getElementById("first") as HTMLButtonElement;
    const last = document.getElementById("last") as HTMLButtonElement;
    markVisible(first);
    markVisible(last);
    for (const id of [
      "disabled",
      "in-disabled-fieldset",
      "button-in-disabled-fieldset",
      "negative-tabindex",
      "negative-input",
    ]) {
      markVisible(document.getElementById(id) as HTMLElement);
    }
    createFocusTrap(modal).activate();

    last.focus();
    expect(pressTab(last)).toBe(true);
    expect(document.activeElement).toBe(first);

    expect(pressTab(first, true)).toBe(true);
    expect(document.activeElement).toBe(last);
  });

  it("keeps a textarea with a non-negative tabindex as the last control", () => {
    document.body.innerHTML = `
      <div id="modal">
        <button id="first" type="button">First</button>
        <textarea id="comment" tabindex="0"></textarea>
      </div>
    `;
    const modal = document.getElementById("modal") as HTMLElement;
    const first = document.getElementById("first") as HTMLButtonElement;
    const comment = document.getElementById("comment") as HTMLTextAreaElement;
    markVisible(first);
    markVisible(comment);
    createFocusTrap(modal).activate();

    comment.focus();
    expect(pressTab(comment)).toBe(true);
    expect(document.activeElement).toBe(first);
  });

  it("includes a rendered fixed control with no offset parent", () => {
    document.body.innerHTML = '<div id="modal"><button id="first">First</button><button id="last" style="position:fixed">Last</button></div>';
    const modal = document.getElementById("modal")!;
    const first = document.getElementById("first")!;
    const last = document.getElementById("last")!;
    markVisible(first);
    markVisible(last);
    createFocusTrap(modal).activate();
    last.focus();
    expect(pressTab(last)).toBe(true);
    expect(document.activeElement).toBe(first);
  });

  it("wraps in stable positive tabindex order before zero stops", () => {
    document.body.innerHTML = '<div id="modal"><button id="zero">Zero</button><button id="one" tabindex="1">One</button><button id="same" tabindex="1">Same</button></div>';
    const modal = document.getElementById("modal")!;
    const zero = document.getElementById("zero")!;
    const one = document.getElementById("one")!;
    const same = document.getElementById("same")!;
    [zero, one, same].forEach(markVisible);
    createFocusTrap(modal).activate();
    zero.focus();
    expect(pressTab(zero)).toBe(true);
    expect(document.activeElement).toBe(one);
    expect(pressTab(one, true)).toBe(true);
    expect(document.activeElement).toBe(zero);
    one.focus();
    expect(pressTab(one)).toBe(true);
    expect(document.activeElement).toBe(same);
    expect(pressTab(same)).toBe(true);
    expect(document.activeElement).toBe(zero);
    same.tabIndex = 1;
    one.tabIndex = 2;
    expect(pressTab(zero)).toBe(true);
    expect(document.activeElement).toBe(same);
  });

  it("ignores CSS-hidden and inert controls and recovers from a stale active stop", () => {
    document.body.innerHTML = `<div id="modal">
      <button style="visibility:hidden">Hidden</button><div inert><button>Inert</button></div>
      <button id="first">First</button><button id="last">Last</button>
      <button style="visibility:hidden">Hidden last</button><div inert><button>Inert last</button></div>
    </div>`;
    const modal = document.getElementById("modal")!;
    const first = document.getElementById("first")!;
    const last = document.getElementById("last")!;
    modal.querySelectorAll<HTMLElement>("button").forEach(markVisible);
    const trap = createFocusTrap(modal);
    trap.activate();
    last.focus();
    expect(pressTab(last)).toBe(true);
    expect(document.activeElement).toBe(first);
    first.tabIndex = -1;
    expect(pressTab(first)).toBe(true);
    expect(document.activeElement).toBe(last);
    trap.deactivate();
  });

  it("contains an empty set and recovers after the focused control is replaced", () => {
    document.body.innerHTML = '<div id="modal"><button id="old">Old</button></div><button id="outside">Outside</button>';
    const modal = document.getElementById("modal")!;
    const trap = createFocusTrap(modal);
    trap.activate();
    document.getElementById("old")!.focus();
    modal.replaceChildren();
    expect(pressTab(document.body)).toBe(true);
    expect(document.activeElement).toBe(modal);
    modal.innerHTML = '<button id="new">New</button>';
    const fresh = document.getElementById("new")!;
    markVisible(fresh);
    expect(pressTab(modal, true)).toBe(true);
    expect(document.activeElement).toBe(fresh);
    fresh.remove();
    expect(pressTab(document.body, true)).toBe(true);
    expect(document.activeElement).toBe(modal);
    trap.deactivate();
    expect(modal.hasAttribute("tabindex")).toBe(false);
    expect(pressTab(modal)).toBe(false);
  });

  it("registers one listener however often it is activated", () => {
    document.body.innerHTML = `
      <div id="modal">
        <button id="first" type="button">First</button>
        <textarea id="comment"></textarea>
      </div>
    `;
    const modal = document.getElementById("modal") as HTMLElement;
    const comment = document.getElementById("comment") as HTMLTextAreaElement;
    markVisible(document.getElementById("first") as HTMLElement);
    markVisible(comment);
    const addSpy = vi.spyOn(document, "addEventListener");
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const trap = createFocusTrap(modal);

    trap.activate();
    trap.activate();
    trap.deactivate();
    trap.deactivate();

    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledTimes(1);
    comment.focus();
    expect(pressTab(comment)).toBe(false);
    expect(document.activeElement).toBe(comment);
  });

  it("stops trapping when deactivated", () => {
    document.body.innerHTML = `
      <div id="modal">
        <button id="first" type="button">First</button>
        <button id="last" type="button">Last</button>
      </div>
    `;

    const modal = document.getElementById("modal") as HTMLElement;
    const first = document.getElementById("first") as HTMLButtonElement;
    const last = document.getElementById("last") as HTMLButtonElement;
    markVisible(first);
    markVisible(last);

    const trap = createFocusTrap(modal);
    trap.activate();
    trap.deactivate();

    last.focus();
    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
    const preventedSpy = vi.spyOn(event, "preventDefault");
    modal.dispatchEvent(event);

    expect(preventedSpy).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(last);
  });
});
