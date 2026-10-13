import { afterEach, describe, expect, it, vi } from 'vitest';
import '@/audio/podlove-player';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
vi.stubGlobal('IntersectionObserver', class {
  observe() {} unobserve() {} disconnect() {}
});
function setup(facade: boolean) {
  const element = document.createElement('podlove-player');
  element.setAttribute('data-url', '/audio/1/');
  if (facade) {
    element.setAttribute('data-load-mode', 'facade');
    element.innerHTML = '<div class="podlove-player-container podlove-facade"><div class="podlove-facade-inner"><button class="podlove-facade-play" type="button" aria-label="Play">Play</button></div></div>';
  }
  document.body.append(element);
  if (!facade) element.showFacade();
  return element;
}
function click(element: HTMLElement) {
  const button = element.querySelector<HTMLButtonElement>('button');
  expect(button).not.toBeNull();
  button!.click();
}
function expectRetry(element: HTMLElementTagNameMap['podlove-player']) {
  expect(element.isInitialized).toBe(false);
  expect(element.querySelector('.podlove-player-facade-loading')).toBeNull();
  expect(element.querySelector('.is-loading')).toBeNull();
  expect(element.querySelectorAll('button')).toHaveLength(1);
  expect(element.querySelector('button')!.getAttribute('aria-label')).toBe('Retry loading player');
  expect(element.querySelector('button')!.textContent).toBe('Retry loading player');
  expect(element.querySelector('[role=alert]')!.textContent).toContain('failed to load');
}
afterEach(() => {
  document.body.replaceChildren();
  delete globalThis.podlovePlayer;
});
describe('player recovery', () => {
  it.each([false, true])('retries failed script and missing registration (facade=%s)', async (facade) => {
    const element = setup(facade);
    click(element);
    const first = document.querySelector('script[data-podlove-embed]')!;
    expect(first).not.toBeNull();
    first.dispatchEvent(new Event('error'));
    await settle();
    expectRetry(element);
    element.querySelector('.podlove-player-container')!.dispatchEvent(new Event('mouseenter'));
    element.querySelector('button')!.dispatchEvent(new Event('focus'));
    expect(document.querySelector('script[data-podlove-embed]')).toBeNull();
    click(element);
    const second = document.querySelector('script[data-podlove-embed]')!;
    expect(second).not.toBeNull();
    expect(second).not.toBe(first);
    second.dispatchEvent(new Event('load'));
    await settle();
    expectRetry(element);
    expect(second.isConnected).toBe(false);
    const retryButton = element.querySelector<HTMLButtonElement>('button')!;
    click(element);
    const third = document.querySelector('script[data-podlove-embed]')!;
    expect(third).not.toBeNull();
    expect(third).not.toBe(second);
    retryButton.click();
    expect(document.querySelectorAll('script[data-podlove-embed]')).toHaveLength(1);
    globalThis.podlovePlayer = vi.fn();
    third.dispatchEvent(new Event('load'));
    await settle();
    expect(globalThis.podlovePlayer).toHaveBeenCalledTimes(1);
    expect(element.isInitialized).toBe(true);
    expect(element.querySelectorAll('.podlove-player-host')).toHaveLength(1);
    // Exercise invalidation of an already-resolved shared load as well.
    delete globalThis.podlovePlayer;
    const reset = setup(false);
    click(reset);
    document.querySelector('script[data-podlove-embed]')!.dispatchEvent(new Event('load'));
    await settle();
    expectRetry(reset);
    expect(third.isConnected).toBe(false);
  });
  it.each([false, true])('recovers a synchronous initializer exception (facade=%s)', (facade) => {
    globalThis.podlovePlayer = vi.fn().mockImplementationOnce((host: HTMLElement) => {
      host.append(document.createElement('iframe'));
      throw new Error('Initialization failed');
    });
    const element = setup(facade);
    const originalButton = element.querySelector<HTMLButtonElement>('button')!;
    // In server facades focus itself triggers the first initialization.
    originalButton.focus();
    if (!facade) originalButton.click();
    expectRetry(element);
    expect(document.activeElement).toBe(element.querySelector('button'));
    expect(element.querySelector('iframe')).toBeNull();
    click(element);
    expect(element.isInitialized).toBe(true);
    expect(globalThis.podlovePlayer).toHaveBeenCalledTimes(2);
    expect(element.querySelectorAll('.podlove-player-host')).toHaveLength(1);
    expect(element.querySelector('[role=alert]')).toBeNull();
    if (facade) {
      expect(originalButton.textContent).toBe('Play');
      expect(originalButton.getAttribute('aria-label')).toBe('Play');
    }
  });
  it.each([false, true])('does not steal focus moved elsewhere during loading (facade=%s)', async (facade) => {
    const element = setup(facade);
    const other = document.createElement('input');
    document.body.append(other);
    const button = element.querySelector<HTMLButtonElement>('button')!;
    button.focus();
    if (!facade) button.click();
    other.focus();
    document.querySelector('script[data-podlove-embed]')!.dispatchEvent(new Event('error'));
    await settle();
    expectRetry(element);
    expect(document.activeElement).toBe(other);
    // A later failure must not reuse the stale focus snapshot either.
    click(element);
    document.querySelector('script[data-podlove-embed]')!.dispatchEvent(new Event('error'));
    await settle();
    expectRetry(element);
    expect(document.activeElement).toBe(other);
  });
  it('shows the facade retry again when reinitialization fails before reveal', () => {
    globalThis.podlovePlayer = vi.fn()
      .mockImplementationOnce((host: HTMLElement) => { host.append(document.createElement('iframe')); })
      .mockImplementationOnce(() => { throw new Error('Reinitialization failed'); });
    const element = setup(true);
    const other = document.createElement('input');
    document.body.append(other);
    const container = element.querySelector<HTMLElement>('.podlove-player-container')!;
    const inner = element.querySelector<HTMLElement>('.podlove-facade-inner')!;
    element.querySelector<HTMLButtonElement>('button')!.focus();
    expect(element.isInitialized).toBe(true);
    expect(container.classList.contains('podlove-facade')).toBe(false);
    expect(inner.style.position).toBe('absolute');
    other.focus();
    element.reinitializePlayer();
    expectRetry(element);
    expect(container.classList.contains('podlove-facade')).toBe(true);
    expect(container.hasAttribute('data-cast-mask-active')).toBe(false);
    expect(inner.isConnected).toBe(true);
    expect(inner.style.position).toBe('');
    expect(inner.contains(element.querySelector('button'))).toBe(true);
    expect(document.activeElement).toBe(other);
    globalThis.podlovePlayer = vi.fn();
    click(element);
    expect(element.isInitialized).toBe(true);
    expect(globalThis.podlovePlayer).toHaveBeenCalledTimes(1);
  });
  it('does not reset a newer initialization when an older initializer throws', () => {
    const element = setup(false);
    globalThis.podlovePlayer = vi.fn().mockImplementationOnce(() => {
      element.reinitializePlayer();
      throw new Error('Old initialization failed');
    });
    click(element);
    expect(element.isInitialized).toBe(true);
    expect(globalThis.podlovePlayer).toHaveBeenCalledTimes(2);
    expect(element.querySelectorAll('.podlove-player-host')).toHaveLength(1);
    expect(element.querySelector('button')).toBeNull();
  });
});
