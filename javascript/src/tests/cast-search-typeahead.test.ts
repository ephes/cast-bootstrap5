import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CastSearchTypeahead from "@/search/cast-search-typeahead";

type Suggestion = {
  id: number;
  title: string;
  url: string;
};

function response(query: string, suggestions: Suggestion[]): Promise<Response> {
  return Promise.resolve({
    ok: true,
    json: async () => ({ query, suggestions }),
  } as Response);
}

function setup(
  actions: {
    navigate?: (url: string) => void;
    openInNewTab?: (url: string) => void;
    onOpenChange?: (open: boolean) => void;
    messages?: Partial<{
      noSuggestions: string;
      unavailable: string;
      oneAvailable: string;
      manyAvailable: string;
    }>;
  } = {}
) {
  document.body.innerHTML = `
    <form action="/blog/">
      <input name="search">
      <input type="hidden" name="tag_facets" value="python">
      <ul id="suggestions" data-cast-search-suggestions hidden></ul>
      <div data-cast-suggestion-status></div>
      <div data-cast-suggestion-loading hidden></div>
      <button type="submit">Search</button>
    </form>
  `;
  const input = document.querySelector('input[name="search"]') as HTMLInputElement;
  const form = document.querySelector("form") as HTMLFormElement;
  const listbox = document.querySelector("[data-cast-search-suggestions]") as HTMLElement;
  const status = document.querySelector("[data-cast-suggestion-status]") as HTMLElement;
  const loading = document.querySelector("[data-cast-suggestion-loading]") as HTMLElement;
  const controller = new CastSearchTypeahead(
    "/cast/api/search-suggestions/1/",
    { input, form, listbox, status, loading },
    actions
  );
  controller.connect();
  input.focus();
  return { controller, input, form, listbox, status, loading };
}

const pythonSuggestions: Suggestion[] = [
  { id: 2, title: "Python newest", url: "/python-newest/" },
  { id: 1, title: "Python older", url: "/python-older/" },
];

