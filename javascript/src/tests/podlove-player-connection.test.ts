import { afterEach, expect, it, vi } from 'vitest';
import '@/audio/podlove-player';

const observe = vi.fn();
vi.stubGlobal('IntersectionObserver', class {
  observe = observe;
  unobserve() {} disconnect() {}
});
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
function player() {
  const element = document.createElement('podlove-player');
  element.dataset.url = '/audio/1/';
  document.body.append(element);
  return element;
}
afterEach(() => {
  document.body.replaceChildren();
  delete globalThis.podlovePlayer;
  vi.restoreAllMocks();
});
it('observes only the current connection after window load', async () => {
  vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading');
  const detached = player();
  detached.remove();
  const reconnected = player();
  reconnected.remove();
  document.body.append(reconnected);
  window.dispatchEvent(new Event('load'));
  await settle();
  expect(observe.mock.calls.map(([element]) => element)).toEqual([reconnected]);
});
it('retires the old iframe host and its late reveal callbacks before reconnecting', async () => {
  globalThis.podlovePlayer = vi.fn((host: HTMLElement | string) => {
    if (host instanceof HTMLElement) host.append(document.createElement('iframe'));
  });
  const element = player();
  element.initializePlayer();
  const oldHost = element.playerDiv!;
  const oldIframe = oldHost.querySelector('iframe')!;
  element.remove();
  expect(element.playerDiv).toBeNull();
  expect(oldHost.parentNode).toBeNull();
  document.body.append(element);
  element.initializePlayer();
  const currentHost = element.playerDiv;
  oldIframe.dispatchEvent(new Event('load'));
  await settle();
  expect(element.playerDiv).toBe(currentHost);
  expect(currentHost).not.toBe(oldHost);
  expect(element.querySelectorAll('iframe')).toHaveLength(1);
  expect(element.querySelectorAll('.podlove-player-host')).toHaveLength(1);
  expect(globalThis.podlovePlayer).toHaveBeenCalledTimes(2);
});
