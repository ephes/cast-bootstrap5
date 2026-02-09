import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { destroyScrollTop, getScrollTopVisibilityState, initScrollTop } from "@/theme/scroll-top";

function setViewport({ scrollY, innerHeight, scrollHeight }: { scrollY: number; innerHeight: number; scrollHeight: number }): void {
  Object.defineProperty(window, "scrollY", { configurable: true, value: scrollY });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: innerHeight });
  Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: scrollHeight });
}

describe("scroll-top", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button type="button" class="cast-scroll-top" aria-hidden="true" tabindex="-1"></button>
    `;

    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    destroyScrollTop();
    vi.restoreAllMocks();
  });

  it("keeps the button hidden when page is short", () => {
    const state = getScrollTopVisibilityState(50, 900, 1100);
    expect(state.show).toBe(false);
    expect(state.scrollable).toBe(200);
  });

  it("keeps the button hidden when no scrolling is possible", () => {
    const state = getScrollTopVisibilityState(0, 900, 900);
    expect(state.show).toBe(false);
    expect(state.scrollable).toBe(0);
  });

  it("shows button once scroll position passes dynamic threshold", () => {
    const state = getScrollTopVisibilityState(250, 900, 1450);
    expect(state.threshold).toBe(275);
    expect(state.show).toBe(false);

    const visible = getScrollTopVisibilityState(280, 900, 1450);
    expect(visible.show).toBe(true);
  });

  it("caps threshold at 400 for long pages", () => {
    const hidden = getScrollTopVisibilityState(400, 900, 5000);
    const visible = getScrollTopVisibilityState(401, 900, 5000);
    expect(hidden.threshold).toBe(400);
    expect(hidden.show).toBe(false);
    expect(visible.show).toBe(true);
  });

  it("stays hidden at top on long pages", () => {
    const state = getScrollTopVisibilityState(0, 900, 5000);
    expect(state.show).toBe(false);
  });

  it("updates button visibility on init and scroll", () => {
    setViewport({ scrollY: 0, innerHeight: 900, scrollHeight: 1450 });

    initScrollTop();
    const button = document.querySelector(".cast-scroll-top") as HTMLButtonElement;

    expect(button.classList.contains("is-visible")).toBe(false);
    expect(button.getAttribute("aria-hidden")).toBe("true");
    expect(button.tabIndex).toBe(-1);

    setViewport({ scrollY: 280, innerHeight: 900, scrollHeight: 1450 });
    window.dispatchEvent(new Event("scroll"));

    expect(button.classList.contains("is-visible")).toBe(true);
    expect(button.getAttribute("aria-hidden")).toBe("false");
    expect(button.tabIndex).toBe(0);
  });

  it("updates button visibility on resize", () => {
    setViewport({ scrollY: 250, innerHeight: 300, scrollHeight: 1300 });
    initScrollTop();

    const button = document.querySelector(".cast-scroll-top") as HTMLButtonElement;
    expect(button.classList.contains("is-visible")).toBe(false);

    setViewport({ scrollY: 250, innerHeight: 900, scrollHeight: 1300 });
    window.dispatchEvent(new Event("resize"));

    expect(button.classList.contains("is-visible")).toBe(true);
    expect(button.getAttribute("aria-hidden")).toBe("false");
    expect(button.tabIndex).toBe(0);
  });

  it("scrolls to top when clicked", () => {
    setViewport({ scrollY: 400, innerHeight: 900, scrollHeight: 2000 });
    initScrollTop();

    const button = document.querySelector(".cast-scroll-top") as HTMLButtonElement;
    button.click();

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("does not bind duplicate listeners", () => {
    setViewport({ scrollY: 400, innerHeight: 900, scrollHeight: 2000 });
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");

    initScrollTop();
    initScrollTop();

    const scrollBindings = addEventListenerSpy.mock.calls.filter(([event]) => event === "scroll");
    expect(scrollBindings).toHaveLength(1);
  });

  it("stops updating after destroy", () => {
    setViewport({ scrollY: 0, innerHeight: 900, scrollHeight: 2000 });
    initScrollTop();

    const button = document.querySelector(".cast-scroll-top") as HTMLButtonElement;
    destroyScrollTop();

    setViewport({ scrollY: 500, innerHeight: 900, scrollHeight: 2000 });
    window.dispatchEvent(new Event("scroll"));

    expect(button.classList.contains("is-visible")).toBe(false);
    expect(button.getAttribute("aria-hidden")).toBe("true");
    expect(button.tabIndex).toBe(-1);
  });

  it("is a no-op when button is missing from DOM", () => {
    document.body.innerHTML = "";
    expect(() => initScrollTop()).not.toThrow();
  });

  it("re-binds to a replaced button after htmx swap", () => {
    setViewport({ scrollY: 280, innerHeight: 900, scrollHeight: 1450 });
    initScrollTop();

    const original = document.querySelector(".cast-scroll-top") as HTMLButtonElement;
    expect(original.classList.contains("is-visible")).toBe(true);

    document.body.innerHTML = `
      <button type="button" class="cast-scroll-top" aria-hidden="true" tabindex="-1"></button>
    `;
    document.dispatchEvent(new CustomEvent("htmx:afterSwap"));

    const replacement = document.querySelector(".cast-scroll-top") as HTMLButtonElement;
    expect(replacement).not.toBe(original);
    expect(replacement.classList.contains("is-visible")).toBe(true);
    expect(replacement.getAttribute("aria-hidden")).toBe("false");
    expect(replacement.tabIndex).toBe(0);
  });
});
