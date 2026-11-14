// podlove-player.ts
type PodlovePlayer = (playerTarget: HTMLElement | string, url: string, configUrl: string) => void;

declare global {
  // Registered asynchronously by the external Podlove embed script.
  var podlovePlayer: PodlovePlayer | undefined;

  interface HTMLElementTagNameMap {
    "podlove-player": PodlovePlayerElement;
  }
}

export {};

let embedScriptUrl: string | null = null;
let embedScriptPromise: Promise<void> | null = null;
let playerInstanceCounter = 0;
let pageLoadPromise: Promise<void> | null = null;
let sharedObserver: IntersectionObserver | null = null;
let lastKnownColorScheme: string | null = null;
const EMBED_SCRIPT_LOAD_DEADLINE_MS = 10000;
const EMBED_SCRIPT_ATTR = "data-podlove-embed";
const EMBED_SCRIPT_LOADED_ATTR = "data-podlove-embed-loaded";
const EMBED_SCRIPT_FAILED_ATTR = "data-podlove-embed-failed";
const PLAYER_STYLE_ID = "podlove-player-styles";
const COLOR_SCHEME_PARAM = "color_scheme";
const DARK_LOADING_BG_FALLBACK = "#292524";
const LIGHT_LOADING_BG_FALLBACK = "#ffffff";
const RESERVED_MIN_HEIGHT_DESKTOP_PX = 297;
const RESERVED_MIN_HEIGHT_MOBILE_PX = 312;
const IFRAME_REVEAL_DELAY_LIGHT_MS = 100;
const IFRAME_REVEAL_DELAY_DARK_MS = 900;
const IFRAME_REVEAL_TIMEOUT_MS = 2500;
const IFRAME_REVEAL_TIMEOUT_DARK_MS = 8000;
const IFRAME_MASKED_ATTR = "data-cast-iframe-masked";
const CONTAINER_MASK_ACTIVE_ATTR = "data-cast-mask-active";
const REVEAL_SHIELD_CLASS = "podlove-player-reveal-shield";
const REVEAL_SHIELD_HOLD_LIGHT_MS = 80;
const REVEAL_SHIELD_HOLD_DARK_MS = 180;
const REVEAL_SHIELD_FADE_MS = 120;
const PAGING_AREA_SELECTOR = "#paging-area";
const PAGINATION_LINK_SELECTOR = ".pagination a, .cast-pagination a";
const PAGING_REMASK_ATTR = "data-cast-paging-remask";
const PAGING_REMASK_RESTORE_MS = 1600;
const PAGING_MASK_ACTIVE_ATTR = "data-cast-paging-mask-active";
const IFRAME_REVEAL_RETRY_WHILE_PAGING_MASK_MS = 50;

function waitForPageLoad(): Promise<void> {
  if (document.readyState === "complete") {
    return Promise.resolve();
  }

  if (!pageLoadPromise) {
    pageLoadPromise = new Promise((resolve) => {
      window.addEventListener("load", () => resolve(), { once: true });
    });
  }

  return pageLoadPromise;
}

function getLoadingBg(isDark: boolean): string {
  const varName = isDark ? "--cast-bg-alt" : "--cast-surface";
  const fallback = isDark ? DARK_LOADING_BG_FALLBACK : LIGHT_LOADING_BG_FALLBACK;
  const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return val || fallback;
}

const FACADE_BTN_CLASS = "podlove-player-facade-btn";
const FACADE_LOADING_CLASS = "podlove-player-facade-loading";

function getSharedObserver(): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const target = entry.target;
        observer.unobserve(target);

        if (target instanceof PodlovePlayerElement) {
          target.showFacade();
        }
      });
    });
  }

  return sharedObserver;
}

// One global initializer means one implementation per document. Fragments do
// not identify a different script; paths and query strings do.
function bindEmbedUrl(embedUrl: string): string {
  const requested = new URL(embedUrl, document.baseURI);
  requested.hash = "";
  const existing = document.querySelector<HTMLScriptElement>(`script[${EMBED_SCRIPT_ATTR}]`);
  if (embedScriptUrl === null && existing) {
    const registered = new URL(existing.src, document.baseURI);
    registered.hash = "";
    embedScriptUrl = registered.href;
  }
  if (embedScriptUrl !== null && embedScriptUrl !== requested.href) {
    throw new Error("A different Podlove embed implementation already owns this document.");
  }
  embedScriptUrl = requested.href;
  return requested.href;
}

