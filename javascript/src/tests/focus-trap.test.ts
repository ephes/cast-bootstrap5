import { describe, expect, it } from "vitest";

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
