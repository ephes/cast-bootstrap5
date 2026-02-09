import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CastSearchModal, { buildOrderingPills } from "@/search/cast-search-modal";

function markVisible(element: HTMLElement): void {
  Object.defineProperty(element, "offsetParent", {
    configurable: true,
    get() {
      return document.body;
    },
  });
}

type MarkupOptions = {
  dynamic?: boolean;
  valuedGroups?: boolean;
};

function buildModalMarkup(options: MarkupOptions = {}): string {
  const { dynamic = false, valuedGroups = true } = options;
  const dynamicAttribute = dynamic ? ' data-cast-dynamic-facets-url="/api/facet_counts/1/"' : "";
  const tagGroupAttr = valuedGroups ? 'data-cast-facet-group="tag_facets"' : "data-cast-facet-group";
  const dateGroupAttr = valuedGroups ? 'data-cast-facet-group="date_facets"' : "data-cast-facet-group";
  const categoryGroupAttr = valuedGroups
    ? 'data-cast-facet-group="category_facets"'
    : "data-cast-facet-group";

  return `
    <button type="button" data-cast-search-trigger>Open</button>
    <cast-search-modal data-trigger="[data-cast-search-trigger]"${dynamicAttribute}>
      <div class="cast-search-overlay" data-cast-search-overlay hidden>
        <div class="cast-search-modal">
          <form action="/blog/" method="get" class="cast-search-modal-form" data-cast-search-form>
            <input type="text" name="search" value="">
            <button type="button" data-cast-search-close>Close</button>

            <div class="cast-search-modal-body">
              <div data-cast-facet-loading hidden>Loading</div>
              <div data-cast-facet-status aria-live="polite"></div>

              <details class="cast-modal-filter-panel" data-cast-filter-panel="date_facets">
                <summary>Date</summary>
                <div>
                  <div ${dateGroupAttr} data-limit="5">
                    <div class="cast-date-facet-container">
                      <div class="cast-date-facet-item"><a href="/blog/?date_facets=2026-01">2026-01 (1)</a></div>
                      <div class="cast-date-facet-item"><a href="/blog/">All (3)</a></div>
                    </div>
                  </div>
                </div>
              </details>

              <details class="cast-modal-filter-panel" data-cast-filter-panel="tag_facets">
                <summary>Tags</summary>
                <div>
                  <div ${tagGroupAttr} data-limit="2">
                    <div class="cast-date-facet-container">
                      <div class="cast-date-facet-item"><a href="/blog/?tag_facets=python" class="selected">Python (2)</a></div>
                      <div class="cast-date-facet-item"><a href="/blog/?tag_facets=legacy">Legacy (1)</a></div>
                      <div class="cast-date-facet-item"><a href="/blog/">All (3)</a></div>
                    </div>
                  </div>
                  <button type="button" data-cast-facet-toggle hidden>
                    <span data-show-text>Show all</span>
                    <span data-hide-text hidden>Show fewer</span>
                  </button>
                </div>
              </details>

              <details class="cast-modal-filter-panel" data-cast-filter-panel="category_facets">
                <summary>Categories</summary>
                <div>
                  <div ${categoryGroupAttr} data-limit="5">
                    <div class="cast-date-facet-container">
                      <div class="cast-date-facet-item"><a href="/blog/?category_facets=til">Today I Learned (2)</a></div>
                      <div class="cast-date-facet-item"><a href="/blog/">All (3)</a></div>
                    </div>
                  </div>
                </div>
              </details>
            </div>

            <div class="cast-modal-ordering-panel" data-cast-filter-panel="o">
              <div id="div_id_o">
                <select name="o">
                  <option value="">Default</option>
                  <option value="-visible_date">Date desc</option>
                  <option value="visible_date">Date asc</option>
                </select>
              </div>
            </div>

            <a href="/blog/" class="cast-btn-clear">Clear</a>
            <div data-cast-no-results hidden>No results</div>
            <button type="submit">Search</button>
          </form>
        </div>
      </div>
    </cast-search-modal>
  `;
}