function loadEmbedScript(embedUrl: string): Promise<void> {
  if (typeof podlovePlayer === "function") {
    return Promise.resolve();
  }

  const loadedScript = document.querySelector(`script[${EMBED_SCRIPT_LOADED_ATTR}="true"]`);
  if (loadedScript) {
    loadedScript.remove();
    embedScriptPromise = null;
  }
  if (embedScriptPromise) {
    return embedScriptPromise;
  }

  const promise = new Promise<void>((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(`script[${EMBED_SCRIPT_ATTR}]`);
    if (script?.getAttribute(EMBED_SCRIPT_FAILED_ATTR) === "true") {
      script.remove();
      script = null;
    }
    const isNew = !script;
    const ownedScript = script ?? document.createElement("script");
    let settled = false;
    const cleanup = (): void => {
      clearTimeout(deadline);
      ownedScript.removeEventListener("load", onLoad);
      ownedScript.removeEventListener("error", onError);
    };
    const fail = (message: string): void => {
      if (settled) return;
      settled = true;
      cleanup();
      ownedScript.setAttribute(EMBED_SCRIPT_FAILED_ATTR, "true");
      ownedScript.remove();
      reject(new Error(message));
    };
    const onLoad = (): void => {
      if (settled) return;
      if (typeof podlovePlayer !== "function") {
        fail("Podlove embed script did not register.");
        return;
      }
      settled = true;
      cleanup();
      ownedScript.setAttribute(EMBED_SCRIPT_LOADED_ATTR, "true");
      resolve();
    };
    const onError = (): void => fail("Failed to load Podlove embed script");
    const deadline = setTimeout(
      () => fail("Podlove embed script load timed out"), EMBED_SCRIPT_LOAD_DEADLINE_MS
    );
    ownedScript.addEventListener("load", onLoad);
    ownedScript.addEventListener("error", onError);
    if (isNew) {
      ownedScript.src = embedUrl;
      ownedScript.async = true;
      ownedScript.setAttribute(EMBED_SCRIPT_ATTR, "true");
      document.head.appendChild(ownedScript);
    }
  }).catch((error: unknown) => {
    if (embedScriptPromise === promise) {
      embedScriptPromise = null;
    }
    throw error;
  });
  embedScriptPromise = promise;

  return embedScriptPromise;
}

function getColorScheme(): string | null {
  const configuredTheme =
    document.documentElement.getAttribute("data-bs-theme") ||
    document.documentElement.getAttribute("data-theme") ||
    document.body?.getAttribute("data-bs-theme") ||
    document.body?.getAttribute("data-theme");
  if (configuredTheme === "light" || configuredTheme === "dark") {
    return configuredTheme;
  }
  if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return null;
}

function appendColorScheme(configUrl: string): string {
  const colorScheme = getColorScheme();
  if (!colorScheme) {
    return configUrl;
  }

  const hashIndex = configUrl.indexOf("#");
  const base = hashIndex === -1 ? configUrl : configUrl.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : configUrl.slice(hashIndex + 1);
  const queryIndex = base.indexOf("?");
  const path = queryIndex === -1 ? base : base.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : base.slice(queryIndex + 1);
  const params = new URLSearchParams(query);
  if (!params.has(COLOR_SCHEME_PARAM)) {
    params.set(COLOR_SCHEME_PARAM, colorScheme);
  }
  const queryString = params.toString();
  const hashSuffix = hash ? `#${hash}` : "";
  return queryString ? `${path}?${queryString}${hashSuffix}` : `${path}${hashSuffix}`;
}

function getReservedMinHeightPx(): number {
  if (typeof window.matchMedia === "function" && window.matchMedia("(max-width: 768px)").matches) {
    return RESERVED_MIN_HEIGHT_MOBILE_PX;
  }
  return RESERVED_MIN_HEIGHT_DESKTOP_PX;
}

function forceMaskIframeForPaging(container: HTMLElement, iframe: HTMLIFrameElement): void {
  if (iframe.getAttribute(PAGING_REMASK_ATTR) === "true") {
    return;
  }
  iframe.setAttribute(PAGING_REMASK_ATTR, "true");
  iframe.setAttribute(IFRAME_MASKED_ATTR, "true");
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  iframe.style.backgroundColor = "inherit";
  iframe.style.colorScheme = "inherit";
  container.setAttribute(CONTAINER_MASK_ACTIVE_ATTR, "true");

  window.setTimeout(() => {
    if (!iframe.isConnected || iframe.getAttribute(PAGING_REMASK_ATTR) !== "true") {
      return;
    }
    iframe.removeAttribute(PAGING_REMASK_ATTR);
    if (iframe.getAttribute(IFRAME_MASKED_ATTR) === "true") {
      iframe.removeAttribute(IFRAME_MASKED_ATTR);
    }
    iframe.style.opacity = "1";
    iframe.style.pointerEvents = "";
    iframe.style.removeProperty("background-color");
    iframe.style.removeProperty("color-scheme");
    if (!container.querySelector(`iframe[${PAGING_REMASK_ATTR}="true"]`)) {
      container.removeAttribute(CONTAINER_MASK_ACTIVE_ATTR);
    }
  }, PAGING_REMASK_RESTORE_MS);
}

function remaskVisiblePagingIframes(event: Event): void {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }
  if (!target.closest(PAGINATION_LINK_SELECTOR)) {
    return;
  }

  const pagingArea = document.querySelector<HTMLElement>(PAGING_AREA_SELECTOR);
  if (!pagingArea) {
    return;
  }

  pagingArea.querySelectorAll(".podlove-player-container").forEach((container) => {
    if (!(container instanceof HTMLElement)) {
      return;
    }
    container.querySelectorAll("iframe").forEach((iframe) => {
      if (!(iframe instanceof HTMLIFrameElement)) {
        return;
      }
      if (iframe.getAttribute(IFRAME_MASKED_ATTR) === "true") {
        return;
      }
      forceMaskIframeForPaging(container, iframe);
    });
  });
}

