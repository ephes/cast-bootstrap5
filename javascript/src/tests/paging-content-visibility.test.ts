import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  destroyPagingContentVisibility,
  initPagingContentVisibility,
} from "@/theme/paging-content-visibility";

describe("paging-content-visibility", () => {
  beforeEach(() => {
    destroyPagingContentVisibility();
    document.body.innerHTML = '<div id="paging-area"></div><div id="other-area"></div>';
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  });

  afterEach(() => {
    destroyPagingContentVisibility();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("adds vt-active before transition and removes it after settle", () => {
    const pagingArea = document.querySelector("#paging-area") as HTMLElement;
    initPagingContentVisibility();

    document.dispatchEvent(new CustomEvent("htmx:beforeTransition", { detail: { target: pagingArea } }));
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    expect(pagingArea.classList.contains("vt-active")).toBe(true);

    document.dispatchEvent(new CustomEvent("htmx:afterSettle", { detail: { target: pagingArea } }));
    expect(pagingArea.classList.contains("vt-active")).toBe(false);
  });

  it("treats detail.elt as a valid paging-area marker", () => {
    const pagingArea = document.querySelector("#paging-area") as HTMLElement;
    initPagingContentVisibility();

    document.dispatchEvent(new CustomEvent("htmx:beforeTransition", { detail: { elt: pagingArea } }));
    expect(pagingArea.classList.contains("vt-active")).toBe(true);
  });

  it("ignores unrelated transitions", () => {
    const pagingArea = document.querySelector("#paging-area") as HTMLElement;
    const otherArea = document.querySelector("#other-area") as HTMLElement;
    initPagingContentVisibility();

    document.dispatchEvent(new CustomEvent("htmx:beforeTransition", { detail: { target: otherArea } }));
    expect(pagingArea.classList.contains("vt-active")).toBe(false);
  });

  it("scrolls to top and activates transition even when far down the page", () => {
    const pagingArea = document.querySelector("#paging-area") as HTMLElement;
    Object.defineProperty(window, "scrollY", { configurable: true, value: 500 });
    initPagingContentVisibility();

    const event = new CustomEvent("htmx:beforeTransition", {
      cancelable: true,
      detail: { target: pagingArea },
    });
    document.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    expect(pagingArea.classList.contains("vt-active")).toBe(true);
  });

  it("skips transition when paging area contains podlove players", () => {
    const pagingArea = document.querySelector("#paging-area") as HTMLElement;
    pagingArea.innerHTML = "<podlove-player></podlove-player>";
    initPagingContentVisibility();

    const event = new CustomEvent("htmx:beforeTransition", {
      cancelable: true,
      detail: { target: pagingArea },
    });
    document.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(pagingArea.classList.contains("vt-active")).toBe(false);
    expect(pagingArea.getAttribute("data-cast-paging-mask-active")).toBe("true");
  });

  it("marks paging area as podlove-present when podlove players exist", () => {
    const pagingArea = document.querySelector("#paging-area") as HTMLElement;
    pagingArea.innerHTML = "<podlove-player></podlove-player>";

    initPagingContentVisibility();

    expect(pagingArea.getAttribute("data-cast-podlove-present")).toBe("true");
  });

  it("removes podlove-present marker after swaps without podlove players", () => {
    const pagingArea = document.querySelector("#paging-area") as HTMLElement;
    pagingArea.innerHTML = "<podlove-player></podlove-player>";
    initPagingContentVisibility();
    expect(pagingArea.getAttribute("data-cast-podlove-present")).toBe("true");

    pagingArea.innerHTML = '<article class="post-card">No player</article>';
    document.dispatchEvent(new CustomEvent("htmx:afterSettle", { detail: { target: pagingArea } }));

    expect(pagingArea.getAttribute("data-cast-podlove-present")).toBeNull();
  });

  it("activates a podlove paging mask on beforeRequest and clears it after settle delay", () => {
    vi.useFakeTimers();
    const pagingArea = document.querySelector("#paging-area") as HTMLElement;
    pagingArea.innerHTML = "<podlove-player></podlove-player>";
    initPagingContentVisibility();

    document.dispatchEvent(new CustomEvent("htmx:beforeRequest", { detail: { target: pagingArea } }));
    expect(pagingArea.getAttribute("data-cast-paging-mask-active")).toBe("true");

    document.dispatchEvent(new CustomEvent("htmx:afterSettle", { detail: { target: pagingArea } }));
    expect(pagingArea.getAttribute("data-cast-paging-mask-active")).toBe("true");

    vi.advanceTimersByTime(299);
    expect(pagingArea.getAttribute("data-cast-paging-mask-active")).toBe("true");

    vi.advanceTimersByTime(1);
    expect(pagingArea.getAttribute("data-cast-paging-mask-active")).toBeNull();
    vi.useRealTimers();
  });

  it("does not activate a paging mask for non-podlove requests", () => {
    const pagingArea = document.querySelector("#paging-area") as HTMLElement;
    initPagingContentVisibility();

    document.dispatchEvent(new CustomEvent("htmx:beforeRequest", { detail: { target: pagingArea } }));
    expect(pagingArea.getAttribute("data-cast-paging-mask-active")).toBeNull();
  });

  it("removes vt-active when htmx errors or aborts", () => {
    const pagingArea = document.querySelector("#paging-area") as HTMLElement;
    initPagingContentVisibility();

    document.dispatchEvent(new CustomEvent("htmx:beforeTransition", { detail: { target: pagingArea } }));
    expect(pagingArea.classList.contains("vt-active")).toBe(true);

    document.dispatchEvent(new CustomEvent("htmx:responseError", { detail: { target: pagingArea } }));
    expect(pagingArea.classList.contains("vt-active")).toBe(false);

    document.dispatchEvent(new CustomEvent("htmx:beforeTransition", { detail: { target: pagingArea } }));
    expect(pagingArea.classList.contains("vt-active")).toBe(true);

    document.dispatchEvent(new CustomEvent("htmx:sendAbort", { detail: { target: pagingArea } }));
    expect(pagingArea.classList.contains("vt-active")).toBe(false);

    document.dispatchEvent(new CustomEvent("htmx:beforeTransition", { detail: { target: pagingArea } }));
    expect(pagingArea.classList.contains("vt-active")).toBe(true);

    document.dispatchEvent(new CustomEvent("htmx:swapError", { detail: { target: pagingArea } }));
    expect(pagingArea.classList.contains("vt-active")).toBe(false);
  });

  it("removes paging mask when htmx errors or aborts", () => {
    const pagingArea = document.querySelector("#paging-area") as HTMLElement;
    pagingArea.innerHTML = "<podlove-player></podlove-player>";
    initPagingContentVisibility();

    document.dispatchEvent(new CustomEvent("htmx:beforeRequest", { detail: { target: pagingArea } }));
    expect(pagingArea.getAttribute("data-cast-paging-mask-active")).toBe("true");

    document.dispatchEvent(new CustomEvent("htmx:responseError", { detail: { target: pagingArea } }));
    expect(pagingArea.getAttribute("data-cast-paging-mask-active")).toBeNull();

    document.dispatchEvent(new CustomEvent("htmx:beforeRequest", { detail: { target: pagingArea } }));
    expect(pagingArea.getAttribute("data-cast-paging-mask-active")).toBe("true");

    document.dispatchEvent(new CustomEvent("htmx:sendAbort", { detail: { target: pagingArea } }));
    expect(pagingArea.getAttribute("data-cast-paging-mask-active")).toBeNull();

    document.dispatchEvent(new CustomEvent("htmx:beforeRequest", { detail: { target: pagingArea } }));
    expect(pagingArea.getAttribute("data-cast-paging-mask-active")).toBe("true");

    document.dispatchEvent(new CustomEvent("htmx:swapError", { detail: { target: pagingArea } }));
    expect(pagingArea.getAttribute("data-cast-paging-mask-active")).toBeNull();
  });

  it("ignores cleanup events from unrelated htmx requests", () => {
    const pagingArea = document.querySelector("#paging-area") as HTMLElement;
    const otherArea = document.querySelector("#other-area") as HTMLElement;
    initPagingContentVisibility();

    document.dispatchEvent(new CustomEvent("htmx:beforeTransition", { detail: { target: pagingArea } }));
    expect(pagingArea.classList.contains("vt-active")).toBe(true);

    document.dispatchEvent(new CustomEvent("htmx:responseError", { detail: { target: otherArea } }));
    expect(pagingArea.classList.contains("vt-active")).toBe(true);
  });

  it("scrolls to top on htmx:historyRestore after deferred htmx scroll", () => {
    vi.useFakeTimers();
    initPagingContentVisibility();

    Object.defineProperty(window, "scrollY", { configurable: true, value: 856 });
    document.dispatchEvent(new CustomEvent("htmx:historyRestore"));

    // scrollTo is deferred via setTimeout(0) to run after htmx's own
    // deferred scroll restoration
    expect(window.scrollTo).not.toHaveBeenCalled();
    vi.advanceTimersByTime(0);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    vi.useRealTimers();
  });

  it("overrides htmx deferred scroll restoration on history restore", () => {
    vi.useFakeTimers();
    initPagingContentVisibility();

    // Simulate htmx's En() queuing scroll restoration BEFORE historyRestore fires
    // (this mirrors the real htmx settle→En()→historyRestore sequence)
    window.setTimeout(() => window.scrollTo(0, 856), 0);

    // Then htmx:historyRestore fires, which queues our scroll-to-top AFTER
    document.dispatchEvent(new CustomEvent("htmx:historyRestore"));

    // Flush all timers: htmx scroll runs first, then ours wins
    vi.advanceTimersByTime(0);
    expect(window.scrollTo).toHaveBeenCalledTimes(2);
    expect(window.scrollTo).toHaveBeenLastCalledWith(0, 0);
    vi.useRealTimers();
  });

  it("does not scroll on htmx:historyRestore when paging area is absent", () => {
    vi.useFakeTimers();
    document.body.innerHTML = '<div id="other-content"></div>';
    initPagingContentVisibility();

    document.dispatchEvent(new CustomEvent("htmx:historyRestore"));

    vi.advanceTimersByTime(0);
    expect(window.scrollTo).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("registers each listener once", () => {
    const addEventListenerSpy = vi.spyOn(document, "addEventListener");

    initPagingContentVisibility();
    initPagingContentVisibility();

    const beforeTransitionCalls = addEventListenerSpy.mock.calls.filter(([name]) => name === "htmx:beforeTransition");
    const beforeRequestCalls = addEventListenerSpy.mock.calls.filter(([name]) => name === "htmx:beforeRequest");
    const afterSettleCalls = addEventListenerSpy.mock.calls.filter(([name]) => name === "htmx:afterSettle");
    const historyRestoreCalls = addEventListenerSpy.mock.calls.filter(([name]) => name === "htmx:historyRestore");
    const responseErrorCalls = addEventListenerSpy.mock.calls.filter(([name]) => name === "htmx:responseError");
    const sendAbortCalls = addEventListenerSpy.mock.calls.filter(([name]) => name === "htmx:sendAbort");
    const swapErrorCalls = addEventListenerSpy.mock.calls.filter(([name]) => name === "htmx:swapError");

    expect(beforeTransitionCalls).toHaveLength(1);
    expect(beforeRequestCalls).toHaveLength(1);
    expect(afterSettleCalls).toHaveLength(1);
    expect(historyRestoreCalls).toHaveLength(1);
    expect(responseErrorCalls).toHaveLength(1);
    expect(sendAbortCalls).toHaveLength(1);
    expect(swapErrorCalls).toHaveLength(1);
  });

  it("is a no-op when #paging-area is absent", () => {
    document.body.innerHTML = '<div id="other-content"></div>';
    initPagingContentVisibility();

    expect(() => {
      document.dispatchEvent(new CustomEvent("htmx:beforeRequest", { detail: { target: document.body } }));
      document.dispatchEvent(new CustomEvent("htmx:beforeTransition", { detail: { target: document.body } }));
      document.dispatchEvent(new CustomEvent("htmx:afterSettle", { detail: { target: document.body } }));
      document.dispatchEvent(new CustomEvent("htmx:responseError", { detail: { target: document.body } }));
    }).not.toThrow();
  });
});
