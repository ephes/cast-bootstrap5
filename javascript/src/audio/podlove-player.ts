// podlove-player.ts
declare const podlovePlayer:
  | ((playerTarget: HTMLElement | string, url: string, configUrl: string) => void)
  | undefined;

let embedScriptPromise: Promise<void> | null = null;
const EMBED_SCRIPT_ATTR = "data-podlove-embed";
const EMBED_SCRIPT_LOADED_ATTR = "data-podlove-embed-loaded";
const EMBED_SCRIPT_FAILED_ATTR = "data-podlove-embed-failed";
const PLAYER_STYLE_ID = "podlove-player-styles";

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
class PodlovePlayerElement extends HTMLElement {
  observer: IntersectionObserver | null;
  playerDiv: HTMLDivElement | null;

  constructor() {
    super();
    this.observer = null;
    this.playerDiv = null;
  }

  connectedCallback() {
    this.renderPlaceholder();

    if (document.readyState === 'complete') {
      // The page is already fully loaded
      this.observeElement();
    } else {
      // Wait for the 'load' event before initializing
      window.addEventListener('load', () => {
        this.observeElement();
      }, { once: true });
    }
  }

  disconnectedCallback() {
    if (this.observer) {
      this.observer.disconnect();
    }
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
    this.observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.initializePlayer();
          observer.unobserve(this);
        }
      });
    });
    this.observer.observe(this);
  }

  initializePlayer() {
    const container = this.querySelector('.podlove-player-container');
    if (!container) {
      return;
    }

    let audioId = this.getAttribute('id');
    if (!audioId) {
      audioId = `podlove-player-${Date.now()}`;
      this.setAttribute('id', audioId);
    }
    const playerId = `${audioId}-player`;

    const url = this.getAttribute('data-url');
    if (!url) {
      return;
    }
    const configUrl = this.getAttribute('data-config') || '/api/audios/player_config/';
    const podloveTemplate = this.getAttribute('data-template');
    let embedUrl = this.getAttribute('data-embed') || 'https://cdn.podlove.org/web-player/5.x/embed.js';

    // If host is localhost use local embed url
    const { hostname, port } = window.location;
    this.getOrCreatePlayerDiv(container, playerId, podloveTemplate);

    if (typeof podlovePlayer === 'function') {
      // Initialize existing Podlove player
      podlovePlayer(`#${playerId}`, url, configUrl);
    } else {
      // If in dev mode on localhost and embedUrl starts with a slash, use the local embedUrl
      // otherwise the vite url 5173 will be used -> which will not work
      if (hostname === 'localhost' && embedUrl.startsWith("/")) {
        embedUrl = `http://localhost:${port}${embedUrl}`;
      }
      loadEmbedScript(embedUrl)
        .then(() => {
          if (typeof podlovePlayer === "function") {
            podlovePlayer(`#${playerId}`, url, configUrl);
            return;
          }
          throw new Error("Podlove embed script did not register.");
        })
        .catch(() => {
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

console.log("Registering podlove-player!");
customElements.define('podlove-player', PodlovePlayerElement);