class PodlovePlayerElement extends HTMLElement {
  observer: IntersectionObserver | null;
  isInitialized: boolean;
  playerDiv: HTMLDivElement | null;
  initVersion: number;
  iframeObserver: MutationObserver | null;
  iframeRevealDelayTimeoutId: number | null;
  iframeRevealTimeoutId: number | null;
  iframeRevealShieldTimeoutId: number | null;
  facadeAbortController: AbortController | null;
  private connectionVersion = 0;
  private retryShouldFocus = false;
  private originalFacadeButton: { button: Element; html: string; label: string | null } | null = null;

  constructor() {
    super();
    this.observer = null;
    this.isInitialized = false;
    this.playerDiv = null;
    this.initVersion = 0;
    this.iframeObserver = null;
    this.iframeRevealDelayTimeoutId = null;
    this.iframeRevealTimeoutId = null;
    this.iframeRevealShieldTimeoutId = null;
    this.facadeAbortController = null;
  }

  isFacadeMode(): boolean {
    return this.getAttribute("data-load-mode") === "facade";
  }

  reinitializePlayer() {
    if (!this.isInitialized || !this.isConnected) {
      return;
    }
    this.clearIframeMasking();
    if (this.playerDiv) {
      this.playerDiv.remove();
      this.playerDiv = null;
    }
    // Clear any inline min-height: 0 left by releaseReservedHeight so the
    // CSS floor rule takes over while content is absent during re-init.
    const container = this.querySelector(".podlove-player-container");
    if (container instanceof HTMLElement) {
      container.style.removeProperty("min-height");
    }
    this.style.removeProperty("min-height");
    this.isInitialized = false;
    delete this.dataset.playerInstanceId;
    this.initializePlayer();
  }

  connectedCallback() {
    const connectionVersion = ++this.connectionVersion;
    this.renderPlaceholder();

    if (this.isFacadeMode()) {
      // Facade containers are styled by SCSS — no need for applyLoadingTheme.
      this.setupFacadeInteraction();
      return;
    }

    if (document.readyState === "complete") {
      this.observeElement();
      return;
    }

    void waitForPageLoad().then(() => {
      if (this.isConnected && this.connectionVersion === connectionVersion) this.observeElement();
    });
  }

  disconnectedCallback() {
    this.connectionVersion += 1;
    this.initVersion += 1;
    if (this.observer) {
      this.observer.unobserve(this);
    }
    if (this.facadeAbortController) {
      this.facadeAbortController.abort();
      this.facadeAbortController = null;
    }
    this.clearIframeMasking();
    this.restoreFacadeButton();
    this.querySelector(".podlove-player-error")?.remove();
    this.retryShouldFocus = false;
    // Remove stale facade/loading elements so they don't persist after reattach
    this.querySelector(`.${FACADE_LOADING_CLASS}`)?.remove();
    this.querySelector(`.${FACADE_BTN_CLASS}`)?.remove();
    // Reset facade-inner positioning if it was made absolute during loading
    const facadeInner = this.querySelector(".podlove-facade-inner");
    if (facadeInner instanceof HTMLElement) {
      facadeInner.style.removeProperty("position");
      facadeInner.style.removeProperty("inset");
      facadeInner.style.removeProperty("z-index");
      facadeInner.style.removeProperty("padding");
    }
    // Restore facade class if this was a facade element, and clear loading state
    const container = this.querySelector(".podlove-player-container");
    if (container instanceof HTMLElement) {
      if (this.isFacadeMode()) {
        container.classList.add("podlove-facade");
      }
      container.classList.remove("is-loading");
      container.style.removeProperty("min-height");
    }
    this.style.removeProperty("min-height");
    // Removing the iframe host retires its browsing context. The external
    // initializer may still hold this detached host; it cannot own the next one.
    this.playerDiv?.remove();
    this.playerDiv = null;
    delete this.dataset.playerInstanceId;
    // Allow re-init on reattach; async work was invalidated before teardown.
    this.isInitialized = false;
  }

  clearIframeMasking() {
    if (this.iframeObserver) {
      this.iframeObserver.disconnect();
      this.iframeObserver = null;
    }
    if (this.iframeRevealDelayTimeoutId !== null) {
      window.clearTimeout(this.iframeRevealDelayTimeoutId);
      this.iframeRevealDelayTimeoutId = null;
    }
    if (this.iframeRevealTimeoutId !== null) {
      window.clearTimeout(this.iframeRevealTimeoutId);
      this.iframeRevealTimeoutId = null;
    }
    if (this.iframeRevealShieldTimeoutId !== null) {
      window.clearTimeout(this.iframeRevealShieldTimeoutId);
      this.iframeRevealShieldTimeoutId = null;
    }
    this.querySelectorAll(".podlove-player-container").forEach((container) => {
      if (container instanceof HTMLElement) {
        container.removeAttribute(CONTAINER_MASK_ACTIVE_ATTR);
        container.querySelectorAll(`.${REVEAL_SHIELD_CLASS}`).forEach((shield) => {
          shield.remove();
        });
      }
    });
  }

