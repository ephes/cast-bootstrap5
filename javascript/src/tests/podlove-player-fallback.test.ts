import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import '@/audio/podlove-player';

beforeEach(() => {
  vi.spyOn(document, 'readyState', 'get').mockReturnValue('complete');
  globalThis.podlovePlayer = vi.fn();
});
afterEach(async () => {
  document.body.replaceChildren();
  await Promise.resolve();
  delete globalThis.podlovePlayer;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function refuseObservation(mode: string) {
  vi.stubGlobal('IntersectionObserver', mode === 'missing' ? undefined : class {
    constructor() { throw new DOMException('Synthetic observation refusal', 'SecurityError'); }
  });
}

it.each(['missing', 'refused'])('offers deliberate playback when observation is %s', async (mode) => {
  refuseObservation(mode);
  const player = document.createElement('podlove-player');
  player.dataset.url = '/synthetic/audio/';
  document.body.append(player);
  const button = player.querySelector<HTMLButtonElement>('button[aria-label="Play"]');
  expect(button).not.toBeNull();
  expect(player.observer).toBeNull();
  button!.focus();
  player.querySelector('.podlove-player-container')!.dispatchEvent(new Event('mouseenter'));
  expect(globalThis.podlovePlayer).not.toHaveBeenCalled();
  button!.click();
  expect(globalThis.podlovePlayer).toHaveBeenCalledTimes(1);
  const host = player.playerDiv;
  player.remove();
  expect(host!.isConnected).toBe(false);
  expect(player.playerDiv).toBeNull();
  expect(player.querySelector('button')).toBeNull();
  document.body.append(player);
  expect(player.querySelectorAll('button[aria-label="Play"]')).toHaveLength(1);
  expect(globalThis.podlovePlayer).toHaveBeenCalledTimes(1);
  player.querySelector<HTMLButtonElement>('button')!.click();
  expect(globalThis.podlovePlayer).toHaveBeenCalledTimes(2);
  expect(player.playerDiv).not.toBe(host);
});

it.each(['missing', 'refused'])('owns delayed page-load fallback when observation is %s', async (mode) => {
  refuseObservation(mode);
  vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading');
  const player = document.createElement('podlove-player');
  player.dataset.url = '/synthetic/audio/';
  document.body.append(player);
  player.remove();
  window.dispatchEvent(new Event('load'));
  await Promise.resolve();
  expect(player.querySelector('button')).toBeNull();
  document.body.append(player);
  await Promise.resolve();
  expect(player.querySelectorAll('button[aria-label="Play"]')).toHaveLength(1);
  expect(globalThis.podlovePlayer).not.toHaveBeenCalled();
});

it('clears retired registrations when the replacement observer is refused', async () => {
  vi.stubGlobal('IntersectionObserver', class {
    observe() {} unobserve() {} disconnect() {}
    takeRecords() { return []; }
  });
  const first = document.createElement('podlove-player');
  const sibling = document.createElement('podlove-player');
  sibling.dataset.url = '/synthetic/audio/';
  document.body.append(first, sibling);
  expect(sibling.observer).not.toBeNull();
  refuseObservation('refused');
  first.remove();
  await Promise.resolve();
  expect(sibling.observer).toBeNull();
  expect(sibling.querySelectorAll('button[aria-label="Play"]')).toHaveLength(1);
  expect(globalThis.podlovePlayer).not.toHaveBeenCalled();
});

it.each(['missing', 'refused'])('restarts a source change without a stale Play control when observation is %s', async (mode) => {
  refuseObservation(mode);
  const player = document.createElement('podlove-player');
  player.dataset.url = '/synthetic/audio/';
  document.body.append(player);
  player.querySelector<HTMLButtonElement>('button[aria-label="Play"]')!.click();
  expect(globalThis.podlovePlayer).toHaveBeenCalledTimes(1);
  player.dataset.url = '/synthetic/other/';
  await Promise.resolve();
  await Promise.resolve();
  expect(globalThis.podlovePlayer).toHaveBeenCalledTimes(2);
  expect(player.isInitialized).toBe(true);
  expect(player.querySelector('.podlove-player-facade-btn')).toBeNull();
});
