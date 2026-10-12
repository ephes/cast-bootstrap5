import { describe, expect, it, vi } from "vitest";

import { createFocusTrap } from "@/utils/focus-trap";

function markVisible(element: HTMLElement): void {
  Object.defineProperty(element, "offsetParent", {
    configurable: true,
    get() {
      return document.body;
    },
  });
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

  it("skips disabled and hidden textareas", () => {
    document.body.innerHTML = `
      <div id="modal">
        <button id="first" type="button">First</button>
        <button id="last" type="button">Last</button>
        <textarea id="disabled" disabled></textarea>
        <textarea id="hidden"></textarea>
        <fieldset disabled><textarea id="in-disabled-fieldset" disabled></textarea></fieldset>
      </div>
    `;
    const modal = document.getElementById("modal") as HTMLElement;
    const first = document.getElementById("first") as HTMLButtonElement;
    const last = document.getElementById("last") as HTMLButtonElement;
    markVisible(first);
    markVisible(last);
    markVisible(document.getElementById("disabled") as HTMLElement);
    createFocusTrap(modal).activate();

    last.focus();
    expect(pressTab(last)).toBe(true);
    expect(document.activeElement).toBe(first);

    expect(pressTab(first, true)).toBe(true);
    expect(document.activeElement).toBe(last);
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
    const addSpy = vi.spyOn(modal, "addEventListener");
    const removeSpy = vi.spyOn(modal, "removeEventListener");
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