  applyReservedHeight(container: HTMLElement) {
    const reservedMinHeight = `${getReservedMinHeightPx()}px`;
    container.style.minHeight = reservedMinHeight;
    this.style.minHeight = reservedMinHeight;
  }

  getOrCreateRevealShield(container: HTMLElement): HTMLDivElement {
    const existing = container.querySelector(`.${REVEAL_SHIELD_CLASS}`);
    if (existing instanceof HTMLDivElement) {
      existing.style.backgroundColor = container.style.backgroundColor || window.getComputedStyle(container).backgroundColor;
      existing.style.opacity = "1";
      return existing;
    }
    const shield = document.createElement("div");
    shield.classList.add(REVEAL_SHIELD_CLASS);
    shield.style.backgroundColor = container.style.backgroundColor || window.getComputedStyle(container).backgroundColor;
    shield.style.opacity = "1";
    container.appendChild(shield);
    return shield;
  }

  scheduleRevealShieldRelease(container: HTMLElement, expectedVersion: number) {
    if (this.iframeRevealShieldTimeoutId !== null) {
      window.clearTimeout(this.iframeRevealShieldTimeoutId);
      this.iframeRevealShieldTimeoutId = null;
    }
    const shield = this.getOrCreateRevealShield(container);
    const holdMs = container.style.colorScheme === "dark" ? REVEAL_SHIELD_HOLD_DARK_MS : REVEAL_SHIELD_HOLD_LIGHT_MS;
    this.iframeRevealShieldTimeoutId = window.setTimeout(() => {
      if (this.initVersion !== expectedVersion) {
        return;
      }
      // Release reserved height and border while the shield is still opaque
      // so the size/border change is invisible to the user.
      this.releaseReservedHeight(container);
      shield.style.opacity = "0";
      this.iframeRevealShieldTimeoutId = window.setTimeout(() => {
        if (this.initVersion !== expectedVersion) {
          return;
        }
        shield.remove();
        this.iframeRevealShieldTimeoutId = null;
      }, REVEAL_SHIELD_FADE_MS);
    }, holdMs);
  }

