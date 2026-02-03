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

  it('should not reinitialize the player when reattached', () => {
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

    expect(globalThis.podlovePlayer).toHaveBeenCalledTimes(1);
  });

  it('should unobserve the element when it is removed', () => {
    const unobserveSpy = vi.spyOn(IntersectionObserver.prototype, 'unobserve');

    const element = document.createElement('podlove-player');
    document.body.appendChild(element);
    document.body.removeChild(element);

    expect(unobserveSpy).toHaveBeenCalledWith(element);
    unobserveSpy.mockRestore();
  });
});
