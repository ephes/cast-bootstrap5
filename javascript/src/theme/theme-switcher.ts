import { resolveAutoTheme, type ResolvedTheme } from "@/theme/theme-utils";

export const THEME_STORAGE_KEY = "cast-theme";
export const THEME_SWITCHER_SELECTOR = "[data-cast-theme-switcher]";
const MEDIA_QUERY = "(prefers-color-scheme: dark)";

type ThemeMode = "auto" | ResolvedTheme;

type HtmxAfterSwapDetail = {
  target?: Element;
};

let listenersBound = false;
let mediaQueryList: MediaQueryList | null = null;
let bodyClickHandler: ((event: Event) => void) | null = null;
let mediaChangeHandler: ((event: MediaQueryListEvent) => void) | null = null;
let afterSwapHandler: ((event: Event) => void) | null = null;

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "auto" || value === "light" || value === "dark";
}

function getDocument(): Document | null {
  return typeof document === "undefined" ? null : document;
}

function getWindow(): Window | null {
  return typeof window === "undefined" ? null : window;
}

export function getStoredTheme(): ThemeMode | null {
  const win = getWindow();
  if (!win) {
    return null;
  }

  try {
    const value = win.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(value) ? value : null;
  } catch {
    return null;
  }
}

export function setStoredTheme(theme: ThemeMode): void {
  const win = getWindow();
  if (!win) {
    return;
  }

  try {
    win.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Intentionally ignored to keep the switcher functional in private/restricted contexts.
  }
}

export function getEffectiveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "auto") {
    const win = getWindow();
    if (!win) {
      return "light";
    }
    if (typeof win.matchMedia !== "function") {
      return "light";
    }
    return resolveAutoTheme(win.matchMedia(MEDIA_QUERY).matches);
  }

  return mode;
}

export function applyTheme(mode: ThemeMode): ResolvedTheme {
  const doc = getDocument();
  const effectiveTheme = getEffectiveTheme(mode);
  if (doc) {
    doc.documentElement.setAttribute("data-bs-theme", effectiveTheme);
  }
  return effectiveTheme;
}

function findSwitchers(root: ParentNode | Element): HTMLElement[] {
  const elements: HTMLElement[] = [];

  if (root instanceof Element && root.matches(THEME_SWITCHER_SELECTOR)) {
    elements.push(root as HTMLElement);
  }

  elements.push(...Array.from(root.querySelectorAll<HTMLElement>(THEME_SWITCHER_SELECTOR)));
  return elements;
}

function getModeLabel(switcher: HTMLElement, mode: ThemeMode): string | null {
  const button = switcher.querySelector<HTMLElement>(`[data-cast-theme-mode="${mode}"]`);
  if (!button) {
    return null;
  }

  const label = button.querySelector("span");
  if (label?.textContent) {
    return label.textContent.trim();
  }

  if (button.textContent) {
    return button.textContent.trim();
  }

  return null;
}

export function syncThemeSwitcher(switcher: HTMLElement, mode: ThemeMode): void {
  const label = switcher.querySelector<HTMLElement>("[data-cast-theme-label]");
  const nextLabel = getModeLabel(switcher, mode);
  if (label && nextLabel) {
    label.textContent = nextLabel;
  }

  const icons = switcher.querySelectorAll<HTMLElement>("[data-cast-theme-icon]");
  icons.forEach((icon) => {
    const iconTheme = icon.getAttribute("data-cast-theme-icon");
    icon.style.display = iconTheme === mode ? "inline-flex" : "none";
  });

  const modeButtons = switcher.querySelectorAll<HTMLElement>("[data-cast-theme-mode]");
  modeButtons.forEach((button) => {
    const buttonMode = button.getAttribute("data-cast-theme-mode");
    const isActive = buttonMode === mode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");

    const check = button.querySelector<HTMLElement>(".cast-theme-check");
    if (check) {
      check.style.opacity = isActive ? "1" : "0";
    }
  });
}

export function syncThemeSwitchers(root: ParentNode | Element = getDocument() as Document): void {
  if (!root) {
    return;
  }

  const mode = getStoredTheme() ?? "auto";
  findSwitchers(root).forEach((switcher) => {
    syncThemeSwitcher(switcher, mode);
  });
}

export function handleThemeSelection(target: Element): void {
  const value = target.getAttribute("data-cast-theme-value");
  if (!value) {
    return;
  }

  if (value.startsWith("mode:")) {
    const mode = value.slice(5);
    if (!isThemeMode(mode)) {
      return;
    }

    setStoredTheme(mode);
    applyTheme(mode);

    const doc = getDocument();
    if (doc) {
      syncThemeSwitchers(doc);
    }
    return;
  }

  if (!value.startsWith("theme:")) {
    return;
  }

  const selectedTheme = value.slice(6);
  const form = target.closest("form");
  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  const hidden = form.querySelector<HTMLInputElement>('input[name="template_base_dir"]');
  if (hidden) {
    hidden.value = selectedTheme;
  }
  form.submit();
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

function bindListeners(): void {
  const doc = getDocument();
  const win = getWindow();

  if (!doc || !win || listenersBound) {
    return;
  }

  bodyClickHandler = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const selected = target.closest("[data-cast-theme-value]");
    if (!selected) {
      return;
    }

    event.preventDefault();
    handleThemeSelection(selected);
  };

  afterSwapHandler = (event: Event) => {
    const detail = (event as CustomEvent<HtmxAfterSwapDetail>).detail;
    const target = detail?.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (target.matches(THEME_SWITCHER_SELECTOR) || target.querySelector(THEME_SWITCHER_SELECTOR)) {
      syncThemeSwitchers(target);
    }
  };

  if (typeof win.matchMedia === "function") {
    mediaQueryList = win.matchMedia(MEDIA_QUERY);
    mediaChangeHandler = () => {
      const stored = getStoredTheme();
      if (!stored || stored === "auto") {
        applyTheme("auto");
        syncThemeSwitchers(doc);
      }
    };
  }

  doc.body.addEventListener("click", bodyClickHandler);
  doc.body.addEventListener("htmx:afterSwap", afterSwapHandler);
  if (mediaQueryList && mediaChangeHandler) {
    mediaQueryList.addEventListener("change", mediaChangeHandler);
  }
  listenersBound = true;
}

export function initThemeSwitcher(root: ParentNode | Element = getDocument() as Document): void {
  if (!root) {
    return;
  }

  const mode = getStoredTheme() ?? "auto";
  applyTheme(mode);
  syncThemeSwitchers(root);
  bindListeners();
}

export function destroyThemeSwitcher(): void {
  const doc = getDocument();
  if (!doc || !listenersBound) {
    listenersBound = false;
    mediaQueryList = null;
    bodyClickHandler = null;
    mediaChangeHandler = null;
    afterSwapHandler = null;
    return;
  }

  if (bodyClickHandler) {
    doc.body.removeEventListener("click", bodyClickHandler);
  }
  if (afterSwapHandler) {
    doc.body.removeEventListener("htmx:afterSwap", afterSwapHandler);
  }
  if (mediaQueryList && mediaChangeHandler) {
    mediaQueryList.removeEventListener("change", mediaChangeHandler);
  }

  listenersBound = false;
  mediaQueryList = null;
  bodyClickHandler = null;
  mediaChangeHandler = null;
  afterSwapHandler = null;
}

if (typeof document !== "undefined") {
  initThemeSwitcher();
}

export type { ThemeMode };