  maskIframeUntilReady(container: Element, expectedVersion: number) {
    if (!(container instanceof HTMLElement)) {
      return;
    }
    this.clearIframeMasking();
    container.setAttribute(CONTAINER_MASK_ACTIVE_ATTR, "true");
    const revealDelayMs =
      container.style.colorScheme === "dark" ? IFRAME_REVEAL_DELAY_DARK_MS : IFRAME_REVEAL_DELAY_LIGHT_MS;
    const processedIframes = new WeakSet<HTMLIFrameElement>();
    let latestIframe: HTMLIFrameElement | null = null;
    const isPagingMaskActive = () => {
      const pagingArea = document.querySelector<HTMLElement>(PAGING_AREA_SELECTOR);
      return pagingArea?.getAttribute(PAGING_MASK_ACTIVE_ATTR) === "true";
    };
    const shouldHoldReveal = (iframe: HTMLIFrameElement) => {
      if (iframe.getAttribute(PAGING_REMASK_ATTR) === "true") {
        return true;
      }
      return isPagingMaskActive();
    };

    const reveal = (iframe: HTMLIFrameElement | null) => {
      if (this.initVersion !== expectedVersion) {
        return;
      }
      if (!(iframe instanceof HTMLIFrameElement) || !container.contains(iframe)) {
        return;
      }
      if (shouldHoldReveal(iframe)) {
        if (this.iframeRevealDelayTimeoutId !== null) {
          window.clearTimeout(this.iframeRevealDelayTimeoutId);
        }
        this.iframeRevealDelayTimeoutId = window.setTimeout(
          () => reveal(iframe),
          IFRAME_REVEAL_RETRY_WHILE_PAGING_MASK_MS
        );
        return;
      }
      // Remove facade overlay now that the iframe is ready
      container.querySelector(".podlove-facade-inner")?.remove();
      // Fallback: also search the custom element itself in case the container
      // reference diverged from the live DOM (e.g. htmx swap / View Transitions).
      this.querySelector(".podlove-facade-inner")?.remove();
      iframe.style.opacity = "1";
      iframe.style.pointerEvents = "";
      iframe.style.removeProperty("transition");
      iframe.style.removeProperty("background-color");
      iframe.style.removeProperty("color-scheme");
      iframe.removeAttribute(IFRAME_MASKED_ATTR);
      container.removeAttribute(CONTAINER_MASK_ACTIVE_ATTR);
      this.scheduleRevealShieldRelease(container, expectedVersion);

      if (this.iframeRevealTimeoutId !== null) {
        window.clearTimeout(this.iframeRevealTimeoutId);
        this.iframeRevealTimeoutId = null;
      }
      if (this.iframeRevealDelayTimeoutId !== null) {
        window.clearTimeout(this.iframeRevealDelayTimeoutId);
        this.iframeRevealDelayTimeoutId = null;
      }
    };

    const revealWithDelay = (iframe: HTMLIFrameElement) => {
      if (this.initVersion !== expectedVersion || !this.isConnected) return;
      if (this.iframeRevealDelayTimeoutId !== null) {
        window.clearTimeout(this.iframeRevealDelayTimeoutId);
      }
      this.iframeRevealDelayTimeoutId = window.setTimeout(() => reveal(iframe), revealDelayMs);
    };

    const setupIframe = (iframe: HTMLIFrameElement) => {
      if (processedIframes.has(iframe)) {
        return;
      }
      processedIframes.add(iframe);
      latestIframe = iframe;
      this.getOrCreateRevealShield(container);
      const facadeSpinner = container.querySelector(`.${FACADE_LOADING_CLASS}`);
      if (facadeSpinner) facadeSpinner.remove();
      // Position facade content absolutely so it overlays without affecting
      // layout, then remove it when the iframe is revealed.
      const facadeInner = container.querySelector(".podlove-facade-inner");
      if (facadeInner instanceof HTMLElement) {
        facadeInner.style.position = "absolute";
        facadeInner.style.inset = "0";
        facadeInner.style.zIndex = "1";
        facadeInner.style.padding = "inherit";
      }
      // Legacy facade cleanup (old template structure)
      container.querySelector(".podlove-facade-content")?.remove();
      container.querySelector(".podlove-facade-play:not(.podlove-facade-inner .podlove-facade-play)")?.remove();
      // Preserve facade border/radius as inline styles before removing the
      // class so the 1px border doesn't vanish and cause a layout shift.
      // Cleaned up later in releaseReservedHeight().
      const cs = getComputedStyle(container);
      container.style.border = cs.border;
      container.style.borderRadius = cs.borderRadius;
      container.classList.remove("podlove-facade");
      iframe.setAttribute(IFRAME_MASKED_ATTR, "true");
      iframe.style.opacity = "0";
      iframe.style.pointerEvents = "none";
      iframe.style.transition = "opacity 160ms ease";
      iframe.style.backgroundColor = "inherit";
      iframe.style.colorScheme = "inherit";
      iframe.addEventListener(
        "load",
        () => {
          if (latestIframe !== iframe) {
            return;
          }
          revealWithDelay(iframe);
        },
        { once: true }
      );
      if (this.iframeRevealTimeoutId !== null) {
        window.clearTimeout(this.iframeRevealTimeoutId);
      }
      const revealTimeoutMs =
        container.style.colorScheme === "dark" ? IFRAME_REVEAL_TIMEOUT_DARK_MS : IFRAME_REVEAL_TIMEOUT_MS;
      this.iframeRevealTimeoutId = window.setTimeout(() => reveal(latestIframe), revealTimeoutMs);
    };

    const setupAllIframes = () => {
      const iframes = container.querySelectorAll("iframe");
      iframes.forEach((iframe) => {
        if (iframe instanceof HTMLIFrameElement) {
          setupIframe(iframe);
        }
      });
    };
    setupAllIframes();

    this.iframeObserver = new MutationObserver(() => {
      setupAllIframes();
    });
    this.iframeObserver.observe(container, { childList: true, subtree: true });
  }

  applyLoadingTheme(container: Element) {
    if (!(container instanceof HTMLElement)) {
      return;
    }
    const colorScheme = getColorScheme() === "dark" ? "dark" : "light";
    container.style.backgroundColor = getLoadingBg(colorScheme === "dark");
    container.style.colorScheme = colorScheme;
  }

