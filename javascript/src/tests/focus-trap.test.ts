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

  it.each([false, true])("contains a radio-only group (checked: %s)", (checked) => {
    document.body.innerHTML = `<div id="modal">
      <input id="a" type="radio" name="choice">
      <input id="b" type="radio" name="choice" ${checked ? "checked" : ""}>
      <input id="c" type="radio" name="choice">
    </div><button>Outside</button>`;
    const modal = document.getElementById("modal")!;
    modal.querySelectorAll<HTMLElement>("input").forEach(markVisible);
    createFocusTrap(modal).activate();
    const selected = document.getElementById("b")!;
    selected.focus();
    expect(pressTab(selected)).toBe(true);
    expect(document.activeElement).toBe(selected);
    expect(pressTab(selected, true)).toBe(true);
    expect(document.activeElement).toBe(selected);
  });

  it("groups radios by literal nonempty name and form owner in positive tabindex order", () => {
    document.body.innerHTML = `<form id="one"></form><form id="two"></form><div id="modal">
      <input id="a" type="radio" name='choice[]"' form="one" tabindex="2">
      <input id="b" type="radio" name='choice[]"' form="one" tabindex="1" checked>
      <input id="c" type="radio" name='choice[]"' form="two" tabindex="3" checked>
      <input id="d" type="radio" name='choice[]"' tabindex="4" checked>
      <input id="e" type="radio" tabindex="5">
      <input id="f" type="radio" name="" tabindex="6">
    </div>`;
    const modal = document.getElementById("modal")!;
    modal.querySelectorAll<HTMLElement>("input").forEach(markVisible);
    createFocusTrap(modal).activate();
    const b = document.getElementById("b")!;
    b.focus();
    for (const id of ["c", "d", "e", "f", "b"]) {
      expect(pressTab(document.activeElement as HTMLElement)).toBe(true);
      expect(document.activeElement).toBe(document.getElementById(id));
    }
    (document.getElementById("a") as HTMLInputElement).checked = true;
    // Like native Chromium, Tab from the focused member leaves its group.
    expect(pressTab(b)).toBe(true);
    expect(document.activeElement).toBe(document.getElementById("c"));
    // The newly checked member is the group's entry stop once focus is elsewhere.
    const f = document.getElementById("f")!;
    f.focus();
    expect(pressTab(f)).toBe(true);
    expect(document.activeElement).toBe(document.getElementById("a"));
  });

  it("skips unavailable radios and uses an eligible member when the checked one is unavailable", () => {
    document.body.innerHTML = `<div id="modal">
      <input type="radio" name="choice" checked disabled>
      <input id="available" type="radio" name="choice" tabindex="1">
      <input type="radio" name="choice" style="visibility:hidden">
      <div inert><input type="radio" name="choice"></div>
      <input type="radio" name="choice" tabindex="-1">
    </div>`;
    const modal = document.getElementById("modal")!;
    modal.querySelectorAll<HTMLElement>("input").forEach(markVisible);
    createFocusTrap(modal).activate();
    const available = document.getElementById("available")!;
    available.focus();
    expect(pressTab(available)).toBe(true);
    expect(document.activeElement).toBe(available);
    expect(pressTab(available, true)).toBe(true);
    expect(document.activeElement).toBe(available);
  });

  it("does not admit unchecked members of a group whose checked stop is outside", () => {
    document.body.innerHTML = `<input type="radio" name="choice" checked>
      <div id="modal"><input type="radio" name="choice"><button id="only">Only</button></div>`;
    document.querySelectorAll<HTMLElement>("input, button").forEach(markVisible);
    const modal = document.getElementById("modal")!;
    createFocusTrap(modal).activate();
    const only = document.getElementById("only")!;
    only.focus();
    expect(pressTab(only, true)).toBe(true);
    expect(document.activeElement).toBe(only);
  });

  it("owns each Tab step when unchecked radio members surround other controls", () => {
    document.body.innerHTML = `<div id="modal">
      <input id="a" type="radio" name="choice"><button id="middle">Middle</button>
      <input id="b" type="radio" name="choice">
    </div>`;
    const modal = document.getElementById("modal")!;
    modal.querySelectorAll<HTMLElement>("input, button").forEach(markVisible);
    createFocusTrap(modal).activate();
    const a = document.getElementById("a")!;
    const b = document.getElementById("b")!;
    const middle = document.getElementById("middle")!;
    b.focus();
    expect(pressTab(b, true)).toBe(true);
    expect(document.activeElement).toBe(middle);
    expect(pressTab(middle, true)).toBe(true);
    expect(document.activeElement).toBe(a);
    expect(pressTab(a)).toBe(true);
    expect(document.activeElement).toBe(middle);
    expect(pressTab(middle)).toBe(true);
    expect(document.activeElement).toBe(a);
  });

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

  function overlappingTraps() {
    document.body.innerHTML = `<div id="older"><button id="old-first">First</button>
      <button id="old-last">Last</button></div>
      <div id="newer"><button id="new-first">First</button><button id="new-last">Last</button></div>`;
    document.querySelectorAll<HTMLElement>("button").forEach(markVisible);
    const older = createFocusTrap(document.getElementById("older")!);
    const newer = createFocusTrap(document.getElementById("newer")!);
    older.activate();
    newer.activate();
    return { older, newer };
  }

  it("gives only the newest trap Tab ownership and restores its predecessor on close", () => {
    const { older, newer } = overlappingTraps();
    const oldFirst = document.getElementById("old-first")!;
    const newFirst = document.getElementById("new-first")!;
    const newLast = document.getElementById("new-last")!;
    // Repeated activation of an already active trap cannot steal ownership.
    older.activate();
    newFirst.focus();
    expect(pressTab(newFirst)).toBe(false);
    expect(document.activeElement).toBe(newFirst);
    newLast.focus();
    expect(pressTab(newLast)).toBe(true);
    expect(document.activeElement).toBe(newFirst);
    expect(pressTab(newFirst, true)).toBe(true);
    expect(document.activeElement).toBe(newLast);
    newer.deactivate();
    newer.deactivate();
    expect(pressTab(newLast)).toBe(true);
    expect(document.activeElement).toBe(oldFirst);
    older.deactivate();
    expect(pressTab(oldFirst)).toBe(false);
  });

  it("can retire a suspended trap without disturbing the current owner", () => {
    const { older, newer } = overlappingTraps();
    older.deactivate();
    older.deactivate();
    const newFirst = document.getElementById("new-first")!;
    const newLast = document.getElementById("new-last")!;
    newLast.focus();
    expect(pressTab(newLast)).toBe(true);
    expect(document.activeElement).toBe(newFirst);
    newer.deactivate();
    expect(pressTab(newFirst)).toBe(false);
  });

  it("skips disconnected owners and resumes the previous connected trap", () => {
    const { newer } = overlappingTraps();
    document.getElementById("newer")!.remove();
    const oldFirst = document.getElementById("old-first")!;
    document.getElementById("old-last")!.focus();
    expect(pressTab(document.body)).toBe(true);
    expect(document.activeElement).toBe(oldFirst);
    newer.deactivate();
    expect(document.getElementById("older")!.getAttribute("tabindex")).toBe("-1");
  });

  it("restores the nearest connected owner when a suspended container was removed", () => {
    document.body.innerHTML = '<div id="base"><button id="base-stop">Base</button></div>';
    const base = createFocusTrap(document.getElementById("base")!);
    const stop = document.getElementById("base-stop")!;
    markVisible(stop);
    base.activate();
    const removed = document.createElement("div");
    document.body.append(removed);
    createFocusTrap(removed).activate();
    const current = document.createElement("div");
    document.body.append(current);
    const top = createFocusTrap(current);
    top.activate();
    removed.remove();
    top.deactivate();
    expect(pressTab(document.body)).toBe(true);
    expect(document.activeElement).toBe(stop);
    base.deactivate();
    expect(pressTab(document.body)).toBe(false);
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

  it("leaves a group from a focused unchecked member even when another member is checked", () => {
    document.body.innerHTML = `<div id="modal">
      <button id="before" type="button">Before</button>
      <input id="a" type="radio" name="choice" checked>
      <input id="b" type="radio" name="choice">
      <button id="after" type="button">After</button>
    </div>`;
    const modal = document.getElementById("modal")!;
    modal.querySelectorAll<HTMLElement>("input, button").forEach(markVisible);
    createFocusTrap(modal).activate();
    const b = document.getElementById("b")!;
    b.focus();
    expect(pressTab(b)).toBe(true);
    expect(document.activeElement).toBe(document.getElementById("after"));
    b.focus();
    expect(pressTab(b, true)).toBe(true);
    expect(document.activeElement).toBe(document.getElementById("before"));
  });

  it("finds the checked member of a group inside a shadow-root trap", () => {
    document.body.innerHTML = `<div id="host"></div>`;
    const shadow = document.getElementById("host")!.attachShadow({ mode: "open" });
    shadow.innerHTML = `<div id="modal">
      <input id="a" type="radio" name="choice">
      <input id="b" type="radio" name="choice" checked>
      <input id="c" type="radio" name="choice">
    </div>`;
    const modal = shadow.getElementById("modal")!;
    modal.querySelectorAll<HTMLElement>("input").forEach(markVisible);
    createFocusTrap(modal).activate();
    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, composed: true, cancelable: true });
    modal.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(shadow.activeElement).toBe(shadow.getElementById("b"));
  });

  it("moves through a shadow-root trap from focused controls", () => {
    document.body.innerHTML = `<div id="host"></div><button id="outside">Outside</button>`;
    const shadow = document.getElementById("host")!.attachShadow({ mode: "open" });
    shadow.innerHTML = `<div id="modal">
      <button id="first" type="button">First</button>
      <input id="a" type="radio" name="choice">
      <input id="b" type="radio" name="choice" checked>
      <button id="last" type="button">Last</button>
    </div>`;
    const modal = shadow.getElementById("modal")!;
    modal.querySelectorAll<HTMLElement>("input, button").forEach(markVisible);
    createFocusTrap(modal).activate();
    const press = (shiftKey = false): boolean => {
      const event = new KeyboardEvent("keydown", { key: "Tab", shiftKey, bubbles: true, composed: true, cancelable: true });
      (shadow.activeElement as HTMLElement).dispatchEvent(event);
      return event.defaultPrevented;
    };
    shadow.getElementById("first")!.focus();
    for (const id of ["b", "last", "first"]) {
      expect(press()).toBe(true);
      expect(shadow.activeElement).toBe(shadow.getElementById(id));
    }
    shadow.getElementById("a")!.focus();
    expect(press(true)).toBe(true);
    expect(shadow.activeElement).toBe(shadow.getElementById("first"));
  });
});
