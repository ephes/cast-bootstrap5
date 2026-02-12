// podlove-player.ts
declare const podlovePlayer:
  | ((playerTarget: HTMLElement | string, url: string, configUrl: string) => void)
  | undefined;

let embedScriptPromise: Promise<void> | null = null;
let playerInstanceCounter = 0;
let pageLoadPromise: Promise<void> | null = null;
let sharedObserver: IntersectionObserver | null = null;
let lastKnownColorScheme: string | null = null;
const EMBED_SCRIPT_ATTR = "data-podlove-embed";
const EMBED_SCRIPT_LOADED_ATTR = "data-podlove-embed-loaded";
const EMBED_SCRIPT_FAILED_ATTR = "data-podlove-embed-failed";
const PLAYER_STYLE_ID = "podlove-player-styles";
const COLOR_SCHEME_PARAM = "color_scheme";
const DARK_LOADING_BG = "#1e293b";
const LIGHT_LOADING_BG = "#ffffff";
const RESERVED_MIN_HEIGHT_DESKTOP_PX = 297;
const RESERVED_MIN_HEIGHT_MOBILE_PX = 309;
const IFRAME_REVEAL_DELAY_LIGHT_MS = 100;
const IFRAME_REVEAL_DELAY_DARK_MS = 700;
const IFRAME_REVEAL_TIMEOUT_MS = 2500;
const IFRAME_MASKED_ATTR = "data-cast-iframe-masked";
const CURTAIN_CLASS = "podlove-player-curtain";
const CURTAIN_FADE_MS = 220;
const CURTAIN_SETTLE_DELAY_LIGHT_MS = 120;
const CURTAIN_SETTLE_DELAY_DARK_MS = 450;

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

function getSharedObserver(): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const target = entry.target;
        if (target instanceof PodlovePlayerElement) {
          target.initializePlayer();
        }

        observer.unobserve(target);
      });
    });
  }

  return sharedObserver;
}

