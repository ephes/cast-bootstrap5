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

  it("skips transition when already far down the page", () => {
    const pagingArea = document.querySelector("#paging-area") as HTMLElement;
    Object.defineProperty(window, "scrollY", { configurable: true, value: 500 });
    initPagingContentVisibility();

    const event = new CustomEvent("htmx:beforeTransition", {
      cancelable: true,
      detail: { target: pagingArea },
    });
    document.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(pagingArea.classList.contains("vt-active")).toBe(false);
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

  it("ignores cleanup events from unrelated htmx requests", () => {
    const pagingArea = document.querySelector("#paging-area") as HTMLElement;
    const otherArea = document.querySelector("#other-area") as HTMLElement;
    initPagingContentVisibility();

    document.dispatchEvent(new CustomEvent("htmx:beforeTransition", { detail: { target: pagingArea } }));
    expect(pagingArea.classList.contains("vt-active")).toBe(true);

    document.dispatchEvent(new CustomEvent("htmx:responseError", { detail: { target: otherArea } }));
    expect(pagingArea.classList.contains("vt-active")).toBe(true);
  });

  it("registers each listener once", () => {
    const addEventListenerSpy = vi.spyOn(document, "addEventListener");

    initPagingContentVisibility();
    initPagingContentVisibility();

    const beforeTransitionCalls = addEventListenerSpy.mock.calls.filter(([name]) => name === "htmx:beforeTransition");
    const afterSettleCalls = addEventListenerSpy.mock.calls.filter(([name]) => name === "htmx:afterSettle");
    const responseErrorCalls = addEventListenerSpy.mock.calls.filter(([name]) => name === "htmx:responseError");
    const sendAbortCalls = addEventListenerSpy.mock.calls.filter(([name]) => name === "htmx:sendAbort");
    const swapErrorCalls = addEventListenerSpy.mock.calls.filter(([name]) => name === "htmx:swapError");

    expect(beforeTransitionCalls).toHaveLength(1);
    expect(afterSettleCalls).toHaveLength(1);
    expect(responseErrorCalls).toHaveLength(1);
    expect(sendAbortCalls).toHaveLength(1);
    expect(swapErrorCalls).toHaveLength(1);
  });

  it("is a no-op when #paging-area is absent", () => {
    document.body.innerHTML = '<div id="other-content"></div>';
    initPagingContentVisibility();

    expect(() => {
      document.dispatchEvent(new CustomEvent("htmx:beforeTransition", { detail: { target: document.body } }));
      document.dispatchEvent(new CustomEvent("htmx:afterSettle", { detail: { target: document.body } }));
      document.dispatchEvent(new CustomEvent("htmx:responseError", { detail: { target: document.body } }));
    }).not.toThrow();
  });
});
