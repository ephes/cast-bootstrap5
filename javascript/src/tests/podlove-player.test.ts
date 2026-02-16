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
    document.documentElement.removeAttribute('data-theme');
    document.body.removeAttribute('data-bs-theme');
    document.body.removeAttribute('data-theme');
    document.body.style.backgroundColor = '';
    document.documentElement.style.backgroundColor = '';
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

    // Click the facade play button to trigger player initialization
    const facadeBtn = element.querySelector('.podlove-player-facade-btn') as HTMLButtonElement | null;
    facadeBtn?.click();

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

    // Click facade to trigger initialization
    const facadeBtn = element.querySelector('.podlove-player-facade-btn') as HTMLButtonElement | null;
    facadeBtn?.click();

    // Check that podlovePlayer was called
    const playerHost = element.querySelector('.podlove-player-host') as HTMLDivElement | null;
    expect(playerHost).not.toBeNull();
    expect(global.podlovePlayer).toHaveBeenCalledWith(
      playerHost,
      '/api/audios/podlove/63/post/75/',
      '/api/audios/player_config/'
    );
  });

  it('should release reserved min-height only after reveal shield settles', () => {
    vi.useFakeTimers();
    const originalPodlovePlayer = global.podlovePlayer;
    global.podlovePlayer = vi.fn((playerHost: HTMLDivElement) => {
      const iframe = document.createElement('iframe');
      playerHost.appendChild(iframe);
    });

    try {
      const element = document.createElement('podlove-player');
      element.setAttribute('id', 'audio_63');
      element.setAttribute('data-url', '/api/audios/podlove/63/post/75/');
      document.body.appendChild(element);

      const container = element.querySelector('.podlove-player-container') as HTMLDivElement | null;
      expect(container).not.toBeNull();
      expect(container?.style.minHeight).toBe('297px');
      expect(element.style.minHeight).toBe('297px');

      const observerInstance = element.observer as IntersectionObserverMock;
      observerInstance.trigger([
        { isIntersecting: true, target: element } as IntersectionObserverEntry,
      ]);
      const facadeBtn = element.querySelector('.podlove-player-facade-btn') as HTMLButtonElement;
      facadeBtn.click();

      const iframe = element.querySelector('iframe') as HTMLIFrameElement | null;
      expect(iframe).not.toBeNull();
      iframe?.dispatchEvent(new Event('load'));

      // Not released before reveal delay.
      vi.advanceTimersByTime(99);
      expect(container?.style.minHeight).toBe('297px');
      expect(element.style.minHeight).toBe('297px');

      // Reveal starts at 100ms but shield hold/fade keeps reserved height.
      vi.advanceTimersByTime(200);
      expect(container?.style.minHeight).toBe('297px');
      expect(element.style.minHeight).toBe('297px');

      vi.advanceTimersByTime(1);
      expect(container?.style.minHeight).toBe('auto');
      expect(element.style.minHeight).toBe('auto');
    } finally {
      global.podlovePlayer = originalPodlovePlayer;
      vi.useRealTimers();
    }
  });

  it('should reserve mobile min-height when viewport media query matches', () => {
    const originalMatchMedia = globalThis.matchMedia;
    globalThis.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(max-width: 768px)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    try {
      const element = document.createElement('podlove-player');
      document.body.appendChild(element);

      const container = element.querySelector('.podlove-player-container') as HTMLDivElement | null;
      expect(container).not.toBeNull();
      expect(container?.style.minHeight).toBe('309px');
      expect(element.style.minHeight).toBe('309px');
    } finally {
      globalThis.matchMedia = originalMatchMedia;
    }
  });

  it('should keep iframe hidden until load event before revealing it', () => {
    vi.useFakeTimers();
    const originalPodlovePlayer = global.podlovePlayer;
    global.podlovePlayer = vi.fn((playerHost: HTMLDivElement) => {
      const iframe = document.createElement('iframe');
      playerHost.appendChild(iframe);
    });

    try {
      const element = document.createElement('podlove-player');
      element.setAttribute('id', 'audio_63');
      element.setAttribute('data-url', '/api/audios/podlove/63/post/75/');
      document.body.appendChild(element);

      const observerInstance = element.observer as IntersectionObserverMock;
      observerInstance.trigger([
        { isIntersecting: true, target: element } as IntersectionObserverEntry,
      ]);
      const facadeBtn = element.querySelector('.podlove-player-facade-btn') as HTMLButtonElement;
      facadeBtn.click();

      const iframe = element.querySelector('iframe') as HTMLIFrameElement | null;
      expect(iframe).not.toBeNull();
      expect(iframe?.style.opacity).toBe('0');
      expect(iframe?.style.pointerEvents).toBe('none');

      iframe?.dispatchEvent(new Event('load'));
      vi.advanceTimersByTime(99);
      expect(iframe?.style.opacity).toBe('0');

      vi.advanceTimersByTime(1);
      expect(iframe?.style.opacity).toBe('1');
      expect(iframe?.style.pointerEvents).toBe('');
    } finally {
      global.podlovePlayer = originalPodlovePlayer;
      vi.useRealTimers();
    }
  });

  it('should keep a reveal shield during iframe reveal and remove it after fade', () => {
    vi.useFakeTimers();
    const originalPodlovePlayer = global.podlovePlayer;
    global.podlovePlayer = vi.fn((playerHost: HTMLDivElement) => {
      const iframe = document.createElement('iframe');
      playerHost.appendChild(iframe);
    });

    try {
      const element = document.createElement('podlove-player');
      element.setAttribute('id', 'audio_63');
      element.setAttribute('data-url', '/api/audios/podlove/63/post/75/');
      document.body.appendChild(element);

      const observerInstance = element.observer as IntersectionObserverMock;
      observerInstance.trigger([
        { isIntersecting: true, target: element } as IntersectionObserverEntry,
      ]);
      const facadeBtn = element.querySelector('.podlove-player-facade-btn') as HTMLButtonElement;
      facadeBtn.click();

      const container = element.querySelector('.podlove-player-container') as HTMLDivElement | null;
      const iframe = element.querySelector('iframe') as HTMLIFrameElement | null;
      expect(container).not.toBeNull();
      expect(iframe).not.toBeNull();

      iframe?.dispatchEvent(new Event('load'));

      // Before reveal delay: shield exists and iframe is hidden.
      vi.advanceTimersByTime(99);
      let shield = element.querySelector('.podlove-player-reveal-shield') as HTMLDivElement | null;
      expect(shield).not.toBeNull();
      expect(iframe?.style.opacity).toBe('0');

      // Reveal at 100ms, shield still covering.
      vi.advanceTimersByTime(1);
      shield = element.querySelector('.podlove-player-reveal-shield') as HTMLDivElement | null;
      expect(iframe?.style.opacity).toBe('1');
      expect(shield?.style.opacity).toBe('1');

      // Hold + fade window.
      vi.advanceTimersByTime(80);
      expect(shield?.style.opacity).toBe('0');
      vi.advanceTimersByTime(119);
      expect(element.querySelector('.podlove-player-reveal-shield')).not.toBeNull();
      vi.advanceTimersByTime(1);
      expect(element.querySelector('.podlove-player-reveal-shield')).toBeNull();
    } finally {
      global.podlovePlayer = originalPodlovePlayer;
      vi.useRealTimers();
    }
  });

  it('should reveal iframe via timeout fallback when load does not fire', () => {
    vi.useFakeTimers();
    const originalPodlovePlayer = global.podlovePlayer;
    global.podlovePlayer = vi.fn((playerHost: HTMLDivElement) => {
      const iframe = document.createElement('iframe');
      playerHost.appendChild(iframe);
    });

    try {
      const element = document.createElement('podlove-player');
      element.setAttribute('id', 'audio_63');
      element.setAttribute('data-url', '/api/audios/podlove/63/post/75/');
      document.body.appendChild(element);

      const observerInstance = element.observer as IntersectionObserverMock;
      observerInstance.trigger([
        { isIntersecting: true, target: element } as IntersectionObserverEntry,
      ]);
      const facadeBtn = element.querySelector('.podlove-player-facade-btn') as HTMLButtonElement;
      facadeBtn.click();

      const iframe = element.querySelector('iframe') as HTMLIFrameElement | null;
      expect(iframe).not.toBeNull();
      expect(iframe?.style.opacity).toBe('0');

      vi.advanceTimersByTime(2499);
      expect(iframe?.style.opacity).toBe('0');
      vi.advanceTimersByTime(1);

      expect(iframe?.style.opacity).toBe('1');
    } finally {
      global.podlovePlayer = originalPodlovePlayer;
      vi.useRealTimers();
    }
  });

  it('should use a longer reveal timeout fallback in dark mode', () => {
    vi.useFakeTimers();
    const originalPodlovePlayer = global.podlovePlayer;
    global.podlovePlayer = vi.fn((playerHost: HTMLDivElement) => {
      const iframe = document.createElement('iframe');
      playerHost.appendChild(iframe);
    });

    try {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
      const element = document.createElement('podlove-player');
      element.setAttribute('id', 'audio_63');
      element.setAttribute('data-url', '/api/audios/podlove/63/post/75/');
      document.body.appendChild(element);

      const observerInstance = element.observer as IntersectionObserverMock;
      observerInstance.trigger([
        { isIntersecting: true, target: element } as IntersectionObserverEntry,
      ]);
      const facadeBtn = element.querySelector('.podlove-player-facade-btn') as HTMLButtonElement;
      facadeBtn.click();

      const iframe = element.querySelector('iframe') as HTMLIFrameElement | null;
      expect(iframe).not.toBeNull();
      expect(iframe?.style.opacity).toBe('0');

      // Light-mode timeout (2500ms) should NOT reveal in dark mode.
      vi.advanceTimersByTime(2500);
      expect(iframe?.style.opacity).toBe('0');

      // Dark-mode extended timeout (8000ms) should reveal.
      vi.advanceTimersByTime(5499);
      expect(iframe?.style.opacity).toBe('0');
      vi.advanceTimersByTime(1);
      expect(iframe?.style.opacity).toBe('1');
    } finally {
      global.podlovePlayer = originalPodlovePlayer;
      vi.useRealTimers();
    }
  });

  it('should use a longer reveal delay for dark-mode loading fallback', () => {
    vi.useFakeTimers();
    const originalPodlovePlayer = global.podlovePlayer;
    global.podlovePlayer = vi.fn((playerHost: HTMLDivElement) => {
      const iframe = document.createElement('iframe');
      playerHost.appendChild(iframe);
    });

    try {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
      const element = document.createElement('podlove-player');
      element.setAttribute('id', 'audio_63');
      element.setAttribute('data-url', '/api/audios/podlove/63/post/75/');
      document.body.appendChild(element);

      const observerInstance = element.observer as IntersectionObserverMock;
      observerInstance.trigger([
        { isIntersecting: true, target: element } as IntersectionObserverEntry,
      ]);
      const facadeBtn = element.querySelector('.podlove-player-facade-btn') as HTMLButtonElement;
      facadeBtn.click();

      const iframe = element.querySelector('iframe') as HTMLIFrameElement | null;
      expect(iframe).not.toBeNull();
      expect(iframe?.style.opacity).toBe('0');

      iframe?.dispatchEvent(new Event('load'));
      vi.advanceTimersByTime(899);
      expect(iframe?.style.opacity).toBe('0');
      vi.advanceTimersByTime(1);

      expect(iframe?.style.opacity).toBe('1');
    } finally {
      global.podlovePlayer = originalPodlovePlayer;
      vi.useRealTimers();
    }
  });

  it('should mask asynchronously created iframe via observer path', async () => {
    vi.useFakeTimers();
    const originalPodlovePlayer = global.podlovePlayer;
    global.podlovePlayer = vi.fn((playerHost: HTMLDivElement) => {
      window.setTimeout(() => {
        const iframe = document.createElement('iframe');
        playerHost.appendChild(iframe);
      }, 0);
    });

    try {
      const element = document.createElement('podlove-player');
      element.setAttribute('id', 'audio_63');
      element.setAttribute('data-url', '/api/audios/podlove/63/post/75/');
      document.body.appendChild(element);

      const observerInstance = element.observer as IntersectionObserverMock;
      observerInstance.trigger([
        { isIntersecting: true, target: element } as IntersectionObserverEntry,
      ]);
      const facadeBtn = element.querySelector('.podlove-player-facade-btn') as HTMLButtonElement;
      facadeBtn.click();
      vi.advanceTimersByTime(1); // flush inner setTimeout(0) from podlovePlayer mock
      await Promise.resolve();

      const iframe = element.querySelector('iframe') as HTMLIFrameElement | null;
      expect(iframe).not.toBeNull();
      expect(iframe?.getAttribute('data-cast-iframe-masked')).toBe('true');
      expect(iframe?.style.opacity).toBe('0');

      iframe?.dispatchEvent(new Event('load'));
      vi.advanceTimersByTime(100);

      expect(iframe?.style.opacity).toBe('1');
      expect(iframe?.getAttribute('data-cast-iframe-masked')).toBeNull();
    } finally {
      global.podlovePlayer = originalPodlovePlayer;
      vi.useRealTimers();
    }
  });

  it('should keep replacement iframes masked until the latest iframe is ready', async () => {
    vi.useFakeTimers();
    const originalPodlovePlayer = global.podlovePlayer;
    global.podlovePlayer = vi.fn((playerHost: HTMLDivElement) => {
      const first = document.createElement('iframe');
      playerHost.appendChild(first);
      window.setTimeout(() => {
        first.remove();
        const second = document.createElement('iframe');
        playerHost.appendChild(second);
      }, 10);
    });

    try {
      const element = document.createElement('podlove-player');
      element.setAttribute('id', 'audio_63');
      element.setAttribute('data-url', '/api/audios/podlove/63/post/75/');
      document.body.appendChild(element);

      const observerInstance = element.observer as IntersectionObserverMock;
      observerInstance.trigger([
        { isIntersecting: true, target: element } as IntersectionObserverEntry,
      ]);
      const facadeBtn = element.querySelector('.podlove-player-facade-btn') as HTMLButtonElement;
      facadeBtn.click();

      const container = element.querySelector('.podlove-player-container') as HTMLDivElement | null;
      expect(container?.getAttribute('data-cast-mask-active')).toBe('true');

      const firstIframe = element.querySelector('iframe') as HTMLIFrameElement | null;
      expect(firstIframe).not.toBeNull();
      expect(firstIframe?.getAttribute('data-cast-iframe-masked')).toBe('true');
      expect(firstIframe?.style.opacity).toBe('0');

      vi.advanceTimersByTime(10);
      await Promise.resolve();

      const replacementIframe = element.querySelector('iframe') as HTMLIFrameElement | null;
      expect(replacementIframe).not.toBeNull();
      expect(replacementIframe).not.toBe(firstIframe);
      expect(replacementIframe?.getAttribute('data-cast-iframe-masked')).toBe('true');
      expect(replacementIframe?.style.opacity).toBe('0');

      replacementIframe?.dispatchEvent(new Event('load'));
      vi.advanceTimersByTime(99);
      expect(replacementIframe?.style.opacity).toBe('0');
      expect(container?.getAttribute('data-cast-mask-active')).toBe('true');

      vi.advanceTimersByTime(1);
      expect(replacementIframe?.style.opacity).toBe('1');
      expect(replacementIframe?.getAttribute('data-cast-iframe-masked')).toBeNull();
      expect(container?.getAttribute('data-cast-mask-active')).toBeNull();
    } finally {
      global.podlovePlayer = originalPodlovePlayer;
      vi.useRealTimers();
    }
  });

  it('should remask visible paging-area iframes on pagination beforeRequest and restore them on timeout', () => {
    vi.useFakeTimers();

    try {
      const pagingArea = document.createElement('div');
      pagingArea.id = 'paging-area';
      const pagination = document.createElement('ul');
      pagination.className = 'pagination';
      const paginationLink = document.createElement('a');
      paginationLink.className = 'page-link';
      pagination.appendChild(paginationLink);

      const element = document.createElement('podlove-player');
      pagingArea.appendChild(element);
      pagingArea.appendChild(pagination);
      document.body.appendChild(pagingArea);

      const container = element.querySelector('.podlove-player-container') as HTMLDivElement | null;
      expect(container).not.toBeNull();

      const iframe = document.createElement('iframe');
      container?.appendChild(iframe);
      iframe.style.opacity = '1';
      iframe.style.pointerEvents = 'auto';

      paginationLink.dispatchEvent(new CustomEvent('htmx:beforeRequest', { bubbles: true, cancelable: true }));

      expect(container?.getAttribute('data-cast-mask-active')).toBe('true');
      expect(iframe.getAttribute('data-cast-iframe-masked')).toBe('true');
      expect(iframe.getAttribute('data-cast-paging-remask')).toBe('true');
      expect(iframe.style.opacity).toBe('0');
      expect(iframe.style.pointerEvents).toBe('none');

      vi.advanceTimersByTime(1599);
      expect(iframe.getAttribute('data-cast-paging-remask')).toBe('true');
      expect(container?.getAttribute('data-cast-mask-active')).toBe('true');

      vi.advanceTimersByTime(1);
      expect(iframe.getAttribute('data-cast-paging-remask')).toBeNull();
      expect(iframe.getAttribute('data-cast-iframe-masked')).toBeNull();
      expect(iframe.style.opacity).toBe('1');
      expect(iframe.style.pointerEvents).toBe('');
      expect(container?.getAttribute('data-cast-mask-active')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('should keep reveal deferred while paging mask is active even when iframe load fires', async () => {
    vi.useFakeTimers();
    const originalPodlovePlayer = global.podlovePlayer;
    global.podlovePlayer = vi.fn((playerHost: HTMLDivElement) => {
      const iframe = document.createElement('iframe');
      playerHost.appendChild(iframe);
    });

    try {
      const pagingArea = document.createElement('div');
      pagingArea.id = 'paging-area';
      const pagination = document.createElement('ul');
      pagination.className = 'pagination';
      const paginationLink = document.createElement('a');
      paginationLink.className = 'page-link';
      pagination.appendChild(paginationLink);

      const element = document.createElement('podlove-player');
      element.setAttribute('id', 'audio_63');
      element.setAttribute('data-url', '/api/audios/podlove/63/post/75/');
      pagingArea.appendChild(element);
      pagingArea.appendChild(pagination);
      document.body.appendChild(pagingArea);

      const observerInstance = element.observer as IntersectionObserverMock;
      observerInstance.trigger([
        { isIntersecting: true, target: element } as IntersectionObserverEntry,
      ]);
      const facadeBtn = element.querySelector('.podlove-player-facade-btn') as HTMLButtonElement;
      facadeBtn.click();

      const container = element.querySelector('.podlove-player-container') as HTMLDivElement | null;
      const iframe = element.querySelector('iframe') as HTMLIFrameElement | null;
      expect(container).not.toBeNull();
      expect(iframe).not.toBeNull();

      iframe?.dispatchEvent(new Event('load'));
      vi.advanceTimersByTime(100);
      expect(iframe?.style.opacity).toBe('1');

      pagingArea.setAttribute('data-cast-paging-mask-active', 'true');
      paginationLink.dispatchEvent(new CustomEvent('htmx:beforeRequest', { bubbles: true, cancelable: true }));
      expect(iframe?.getAttribute('data-cast-paging-remask')).toBe('true');
      expect(iframe?.style.opacity).toBe('0');

      const replacementIframe = document.createElement('iframe');
      container?.appendChild(replacementIframe);
      await Promise.resolve();

      expect(replacementIframe.getAttribute('data-cast-iframe-masked')).toBe('true');
      replacementIframe.dispatchEvent(new Event('load'));

      vi.advanceTimersByTime(100);
      expect(replacementIframe.style.opacity).toBe('0');
      expect(replacementIframe.getAttribute('data-cast-iframe-masked')).toBe('true');
      expect(container?.getAttribute('data-cast-mask-active')).toBe('true');

      pagingArea.removeAttribute('data-cast-paging-mask-active');
      vi.advanceTimersByTime(50);
      expect(replacementIframe.style.opacity).toBe('1');
      expect(replacementIframe.getAttribute('data-cast-iframe-masked')).toBeNull();
      expect(container?.getAttribute('data-cast-mask-active')).toBeNull();
    } finally {
      global.podlovePlayer = originalPodlovePlayer;
      vi.useRealTimers();
    }
  });

  it('should inject dark loading styles to avoid iframe white flashes', () => {
    const element = document.createElement('podlove-player');
    document.body.appendChild(element);

    const style = document.getElementById('podlove-player-styles');
    expect(style).not.toBeNull();
    expect(style?.textContent).toContain('color-scheme: dark');
    expect(style?.textContent).toContain('var(--cast-bg-alt');
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

  it('should include explicit-light background reset styles to override dark media query', () => {
    const element = document.createElement('podlove-player');
    document.body.appendChild(element);

    const style = document.getElementById('podlove-player-styles');
    expect(style).not.toBeNull();
    expect(style?.textContent).toContain('html[data-bs-theme="light"] podlove-player .podlove-player-container');
    expect(style?.textContent).toContain('var(--cast-surface');
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

  it('should keep explicit light mode when OS preference is dark', () => {
    document.documentElement.setAttribute('data-bs-theme', 'light');
    const originalMatchMedia = globalThis.matchMedia;
    globalThis.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    try {
      const playerHost = setupAndTrigger();

      expect(playerHost).not.toBeNull();
      expect(global.podlovePlayer).toHaveBeenCalledWith(
        playerHost,
        '/api/audios/podlove/63/post/75/',
        '/api/audios/player_config/?color_scheme=light'
      );
    } finally {
      globalThis.matchMedia = originalMatchMedia;
    }
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

    // First trigger — shows facade
    observerInstance.trigger(entries);

    // Click facade to initialize
    const facadeBtn = element.querySelector('.podlove-player-facade-btn') as HTMLButtonElement;
    facadeBtn.click();

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

    let facadeBtn = element.querySelector('.podlove-player-facade-btn') as HTMLButtonElement;
    facadeBtn.click();

    expect(globalThis.podlovePlayer).toHaveBeenCalledTimes(1);

    document.body.removeChild(element);
    document.body.appendChild(element);

    const reattachObserver = element.observer as IntersectionObserverMock;
    reattachObserver.trigger([{ isIntersecting: true, target: element } as IntersectionObserverEntry]);

    facadeBtn = element.querySelector('.podlove-player-facade-btn') as HTMLButtonElement;
    facadeBtn.click();

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

  it('should clear inline reserved min-height when embed script load fails', async () => {
    const originalPodlovePlayer = global.podlovePlayer;
    const originalMatchMedia = globalThis.matchMedia;
    globalThis.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    delete (global as any).podlovePlayer;

    try {
      const element = document.createElement('podlove-player');
      element.setAttribute('id', 'audio_error');
      element.setAttribute('data-url', '/api/audios/podlove/63/post/75/');
      document.body.appendChild(element);

      const container = element.querySelector('.podlove-player-container') as HTMLDivElement | null;
      expect(container).not.toBeNull();
      expect(container?.style.minHeight).toBe('297px');
      expect(element.style.minHeight).toBe('297px');

      const observerInstance = element.observer as IntersectionObserverMock;
      observerInstance.trigger([
        { isIntersecting: true, target: element } as IntersectionObserverEntry,
      ]);

      const facadeBtn = element.querySelector('.podlove-player-facade-btn') as HTMLButtonElement;
      facadeBtn.click();

      const script = document.querySelector('script[data-podlove-embed]') as HTMLScriptElement | null;
      expect(script).not.toBeNull();
      script?.dispatchEvent(new Event('error'));

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(element.isInitialized).toBe(false);
      expect(container?.style.minHeight).toBe('');
      expect(element.style.minHeight).toBe('');
    } finally {
      global.podlovePlayer = originalPodlovePlayer;
      globalThis.matchMedia = originalMatchMedia;
    }
  });

  describe('dark mode toggle', () => {
    it('should reinitialize with new config URL when data-bs-theme changes', async () => {
      document.documentElement.setAttribute('data-bs-theme', 'light');
      await new Promise((r) => setTimeout(r, 0));
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
      await new Promise((r) => setTimeout(r, 0));
      const element = document.createElement('podlove-player');
      element.setAttribute('id', 'audio_63');
      element.setAttribute('data-url', '/api/audios/podlove/63/post/75/');
      document.body.appendChild(element);

      const observerInstance = element.observer;
      observerInstance.callback([{ isIntersecting: true, target: element }], observerInstance);

      const facadeBtn = element.querySelector('.podlove-player-facade-btn') as HTMLButtonElement;
      facadeBtn.click();

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
        await new Promise((r) => setTimeout(r, 0));
        document.body.appendChild(element);

        const observerInstance = element.observer;
        observerInstance.callback([{ isIntersecting: true, target: element }], observerInstance);

        const facadeBtn = element.querySelector('.podlove-player-facade-btn') as HTMLButtonElement;
        facadeBtn.click();

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

        let facadeBtn = element.querySelector('.podlove-player-facade-btn') as HTMLButtonElement;
        facadeBtn.click();

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

        facadeBtn = element.querySelector('.podlove-player-facade-btn') as HTMLButtonElement;
        facadeBtn.click();

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

  describe('facade pattern', () => {
    it('should show facade play button when element enters viewport', () => {
      const element = document.createElement('podlove-player');
      element.setAttribute('data-url', '/api/audios/podlove/63/post/75/');
      document.body.appendChild(element);

      const observerInstance = element.observer as IntersectionObserverMock;
      observerInstance.trigger([
        { isIntersecting: true, target: element } as IntersectionObserverEntry,
      ]);

      const facadeBtn = element.querySelector('.podlove-player-facade-btn');
      expect(facadeBtn).not.toBeNull();
      expect(facadeBtn?.getAttribute('aria-label')).toBe('Play');
      expect(global.podlovePlayer).not.toHaveBeenCalled();
    });

    it('should initialize player when facade button is clicked', () => {
      const element = document.createElement('podlove-player');
      element.setAttribute('id', 'audio_63');
      element.setAttribute('data-url', '/api/audios/podlove/63/post/75/');
      document.body.appendChild(element);

      const observerInstance = element.observer as IntersectionObserverMock;
      observerInstance.trigger([
        { isIntersecting: true, target: element } as IntersectionObserverEntry,
      ]);

      expect(global.podlovePlayer).not.toHaveBeenCalled();

      const facadeBtn = element.querySelector('.podlove-player-facade-btn') as HTMLButtonElement;
      facadeBtn.click();

      expect(global.podlovePlayer).toHaveBeenCalledTimes(1);
      expect(element.querySelector('.podlove-player-facade-btn')).toBeNull();
    });

    it('should show loading spinner after facade click', () => {
      const originalPodlovePlayer = global.podlovePlayer;
      global.podlovePlayer = undefined;

      try {
        const element = document.createElement('podlove-player');
        element.setAttribute('id', 'audio_63');
        element.setAttribute('data-url', '/api/audios/podlove/63/post/75/');
        document.body.appendChild(element);

        const observerInstance = element.observer as IntersectionObserverMock;
        observerInstance.trigger([
          { isIntersecting: true, target: element } as IntersectionObserverEntry,
        ]);

        const facadeBtn = element.querySelector('.podlove-player-facade-btn') as HTMLButtonElement;
        facadeBtn.click();

        const spinner = element.querySelector('.podlove-player-facade-loading');
        expect(spinner).not.toBeNull();
      } finally {
        global.podlovePlayer = originalPodlovePlayer;
      }
    });

    it('should remove loading spinner when iframe is detected', () => {
      const originalPodlovePlayer = global.podlovePlayer;
      global.podlovePlayer = vi.fn((playerHost: HTMLDivElement) => {
        const iframe = document.createElement('iframe');
        playerHost.appendChild(iframe);
      });

      try {
        const element = document.createElement('podlove-player');
        element.setAttribute('id', 'audio_63');
        element.setAttribute('data-url', '/api/audios/podlove/63/post/75/');
        document.body.appendChild(element);

        const observerInstance = element.observer as IntersectionObserverMock;
        observerInstance.trigger([
          { isIntersecting: true, target: element } as IntersectionObserverEntry,
        ]);

        const facadeBtn = element.querySelector('.podlove-player-facade-btn') as HTMLButtonElement;
        facadeBtn.click();

        // Spinner should be removed because iframe masking took over
        expect(element.querySelector('.podlove-player-facade-loading')).toBeNull();
      } finally {
        global.podlovePlayer = originalPodlovePlayer;
      }
    });

    it('should not show facade for already-initialized player', () => {
      const element = document.createElement('podlove-player');
      element.setAttribute('id', 'audio_63');
      element.setAttribute('data-url', '/api/audios/podlove/63/post/75/');
      document.body.appendChild(element);

      const observerInstance = element.observer as IntersectionObserverMock;
      observerInstance.trigger([
        { isIntersecting: true, target: element } as IntersectionObserverEntry,
      ]);

      const facadeBtn = element.querySelector('.podlove-player-facade-btn') as HTMLButtonElement;
      facadeBtn.click();

      // Try to show facade again
      (element as any).showFacade();

      expect(element.querySelector('.podlove-player-facade-btn')).toBeNull();
    });

    it('should not show facade when data-url is missing', () => {
      const element = document.createElement('podlove-player');
      document.body.appendChild(element);

      const observerInstance = element.observer as IntersectionObserverMock;
      observerInstance.trigger([
        { isIntersecting: true, target: element } as IntersectionObserverEntry,
      ]);

      expect(element.querySelector('.podlove-player-facade-btn')).toBeNull();
    });

    it('should remove loading spinner on embed script failure', async () => {
      const originalPodlovePlayer = global.podlovePlayer;
      const originalMatchMedia = globalThis.matchMedia;
      globalThis.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      delete (global as any).podlovePlayer;

      try {
        const element = document.createElement('podlove-player');
        element.setAttribute('data-url', '/api/audios/podlove/63/post/75/');
        document.body.appendChild(element);

        const observerInstance = element.observer as IntersectionObserverMock;
        observerInstance.trigger([
          { isIntersecting: true, target: element } as IntersectionObserverEntry,
        ]);

        const facadeBtn = element.querySelector('.podlove-player-facade-btn') as HTMLButtonElement;
        facadeBtn.click();

        expect(element.querySelector('.podlove-player-facade-loading')).not.toBeNull();

        const script = document.querySelector('script[data-podlove-embed]') as HTMLScriptElement | null;
        script?.dispatchEvent(new Event('error'));

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(element.querySelector('.podlove-player-facade-loading')).toBeNull();
      } finally {
        global.podlovePlayer = originalPodlovePlayer;
        globalThis.matchMedia = originalMatchMedia;
      }
    });

    it('should show facade on each player when multiple intersect simultaneously', () => {
      const elements = [1, 2, 3].map((i) => {
        const el = document.createElement('podlove-player');
        el.setAttribute('id', `audio_multi_${i}`);
        el.setAttribute('data-url', `/api/audios/podlove/${i}/post/${i}/`);
        document.body.appendChild(el);
        return el;
      });

      const observer = elements[0].observer as IntersectionObserverMock;
      observer.trigger(
        elements.map((el) => ({ isIntersecting: true, target: el } as IntersectionObserverEntry))
      );

      // All should have facade buttons, none initialized yet
      elements.forEach((el) => {
        expect(el.querySelector('.podlove-player-facade-btn')).not.toBeNull();
      });
      expect(global.podlovePlayer).not.toHaveBeenCalled();

      // Click all facades
      elements.forEach((el) => {
        const btn = el.querySelector('.podlove-player-facade-btn') as HTMLButtonElement;
        btn.click();
      });

      expect(global.podlovePlayer).toHaveBeenCalledTimes(3);
    });

    it('should clean up spinner and facade button on disconnect then reattach cleanly', () => {
      const originalPodlovePlayer = global.podlovePlayer;
      global.podlovePlayer = undefined;

      try {
        const element = document.createElement('podlove-player');
        element.setAttribute('id', 'audio_disconnect_spinner');
        element.setAttribute('data-url', '/api/audios/podlove/63/post/75/');
        document.body.appendChild(element);

        const observerInstance = element.observer as IntersectionObserverMock;
        observerInstance.trigger([
          { isIntersecting: true, target: element } as IntersectionObserverEntry,
        ]);

        // Click facade — spinner appears (embed script loading)
        const facadeBtn = element.querySelector('.podlove-player-facade-btn') as HTMLButtonElement;
        facadeBtn.click();
        expect(element.querySelector('.podlove-player-facade-loading')).not.toBeNull();

        // Disconnect while spinner is visible
        document.body.removeChild(element);

        // Spinner and facade button should be cleaned up
        expect(element.querySelector('.podlove-player-facade-loading')).toBeNull();
        expect(element.querySelector('.podlove-player-facade-btn')).toBeNull();

        // Reattach — should get a clean facade, not a stale spinner
        (global as any).podlovePlayer = vi.fn();
        document.body.appendChild(element);

        const reattachObserver = element.observer as IntersectionObserverMock;
        reattachObserver.trigger([
          { isIntersecting: true, target: element } as IntersectionObserverEntry,
        ]);

        expect(element.querySelector('.podlove-player-facade-btn')).not.toBeNull();
        expect(element.querySelector('.podlove-player-facade-loading')).toBeNull();
      } finally {
        global.podlovePlayer = originalPodlovePlayer;
      }
    });

    it('should not leave spinner when handleFacadeClick is called without data-url', () => {
      const element = document.createElement('podlove-player');
      // No data-url set
      document.body.appendChild(element);

      // Programmatically call handleFacadeClick
      (element as any).handleFacadeClick();

      // No spinner should be left behind
      expect(element.querySelector('.podlove-player-facade-loading')).toBeNull();
    });
  });

  describe('server-rendered facade mode', () => {
    /** Helper: create a podlove-player with server-rendered facade HTML inside. */
    function createFacadeElement(opts?: { withCover?: boolean }): HTMLElement {
      const element = document.createElement('podlove-player');
      element.setAttribute('id', 'audio_facade');
      element.setAttribute('data-url', '/api/audios/podlove/63/post/75/');
      element.setAttribute('data-load-mode', 'facade');

      // Simulate server-rendered HTML inside the element
      const container = document.createElement('div');
      container.className = 'podlove-player-container podlove-facade';

      const inner = document.createElement('div');
      inner.className = 'podlove-facade-inner';

      const header = document.createElement('div');
      header.className = 'podlove-facade-header';

      if (opts?.withCover) {
        const img = document.createElement('img');
        img.className = 'podlove-facade-cover';
        img.src = '/media/cover.jpg';
        img.alt = 'Episode Cover';
        header.appendChild(img);
      }

      const info = document.createElement('div');
      info.className = 'podlove-facade-info';
      const title = document.createElement('div');
      title.className = 'podlove-facade-title';
      title.textContent = 'Episode Title';
      info.appendChild(title);
      header.appendChild(info);
      inner.appendChild(header);

      const playBtn = document.createElement('button');
      playBtn.type = 'button';
      playBtn.className = 'podlove-facade-play';
      playBtn.setAttribute('aria-label', 'Play');
      playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><span>Play Episode</span>';
      inner.appendChild(playBtn);

      container.appendChild(inner);
      element.appendChild(container);
      return element;
    }

    it('should skip IntersectionObserver in facade mode', () => {
      const observeSpy = vi.spyOn(IntersectionObserver.prototype, 'observe');
      const element = createFacadeElement();
      document.body.appendChild(element);

      expect(observeSpy).not.toHaveBeenCalled();
      observeSpy.mockRestore();
    });

    it('should not create a duplicate container for server-rendered facade', () => {
      const element = createFacadeElement();
      document.body.appendChild(element);

      const containers = element.querySelectorAll('.podlove-player-container');
      expect(containers.length).toBe(1);
    });

    it('should trigger player load on mouseenter (hover)', () => {
      const element = createFacadeElement();
      document.body.appendChild(element);

      expect(global.podlovePlayer).not.toHaveBeenCalled();

      const container = element.querySelector('.podlove-player-container') as HTMLElement;
      container.dispatchEvent(new MouseEvent('mouseenter'));

      expect(global.podlovePlayer).toHaveBeenCalledTimes(1);
    });

    it('should trigger player load on touchstart (tap)', () => {
      const element = createFacadeElement();
      document.body.appendChild(element);

      expect(global.podlovePlayer).not.toHaveBeenCalled();

      const container = element.querySelector('.podlove-player-container') as HTMLElement;
      container.dispatchEvent(new TouchEvent('touchstart'));

      expect(global.podlovePlayer).toHaveBeenCalledTimes(1);
    });

    it('should trigger player load on play button focus (keyboard)', () => {
      const element = createFacadeElement();
      document.body.appendChild(element);

      expect(global.podlovePlayer).not.toHaveBeenCalled();

      const playBtn = element.querySelector('.podlove-facade-play') as HTMLButtonElement;
      playBtn.dispatchEvent(new FocusEvent('focus'));

      expect(global.podlovePlayer).toHaveBeenCalledTimes(1);
    });

    it('should trigger player load on play button click (fallback)', () => {
      const element = createFacadeElement();
      document.body.appendChild(element);

      expect(global.podlovePlayer).not.toHaveBeenCalled();

      const playBtn = element.querySelector('.podlove-facade-play') as HTMLButtonElement;
      playBtn.click();

      expect(global.podlovePlayer).toHaveBeenCalledTimes(1);
    });

    it('should only trigger once even if multiple events fire', () => {
      const element = createFacadeElement();
      document.body.appendChild(element);

      const container = element.querySelector('.podlove-player-container') as HTMLElement;
      const playBtn = element.querySelector('.podlove-facade-play') as HTMLButtonElement;

      // Fire multiple events
      container.dispatchEvent(new MouseEvent('mouseenter'));
      playBtn.dispatchEvent(new FocusEvent('focus'));
      playBtn.click();

      expect(global.podlovePlayer).toHaveBeenCalledTimes(1);
    });

    it('should show spinner and add is-loading class after trigger', () => {
      const originalPodlovePlayer = global.podlovePlayer;
      global.podlovePlayer = undefined;

      try {
        const element = createFacadeElement();
        document.body.appendChild(element);

        const container = element.querySelector('.podlove-player-container') as HTMLElement;
        container.dispatchEvent(new MouseEvent('mouseenter'));

        expect(container.classList.contains('is-loading')).toBe(true);
        expect(element.querySelector('.podlove-player-facade-loading')).not.toBeNull();
      } finally {
        global.podlovePlayer = originalPodlovePlayer;
      }
    });

    it('should remove facade content when iframe is detected', () => {
      const originalPodlovePlayer = global.podlovePlayer;
      global.podlovePlayer = vi.fn((playerHost: HTMLDivElement) => {
        const iframe = document.createElement('iframe');
        playerHost.appendChild(iframe);
      });

      try {
        const element = createFacadeElement({ withCover: true });
        document.body.appendChild(element);

        const container = element.querySelector('.podlove-player-container') as HTMLElement;
        container.dispatchEvent(new MouseEvent('mouseenter'));

        // Facade inner should be positioned absolutely (overlay) until reveal
        const facadeInner = element.querySelector('.podlove-facade-inner') as HTMLElement;
        expect(facadeInner).not.toBeNull();
        expect(facadeInner.style.position).toBe('absolute');
        expect(container.classList.contains('podlove-facade')).toBe(false);
      } finally {
        global.podlovePlayer = originalPodlovePlayer;
      }
    });

    it('should clean up AbortController on disconnect', () => {
      const element = createFacadeElement();
      document.body.appendChild(element);

      expect((element as any).facadeAbortController).not.toBeNull();

      document.body.removeChild(element);

      expect((element as any).facadeAbortController).toBeNull();
    });

    it('should clear expanded and loading state on disconnect for clean reattach', () => {
      const originalPodlovePlayer = global.podlovePlayer;
      global.podlovePlayer = undefined;

      try {
        const element = createFacadeElement();
        document.body.appendChild(element);

        const container = element.querySelector('.podlove-player-container') as HTMLElement;
        // Trigger hover to expand and start loading
        container.dispatchEvent(new MouseEvent('mouseenter'));
        expect(container.style.minHeight).toBe('297px');
        expect(container.classList.contains('is-loading')).toBe(true);

        // Disconnect mid-load
        document.body.removeChild(element);

        // Expanded and loading state should be cleared
        expect(container.style.minHeight).toBe('');
        expect(container.classList.contains('is-loading')).toBe(false);
        expect(element.style.minHeight).toBe('');
      } finally {
        global.podlovePlayer = originalPodlovePlayer;
      }
    });

    it('should not apply inline theme or reserved height in facade mode', () => {
      const element = createFacadeElement();
      document.body.appendChild(element);

      const container = element.querySelector('.podlove-player-container') as HTMLElement;
      // Facade should NOT get the large reserved height — CSS handles sizing
      expect(container.style.minHeight).toBe('');
      expect(element.style.minHeight).toBe('');
      // Facade should NOT get inline background — SCSS handles theming
      expect(container.style.backgroundColor).toBe('');
    });

    it('should inject player styles even when server-rendered container exists', () => {
      // Remove any existing style element from previous tests
      document.getElementById('podlove-player-styles')?.remove();

      const element = createFacadeElement();
      document.body.appendChild(element);

      const styleEl = document.getElementById('podlove-player-styles');
      expect(styleEl).not.toBeNull();
      expect(styleEl?.textContent).toContain('podlove-player-facade-loading');
      expect(styleEl?.textContent).toContain('podlove-player-reveal-shield');
    });

    it('should apply reserved height at interaction time, not at connect time', () => {
      const element = createFacadeElement();
      document.body.appendChild(element);

      const container = element.querySelector('.podlove-player-container') as HTMLElement;
      // At connect time: no reserved height (facade is compact)
      expect(container.style.minHeight).toBe('');
      expect(element.style.minHeight).toBe('');

      // Trigger facade load (hover)
      container.dispatchEvent(new MouseEvent('mouseenter'));

      // After interaction: reserved height applied so expansion is immediate
      expect(container.style.minHeight).toBe('297px');
      expect(element.style.minHeight).toBe('297px');
    });

    it('should preserve reserved min-height in injected styles for non-facade containers', () => {
      // Remove any existing style element from previous tests
      document.getElementById('podlove-player-styles')?.remove();

      const element = createFacadeElement();
      document.body.appendChild(element);

      const styleEl = document.getElementById('podlove-player-styles');
      expect(styleEl).not.toBeNull();
      // The :not(.podlove-facade) guard ensures non-facade containers still get reserved height
      expect(styleEl?.textContent).toContain(':not(.podlove-facade)');
      expect(styleEl?.textContent).toContain('min-height');
    });
  });
});