describe("CastSearchTypeahead", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.unstubAllGlobals();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("adds combobox semantics and does not request short queries", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { input, listbox } = setup();

    expect(input.getAttribute("role")).toBe("combobox");
    expect(input.getAttribute("aria-autocomplete")).toBe("list");
    expect(input.getAttribute("aria-controls")).toBe(listbox.id);
    expect(input.getAttribute("aria-expanded")).toBe("false");

    input.value = "p";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(500);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(listbox.hidden).toBe(true);
  });

  it("debounces requests, includes facet state, and renders destinations without auto-selection", async () => {
    const fetchMock = vi.fn().mockImplementation(() => response("py", pythonSuggestions));
    vi.stubGlobal("fetch", fetchMock);
    const { input, listbox, status } = setup();

    input.value = "py";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(224);
    expect(fetchMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await Promise.resolve();
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(requestUrl.searchParams.get("search")).toBe("py");
    expect(requestUrl.searchParams.get("tag_facets")).toBe("python");
    expect(listbox.hidden).toBe(false);
    expect(input.getAttribute("aria-expanded")).toBe("true");
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
    expect(status.textContent).toBe("2 suggestions available.");

    const options = listbox.querySelectorAll<HTMLElement>("[role=option]");
    expect(options).toHaveLength(2);
    expect(options[0].textContent).toContain("Python newest");
    expect(options[0].querySelector("time")).toBeNull();
  });

  it("uses manual arrow selection and preserves native Enter without a selection", async () => {
    const navigate = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => response("py", pythonSuggestions)));
    const { input, listbox } = setup({ navigate });

    input.value = "py";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(225);
    await Promise.resolve();
    await Promise.resolve();

    const nativeEnter = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    input.dispatchEvent(nativeEnter);
    expect(nativeEnter.defaultPrevented).toBe(false);
    expect(navigate).not.toHaveBeenCalled();

    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
    const first = listbox.querySelector<HTMLElement>("[role=option]") as HTMLElement;
    expect(first.getAttribute("aria-selected")).toBe("true");
    expect(input.getAttribute("aria-activedescendant")).toBe(first.id);

    const selectedEnter = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    input.dispatchEvent(selectedEnter);
    expect(selectedEnter.defaultPrevented).toBe(true);
    expect(navigate).toHaveBeenCalledWith("/python-newest/");
  });

  it("uses caller-provided localized live-region messages", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => response("py", pythonSuggestions)));
    const { input, status } = setup({ messages: { manyAvailable: "{count} Treffer verfügbar." } });

    input.value = "py";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(225);
    await Promise.resolve();
    await Promise.resolve();

    expect(status.textContent).toBe("2 Treffer verfügbar.");
  });

  it("opens the selected destination in a new tab for modified Enter", async () => {
    const openInNewTab = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => response("py", pythonSuggestions)));
    const { input } = setup({ openInNewTab });
    input.value = "py";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(225);
    await Promise.resolve();
    await Promise.resolve();

    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", metaKey: true, bubbles: true }));

    expect(openInNewTab).toHaveBeenCalledWith("/python-newest/");
  });

  it("closes suggestions on the first Escape without clearing input", async () => {
    const onOpenChange = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => response("py", pythonSuggestions)));
    const { input, listbox } = setup({ onOpenChange });
    input.value = "py";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(225);
    await Promise.resolve();
    await Promise.resolve();

    const firstEscape = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    input.dispatchEvent(firstEscape);
    expect(firstEscape.defaultPrevented).toBe(true);
    expect(listbox.hidden).toBe(true);
    expect(input.value).toBe("py");
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);

    const secondEscape = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    input.dispatchEvent(secondEscape);
    expect(secondEscape.defaultPrevented).toBe(false);
  });

  it("aborts stale requests and applies only the current query", async () => {
    let firstSignal: AbortSignal | null = null;
    const fetchMock = vi
      .fn()
      .mockImplementationOnce((_: string, init?: RequestInit) => {
        firstSignal = init?.signal as AbortSignal;
        return new Promise<Response>((_resolve, reject) => {
          firstSignal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        });
      })
      .mockImplementationOnce(() => response("pyth", [pythonSuggestions[0]]));
    vi.stubGlobal("fetch", fetchMock);
    const { input, listbox } = setup();

    input.value = "py";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(225);

    input.value = "pyth";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(225);
    await Promise.resolve();
    await Promise.resolve();

    expect(firstSignal?.aborted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(listbox.querySelectorAll("[role=option]")).toHaveLength(1);
    expect(listbox.textContent).toContain("Python newest");
  });

  it("keys cached results by facets and clears old destinations when facets change", async () => {
    const fetchMock = vi.fn().mockImplementation(() => response("py", pythonSuggestions));
    vi.stubGlobal("fetch", fetchMock);
    const { controller, input, form, listbox } = setup();

    input.value = "py";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(225);
    await Promise.resolve();
    await Promise.resolve();

    input.value = "pyt";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.value = "py";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    (form.querySelector('input[name="tag_facets"]') as HTMLInputElement).value = "django";
    controller.facetStateChanged();

    expect(listbox.hidden).toBe(true);
    expect(listbox.querySelectorAll("[role=option]")).toHaveLength(0);
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);

    await vi.advanceTimersByTimeAsync(225);
    await Promise.resolve();
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const refreshed = new URL(fetchMock.mock.calls[1][0] as string);
    expect(refreshed.searchParams.get("tag_facets")).toBe("django");
  });

  it("ignores an old non-abort failure during the next query debounce", async () => {
    let rejectFirst: ((reason: Error) => void) | undefined;
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<Response>((_resolve, reject) => {
            rejectFirst = reject;
          })
      )
      .mockImplementationOnce(() => response("pyth", [pythonSuggestions[0]]));
    vi.stubGlobal("fetch", fetchMock);
    const { input, listbox, status } = setup();

    input.value = "py";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(225);

    input.value = "pyth";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    rejectFirst?.(new Error("Old request failed"));
    await Promise.resolve();
    await Promise.resolve();

    expect(status.textContent).toBe("");
    expect(listbox.hidden).toBe(true);

    await vi.advanceTimersByTimeAsync(225);
    await Promise.resolve();
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(listbox.hidden).toBe(false);
    expect(listbox.textContent).toContain("Python newest");
    expect(status.textContent).toBe("1 suggestion available.");
  });

  it("keeps normal search usable across empty and failed suggestion responses", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => response("zz", []))
      .mockResolvedValueOnce({ ok: false, status: 500 } as Response)
      .mockResolvedValueOnce({ ok: false, status: 500 } as Response);
    vi.stubGlobal("fetch", fetchMock);
    const { controller, input, listbox, status, form } = setup();
    const submit = form.querySelector('button[type="submit"]') as HTMLButtonElement;

    input.value = "zz";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(225);
    await Promise.resolve();
    await Promise.resolve();
    expect(listbox.hidden).toBe(true);
    expect(status.textContent).toBe("No suggestions.");
    expect(submit.disabled).toBe(false);

    for (const query of ["error", "failed"]) {
      input.value = query;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await vi.advanceTimersByTimeAsync(225);
      await Promise.resolve();
      await Promise.resolve();
    }
    expect(status.textContent).toBe("Suggestions unavailable. You can still search.");
    expect(submit.disabled).toBe(false);

    input.value = "disabled";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(500);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    controller.resume();
    input.value = "retry";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(225);
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("clears an active destination immediately when the query changes", async () => {
    const navigate = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => response("py", pythonSuggestions)));
    const { input, listbox } = setup({ navigate });

    input.value = "py";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(225);
    await Promise.resolve();
    await Promise.resolve();
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));

    input.value = "pyt";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    expect(listbox.hidden).toBe(true);
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
    expect(listbox.querySelector('[aria-selected="true"]')).toBeNull();
    const enter = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    input.dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("does not expose stale destinations after a failed request", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => response("py", pythonSuggestions))
      .mockResolvedValueOnce({ ok: false, status: 500 } as Response);
    vi.stubGlobal("fetch", fetchMock);
    const { input, listbox } = setup();

    input.value = "py";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(225);
    await Promise.resolve();
    await Promise.resolve();

    input.value = "pyz";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(225);
    await Promise.resolve();
    await Promise.resolve();
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));

    expect(listbox.hidden).toBe(true);
    expect(listbox.querySelectorAll("[role=option]")).toHaveLength(0);
  });

  it("keeps a response closed after focus leaves the input", async () => {
    let resolveRequest: ((value: Response) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        () =>
          new Promise<Response>((resolve) => {
            resolveRequest = resolve;
          })
      )
    );
    const { input, listbox, status } = setup();

    input.value = "py";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(225);
    input.blur();
    resolveRequest?.((await response("py", pythonSuggestions)) as Response);
    await Promise.resolve();
    await Promise.resolve();

    expect(listbox.hidden).toBe(true);
    expect(input.getAttribute("aria-expanded")).toBe("false");
    expect(status.textContent).toBe("");
  });

  it.each([
    ["an empty response", response("py", [])],
    ["a failed response", Promise.resolve({ ok: false, status: 500 } as Response)],
  ])("does not announce %s after focus leaves the input", async (_label, pendingResponse) => {
    let resolveRequest: ((value: Response) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        () =>
          new Promise<Response>((resolve) => {
            resolveRequest = resolve;
          })
      )
    );
    const { input, status } = setup();

    input.value = "py";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(225);
    input.blur();
    resolveRequest?.(await pendingResponse);
    await Promise.resolve();
    await Promise.resolve();

    expect(status.textContent).toBe("");
  });

  it("disconnects listeners and cancels scheduled work", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { controller, input } = setup();
    input.value = "py";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    controller.disconnect();

    await vi.advanceTimersByTimeAsync(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