  ensurePlayerStyles() {
    if (document.getElementById(PLAYER_STYLE_ID)) {
      return;
    }
    const style = document.createElement('style');
    style.id = PLAYER_STYLE_ID;
    const darkBg = getLoadingBg(true);
    const lightBg = getLoadingBg(false);
    style.textContent = `
      podlove-player .podlove-player-container {
        width: 100%;
        max-width: 936px;
        margin: 0 auto;
        position: relative;
        overflow: hidden;
        background-color: var(--cast-surface, ${lightBg});
      }
      podlove-player .podlove-player-container:not(.podlove-facade) {
        min-height: ${RESERVED_MIN_HEIGHT_DESKTOP_PX}px;
      }
      @media (max-width: 768px) {
        podlove-player .podlove-player-container {
          max-width: 366px;
        }
        podlove-player .podlove-player-container:not(.podlove-facade) {
          min-height: ${RESERVED_MIN_HEIGHT_MOBILE_PX}px;
        }
      }
      podlove-player .podlove-player-container iframe {
        display: block;
        width: 100%;
        height: 100%;
        border: none;
        background-color: inherit;
        color-scheme: inherit;
      }
      podlove-player .podlove-player-host {
        position: relative;
        z-index: 1;
      }
      podlove-player .podlove-player-facade-btn {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 68px;
        height: 68px;
        border-radius: 50%;
        border: none;
        background: rgba(0, 0, 0, 0.6);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1;
        transition: transform 0.15s ease, background-color 0.15s ease;
      }
      podlove-player .podlove-player-retry-btn {
        width: auto;
        max-width: 90%;
        padding: 0 20px;
        border-radius: 8px;
        color: white;
      }
      podlove-player .podlove-player-error {
        text-align: center;
      }
      podlove-player .podlove-player-container:not(.podlove-facade) .podlove-player-error {
        position: absolute;
        top: 16px;
        width: 100%;
      }
      podlove-player .podlove-player-facade-btn:hover {
        transform: translate(-50%, -50%) scale(1.1);
        background: rgba(0, 0, 0, 0.8);
      }
      podlove-player .podlove-player-facade-btn:focus-visible {
        outline: 3px solid #6aa5ff;
        outline-offset: 3px;
      }
      podlove-player .podlove-player-facade-loading {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 40px;
        height: 40px;
        margin: -20px 0 0 -20px;
        border: 4px solid rgba(0, 0, 0, 0.15);
        border-top-color: #1a1a1a;
        border-radius: 50%;
        animation: podlove-facade-spin 0.8s linear infinite;
        z-index: 1;
      }
      @keyframes podlove-facade-spin {
        to { transform: rotate(360deg); }
      }
      podlove-player .podlove-player-container .${REVEAL_SHIELD_CLASS} {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 2;
        opacity: 1;
        transition: opacity ${REVEAL_SHIELD_FADE_MS}ms ease;
      }
      podlove-player .podlove-player-container[${CONTAINER_MASK_ACTIVE_ATTR}="true"] iframe {
        opacity: 0 !important;
        pointer-events: none !important;
      }
      @media (prefers-color-scheme: dark) {
        podlove-player .podlove-player-container {
          background-color: var(--cast-bg-alt, ${darkBg});
        }
        podlove-player .podlove-player-container iframe {
          background-color: var(--cast-bg-alt, ${darkBg});
          color-scheme: dark;
        }
        podlove-player .podlove-player-facade-loading {
          border-color: rgba(255, 255, 255, 0.15);
          border-top-color: #ffffff;
        }
      }
      html[data-bs-theme="dark"] podlove-player .podlove-player-container,
      html[data-theme="dark"] podlove-player .podlove-player-container,
      body[data-bs-theme="dark"] podlove-player .podlove-player-container,
      body[data-theme="dark"] podlove-player .podlove-player-container {
        background-color: var(--cast-bg-alt, ${darkBg});
      }
      html[data-bs-theme="dark"] podlove-player .podlove-player-facade-loading,
      html[data-theme="dark"] podlove-player .podlove-player-facade-loading,
      body[data-bs-theme="dark"] podlove-player .podlove-player-facade-loading,
      body[data-theme="dark"] podlove-player .podlove-player-facade-loading {
        border-color: rgba(255, 255, 255, 0.15);
        border-top-color: #ffffff;
      }
      html[data-bs-theme="dark"] podlove-player .podlove-player-container iframe,
      html[data-theme="dark"] podlove-player .podlove-player-container iframe,
      body[data-bs-theme="dark"] podlove-player .podlove-player-container iframe,
      body[data-theme="dark"] podlove-player .podlove-player-container iframe {
        background-color: var(--cast-bg-alt, ${darkBg});
        color-scheme: dark;
      }
      html[data-bs-theme="light"] podlove-player .podlove-player-container,
      html[data-theme="light"] podlove-player .podlove-player-container,
      body[data-bs-theme="light"] podlove-player .podlove-player-container,
      body[data-theme="light"] podlove-player .podlove-player-container {
        background-color: var(--cast-surface, ${lightBg});
      }
      html[data-bs-theme="light"] podlove-player .podlove-player-container iframe,
      html[data-theme="light"] podlove-player .podlove-player-container iframe,
      body[data-bs-theme="light"] podlove-player .podlove-player-container iframe,
      body[data-theme="light"] podlove-player .podlove-player-container iframe {
        background-color: var(--cast-surface, ${lightBg});
        color-scheme: light;
      }
    `;
    document.head.appendChild(style);
  }

  renderPlaceholder() {
    this.ensurePlayerStyles();

    if (this.querySelector('.podlove-player-container')) {
      return;
    }

    // Reserve space to prevent layout shifts
    const container = document.createElement('div');
    container.classList.add('podlove-player-container');
    this.applyLoadingTheme(container);
    this.applyReservedHeight(container);

    this.appendChild(container);
  }

  observeElement() {
    if (!this.isConnected) return;
    this.observer = getSharedObserver();
    this.observer.observe(this);
  }

  setupFacadeInteraction() {
    const container = this.querySelector(".podlove-player-container");
    if (!container || !(container instanceof HTMLElement)) {
      return;
    }
    const playBtn = container.querySelector(".podlove-facade-play");
    this.facadeAbortController = new AbortController();
    const signal = this.facadeAbortController.signal;

    const trigger = () => {
      if (this.facadeAbortController) {
        this.facadeAbortController.abort();
        this.facadeAbortController = null;
      }
      this.handleFacadeLoad();
    };

    container.addEventListener("mouseenter", trigger, { once: true, signal });
    container.addEventListener("touchstart", trigger, { once: true, passive: true, signal });
    if (playBtn) {
      playBtn.addEventListener("focus", trigger, { once: true, signal });
      playBtn.addEventListener("click", trigger, { once: true, signal });
    }
  }

