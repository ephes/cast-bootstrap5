// podlove-player.ts
declare const podlovePlayer:
  | ((playerDiv: HTMLElement, url: string, configUrl: string) => void)
  | undefined;

let embedScriptPromise: Promise<void> | null = null;
const EMBED_SCRIPT_ATTR = "data-podlove-embed";
const EMBED_SCRIPT_LOADED_ATTR = "data-podlove-embed-loaded";
const EMBED_SCRIPT_FAILED_ATTR = "data-podlove-embed-failed";

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
  constructor() {
    super();
    this.observer = null;
    this.shadow = this.attachShadow({ mode: 'open' });
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
    // Reserve space to prevent layout shifts
    const container = document.createElement('div');
    container.classList.add('podlove-player-container');

    // Apply styles
    const style = document.createElement('style');
    style.textContent = `
      .podlove-player-container {
        width: 100%;
        max-width: 936px;
        min-height: 300px;
        margin: 0 auto;
      }
      @media (max-width: 768px) {
        .podlove-player-container {
          max-width: 366px;
          min-height: 500px;
        }
      }
      .podlove-player-container iframe {
        width: 100%;
        height: 100%;
        border: none;
      }
    `;

    this.shadow.appendChild(style);
    this.shadow.appendChild(container);
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
    const container = this.shadow.querySelector('.podlove-player-container');
    const audioId = this.getAttribute('id') || `podlove-player-${Date.now()}`;
    const url = this.getAttribute('data-url');
    const configUrl = this.getAttribute('data-config') || '/api/audios/player_config/';
    const podloveTemplate = this.getAttribute('data-template');
    let embedUrl = this.getAttribute('data-embed') || 'https://cdn.podlove.org/web-player/5.x/embed.js';

    // If host ist localhost use local embed url
    const { hostname, port } = window.location;
    const playerDiv = document.createElement('div');
    playerDiv.id = audioId;

    // set the template attribute if it is set (needed for pp theme)
    if (podloveTemplate !== null) {
        playerDiv.setAttribute('data-template', podloveTemplate);
    }
    container.appendChild(playerDiv);

    if (typeof podlovePlayer === 'function') {
      // Initialize existing Podlove player
      podlovePlayer(playerDiv, url, configUrl);
    } else {
      // If in dev mode on localhost and embedUrl starts with a slash, use the local embedUrl
      // otherwise the vite url 5173 will be used -> which will not work
      if (hostname === 'localhost' && embedUrl.startsWith("/")) {
        embedUrl = `http://localhost:${port}${embedUrl}`;
      }
      loadEmbedScript(embedUrl)
        .then(() => {
          if (typeof podlovePlayer === "function") {
            podlovePlayer(playerDiv, url, configUrl);
            return;
          }
          throw new Error("Podlove embed script did not register.");
        })
        .catch(() => {
          // Intentionally silent: the placeholder remains and avoids console spam.
        });
    }
  }
}

console.log("Registering podlove-player!");
customElements.define('podlove-player', PodlovePlayerElement);
