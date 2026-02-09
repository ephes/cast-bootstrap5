import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MatchMediaListener = (event: MediaQueryListEvent) => void;

class MatchMediaMock {
  matches: boolean;
  media: string;
  onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null;
  private listeners: Set<MatchMediaListener>;

  constructor(matches: boolean) {
    this.matches = matches;
    this.media = "(prefers-color-scheme: dark)";
    this.onchange = null;
    this.listeners = new Set<MatchMediaListener>();
  }

  addEventListener(_type: "change", listener: MatchMediaListener): void {
    this.listeners.add(listener);
  }

  removeEventListener(_type: "change", listener: MatchMediaListener): void {
    this.listeners.delete(listener);
  }

  dispatch(matches: boolean): void {
    this.matches = matches;
    const event = { matches, media: this.media } as MediaQueryListEvent;
    this.listeners.forEach((listener) => listener(event));
  }
}

type StorageMock = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

function createStorageMock(): StorageMock {
  const values = new Map<string, string>();

  return {
    getItem(key: string) {
      return values.has(key) ? values.get(key) ?? null : null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
    removeItem(key: string) {
      values.delete(key);
    },
    clear() {
      values.clear();
    },
  };
}

function createSwitcherMarkup(id: string): string {
  return `
    <div id="${id}" data-cast-theme-switcher>
      <form>
        <input type="hidden" name="template_base_dir" value="bootstrap5">
        <button type="button" data-cast-theme-value="mode:auto" data-cast-theme-mode="auto"><span>System</span><span class="cast-theme-check"></span></button>
        <button type="button" data-cast-theme-value="mode:light" data-cast-theme-mode="light"><span>Light</span><span class="cast-theme-check"></span></button>
        <button type="button" data-cast-theme-value="mode:dark" data-cast-theme-mode="dark"><span>Dark</span><span class="cast-theme-check"></span></button>
        <button type="button" data-cast-theme-value="theme:alt">Alt Theme</button>
      </form>
      <span data-cast-theme-label>System</span>
      <span data-cast-theme-icon="auto"></span>
      <span data-cast-theme-icon="light"></span>
      <span data-cast-theme-icon="dark"></span>
    </div>
  `;
}

async function loadModule() {
  vi.resetModules();
  return import("@/theme/theme-switcher");
}

describe("theme-switcher", () => {
  let matchMediaMock: MatchMediaMock;
  let storageMock: StorageMock;

  beforeEach(() => {
    document.body.innerHTML = "";
    document.documentElement.removeAttribute("data-bs-theme");
    storageMock = createStorageMock();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: storageMock,
    });
    storageMock.clear();

    matchMediaMock = new MatchMediaMock(false);
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => matchMediaMock as unknown as MediaQueryList),
    });
  });

  afterEach(async () => {
    const module = await import("@/theme/theme-switcher");
    module.destroyThemeSwitcher();
    vi.restoreAllMocks();
  });

  it("syncs document and switcher state from stored theme", async () => {
    window.localStorage.setItem("cast-theme", "dark");
    document.body.innerHTML = createSwitcherMarkup("a");

    const module = await loadModule();
    module.initThemeSwitcher();

    expect(document.documentElement.getAttribute("data-bs-theme")).toBe("dark");

    const switcher = document.getElementById("a") as HTMLElement;
    expect(switcher.querySelector("[data-cast-theme-label]")?.textContent).toBe("Dark");
    expect(
      (switcher.querySelector('[data-cast-theme-icon="dark"]') as HTMLElement).style.display
    ).toBe("inline-flex");
    expect(
      switcher.querySelector('[data-cast-theme-mode="dark"]')?.getAttribute("aria-pressed")
    ).toBe("true");
  });

  it("resolves auto mode via matchMedia", async () => {
    window.localStorage.setItem("cast-theme", "auto");
    matchMediaMock.matches = true;
    document.body.innerHTML = createSwitcherMarkup("a");

    const module = await loadModule();
    module.initThemeSwitcher();

    expect(document.documentElement.getAttribute("data-bs-theme")).toBe("dark");
  });

  it("updates all switchers when mode changes", async () => {
    document.body.innerHTML = `${createSwitcherMarkup("a")}${createSwitcherMarkup("b")}`;

    const module = await loadModule();
    module.initThemeSwitcher();

    const firstLightButton = document
      .getElementById("a")
      ?.querySelector('[data-cast-theme-value="mode:light"]') as HTMLButtonElement;
    firstLightButton.click();

    expect(window.localStorage.getItem("cast-theme")).toBe("light");
    expect(document.documentElement.getAttribute("data-bs-theme")).toBe("light");
    expect(document.getElementById("a")?.querySelector("[data-cast-theme-label]")?.textContent).toBe("Light");
    expect(document.getElementById("b")?.querySelector("[data-cast-theme-label]")?.textContent).toBe("Light");
  });

  it("submits the theme form when selecting template theme", async () => {
    document.body.innerHTML = createSwitcherMarkup("a");

    const module = await loadModule();
    module.initThemeSwitcher();

    const form = document.querySelector("form") as HTMLFormElement;
    const submitSpy = vi.spyOn(form, "submit").mockImplementation(() => {});

    const button = document.querySelector('[data-cast-theme-value="theme:alt"]') as HTMLButtonElement;
    button.click();

    const hidden = form.querySelector('input[name="template_base_dir"]') as HTMLInputElement;
    expect(hidden.value).toBe("alt");
    expect(submitSpy).toHaveBeenCalledTimes(1);
  });

  it("reacts to system changes only when in auto mode", async () => {
    window.localStorage.setItem("cast-theme", "auto");
    document.body.innerHTML = createSwitcherMarkup("a");

    const module = await loadModule();
    module.initThemeSwitcher();

    matchMediaMock.dispatch(true);
    expect(document.documentElement.getAttribute("data-bs-theme")).toBe("dark");

    window.localStorage.setItem("cast-theme", "light");
    document.documentElement.setAttribute("data-bs-theme", "light");

    matchMediaMock.dispatch(false);
    expect(document.documentElement.getAttribute("data-bs-theme")).toBe("light");
  });

  it("is idempotent and does not bind duplicate listeners", async () => {
    document.body.innerHTML = createSwitcherMarkup("a");

    const module = await loadModule();
    module.initThemeSwitcher();
    module.initThemeSwitcher();

    const setItemSpy = vi.spyOn(window.localStorage, "setItem");
    const darkButton = document.querySelector('[data-cast-theme-value="mode:dark"]') as HTMLButtonElement;
    darkButton.click();

    expect(setItemSpy).toHaveBeenCalledTimes(1);
  });

  it("syncs newly swapped switchers after htmx swap", async () => {
    window.localStorage.setItem("cast-theme", "dark");
    document.body.innerHTML = createSwitcherMarkup("a");

    const module = await loadModule();
    module.initThemeSwitcher();

    const target = document.createElement("div");
    target.innerHTML = createSwitcherMarkup("b");
    document.body.appendChild(target);

    const event = new CustomEvent("htmx:afterSwap", {
      detail: { target },
      bubbles: true,
    });
    document.body.dispatchEvent(event);

    expect(document.getElementById("b")?.querySelector("[data-cast-theme-label]")?.textContent).toBe("Dark");
  });

  it("is a no-op when no switcher markup exists", async () => {
    document.body.innerHTML = "<div>No switcher</div>";

    const module = await loadModule();
    expect(() => module.initThemeSwitcher()).not.toThrow();
  });
});