function getModalElement(): CastSearchModal {
  return document.querySelector("cast-search-modal") as CastSearchModal;
}

function jsonResponse(payload: unknown): Promise<Response> {
  return Promise.resolve({
    ok: true,
    json: async () => payload,
  } as Response);
}

function modalResponse(overrides: Partial<Record<"result_count", number>> = {}): object {
  return {
    mode: "modal",
    result_count: overrides.result_count ?? 2,
    groups: {
      date_facets: {
        selected: "",
        all_count: 2,
        options: [
          { slug: "2026-02", name: "2026-02", count: 1 },
          { slug: "2026-01", name: "2026-01", count: 1 },
        ],
      },
      tag_facets: {
        selected: "django",
        all_count: 5,
        options: [
          { slug: "python", name: "python", count: 2 },
          { slug: "django", name: "django", count: 1 },
          { slug: "newtag", name: "newtag", count: 0 },
          { slug: "python", name: "python", count: 2 },
        ],
      },
      category_facets: {
        selected: "til",
        all_count: 2,
        options: [
          { slug: "til", name: "Today I Learned", count: 2 },
          { slug: "weeknotes", name: "WeekNotes", count: 0 },
        ],
      },
    },
  };
}

describe("cast-search-modal", () => {
  beforeEach(() => {
    document.body.innerHTML = buildModalMarkup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("registers the custom element", () => {
    expect(customElements.get("cast-search-modal")).toBe(CastSearchModal);
  });

  it("opens and closes the modal with trigger and close button", () => {
    const trigger = document.querySelector("[data-cast-search-trigger]") as HTMLButtonElement;
    const overlay = document.querySelector("[data-cast-search-overlay]") as HTMLElement;
    const closeButton = document.querySelector("[data-cast-search-close]") as HTMLButtonElement;

    trigger.click();
    expect(overlay.hidden).toBe(false);
    expect(document.body.style.overflow).toBe("hidden");

    closeButton.click();
    expect(overlay.hidden).toBe(true);
    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement).toBe(trigger);
  });

  it("closes on Escape and returns focus to trigger", () => {
    const trigger = document.querySelector("[data-cast-search-trigger]") as HTMLButtonElement;
    const overlay = document.querySelector("[data-cast-search-overlay]") as HTMLElement;

    trigger.click();
    expect(overlay.hidden).toBe(false);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(overlay.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it("supports Cmd/Ctrl+K shortcut and ignores typing targets", () => {
    const overlay = document.querySelector("[data-cast-search-overlay]") as HTMLElement;
    const trigger = document.querySelector("[data-cast-search-trigger]") as HTMLButtonElement;
    const searchInput = document.querySelector('input[name="search"]') as HTMLInputElement;

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
    expect(overlay.hidden).toBe(false);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
    expect(overlay.hidden).toBe(false);

    trigger.focus();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
    expect(overlay.hidden).toBe(true);

    searchInput.focus();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
    expect(overlay.hidden).toBe(true);
  });

  it("traps focus inside the modal", () => {
    const trigger = document.querySelector("[data-cast-search-trigger]") as HTMLButtonElement;
    const overlay = document.querySelector("[data-cast-search-overlay]") as HTMLElement;
    const searchInput = document.querySelector('input[name="search"]') as HTMLInputElement;
    const closeButton = document.querySelector("[data-cast-search-close]") as HTMLButtonElement;

    markVisible(searchInput);
    markVisible(closeButton);
    markVisible(trigger);

    trigger.click();
    expect(overlay.hidden).toBe(false);

    closeButton.focus();
    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");
    const modal = document.querySelector(".cast-search-modal") as HTMLElement;
    modal.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(document.activeElement).toBe(searchInput);
  });

  it("intercepts facet clicks and syncs hidden inputs, including 'All' clear", () => {
    const form = document.querySelector("form") as HTMLFormElement;
    const allLink = document.querySelector(
      '[data-cast-facet-group="tag_facets"] a[href="/blog/"]'
    ) as HTMLAnchorElement;
    expect(allLink.classList.contains("cast-facet-all-option")).toBe(true);

    const initialHidden = form.querySelector('input[type="hidden"][name="tag_facets"]') as HTMLInputElement;
    expect(initialHidden.value).toBe("python");

    const legacyLink = document.querySelector('a[href="/blog/?tag_facets=legacy"]') as HTMLAnchorElement;
    const selectEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
    legacyLink.dispatchEvent(selectEvent);

    expect(selectEvent.defaultPrevented).toBe(true);
    const switchedHidden = form.querySelector('input[type="hidden"][name="tag_facets"]') as HTMLInputElement;
    expect(switchedHidden.value).toBe("legacy");

    const clearLink = document.querySelector('[data-cast-facet-group="tag_facets"] a[href="/blog/"]') as HTMLAnchorElement;
    const clearEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
    clearLink.dispatchEvent(clearEvent);

    expect(clearEvent.defaultPrevented).toBe(true);
    expect(form.querySelector('input[type="hidden"][name="tag_facets"]')).toBeNull();
  });

  it("keeps modal open and resets filters when clicking Clear all", () => {
    const trigger = document.querySelector("[data-cast-search-trigger]") as HTMLButtonElement;
    const overlay = document.querySelector("[data-cast-search-overlay]") as HTMLElement;
    const searchInput = document.querySelector('input[name="search"]') as HTMLInputElement;
    const form = document.querySelector("form") as HTMLFormElement;
    const orderingSelect = form.querySelector('select[name="o"]') as HTMLSelectElement;

    trigger.click();
    expect(overlay.hidden).toBe(false);

    searchInput.value = "django";
    const ascPill = document.querySelector('[data-order-value="visible_date"]') as HTMLButtonElement;
    ascPill.click();
    expect(orderingSelect.value).toBe("visible_date");

    const clearLink = document.querySelector(".cast-btn-clear") as HTMLAnchorElement;
    const clearEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
    const dispatchResult = clearLink.dispatchEvent(clearEvent);

    expect(dispatchResult).toBe(false);
    expect(clearEvent.defaultPrevented).toBe(true);
    expect(overlay.hidden).toBe(false);
    expect(searchInput.value).toBe("");
    expect(orderingSelect.value).toBe("-visible_date");
    expect(form.querySelector('input[type="hidden"][name="date_facets"]')).toBeNull();
    expect(form.querySelector('input[type="hidden"][name="tag_facets"]')).toBeNull();
    expect(form.querySelector('input[type="hidden"][name="category_facets"]')).toBeNull();

    const tagAllLink = document.querySelector(
      '[data-cast-facet-group="tag_facets"] a.cast-facet-all-option'
    ) as HTMLAnchorElement;
    expect(tagAllLink.classList.contains("selected")).toBe(true);
  });

  it("builds ordering pills and syncs selected value", () => {
    const container = document.getElementById("div_id_o") as HTMLElement;
    const select = container.querySelector('select[name="o"]') as HTMLSelectElement;

    buildOrderingPills(container);

    const pills = container.querySelectorAll(".cast-ordering-pills .tag-pill");
    expect(pills).toHaveLength(2);
    expect(select.style.display).toBe("none");
    expect(select.value).toBe("-visible_date");

    const ascPill = container.querySelector('[data-order-value="visible_date"]') as HTMLButtonElement;
    ascPill.click();

    expect(select.value).toBe("visible_date");
    expect(ascPill.getAttribute("aria-pressed")).toBe("true");
  });

  it("debounces dynamic facet requests and sends only one fetch for rapid clicks", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = buildModalMarkup({ dynamic: true });

    const fetchMock = vi.fn().mockImplementation(() => jsonResponse(modalResponse()));
    vi.stubGlobal("fetch", fetchMock);

    const linkA = document.querySelector('a[href="/blog/?tag_facets=legacy"]') as HTMLAnchorElement;
    const linkB = document.querySelector('a[href="/blog/?date_facets=2026-01"]') as HTMLAnchorElement;

    linkA.click();
    linkB.click();

    await vi.advanceTimersByTimeAsync(149);
    expect(fetchMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("recalculates dynamic facets after Clear all without leaving the modal", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = buildModalMarkup({ dynamic: true });

    const fetchMock = vi.fn().mockImplementation(() => jsonResponse(modalResponse()));
    vi.stubGlobal("fetch", fetchMock);

    const trigger = document.querySelector("[data-cast-search-trigger]") as HTMLButtonElement;
    const overlay = document.querySelector("[data-cast-search-overlay]") as HTMLElement;
    const searchInput = document.querySelector('input[name="search"]') as HTMLInputElement;
    const clearLink = document.querySelector(".cast-btn-clear") as HTMLAnchorElement;

    trigger.click();
    searchInput.value = "django";

    const clearEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
    clearLink.dispatchEvent(clearEvent);

    await vi.advanceTimersByTimeAsync(160);
    await Promise.resolve();

    expect(clearEvent.defaultPrevented).toBe(true);
    expect(overlay.hidden).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const request = new URL(fetchMock.mock.calls[0][0] as string, "http://testserver");
    expect(request.searchParams.get("mode")).toBe("modal");
    expect(request.searchParams.get("search")).toBeNull();
    expect(request.searchParams.get("date_facets")).toBeNull();
    expect(request.searchParams.get("tag_facets")).toBeNull();
    expect(request.searchParams.get("category_facets")).toBeNull();
  });

  it("recalculates dynamic facets when search input changes and when it is cleared", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = buildModalMarkup({ dynamic: true });

    const fetchMock = vi.fn().mockImplementation(() => jsonResponse(modalResponse()));
    vi.stubGlobal("fetch", fetchMock);

    const searchInput = document.querySelector('input[name="search"]') as HTMLInputElement;

    searchInput.value = "django";
    searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(160);
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const withSearch = new URL(fetchMock.mock.calls[0][0] as string, "http://testserver");
    expect(withSearch.searchParams.get("mode")).toBe("modal");
    expect(withSearch.searchParams.get("search")).toBe("django");

    searchInput.value = "";
    searchInput.dispatchEvent(new Event("search", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(160);
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const clearedSearch = new URL(fetchMock.mock.calls[1][0] as string, "http://testserver");
    expect(clearedSearch.searchParams.get("mode")).toBe("modal");
    expect(clearedSearch.searchParams.get("search")).toBeNull();
  });

  it("uses cached facet response for repeated request keys", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = buildModalMarkup({ dynamic: true });

    const cachedPayload = {
      mode: "modal" as const,
      result_count: 2,
      groups: {
        date_facets: {
          selected: "",
          all_count: 2,
          options: [{ slug: "2026-01", name: "2026-01", count: 1 }],
        },
        tag_facets: {
          selected: "legacy",
          all_count: 2,
          options: [
            { slug: "legacy", name: "legacy", count: 1 },
            { slug: "python", name: "python", count: 1 },
          ],
        },
        category_facets: {
          selected: "",
          all_count: 2,
          options: [{ slug: "til", name: "Today I Learned", count: 1 }],
        },
      },
    };
    const fetchMock = vi.fn().mockImplementation(() => jsonResponse(cachedPayload));
    vi.stubGlobal("fetch", fetchMock);

    const legacyLink = document.querySelector('a[href="/blog/?tag_facets=legacy"]') as HTMLAnchorElement;
    legacyLink.click();
    await vi.advanceTimersByTimeAsync(160);
    await Promise.resolve();

    const status = document.querySelector("[data-cast-facet-status]") as HTMLElement;
    expect(status.textContent).toBe("Filters updated.");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const legacyLinkAgain = document.querySelector(
      '[data-cast-facet-group="tag_facets"] a[href*="tag_facets=legacy"]'
    ) as HTMLAnchorElement;
    legacyLinkAgain.click();
    await vi.advanceTimersByTimeAsync(160);
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(status.textContent).toBe("Filters updated.");
  });

  it("re-renders groups from response, updates All(N), removes stale options, hides zero-count options, and de-dupes by slug", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = buildModalMarkup({ dynamic: true });

    const fetchMock = vi.fn().mockImplementation(() => jsonResponse(modalResponse()));
    vi.stubGlobal("fetch", fetchMock);

    const searchInput = document.querySelector('input[name="search"]') as HTMLInputElement;
    searchInput.value = "typed";

    const legacyLink = document.querySelector('a[href="/blog/?tag_facets=legacy"]') as HTMLAnchorElement;
    legacyLink.click();

    await vi.advanceTimersByTimeAsync(160);
    await Promise.resolve();

    const group = document.querySelector('[data-cast-facet-group="tag_facets"]') as HTMLElement;
    expect(group.querySelector(".cast-date-facet-container")).not.toBeNull();
    const allLink = group.querySelector(".cast-date-facet-item a") as HTMLAnchorElement;
    expect(allLink.textContent).toBe("All (5)");
    expect(allLink.classList.contains("cast-facet-all-option")).toBe(true);

    const newOption = group.querySelector('a[href*="tag_facets=newtag"]') as HTMLAnchorElement;
    expect(newOption).toBeNull();

    const pythonOptions = group.querySelectorAll('a[href*="tag_facets=python"]');
    expect(pythonOptions).toHaveLength(1);

    const removedLegacy = group.querySelector('a[href*="tag_facets=legacy"]');
    expect(removedLegacy).toBeNull();

    const dateGroup = document.querySelector('[data-cast-facet-group="date_facets"]') as HTMLElement;
    const dateSlugs = Array.from(dateGroup.querySelectorAll('a[href*="date_facets="]')).map((link) => {
      const href = link.getAttribute("href") ?? "";
      return new URL(href, "http://testserver").searchParams.get("date_facets");
    });
    expect(dateSlugs).toEqual(["2026-01", "2026-02"]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const form = document.querySelector("form") as HTMLFormElement;
    const selectedHidden = form.querySelector('input[type="hidden"][name="tag_facets"]') as HTMLInputElement;
    expect(selectedHidden.value).toBe("django");
  });

  it("keeps selected zero-count option visible while hiding non-selected zero-count options", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = buildModalMarkup({ dynamic: true });

    const payload = {
      mode: "modal" as const,
      result_count: 1,
      groups: {
        date_facets: {
          selected: "",
          all_count: 1,
          options: [{ slug: "2026-01", name: "2026-01", count: 1 }],
        },
        tag_facets: {
          selected: "python",
          all_count: 1,
          options: [
            { slug: "python", name: "python", count: 0 },
            { slug: "django", name: "django", count: 0 },
          ],
        },
        category_facets: {
          selected: "",
          all_count: 1,
          options: [{ slug: "til", name: "Today I Learned", count: 1 }],
        },
      },
    };
    const fetchMock = vi.fn().mockImplementation(() => jsonResponse(payload));
    vi.stubGlobal("fetch", fetchMock);

    const legacyLink = document.querySelector('a[href="/blog/?tag_facets=legacy"]') as HTMLAnchorElement;
    legacyLink.click();

    await vi.advanceTimersByTimeAsync(160);
    await Promise.resolve();

    const group = document.querySelector('[data-cast-facet-group="tag_facets"]') as HTMLElement;
    const selectedZero = group.querySelector('a[href*="tag_facets=python"]') as HTMLAnchorElement;
    const hiddenZero = group.querySelector('a[href*="tag_facets=django"]') as HTMLAnchorElement | null;

    expect(selectedZero).not.toBeNull();
    expect(selectedZero.textContent).toBe("python (0)");
    expect(selectedZero.classList.contains("selected")).toBe(true);
    expect(hiddenZero).toBeNull();
  });

  it("shows no-results state and disables submit when result_count is zero", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = buildModalMarkup({ dynamic: true });

    const fetchMock = vi.fn().mockImplementation(() => jsonResponse(modalResponse({ result_count: 0 })));
    vi.stubGlobal("fetch", fetchMock);

    const tagLink = document.querySelector('a[href="/blog/?tag_facets=legacy"]') as HTMLAnchorElement;
    tagLink.click();

    await vi.advanceTimersByTimeAsync(160);
    await Promise.resolve();
    await Promise.resolve();

    const noResults = document.querySelector("[data-cast-no-results]") as HTMLElement;
    const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(noResults.hidden).toBe(false);
    expect(submitButton.disabled).toBe(true);
  });

  it("handles non-ok responses by preserving usability and announcing fallback status", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = buildModalMarkup({ dynamic: true });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    const noResults = document.querySelector("[data-cast-no-results]") as HTMLElement;
    const status = document.querySelector("[data-cast-facet-status]") as HTMLElement;
    const loading = document.querySelector("[data-cast-facet-loading]") as HTMLElement;

    submitButton.disabled = true;
    noResults.hidden = false;

    const tagLink = document.querySelector('a[href="/blog/?tag_facets=legacy"]') as HTMLAnchorElement;
    tagLink.click();

    await vi.advanceTimersByTimeAsync(160);
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(submitButton.disabled).toBe(false);
    expect(noResults.hidden).toBe(true);
    expect(loading.hidden).toBe(true);
    expect(status.textContent).toBe("Could not refresh filters. You can still search.");
  });

  it("handles invalid payload responses by announcing fallback status", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = buildModalMarkup({ dynamic: true });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const status = document.querySelector("[data-cast-facet-status]") as HTMLElement;
    const tagLink = document.querySelector('a[href="/blog/?tag_facets=legacy"]') as HTMLAnchorElement;
    tagLink.click();

    await vi.advanceTimersByTimeAsync(160);
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(status.textContent).toBe("Could not refresh filters. You can still search.");
  });

  it("aborts stale in-flight requests and applies only the newest response", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = buildModalMarkup({ dynamic: true });

    let firstSignal: AbortSignal | null = null;
    let resolveSecond: ((value: Response) => void) | null = null;

    const fetchMock = vi
      .fn()
      .mockImplementationOnce((_: string, init?: RequestInit) => {
        firstSignal = init?.signal as AbortSignal;
        return new Promise<Response>((_resolve, reject) => {
          (init?.signal as AbortSignal).addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        });
      })
      .mockImplementationOnce(() => {
        return new Promise<Response>((resolve) => {
          resolveSecond = resolve;
        });
      });

    vi.stubGlobal("fetch", fetchMock);

    const legacyLink = document.querySelector('a[href="/blog/?tag_facets=legacy"]') as HTMLAnchorElement;
    const dateLink = document.querySelector(
      '[data-cast-facet-group="date_facets"] a[href*="date_facets=2026-01"]'
    ) as HTMLAnchorElement;

    legacyLink.click();
    await vi.advanceTimersByTimeAsync(160);

    dateLink.click();
    await vi.advanceTimersByTimeAsync(160);

    expect(firstSignal?.aborted).toBe(true);

    resolveSecond?.({
      ok: true,
      json: async () => modalResponse(),
    } as Response);
    await Promise.resolve();
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const form = document.querySelector("form") as HTMLFormElement;
    const selectedHidden = form.querySelector('input[type="hidden"][name="tag_facets"]') as HTMLInputElement;
    expect(selectedHidden.value).toBe("django");
  });

  it("aborts an in-flight request before applying cached responses", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = buildModalMarkup({ dynamic: true });

    const cachedPayload = {
      mode: "modal" as const,
      result_count: 2,
      groups: {
        date_facets: {
          selected: "",
          all_count: 2,
          options: [{ slug: "2026-01", name: "2026-01", count: 1 }],
        },
        tag_facets: {
          selected: "legacy",
          all_count: 2,
          options: [
            { slug: "legacy", name: "legacy", count: 1 },
            { slug: "python", name: "python", count: 1 },
          ],
        },
        category_facets: {
          selected: "",
          all_count: 2,
          options: [{ slug: "til", name: "Today I Learned", count: 1 }],
        },
      },
    };

    let inFlightSignal: AbortSignal | null = null;
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => jsonResponse(cachedPayload))
      .mockImplementationOnce((_: string, init?: RequestInit) => {
        inFlightSignal = init?.signal as AbortSignal;
        return new Promise<Response>((_resolve, reject) => {
          (init?.signal as AbortSignal).addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        });
      });
    vi.stubGlobal("fetch", fetchMock);

    const tagLegacyLink = document.querySelector('a[href="/blog/?tag_facets=legacy"]') as HTMLAnchorElement;
    tagLegacyLink.click();
    await vi.advanceTimersByTimeAsync(160);
    await Promise.resolve();

    const dateLink = document.querySelector(
      '[data-cast-facet-group="date_facets"] a[href*="date_facets=2026-01"]'
    ) as HTMLAnchorElement;
    dateLink.click();
    await vi.advanceTimersByTimeAsync(160);

    const dateAllLink = document.querySelector(
      '[data-cast-facet-group="date_facets"] a.cast-facet-all-option'
    ) as HTMLAnchorElement;
    dateAllLink.click();
    await vi.advanceTimersByTimeAsync(160);
    await Promise.resolve();

    expect(inFlightSignal?.aborted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const form = document.querySelector("form") as HTMLFormElement;
    const tagHidden = form.querySelector('input[type="hidden"][name="tag_facets"]') as HTMLInputElement;
    const dateHidden = form.querySelector('input[type="hidden"][name="date_facets"]');
    expect(tagHidden.value).toBe("legacy");
    expect(dateHidden).toBeNull();
  });

  it("clears debounce timer and aborts request on disconnect", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = buildModalMarkup({ dynamic: true });

    let activeSignal: AbortSignal | null = null;
    const fetchMock = vi.fn().mockImplementation((_: string, init?: RequestInit) => {
      activeSignal = init?.signal as AbortSignal;
      return new Promise<Response>(() => {
        // keep pending to assert abort on disconnect
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const modal = getModalElement();
    const legacyLink = document.querySelector('a[href="/blog/?tag_facets=legacy"]') as HTMLAnchorElement;

    legacyLink.click();
    modal.remove();

    await vi.advanceTimersByTimeAsync(200);
    expect(fetchMock).not.toHaveBeenCalled();

    document.body.innerHTML = buildModalMarkup({ dynamic: true });
    const activeModal = getModalElement();
    const activeLink = document.querySelector('a[href="/blog/?tag_facets=legacy"]') as HTMLAnchorElement;

    activeLink.click();
    await vi.advanceTimersByTimeAsync(160);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    activeModal.remove();
    expect(activeSignal?.aborted).toBe(true);

    const trigger = document.querySelector("[data-cast-search-trigger]") as HTMLButtonElement;
    trigger.click();
    expect(document.querySelector("[data-cast-search-overlay]")).toBeNull();
  });

  it("falls back to panel group name when data-cast-facet-group has no value", () => {
    document.body.innerHTML = buildModalMarkup({ valuedGroups: false });

    const form = document.querySelector("form") as HTMLFormElement;
    const legacyLink = document.querySelector('a[href="/blog/?tag_facets=legacy"]') as HTMLAnchorElement;
    legacyLink.click();

    const switchedHidden = form.querySelector('input[type="hidden"][name="tag_facets"]') as HTMLInputElement;
    expect(switchedHidden.value).toBe("legacy");
  });

  it("is a graceful no-op when required markup is absent", () => {
    document.body.innerHTML = "<cast-search-modal></cast-search-modal>";
    expect(() => {
      const element = document.querySelector("cast-search-modal") as CastSearchModal;
      document.body.appendChild(element);
    }).not.toThrow();
  });
});
