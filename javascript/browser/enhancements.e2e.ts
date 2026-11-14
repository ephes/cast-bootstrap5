import { expect, test } from "@playwright/test";
import { resolve } from "node:path";

test.beforeEach(async ({ page }) => {
  await page.goto('/browser/enhancements.html');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
});

test('actual HTMX requests keep the newer paging mask when the older request settles', async ({ page }) => {
  const a = page.waitForRequest('**/paging/a');
  const b = page.waitForRequest('**/paging/b');
  let sendA!: () => Promise<void>;
  let sendB!: () => Promise<void>;
  await page.route('**/paging/*', async route => {
    await new Promise<void>(resolve => {
      const send = async () => {
        await route.fulfill({ body: '<podlove-player></podlove-player>' });
        resolve();
      };
      if (route.request().url().endsWith('/a')) sendA = send; else sendB = send;
    });
  });
  await page.evaluate(() => {
    document.body.insertAdjacentHTML('beforeend', `<a id="a" hx-get="/paging/a" hx-target="#paging-area">A</a>
      <a id="b" hx-get="/paging/b" hx-target="#paging-area">B</a>
      <div id="paging-area"><podlove-player></podlove-player></div>`);
    document.addEventListener('htmx:afterSettle', () => { document.body.dataset.settled = 'true'; });
  });
  await page.addScriptTag({ path: resolve('../cast_bootstrap5/static/cast_bootstrap5/js/htmx.min.js') });
  // HTMX boots on its next ready task.
  await page.waitForFunction(() => !!(window as any).htmx);
  await page.evaluate(() => (window as any).htmx.process(document.body));
  await page.locator('#a').click(); await a;
  await page.locator('#b').click(); await b;
  await expect(page.locator('#paging-area')).toHaveAttribute('data-cast-paging-mask-active', 'true');
  await expect.poll(() => typeof sendA).toBe('function');
  await sendA();
  await expect(page.locator('body')).toHaveAttribute('data-settled', 'true');
  await page.waitForTimeout(350); // the old owner's 300 ms unmask timer must not win
  await expect(page.locator('#paging-area')).toHaveAttribute('data-cast-paging-mask-active', 'true');
  await expect.poll(() => typeof sendB).toBe('function');
  await sendB();
  await expect(page.locator('#paging-area')).not.toHaveAttribute('data-cast-paging-mask-active');
});

test('real HTMX cleanup retires ordering controls inside a surviving form', async ({ page }) => {
  await page.route('**/ordering', route => route.fulfill({ body: '<div id="div_id_o"><select name="o"><option value="a">A</option><option value="b" selected>B</option></select></div>' }));
  await page.evaluate(() => {
    document.body.insertAdjacentHTML('beforeend', '<button id="replace" hx-get="/ordering" hx-target="#slot">Replace</button><form><div id="slot"></div></form>');
    let swaps = 0;
    document.addEventListener('htmx:afterSwap', () => { document.body.dataset.swaps = String(++swaps); });
  });
  await page.addScriptTag({ path: resolve('../cast_bootstrap5/static/cast_bootstrap5/js/htmx.min.js') });
  await page.evaluate(() => (window as any).htmx.process(document.body));
  for (let i = 0; i < 3; i++) {
    await page.locator('#replace').click();
    await expect(page.locator('body')).toHaveAttribute('data-swaps', String(i + 1));
    await expect(page.locator('#slot .dropdown-toggle')).toHaveText('B');
    await page.locator('form').evaluate(form => (form as HTMLFormElement).reset());
    await expect(page.locator('#slot .dropdown')).toHaveCount(1);
  }
});

test('dynamic facets carry keyboard focus to the live link and then Tab', async ({ page }) => {
  await page.route('**/facets?*', route => route.fulfill({ json: { mode: 'modal', result_count: 1, groups: {
    tag_facets: { selected: 'synthetic', all_count: 1, options: [{ slug: 'synthetic', name: 'Synthetic', count: 1 }] },
  } } }));
  await page.evaluate(() => {
    document.body.insertAdjacentHTML('beforeend', `<cast-search-modal data-cast-dynamic-facets-url="/facets">
      <div data-cast-search-overlay hidden><div class="cast-search-modal"><form action="/blog/">
      <input name="search"><details open data-cast-filter-panel="tag_facets"><summary>Tags</summary>
      <div data-cast-facet-group="tag_facets"><div class="cast-date-facet-container">
      <div class="cast-date-facet-item"><a href="/blog/">All</a></div>
      <div class="cast-date-facet-item"><a href="/blog/?tag_facets=synthetic">Synthetic</a></div></div></div></details>
      <button type="submit">Search</button><div data-cast-facet-status></div>
      </form></div></div></cast-search-modal>`);
    (document.querySelector('cast-search-modal') as any).openModal();
  });
  const link = page.locator('[data-cast-facet-group] a').filter({ hasText: 'Synthetic' });
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-cast-facet-status]')).toHaveText('Filters updated.');
  await expect(link).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('button[type="submit"]')).toBeFocused();
});
