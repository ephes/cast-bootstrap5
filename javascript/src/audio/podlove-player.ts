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

function getColorScheme(): string | null {
  const theme = document.documentElement.getAttribute("data-bs-theme");
  if (theme === "light" || theme === "dark") {
    return theme;
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
  const [path, query = ""] = base.split("?");
  const params = new URLSearchParams(query);
  if (!params.has(COLOR_SCHEME_PARAM)) {
    params.set(COLOR_SCHEME_PARAM, colorScheme);
  }
  const queryString = params.toString();
  const hashSuffix = hash ? `#${hash}` : "";
  return queryString ? `${path}?${queryString}${hashSuffix}` : `${path}${hashSuffix}`;
}
class PodlovePlayerElement extends HTMLElement {
  observer: IntersectionObserver | null;
  isInitialized: boolean;
  playerDiv: HTMLDivElement | null;
  initVersion: number;

  constructor() {
    super();
    this.observer = null;
    this.isInitialized = false;
    this.playerDiv = null;
    this.initVersion = 0;
  }

  reinitializePlayer() {
    if (!this.isInitialized || !this.isConnected) {
      return;
    }
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
    // Invalidate any in-flight async init and allow re-init on reattach
    this.initVersion += 1;
    this.isInitialized = false;
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
          min-height: 300px;
          margin: 0 auto;
        }
        @media (max-width: 768px) {
          podlove-player .podlove-player-container {
            max-width: 366px;
            min-height: 500px;
          }
        }
        podlove-player .podlove-player-container iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
      `;
      document.head.appendChild(style);
    }

    // Reserve space to prevent layout shifts
    const container = document.createElement('div');
    container.classList.add('podlove-player-container');

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
            return;
          }
          throw new Error("Podlove embed script did not register.");
        })
        .catch(() => {
          if (currentVersion === this.initVersion) {
            this.isInitialized = false;
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
