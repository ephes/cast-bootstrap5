import { expect, test } from '@playwright/test';

for (const count of [100, 200, 400]) {
  test(`keeps native mount/removal observation linear for ${count} players`, async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).observeCalls = 0;
      const NativeObserver = window.IntersectionObserver;
      window.IntersectionObserver = class extends NativeObserver {
        observe(target: Element) {
          (window as any).observeCalls++;
          super.observe(target);
        }
      };
    });
    await page.goto('/browser/podlove.html');
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    const result = await page.evaluate(async count => {
      const paging = document.createElement('div');
      paging.id = 'paging-area';
      document.body.append(paging);
      const players = Array.from({ length: count }, () => {
        const player = document.createElement('podlove-player');
        player.dataset.url = '/synthetic/audio/';
        paging.append(player);
        return player;
      });
      players.forEach(player => {
        player.dispatchEvent(new Event('htmx:beforeCleanupElement', { bubbles: true }));
        player.remove();
      });
      await Promise.resolve();
      return { calls: (window as any).observeCalls, retired: players.every(player => player.observer === null) };
    }, count);
    expect(result.calls).toBe(count);
    expect(result.retired).toBe(true);
  });
}

test('rejects already-delivering old entries while native survivors rebind', async ({ page }) => {
  await page.addInitScript(() => {
    const NativeObserver = window.IntersectionObserver;
    (window as any).deliveries = [];
    window.IntersectionObserver = class extends NativeObserver {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        super(callback, options);
        (window as any).deliveries.push((entries: IntersectionObserverEntry[]) => callback(entries, this));
      }
    };
  });
  await page.goto('/browser/podlove.html');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  const result = await page.evaluate(async () => {
    // Keep players offscreen so native delivery does not reveal the facades.
    const paging = document.createElement('div');
    paging.style.cssText = 'position:absolute;top:100000px';
    document.body.append(paging);
    const first = document.createElement('podlove-player');
    const sibling = document.createElement('podlove-player');
    first.dataset.url = sibling.dataset.url = '/synthetic/audio/';
    paging.append(first, sibling);
    const old = first.observer;
    const replay = (window as any).deliveries[0];
    const entries = [first, sibling].map(target => ({ target, isIntersecting: true }));
    first.remove();
    paging.append(first);
    replay(entries);
    const before = paging.querySelectorAll('button').length;
    await Promise.resolve();
    replay(entries);
    const after = paging.querySelectorAll('button').length;
    const rebound = first.observer !== old && sibling.observer === first.observer;
    paging.remove();
    return { before, after, rebound };
  });
  expect(result).toEqual({ before: 0, after: 0, rebound: true });
});

for (const mode of ['missing', 'refused']) {
  test(`keyboard playback and reconnect work when observation is ${mode}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(mode => {
      Object.defineProperty(window, 'IntersectionObserver', { configurable: true, value:
        mode === 'missing' ? undefined : class {
          constructor() { throw new DOMException('Synthetic refusal', 'SecurityError'); }
        },
      });
      (window as any).initializations = 0;
      window.podlovePlayer = host => {
        (window as any).initializations++;
        if (host instanceof HTMLElement) host.append(document.createElement('iframe'));
      };
    }, mode);
    await page.goto('/browser/podlove.html');
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await page.evaluate(() => {
      const player = document.createElement('podlove-player');
      player.dataset.url = '/synthetic/audio/';
      document.body.append(player);
    });
    const play = page.getByRole('button', { name: 'Play', exact: true });
    await expect(play).toBeVisible();
    await play.focus();
    await play.hover();
    expect(await page.evaluate(() => (window as any).initializations)).toBe(0);
    await page.keyboard.press('Enter');
    await expect(page.locator('podlove-player iframe')).toHaveCount(1);
    await page.evaluate(() => {
      const player = document.querySelector('podlove-player')!;
      player.remove();
      document.body.append(player);
    });
    await expect(page.locator('podlove-player iframe')).toHaveCount(0);
    await expect(play).toBeVisible();
    expect(await page.evaluate(() => (window as any).initializations)).toBe(1);
    await play.focus();
    await page.keyboard.press('Space');
    await expect(page.locator('podlove-player iframe')).toHaveCount(1);
    expect(await page.evaluate(() => (window as any).initializations)).toBe(2);
    expect(errors).toEqual([]);
  });
}