  handleFacadeLoad() {
    if (this.isInitialized || !this.isConnected) {
      return;
    }
    const container = this.querySelector(".podlove-player-container");
    if (!container || !(container instanceof HTMLElement)) {
      return;
    }
    this.retryShouldFocus = document.activeElement === container.querySelector(".podlove-facade-play");
    this.restoreFacadeButton();
    this.querySelector(".podlove-player-error")?.remove();
    // Lock the container at its current height so the facade-to-player
    // transition doesn't shrink/expand.  The facade may be taller than
    // the generic reserved height (e.g. 502px stacked cover vs 312px).
    const currentHeight = container.getBoundingClientRect().height;
    const reservedHeight = Math.max(currentHeight, getReservedMinHeightPx());
    container.style.minHeight = `${reservedHeight}px`;
    this.style.minHeight = `${reservedHeight}px`;
    container.classList.add("is-loading");
    const spinner = document.createElement("div");
    spinner.className = FACADE_LOADING_CLASS;
    container.appendChild(spinner);
    this.initializePlayer();
  }

  showFacade(retry = false) {
    if (this.isInitialized || !this.getAttribute("data-url")) {
      return;
    }
    const container = this.querySelector(".podlove-player-container");
    if (!container || container.querySelector(`.${FACADE_BTN_CLASS}`)) {
      return;
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = FACADE_BTN_CLASS;
    btn.setAttribute("aria-label", retry ? "Retry loading player" : "Play");
    if (retry) {
      btn.classList.add("podlove-player-retry-btn");
      btn.textContent = "Retry loading player";
    } else btn.innerHTML =
      '<svg viewBox="0 0 24 24" width="28" height="28" fill="white" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
    btn.addEventListener("click", () => this.handleFacadeClick(), { once: true });
    container.appendChild(btn);
  }

  handleFacadeClick() {
    if (this.isInitialized || !this.isConnected || !this.getAttribute("data-url")) {
      return;
    }
    const container = this.querySelector(".podlove-player-container");
    if (!container) return;
    const btn = container.querySelector(`.${FACADE_BTN_CLASS}`);
    this.retryShouldFocus = document.activeElement === btn;
    this.querySelector(".podlove-player-error")?.remove();
    if (btn) btn.remove();
    const spinner = document.createElement("div");
    spinner.className = FACADE_LOADING_CLASS;
    container.appendChild(spinner);
    this.initializePlayer();
  }

  initializePlayer() {
    if (this.isInitialized || !this.isConnected) {
      return;
    }

    const container = this.querySelector('.podlove-player-container');
    if (!container) {
      return;
    }
    if (container instanceof HTMLElement && !this.isFacadeMode()) {
      this.applyReservedHeight(container);
    }
    if (this.isFacadeMode()) {
      // Facade containers are themed by SCSS — skip inline backgroundColor.
      // But set colorScheme so that reveal-timing logic (which reads
      // container.style.colorScheme) uses the correct dark/light delays.
      if (container instanceof HTMLElement) {
        container.style.colorScheme = getColorScheme() === "dark" ? "dark" : "light";
      }
    } else {
      this.applyLoadingTheme(container);
    }

    let audioId = this.getAttribute('id');
    if (!audioId) {
      audioId = `podlove-player-${Date.now()}`;
      this.setAttribute('id', audioId);
    }
    if (!this.dataset.playerInstanceId) {
      playerInstanceCounter += 1;
      this.dataset.playerInstanceId = String(playerInstanceCounter);
    }
    const playerId = `${audioId}-player-${this.dataset.playerInstanceId}`;

    const url = this.getAttribute('data-url');
    if (!url) {
      return;
    }
    this.isInitialized = true;
    this.initVersion += 1;
    const currentVersion = this.initVersion;
    let configUrl = this.getAttribute('data-config') || '/api/audios/player_config/';
    configUrl = appendColorScheme(configUrl);
    const podloveTemplate = this.getAttribute('data-template');
    let embedUrl = this.getAttribute('data-embed') || 'https://cdn.podlove.org/web-player/5.x/embed.js';

    const playerHost = this.getOrCreatePlayerDiv(container, playerId, podloveTemplate);

    const initialize = () => {
      if (currentVersion !== this.initVersion || !this.isConnected) return;
      // Catch only the external initializer; lifecycle/masking errors remain visible.
      try {
        if (typeof podlovePlayer !== "function") {
          throw new Error("Podlove embed script did not register.");
        }
        podlovePlayer(playerHost, url, configUrl);
      } catch {
        this.recoverInitialization(container, currentVersion);
        return;
      }
      if (currentVersion === this.initVersion && this.isConnected) {
        this.maskIframeUntilReady(container, currentVersion);
      }
    };

    try {
      embedUrl = bindEmbedUrl(embedUrl);
    } catch {
      this.recoverInitialization(container, currentVersion);
      return;
    }
    if (typeof podlovePlayer === 'function') {
      initialize();
    } else {
      void loadEmbedScript(embedUrl).then(initialize, () => {
        this.recoverInitialization(container, currentVersion);
      });
    }
  }

  recoverInitialization(container: Element, version: number) {
    if (version !== this.initVersion || !this.isConnected) return;
    this.isInitialized = false;
    this.clearReservedHeight(container);
    container.classList.remove("is-loading");
    this.querySelector(`.${FACADE_LOADING_CLASS}`)?.remove();
    this.playerDiv?.remove();
    this.playerDiv = null;
    this.facadeAbortController?.abort();
    this.facadeAbortController = null;
    const status = document.createElement("p");
    status.className = "podlove-player-error";
    status.setAttribute("role", "alert");
    status.textContent = "Player failed to load. Please retry.";
    this.querySelector(".podlove-player-error")?.remove();
    container.appendChild(status);
    // A reinitialization can fail after the first iframe already switched the
    // container out of facade mode; bring the facade back so its retry button
    // is not left inside a hidden overlay.
    const facadeInner = container.querySelector(".podlove-facade-inner");
    if (this.isFacadeMode() && facadeInner instanceof HTMLElement) {
      facadeInner.style.removeProperty("position");
      facadeInner.style.removeProperty("inset");
      facadeInner.style.removeProperty("z-index");
      facadeInner.style.removeProperty("padding");
      container.classList.add("podlove-facade");
    }
    const playButton = container.querySelector(".podlove-facade-play");
    if (playButton) {
      this.originalFacadeButton = {
        button: playButton, html: playButton.innerHTML, label: playButton.getAttribute("aria-label"),
      };
      playButton.textContent = "Retry loading player";
      playButton.setAttribute("aria-label", "Retry loading player");
      this.facadeAbortController = new AbortController();
      playButton.addEventListener("click", () => {
        this.facadeAbortController?.abort();
        this.facadeAbortController = null;
        this.handleFacadeLoad();
      }, { once: true, signal: this.facadeAbortController.signal });
    } else {
      this.showFacade(true);
    }
    // Only hand focus back when it is still on this player or was dropped by
    // removing the activated button; never pull it away from another element.
    const active = document.activeElement;
    const focusIsFree = active === null || active === document.body || this.contains(active);
    if (this.retryShouldFocus && focusIsFree) {
      const retryButton = container.querySelector<HTMLElement>(".podlove-facade-play, .podlove-player-retry-btn");
      retryButton?.focus();
    }
    this.retryShouldFocus = false;
  }

  private restoreFacadeButton() {
    if (!this.originalFacadeButton) return;
    const { button, html, label } = this.originalFacadeButton;
    button.innerHTML = html;
    if (label === null) button.removeAttribute("aria-label");
    else button.setAttribute("aria-label", label);
    this.originalFacadeButton = null;
  }

  getOrCreatePlayerDiv(container: Element, playerId: string, podloveTemplate: string | null) {
    if (!this.playerDiv) {
      this.playerDiv = document.createElement('div');
      this.playerDiv.classList.add('podlove-player-host');
    }

    if (!container.contains(this.playerDiv)) {
      container.appendChild(this.playerDiv);
    }

    this.playerDiv.id = playerId;

    if (podloveTemplate !== null) {
      this.playerDiv.setAttribute('data-template', podloveTemplate);
    } else {
      this.playerDiv.removeAttribute('data-template');
    }

    return this.playerDiv;
  }

  releaseReservedHeight(container: Element) {
    if (container instanceof HTMLElement) {
      // Override the CSS min-height rule with 0 so the container matches
      // the iframe's natural height.  This runs after the iframe is fully
      // visible, so the content itself holds the height.
      container.style.minHeight = "0";
      // Remove the inline border/border-radius that was preserved from the
      // facade class during the transition (see setupIframe).
      container.style.removeProperty("border");
      container.style.removeProperty("border-radius");
    }
    this.style.minHeight = "0";
  }

  clearReservedHeight(container: Element) {
    if (container instanceof HTMLElement) {
      container.style.removeProperty("min-height");
      container.style.removeProperty("border");
      container.style.removeProperty("border-radius");
    }
    this.style.removeProperty("min-height");
  }
}

customElements.define('podlove-player', PodlovePlayerElement);

// Keep the embed skin and playback instance until its lifecycle ends. Only
// uninitialized placeholders follow cosmetic theme changes.
lastKnownColorScheme = getColorScheme();
const themeObserver = new MutationObserver(() => {
  const newScheme = getColorScheme();
  if (newScheme === lastKnownColorScheme) {
    return;
  }
  lastKnownColorScheme = newScheme;
  document.querySelectorAll('podlove-player').forEach((el) => {
    if (el instanceof PodlovePlayerElement) {
      if (!el.isInitialized) {
        const container = el.querySelector(".podlove-player-container");
        if (container && !el.isFacadeMode()) el.applyLoadingTheme(container);
      }
    }
  });
});
themeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-bs-theme', 'data-theme'],
});

const observeBodyTheme = () => {
  if (!document.body) {
    return;
  }
  themeObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-bs-theme', 'data-theme'],
  });
};

if (document.body) {
  observeBodyTheme();
} else {
  window.addEventListener("DOMContentLoaded", observeBodyTheme, { once: true });
}

if (typeof document !== "undefined") {
  document.addEventListener("htmx:beforeRequest", remaskVisiblePagingIframes, true);
}
