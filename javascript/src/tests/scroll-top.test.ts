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

  it.each([false, true])("invalidates queued frames on teardown (replacement: %s)", (replace) => {
    const frames: FrameRequestCallback[] = [];
    vi.mocked(window.requestAnimationFrame).mockImplementation(callback => {
      frames.push(callback);
      return frames.length;
    });
    const cancel = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    setViewport({ scrollY: 0, innerHeight: 900, scrollHeight: 2000 });
    initScrollTop();
    const original = document.querySelector<HTMLButtonElement>("button")!;
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("resize"));
    expect(frames).toHaveLength(1);
    if (replace) {
      original.replaceWith(original.cloneNode());
      document.dispatchEvent(new CustomEvent("htmx:afterSwap"));
    } else {
      destroyScrollTop();
      initScrollTop();
    }
    expect(cancel).toHaveBeenCalledWith(1);
    const retiredState = original.outerHTML;
    setViewport({ scrollY: 600, innerHeight: 900, scrollHeight: 2000 });
    frames[0](0);
    expect(original.outerHTML).toBe(retiredState);
    window.dispatchEvent(new Event("scroll"));
    expect(frames).toHaveLength(2);
    frames[1](0);
    expect(document.querySelector("button")!.getAttribute("aria-hidden")).toBe("false");
  });

  it("resumes viewport updates after the same button is temporarily detached", () => {
    const frames: FrameRequestCallback[] = [];
    vi.mocked(window.requestAnimationFrame).mockImplementation(callback => {
      frames.push(callback);
      return frames.length;
    });
    setViewport({ scrollY: 0, innerHeight: 900, scrollHeight: 2000 });
    initScrollTop();
    const button = document.querySelector<HTMLButtonElement>("button")!;
    window.dispatchEvent(new Event("scroll"));
    button.remove();
    setViewport({ scrollY: 600, innerHeight: 900, scrollHeight: 2000 });
    frames[0](0);
    expect(button.getAttribute("aria-hidden")).toBe("true");
    document.body.append(button);
    window.dispatchEvent(new Event("resize"));
    expect(frames).toHaveLength(2);
    frames[1](0);
    expect(button.getAttribute("aria-hidden")).toBe("false");
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

describe("scroll-top accessible activation", () => {
  beforeEach(() => {
    destroyScrollTop();
    document.body.innerHTML = '<main id="main-content"><h1>Top heading</h1></main><button class="cast-scroll-top">Top</button>';
    setViewport({ scrollY: 600, innerHeight: 900, scrollHeight: 2000 });
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => { callback(0); return 1; });
  });
  afterEach(() => {
    destroyScrollTop();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each([false, true])("reads current reduced motion (%s) and transfers focus", (reduced) => {
    const matchMedia = vi.fn().mockReturnValue({ matches: !reduced });
    vi.stubGlobal("matchMedia", matchMedia);
    initScrollTop();
    matchMedia.mockReturnValue({ matches: reduced });
    const button = document.querySelector<HTMLButtonElement>("button")!;
    button.focus();
    button.click();
    expect(matchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: reduced ? "instant" : "smooth" });
    expect(document.activeElement).toBe(document.querySelector("h1"));
    setViewport({ scrollY: 0, innerHeight: 900, scrollHeight: 2000 });
    window.dispatchEvent(new Event("scroll"));
    expect(button.getAttribute("aria-hidden")).toBe("true");
    expect(document.activeElement).not.toBe(button);
    button.focus();
    expect(document.querySelector("h1")!.hasAttribute("tabindex")).toBe(false);
  });

  it("ordinary scrolling never steals focus or hides the focused control", () => {
    initScrollTop();
    const button = document.querySelector<HTMLButtonElement>("button")!;
    button.focus();
    setViewport({ scrollY: 0, innerHeight: 900, scrollHeight: 2000 });
    window.dispatchEvent(new Event("scroll"));
    expect(document.activeElement).toBe(button);
    expect(button.getAttribute("aria-hidden")).toBe("false");
    expect(button.classList.contains("is-visible")).toBe(true);
    const heading = document.querySelector<HTMLElement>("h1")!;
    heading.tabIndex = -1;
    heading.focus();
    expect(button.getAttribute("aria-hidden")).toBe("true");
    expect(button.classList.contains("is-visible")).toBe(false);
  });

  it("uses the main landmark when there is no heading", () => {
    document.querySelector("h1")!.remove();
    initScrollTop();
    document.querySelector<HTMLButtonElement>("button")!.click();
    expect(document.activeElement).toBe(document.querySelector("main"));
  });

  it("preserves native links, modified clicks and cancelled activation", () => {
    document.querySelector("button")!.outerHTML = '<a class="cast-scroll-top" href="#main-content">Top</a>';
    initScrollTop();
    const link = document.querySelector<HTMLAnchorElement>(".cast-scroll-top")!;
    const event = new MouseEvent("click", { cancelable: true, ctrlKey: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(window.scrollTo).not.toHaveBeenCalled();
    link.click();
    expect(window.scrollTo).not.toHaveBeenCalled();
    document.body.innerHTML = '<button class="cast-scroll-top">Top</button>';
    initScrollTop();
    const cancelled = new MouseEvent("click", { cancelable: true });
    cancelled.preventDefault();
    document.querySelector("button")!.dispatchEvent(cancelled);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});

it("prefers the main landmark over a hero heading outside main", () => {
  destroyScrollTop();
  document.body.innerHTML = '<header><h1>Hero title</h1></header><main id="main-content"><h2>Post</h2></main><button class="cast-scroll-top">Top</button>';
  setViewport({ scrollY: 600, innerHeight: 900, scrollHeight: 2000 });
  const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  initScrollTop();
  document.querySelector<HTMLButtonElement>("button")!.click();
  expect(document.activeElement).toBe(document.querySelector("main"));
  destroyScrollTop();
  scroll.mockRestore();
});