function loadEmbedScript(embedUrl: string): Promise<void> {
  if (typeof podlovePlayer === "function") {
    return Promise.resolve();
  }

  if (embedScriptPromise) {
    return embedScriptPromise;
  }

  embedScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[${EMBED_SCRIPT_ATTR}]`);
    if (existing) {
      if (
        existing.getAttribute(EMBED_SCRIPT_LOADED_ATTR) === "true" &&
        typeof podlovePlayer === "function"
      ) {
        resolve();
        return;
      }
      if (existing.getAttribute(EMBED_SCRIPT_FAILED_ATTR) === "true") {
        existing.remove();
      } else {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener(
          "error",
          () => {
            existing.setAttribute(EMBED_SCRIPT_FAILED_ATTR, "true");
            existing.remove();
            embedScriptPromise = null;
            reject(new Error("Failed to load Podlove embed script"));
          },
          { once: true }
        );
        return;
      }
    }

    const script = document.createElement("script");
    script.src = embedUrl;
    script.async = true;
    script.setAttribute(EMBED_SCRIPT_ATTR, "true");
    script.addEventListener(
      "load",
      () => {
        script.setAttribute(EMBED_SCRIPT_LOADED_ATTR, "true");
        resolve();
      },
      { once: true }
    );
    script.addEventListener(
      "error",
      () => {
        script.setAttribute(EMBED_SCRIPT_FAILED_ATTR, "true");
        script.remove();
        embedScriptPromise = null;
        reject(new Error("Failed to load Podlove embed script"));
      },
      { once: true }
    );
    document.head.appendChild(script);
  });

  return embedScriptPromise;
}

function parseRgbChannels(color: string): [number, number, number] | null {
  const match = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!match) {
    return null;
  }
  const [, r, g, b] = match;
  return [Number(r), Number(g), Number(b)];
}

function isTransparent(color: string): boolean {
  return color === "transparent" || color === "rgba(0, 0, 0, 0)";
}

function inferDarkFromColor(color: string): boolean | null {
  const rgb = parseRgbChannels(color);
  if (!rgb) {
    return null;
  }
  const [r, g, b] = rgb;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance < 0.5;
}

function inferDarkFromPageBackground(): boolean | null {
  const candidates = [document.body, document.documentElement];
  for (const element of candidates) {
    if (!element) {
      continue;
    }
    const bg = window.getComputedStyle(element).backgroundColor;
    if (!bg || isTransparent(bg)) {
      continue;
    }
    const inferred = inferDarkFromColor(bg);
    if (inferred !== null) {
      return inferred;
    }
  }
  return null;
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
  const inferred = inferDarkFromPageBackground();
  if (inferred !== null) {
    return inferred ? "dark" : "light";
  }
  return null;
}

function resolveLoadingBackground(host: HTMLElement): string {
  const candidates: Array<HTMLElement | null | undefined> = [
    host,
    host.parentElement,
    document.body,
    document.documentElement,
  ];
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    const bg = window.getComputedStyle(candidate).backgroundColor;
    if (bg && !isTransparent(bg)) {
      return bg;
    }
  }
  return LIGHT_LOADING_BG;
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

class PodlovePlayerElement extends HTMLElement {
  observer: IntersectionObserver | null;
  isInitialized: boolean;
  playerDiv: HTMLDivElement | null;
  initVersion: number;
  iframeObserver: MutationObserver | null;
  iframeRevealDelayTimeoutId: number | null;
  iframeRevealTimeoutId: number | null;
  iframeCurtainTimeoutId: number | null;

  constructor() {
    super();
    this.observer = null;
    this.isInitialized = false;
    this.playerDiv = null;
    this.initVersion = 0;
    this.iframeObserver = null;
    this.iframeRevealDelayTimeoutId = null;
    this.iframeRevealTimeoutId = null;
    this.iframeCurtainTimeoutId = null;
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
    this.isInitialized = false;
    delete this.dataset.playerInstanceId;
    this.initializePlayer();
  }

  connectedCallback() {
    this.renderPlaceholder();

    if (document.readyState === "complete") {
      this.observeElement();
      return;
    }

    waitForPageLoad().then(() => this.observeElement());
  }

  disconnectedCallback() {
    if (this.observer) {
      this.observer.unobserve(this);
    }
    this.clearIframeMasking();
    // Invalidate any in-flight async init and allow re-init on reattach
    this.initVersion += 1;
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
    if (this.iframeCurtainTimeoutId !== null) {
      window.clearTimeout(this.iframeCurtainTimeoutId);
      this.iframeCurtainTimeoutId = null;
    }
    this.querySelectorAll(`.${CURTAIN_CLASS}`).forEach((curtain) => curtain.remove());
  }

  applyReservedHeight(container: HTMLElement) {
    const reservedMinHeight = `${getReservedMinHeightPx()}px`;
    container.style.minHeight = reservedMinHeight;
    this.style.minHeight = reservedMinHeight;
  }

  maskIframeUntilReady(container: Element, expectedVersion: number) {
    if (!(container instanceof HTMLElement)) {
      return;
    }
    this.clearIframeMasking();
    const revealDelayMs =
      container.style.colorScheme === "dark" ? IFRAME_REVEAL_DELAY_DARK_MS : IFRAME_REVEAL_DELAY_LIGHT_MS;
    const settleDelayMs =
      container.style.colorScheme === "dark" ? CURTAIN_SETTLE_DELAY_DARK_MS : CURTAIN_SETTLE_DELAY_LIGHT_MS;

    const getOrCreateCurtain = (): HTMLDivElement => {
      const existing = container.querySelector(`.${CURTAIN_CLASS}`);
      if (existing instanceof HTMLDivElement) {
        existing.style.backgroundColor = container.style.backgroundColor || window.getComputedStyle(container).backgroundColor;
        existing.style.opacity = "1";
        return existing;
      }
      const curtain = document.createElement("div");
      curtain.classList.add(CURTAIN_CLASS);
      curtain.style.backgroundColor = container.style.backgroundColor || window.getComputedStyle(container).backgroundColor;
      container.appendChild(curtain);
      return curtain;
    };

    const reveal = (iframe: HTMLIFrameElement) => {
      if (this.initVersion !== expectedVersion) {
        return;
      }
      iframe.style.opacity = "1";
      iframe.style.pointerEvents = "";
      iframe.style.removeProperty("transition");
      iframe.style.removeProperty("background-color");
      iframe.style.removeProperty("color-scheme");
      iframe.removeAttribute(IFRAME_MASKED_ATTR);

      const curtain = getOrCreateCurtain();
      // This field intentionally tracks the currently pending curtain timer:
      // first settle timer (A), then fade-removal timer (B) once A fires.
      this.iframeCurtainTimeoutId = window.setTimeout(() => {
        if (this.initVersion !== expectedVersion) {
          return;
        }
        curtain.style.opacity = "0";
        this.iframeCurtainTimeoutId = window.setTimeout(() => {
          if (this.initVersion !== expectedVersion) {
            return;
          }
          curtain.remove();
          this.releaseReservedHeight(container);
          this.iframeCurtainTimeoutId = null;
        }, CURTAIN_FADE_MS);
      }, settleDelayMs);

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
      if (this.iframeRevealDelayTimeoutId !== null) {
        window.clearTimeout(this.iframeRevealDelayTimeoutId);
      }
      this.iframeRevealDelayTimeoutId = window.setTimeout(() => reveal(iframe), revealDelayMs);
    };

    const setupIframe = (iframe: HTMLIFrameElement) => {
      if (iframe.getAttribute(IFRAME_MASKED_ATTR) === "true") {
        return;
      }
      getOrCreateCurtain();
      iframe.setAttribute(IFRAME_MASKED_ATTR, "true");
      iframe.style.opacity = "0";
      iframe.style.pointerEvents = "none";
      iframe.style.transition = "opacity 160ms ease";
      iframe.style.backgroundColor = "inherit";
      iframe.style.colorScheme = "inherit";
      iframe.addEventListener("load", () => revealWithDelay(iframe), { once: true });
      this.iframeRevealTimeoutId = window.setTimeout(() => reveal(iframe), IFRAME_REVEAL_TIMEOUT_MS);
    };

    const existing = container.querySelector("iframe");
    if (existing instanceof HTMLIFrameElement) {
      setupIframe(existing);
      return;
    }

    this.iframeObserver = new MutationObserver(() => {
      const iframe = container.querySelector("iframe");
      if (!(iframe instanceof HTMLIFrameElement)) {
        return;
      }
      setupIframe(iframe);
      if (this.iframeObserver) {
        this.iframeObserver.disconnect();
        this.iframeObserver = null;
      }
    });
    this.iframeObserver.observe(container, { childList: true, subtree: true });
  }

  applyLoadingTheme(container: Element) {
    if (!(container instanceof HTMLElement)) {
      return;
    }
    const background = resolveLoadingBackground(this);
    const inferredDark = inferDarkFromColor(background);
    container.style.backgroundColor = background;
    container.style.colorScheme = inferredDark === true ? "dark" : "light";
  }

  renderPlaceholder() {
    if (this.querySelector('.podlove-player-container')) {
      return;
    }

    if (!document.getElementById(PLAYER_STYLE_ID)) {
      const style = document.createElement('style');
      style.id = PLAYER_STYLE_ID;
      style.textContent = `
        podlove-player .podlove-player-container {
          width: 100%;
          max-width: 936px;
          min-height: ${RESERVED_MIN_HEIGHT_DESKTOP_PX}px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
          background-color: ${LIGHT_LOADING_BG};
        }
        @media (max-width: 768px) {
          podlove-player .podlove-player-container {
            max-width: 366px;
            min-height: ${RESERVED_MIN_HEIGHT_MOBILE_PX}px;
          }
        }
        podlove-player .podlove-player-container .${CURTAIN_CLASS} {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 2;
          opacity: 1;
          transition: opacity ${CURTAIN_FADE_MS}ms ease;
        }
        podlove-player .podlove-player-host {
          position: relative;
          z-index: 1;
        }
        podlove-player .podlove-player-container iframe {
          width: 100%;
          height: 100%;
          border: none;
          background-color: inherit;
          color-scheme: inherit;
        }
        @media (prefers-color-scheme: dark) {
          podlove-player .podlove-player-container {
            background-color: ${DARK_LOADING_BG};
          }
          podlove-player .podlove-player-container iframe {
            background-color: ${DARK_LOADING_BG};
            color-scheme: dark;
          }
        }
        html[data-bs-theme="dark"] podlove-player .podlove-player-container,
        html[data-theme="dark"] podlove-player .podlove-player-container,
        body[data-bs-theme="dark"] podlove-player .podlove-player-container,
        body[data-theme="dark"] podlove-player .podlove-player-container {
          background-color: ${DARK_LOADING_BG};
        }
        html[data-bs-theme="dark"] podlove-player .podlove-player-container iframe,
        html[data-theme="dark"] podlove-player .podlove-player-container iframe,
        body[data-bs-theme="dark"] podlove-player .podlove-player-container iframe,
        body[data-theme="dark"] podlove-player .podlove-player-container iframe {
          background-color: ${DARK_LOADING_BG};
          color-scheme: dark;
        }
        html[data-bs-theme="light"] podlove-player .podlove-player-container,
        html[data-theme="light"] podlove-player .podlove-player-container,
        body[data-bs-theme="light"] podlove-player .podlove-player-container,
        body[data-theme="light"] podlove-player .podlove-player-container {
          background-color: ${LIGHT_LOADING_BG};
        }
        html[data-bs-theme="light"] podlove-player .podlove-player-container iframe,
        html[data-theme="light"] podlove-player .podlove-player-container iframe,
        body[data-bs-theme="light"] podlove-player .podlove-player-container iframe,
        body[data-theme="light"] podlove-player .podlove-player-container iframe {
          background-color: ${LIGHT_LOADING_BG};
          color-scheme: light;
        }
      `;
      document.head.appendChild(style);
    }

    // Reserve space to prevent layout shifts
    const container = document.createElement('div');
    container.classList.add('podlove-player-container');
    this.applyLoadingTheme(container);
    this.applyReservedHeight(container);

    this.appendChild(container);
  }

  observeElement() {
    this.observer = getSharedObserver();
    this.observer.observe(this);
  }

  initializePlayer() {
    if (this.isInitialized || !this.isConnected) {
      return;
    }

    const container = this.querySelector('.podlove-player-container');
    if (!container) {
      return;
    }
    if (container instanceof HTMLElement) {
      this.applyReservedHeight(container);
    }
    this.applyLoadingTheme(container);

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

    // If host is localhost use local embed url
    const { hostname, port } = window.location;
    const playerHost = this.getOrCreatePlayerDiv(container, playerId, podloveTemplate);

    if (typeof podlovePlayer === 'function') {
      // Initialize existing Podlove player
      podlovePlayer(playerHost, url, configUrl);
      this.maskIframeUntilReady(container, currentVersion);
    } else {
      // If in dev mode on localhost and embedUrl starts with a slash, use the local embedUrl
      // otherwise the vite url 5173 will be used -> which will not work
      if (hostname === 'localhost' && embedUrl.startsWith("/")) {
        embedUrl = `http://localhost:${port}${embedUrl}`;
      }
      loadEmbedScript(embedUrl)
        .then(() => {
          if (currentVersion !== this.initVersion || !this.isConnected) {
            return; // Stale: a reinitialize or disconnect happened while loading
          }
          if (typeof podlovePlayer === "function") {
            podlovePlayer(playerHost, url, configUrl);
            this.maskIframeUntilReady(container, currentVersion);
            return;
          }
          throw new Error("Podlove embed script did not register.");
        })
        .catch(() => {
          if (currentVersion === this.initVersion) {
            this.isInitialized = false;
            this.clearReservedHeight(container);
          }
          // Intentionally silent: the placeholder remains and avoids console spam.
        });
    }
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
      // Keep reserved space while loading, then release it after successful init.
      container.style.minHeight = "auto";
    }
    // Some consumers reserve space on the custom element itself.
    this.style.minHeight = "auto";
  }

  clearReservedHeight(container: Element) {
    if (container instanceof HTMLElement) {
      container.style.removeProperty("min-height");
    }
    this.style.removeProperty("min-height");
  }
}

customElements.define('podlove-player', PodlovePlayerElement);

// Watch for dark mode toggle and reinitialize players
lastKnownColorScheme = getColorScheme();
const themeObserver = new MutationObserver(() => {
  const newScheme = getColorScheme();
  if (newScheme === lastKnownColorScheme) {
    return;
  }
  lastKnownColorScheme = newScheme;
  document.querySelectorAll('podlove-player').forEach((el) => {
    if (el instanceof PodlovePlayerElement) {
      el.reinitializePlayer();
    }
  });
});
themeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-bs-theme'],
});
