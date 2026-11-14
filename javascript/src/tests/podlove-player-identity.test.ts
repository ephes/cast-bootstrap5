import { afterEach, expect, it, vi } from 'vitest';
import '@/audio/podlove-player';

vi.stubGlobal('IntersectionObserver', class {
  observe() {} unobserve() {} disconnect() {}
});
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const embed = 'https://cdn.podlove.org/web-player/5.x/embed.js';
function player(url = embed) {
  const element = document.createElement('podlove-player');
  element.dataset.url = '/audio/1/';
  element.dataset.embed = url;
  document.body.append(element);
  element.initializePlayer();
  return element;
}
afterEach(() => {
  document.body.replaceChildren();
  delete globalThis.podlovePlayer;
  document.documentElement.removeAttribute('data-bs-theme');
});
it.each([true, false])('keeps the live iframe, playhead and playing=%s through theme changes', async (playing) => {
  const state = { position: 123, playing };
  globalThis.podlovePlayer = vi.fn((host: HTMLElement | string) => {
    if (host instanceof HTMLElement) host.append(document.createElement('iframe'));
    if (vi.mocked(globalThis.podlovePlayer!).mock.calls.length > 1) state.position = 0;
  });
  const element = player();
  const iframe = element.querySelector('iframe');
  for (const theme of ['dark', 'light', 'auto']) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    await settle();
    expect(element.querySelector('iframe')).toBe(iframe);
    expect(state).toEqual({ position: 123, playing });
    expect(globalThis.podlovePlayer).toHaveBeenCalledTimes(1);
  }
});
it('coalesces canonical URLs and refuses conflicting pending and registered implementations', async () => {
  const first = player();
  const same = player(`${embed}#same-script`);
  const conflict = player('/other-embed.js');
  await settle();
  expect(conflict.isInitialized).toBe(false);
  expect(conflict.querySelector('[role=alert]')).not.toBeNull();
  expect(document.querySelectorAll('script[data-podlove-embed]')).toHaveLength(1);
  const script = document.querySelector('script[data-podlove-embed]')!;
  globalThis.podlovePlayer = vi.fn();
  script.dispatchEvent(new Event('load'));
  await settle();
  expect(globalThis.podlovePlayer).toHaveBeenCalledTimes(2);
  expect(first.isInitialized && same.isInitialized).toBe(true);
  conflict.querySelector<HTMLButtonElement>('button')!.click();
  await settle();
  expect(conflict.isInitialized).toBe(false);
  expect(globalThis.podlovePlayer).toHaveBeenCalledTimes(2);
  conflict.dataset.embed = embed;
  conflict.querySelector<HTMLButtonElement>('button')!.click();
  await settle();
  expect(conflict.isInitialized).toBe(true);
  expect(globalThis.podlovePlayer).toHaveBeenCalledTimes(3);
});
