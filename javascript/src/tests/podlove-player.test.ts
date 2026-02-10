import { describe, it, expect, beforeEach, vi } from 'vitest';

// podlove-player.test.js
import '@testing-library/jest-dom';

// Import the component code
import '@/audio/podlove-player';


class IntersectionObserverMock {
  callback: IntersectionObserverCallback;
  observedElements: Set<Element>;

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.observedElements = new Set<Element>();
  }

  observe(target: Element) {
    this.observedElements.add(target);
  }

  unobserve(target: Element) {
    this.observedElements.delete(target);
  }

  disconnect() {
    this.observedElements.clear();
  }

  // Method to simulate intersection events
  trigger(entries: IntersectionObserverEntry[]) {
    const observedEntries = entries.filter(entry => this.observedElements.has(entry.target));
    if (observedEntries.length > 0) {
      this.callback(observedEntries, this);
    }
  }
}

globalThis.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;

// Mock the podlovePlayer function
global.podlovePlayer = vi.fn();

describe('PodlovePlayerElement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-bs-theme');
    global.podlovePlayer.mockReset();
  });

  const setupAndTrigger = (configUrl?: string) => {
    const element = document.createElement('podlove-player');
    element.setAttribute('id', 'audio_63');
    element.setAttribute('data-url', '/api/audios/podlove/63/post/75/');
    if (configUrl) {
      element.setAttribute('data-config', configUrl);
    }
    document.body.appendChild(element);

    const observerInstance = element.observer;
    const entries = [{ isIntersecting: true, target: element }];
    observerInstance.callback(entries, observerInstance);

    return element.querySelector('.podlove-player-host') as HTMLDivElement | null;
  };

  it('should define the custom element', () => {
    expect(customElements.get('podlove-player')).toBeDefined();
  });

  it('should render the placeholder container', () => {
    const element = document.createElement('podlove-player');
    document.body.appendChild(element);

    const container = element.querySelector('.podlove-player-container');
    expect(container).not.toBeNull();
  });

  it('should read the id and data-url attributes', () => {
    const element = document.createElement('podlove-player');
    element.setAttribute('id', 'audio_63');
    element.setAttribute('data-url', '/api/audios/podlove/63/post/75/');
    document.body.appendChild(element);

    expect(element.getAttribute('id')).toBe('audio_63');
    expect(element.getAttribute('data-url')).toBe('/api/audios/podlove/63/post/75/');
  });

  it('should set up an IntersectionObserver', () => {
    const observeSpy = vi.spyOn(IntersectionObserver.prototype, 'observe');
    const element = document.createElement('podlove-player');
    document.body.appendChild(element);

    expect(observeSpy).toHaveBeenCalledWith(element);
    observeSpy.mockRestore();
  });

  it('should initialize the player when in view', () => {
    const element = document.createElement('podlove-player');
    element.setAttribute('id', 'audio_63');
    element.setAttribute('data-url', '/api/audios/podlove/63/post/75/');
    document.body.appendChild(element);

    // Access the observer
    const observerInstance = element.observer;

    // Simulate the IntersectionObserver callback
    const entries = [{ isIntersecting: true, target: element }];
    observerInstance.callback(entries, observerInstance);

    // Check that podlovePlayer was called
    const playerHost = element.querySelector('.podlove-player-host') as HTMLDivElement | null;
    expect(playerHost).not.toBeNull();
    expect(global.podlovePlayer).toHaveBeenCalledWith(
      playerHost,
      '/api/audios/podlove/63/post/75/',
      '/api/audios/player_config/'
    );
  });

  it('should append the color scheme to the config url when theme is set', () => {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
    const playerHost = setupAndTrigger();
    expect(playerHost).not.toBeNull();
    expect(global.podlovePlayer).toHaveBeenCalledWith(
      playerHost,
      '/api/audios/podlove/63/post/75/',
      '/api/audios/player_config/?color_scheme=dark'
    );
  });

  it('should append the color scheme with existing query params', () => {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
    const playerHost = setupAndTrigger('/api/audios/player_config/?foo=bar');

    expect(playerHost).not.toBeNull();
    expect(global.podlovePlayer).toHaveBeenCalledWith(
      playerHost,
      '/api/audios/podlove/63/post/75/',
      '/api/audios/player_config/?foo=bar&color_scheme=dark'
    );
  });

  it('should append the color scheme before hash fragments', () => {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
    const playerHost = setupAndTrigger('/api/audios/player_config/#section');

    expect(playerHost).not.toBeNull();
    expect(global.podlovePlayer).toHaveBeenCalledWith(
      playerHost,
      '/api/audios/podlove/63/post/75/',
      '/api/audios/player_config/?color_scheme=dark#section'
    );
  });

  it('should append the color scheme with query params and hash', () => {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
    const playerHost = setupAndTrigger('/api/audios/player_config/?foo=bar#section');

    expect(playerHost).not.toBeNull();
    expect(global.podlovePlayer).toHaveBeenCalledWith(
      playerHost,
      '/api/audios/podlove/63/post/75/',
      '/api/audios/player_config/?foo=bar&color_scheme=dark#section'
    );
  });

  it('should not duplicate an existing color_scheme param', () => {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
    const playerHost = setupAndTrigger('/api/audios/player_config/?color_scheme=light');

    expect(playerHost).not.toBeNull();
    expect(global.podlovePlayer).toHaveBeenCalledWith(
      playerHost,
      '/api/audios/podlove/63/post/75/',
      '/api/audios/player_config/?color_scheme=light'
    );
  });

  it('should use the light color scheme when theme is light', () => {
    document.documentElement.setAttribute('data-bs-theme', 'light');
    const playerHost = setupAndTrigger();

    expect(playerHost).not.toBeNull();
    expect(global.podlovePlayer).toHaveBeenCalledWith(
      playerHost,
      '/api/audios/podlove/63/post/75/',
      '/api/audios/player_config/?color_scheme=light'
    );
  });

  it('should not initialize the player when not in view', () => {
    const element = document.createElement('podlove-player');
    element.setAttribute('id', 'audio_63');
    element.setAttribute('data-url', '/api/audios/podlove/63/post/75/');
    document.body.appendChild(element);

    // Access the observer
    const observerInstance = element.observer;

    // Simulate the IntersectionObserver callback with isIntersecting false
    const entries = [{ isIntersecting: false, target: element }];
    observerInstance.callback(entries, observerInstance);

    // Check that podlovePlayer was not called
    expect(global.podlovePlayer).not.toHaveBeenCalled();
  });

  it('should initialize the player only once', () => {
    const unobserveSpy = vi.spyOn(IntersectionObserver.prototype, 'unobserve');

    const element = document.createElement('podlove-player');
    element.setAttribute('id', 'audio_63');
    element.setAttribute('data-url', '/api/audios/podlove/63/post/75/');
    document.body.appendChild(element);

    // Access the observer instance
    const observerInstance = element.observer as IntersectionObserverMock;

    // Simulate the IntersectionObserver callback multiple times
    const entries = [{ isIntersecting: true, target: element } as IntersectionObserverEntry];

    // First trigger
    observerInstance.trigger(entries);

    // Check that podlovePlayer was called once
    expect(globalThis.podlovePlayer).toHaveBeenCalledTimes(1);

    // Second trigger (should not call podlovePlayer again)
    observerInstance.trigger(entries);

    // Check that podlovePlayer was still called only once
    expect(globalThis.podlovePlayer).toHaveBeenCalledTimes(1);

    // Check that unobserve was called
    expect(unobserveSpy).toHaveBeenCalledWith(element);

    unobserveSpy.mockRestore();
  });

  it('should reinitialize the player when reattached', () => {
    const element = document.createElement('podlove-player');
    element.setAttribute('id', 'audio_63');
    element.setAttribute('data-url', '/api/audios/podlove/63/post/75/');
    document.body.appendChild(element);

    const observerInstance = element.observer as IntersectionObserverMock;
    observerInstance.trigger([{ isIntersecting: true, target: element } as IntersectionObserverEntry]);

    expect(globalThis.podlovePlayer).toHaveBeenCalledTimes(1);

    document.body.removeChild(element);
    document.body.appendChild(element);

    const reattachObserver = element.observer as IntersectionObserverMock;
    reattachObserver.trigger([{ isIntersecting: true, target: element } as IntersectionObserverEntry]);

    expect(globalThis.podlovePlayer).toHaveBeenCalledTimes(2);
  });

  it('should unobserve the element when it is removed', () => {
    const unobserveSpy = vi.spyOn(IntersectionObserver.prototype, 'unobserve');

    const element = document.createElement('podlove-player');
    document.body.appendChild(element);
    document.body.removeChild(element);

    expect(unobserveSpy).toHaveBeenCalledWith(element);
    unobserveSpy.mockRestore();
  });

  describe('dark mode toggle', () => {
    it('should reinitialize with new config URL when data-bs-theme changes', async () => {
      document.documentElement.setAttribute('data-bs-theme', 'light');
      const playerHost = setupAndTrigger();
      expect(playerHost).not.toBeNull();
      expect(global.podlovePlayer).toHaveBeenCalledTimes(1);
      expect(global.podlovePlayer).toHaveBeenCalledWith(
        playerHost,
        '/api/audios/podlove/63/post/75/',
        '/api/audios/player_config/?color_scheme=light'
      );

      // Toggle to dark
      document.documentElement.setAttribute('data-bs-theme', 'dark');
      // MutationObserver fires asynchronously
      await new Promise((r) => setTimeout(r, 0));

      expect(global.podlovePlayer).toHaveBeenCalledTimes(2);
      const lastCall = global.podlovePlayer.mock.calls[1];
      expect(lastCall[1]).toBe('/api/audios/podlove/63/post/75/');
      expect(lastCall[2]).toBe('/api/audios/player_config/?color_scheme=dark');
    });

    it('should not reinitialize when color scheme has not changed', async () => {
      document.documentElement.setAttribute('data-bs-theme', 'light');
      // Flush pending MutationObserver callbacks (from beforeEach removeAttribute
      // and the setAttribute above) before creating the player
      await new Promise((r) => setTimeout(r, 0));

      setupAndTrigger();
      expect(global.podlovePlayer).toHaveBeenCalledTimes(1);

      // Set same value again
      document.documentElement.setAttribute('data-bs-theme', 'light');
      await new Promise((r) => setTimeout(r, 0));

      expect(global.podlovePlayer).toHaveBeenCalledTimes(1);
    });

    it('should replace the old player host element after reinitialization', async () => {
      document.documentElement.setAttribute('data-bs-theme', 'light');
      const element = document.createElement('podlove-player');
      element.setAttribute('id', 'audio_63');
      element.setAttribute('data-url', '/api/audios/podlove/63/post/75/');
      document.body.appendChild(element);

      const observerInstance = element.observer;
      observerInstance.callback([{ isIntersecting: true, target: element }], observerInstance);

      const oldHost = element.querySelector('.podlove-player-host');
      expect(oldHost).not.toBeNull();

      // Toggle to dark
      document.documentElement.setAttribute('data-bs-theme', 'dark');
      await new Promise((r) => setTimeout(r, 0));

      const newHost = element.querySelector('.podlove-player-host');
      expect(newHost).not.toBeNull();
      expect(newHost).not.toBe(oldHost);
      // Old host should no longer be in the DOM
      expect(oldHost!.parentElement).toBeNull();
    });

    it('should discard stale async callback when theme toggles during embed script load', async () => {
      // Remove the global podlovePlayer so the async loadEmbedScript path is taken
      const originalPodlovePlayer = global.podlovePlayer;
      delete (global as any).podlovePlayer;

      try {
        const element = document.createElement('podlove-player');
        element.setAttribute('id', 'audio_race');
        element.setAttribute('data-url', '/api/audios/podlove/1/post/1/');
        element.setAttribute('data-embed', '/embed.js');
        document.documentElement.setAttribute('data-bs-theme', 'light');
        document.body.appendChild(element);

        const observerInstance = element.observer;
        observerInstance.callback([{ isIntersecting: true, target: element }], observerInstance);

        // At this point, loadEmbedScript is pending (script tag added to head)
        // Player is "initialized" but podlovePlayer hasn't been called yet

        // Toggle theme while script is still loading
        document.documentElement.setAttribute('data-bs-theme', 'dark');
        await new Promise((r) => setTimeout(r, 0));

        // Now simulate the script finishing loading by restoring podlovePlayer
        // and firing the load event on the script
        (global as any).podlovePlayer = vi.fn();
        const scriptTag = document.querySelector('script[data-podlove-embed]');
        if (scriptTag) {
          scriptTag.setAttribute('data-podlove-embed-loaded', 'true');
          scriptTag.dispatchEvent(new Event('load'));
        }
        await new Promise((r) => setTimeout(r, 0));

        // The stale first init should have been discarded by the version guard.
        // Only the second init (dark theme) should have called podlovePlayer.
        const calls = (global.podlovePlayer as ReturnType<typeof vi.fn>).mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        for (const call of calls) {
          const configArg = call[2] as string;
          expect(configArg).toContain('color_scheme=dark');
          expect(configArg).not.toContain('color_scheme=light');
        }
      } finally {
        global.podlovePlayer = originalPodlovePlayer;
      }
    });

    it('should allow reinitialization after disconnect during pending embed load', async () => {
      const originalPodlovePlayer = global.podlovePlayer;
      delete (global as any).podlovePlayer;

      try {
        const element = document.createElement('podlove-player');
        element.setAttribute('id', 'audio_disconnect');
        element.setAttribute('data-url', '/api/audios/podlove/1/post/1/');
        element.setAttribute('data-embed', '/embed.js');
        document.body.appendChild(element);

        const observerInstance = element.observer;
        observerInstance.callback([{ isIntersecting: true, target: element }], observerInstance);

        // Element is "initialized" but embed script is still loading
        expect(element.isInitialized).toBe(true);

        // Disconnect while script is pending
        document.body.removeChild(element);
        expect(element.isInitialized).toBe(false);

        // Reattach — should be able to initialize again
        (global as any).podlovePlayer = vi.fn();
        document.body.appendChild(element);

        const reattachObserver = element.observer;
        reattachObserver.callback([{ isIntersecting: true, target: element }], reattachObserver);

        expect(element.isInitialized).toBe(true);
        expect(global.podlovePlayer).toHaveBeenCalledTimes(1);
      } finally {
        global.podlovePlayer = originalPodlovePlayer;
      }
    });

    it('should not reinitialize non-initialized players', async () => {
      document.documentElement.setAttribute('data-bs-theme', 'light');

      // Create element but do NOT trigger intersection observer
      const element = document.createElement('podlove-player');
      element.setAttribute('id', 'audio_99');
      element.setAttribute('data-url', '/api/audios/podlove/99/post/100/');
      document.body.appendChild(element);

      expect(global.podlovePlayer).not.toHaveBeenCalled();

      // Toggle theme
      document.documentElement.setAttribute('data-bs-theme', 'dark');
      await new Promise((r) => setTimeout(r, 0));

      // Player was never initialized, so it should not be called
      expect(global.podlovePlayer).not.toHaveBeenCalled();
    });
  });
});
