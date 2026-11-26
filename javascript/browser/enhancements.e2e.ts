import { expect, test } from "@playwright/test";
import { resolve } from "node:path";

test.beforeEach(async ({ page }) => {
  await page.goto('/browser/enhancements.html');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
});

test('scroll to top releases tabindex after a hidden heading declines focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => {
    document.body.insertAdjacentHTML('beforeend', `
      <main style="min-height: 200vh"><h1 hidden>Heading</h1></main>
      <button type="button" class="cast-scroll-top" style="position: fixed; bottom: 0">Top</button>`);
    window.scrollTo(0, 500);
  });
  await page.addScriptTag({ type: 'module', url: '/src/theme/scroll-top.ts' });
  const button = page.getByRole('button', { name: 'Top' });
  const heading = page.locator('h1');
  await expect(button).toHaveAttribute('tabindex', '0');
  await button.click();
  await expect(button).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  await heading.evaluate(element => element.removeAttribute('hidden'));
  await expect(heading).not.toHaveAttribute('tabindex');
  await button.press('Enter');
  await expect(heading).toBeFocused();
  await expect(heading).toHaveAttribute('tabindex', '-1');
  await heading.evaluate(element => element.blur());
  await expect(heading).not.toHaveAttribute('tabindex');
});

test('scroll to top tracks content height at a fixed scroll position', async ({ page }) => {
  await page.evaluate(async () => {
    document.body.style.margin = '0';
    document.body.style.overflowAnchor = 'none';
    document.body.insertAdjacentHTML('beforeend', `
      <main style="height: calc(100vh + 500px); display: flow-root"><h1>Heading</h1></main>
      <button type="button" class="cast-scroll-top" style="position: fixed; bottom: 0">Top</button>`);
    await new Promise<void>(resolve => {
      window.addEventListener('scroll', () => resolve(), { once: true });
      window.scrollTo(0, 300);
    });
  });
  await page.addScriptTag({ type: 'module', url: '/src/theme/scroll-top.ts' });
  const button = page.locator('.cast-scroll-top');
  const main = page.locator('main');
  await expect(button).toHaveClass(/is-visible/);
  await expect(button).toHaveAttribute('tabindex', '0');
  await page.evaluate(() => {
    document.body.dataset.scrolled = 'false';
    window.addEventListener('scroll', () => { document.body.dataset.scrolled = 'true'; }, { once: true });
  });

  await main.evaluate(element => { element.style.height = 'calc(100vh + 800px)'; });
  await expect(button).not.toHaveClass(/is-visible/);
  await expect(button).toHaveAttribute('tabindex', '-1');
  await expect(button).toHaveAttribute('aria-hidden', 'true');

  await main.evaluate(element => { element.style.height = 'calc(100vh + 500px)'; });
  await expect(button).toHaveClass(/is-visible/);
  await expect(button).toHaveAttribute('tabindex', '0');
  await expect(page.locator('body')).toHaveAttribute('data-scrolled', 'false');
  expect(await page.evaluate(() => window.scrollY)).toBe(300);
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

test('a later document listener can cancel HTMX pagination without masking the list', async ({ page }) => {
  await page.evaluate(() => {
    document.body.insertAdjacentHTML('beforeend', '<button id="cancelled" hx-get="/paging/cancelled" hx-target="#paging-area">Next</button><div id="paging-area"><podlove-player></podlove-player></div>');
    document.addEventListener('htmx:beforeRequest', event => {
      event.preventDefault();
      document.body.dataset.cancelled = String(event.defaultPrevented);
    }, { once: true });
  });
  await page.addScriptTag({ path: resolve('../cast_bootstrap5/static/cast_bootstrap5/js/htmx.min.js') });
  await page.evaluate(() => (window as any).htmx.process(document.body));
  await page.locator('#cancelled').click();
  await expect(page.locator('body')).toHaveAttribute('data-cancelled', 'true');
  await expect(page.locator('#paging-area')).not.toHaveAttribute('data-cast-paging-mask-active');
});

test('HTMX outerHTML swaps merge inserted quotes like an initial render', async ({ page }) => {
  await page.route('**/quote', route => route.fulfill({ body: '<blockquote>B</blockquote>' }));
  await page.evaluate(() => {
    document.body.insertAdjacentHTML('beforeend', `
      <button id="replace-quote" hx-get="/quote" hx-target="#quote-slot" hx-swap="outerHTML">Replace quote</button>
      <article id="swapped-quotes">
        <blockquote>A</blockquote>
        <span id="quote-slot">Loading</span>
        <blockquote>C</blockquote>
        <blockquote cite="/source">Attributed</blockquote>
      </article>
      <article id="initial-quotes">
        <blockquote>A</blockquote>
        <blockquote>B</blockquote>
        <blockquote>C</blockquote>
        <blockquote cite="/source">Attributed</blockquote>
      </article>`);
  });
  await page.addScriptTag({ type: 'module', url: '/src/content/post-content-enhancements.ts' });
  await page.addScriptTag({ path: resolve('../cast_bootstrap5/static/cast_bootstrap5/js/htmx.min.js') });
  await page.evaluate(() => (window as any).htmx.process(document.body));

  const initial = page.locator('#initial-quotes blockquote');
  await expect(initial.first().locator('.cast-blockquote-line')).toHaveText(['A', 'B', 'C']);
  const initialMarkup = await initial.evaluateAll(quotes => quotes.map(quote => quote.outerHTML));

  await page.locator('#replace-quote').click();
  const swapped = page.locator('#swapped-quotes blockquote');
  await expect(page.locator('#quote-slot')).toHaveCount(0);
  await expect(swapped).toHaveCount(2);
  expect(await swapped.evaluateAll(quotes => quotes.map(quote => quote.outerHTML))).toEqual(initialMarkup);
});

test('HTMX outerHTML swaps sync the new switcher to the selected color mode', async ({ page }) => {
  const switcher = (id: string) => `
    <div id="${id}" data-cast-theme-switcher>
      <span data-cast-theme-label>System</span>
      <span data-cast-theme-icon="auto" style="display: inline-flex">☀</span>
      <span data-cast-theme-icon="dark" style="display: none">☾</span>
      <button type="button" data-cast-theme-value="mode:auto" data-cast-theme-mode="auto" aria-pressed="true"><span>System</span></button>
      <button type="button" data-cast-theme-value="mode:dark" data-cast-theme-mode="dark" aria-pressed="false"><span>Dark</span></button>
    </div>`;
  await page.route('**/switcher', route => route.fulfill({ body: switcher('new-switcher') }));
  await page.evaluate(markup => document.body.insertAdjacentHTML('beforeend', markup), `
    <button id="replace-switcher" hx-get="/switcher" hx-target="#old-switcher" hx-swap="outerHTML">Replace switcher</button>
    ${switcher('old-switcher')}`);
  await page.addScriptTag({ type: 'module', url: '/src/theme/theme-switcher.ts' });
  await page.addScriptTag({ path: resolve('../cast_bootstrap5/static/cast_bootstrap5/js/htmx.min.js') });
  await page.evaluate(() => (window as any).htmx.process(document.body));

  await page.locator('#old-switcher').getByRole('button', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');
  await page.locator('#replace-switcher').click();

  const replacement = page.locator('#new-switcher');
  await expect(page.locator('#old-switcher')).toHaveCount(0);
  await expect(replacement.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
  await expect(replacement.getByRole('button', { name: 'System' })).toHaveAttribute('aria-pressed', 'false');
  await expect(replacement.locator('[data-cast-theme-icon="dark"]')).toBeVisible();
  await expect(replacement.locator('[data-cast-theme-icon="auto"]')).toBeHidden();
  await expect(replacement.locator('[data-cast-theme-label]')).toHaveText('Dark');
});

test('real HTMX cleanup retires ordering controls inside a surviving form', async ({ page }) => {
  await page.route('**/ordering', route => route.fulfill({ body: '<div id="div_id_o"><select name="o"><option value="a">A</option><option value="b" selected>B</option></select></div>' }));
  await page.evaluate(() => {
    document.body.insertAdjacentHTML('beforeend', '<button id="replace" hx-get="/ordering" hx-target="#slot">Replace</button><form><div id="slot"></div></form>');
    let swaps = 0;
    document.addEventListener('htmx:afterSwap', () => { document.body.dataset.swaps = String(++swaps); });
  });
  await page.addScriptTag({ path: resolve('../cast_bootstrap5/static/cast_bootstrap5/js/htmx.min.js') });
  await page.addScriptTag({ path: resolve('../cast_bootstrap5/static/cast_bootstrap5/js/bootstrap5/bootstrap.bundle.min.js') });
  await page.evaluate(() => (window as any).htmx.process(document.body));
  for (let i = 0; i < 3; i++) {
    await page.locator('#replace').click();
    await expect(page.locator('body')).toHaveAttribute('data-swaps', String(i + 1));
    await expect(page.locator('#slot .dropdown-toggle')).toHaveText('B');
    await page.locator('form').evaluate(form => (form as HTMLFormElement).reset());
    await expect(page.locator('#slot .dropdown')).toHaveCount(1);
  }
  const toggle = page.locator('#slot .dropdown-toggle');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(await toggle.evaluate(async oldToggle => {
    const { bootstrap, htmx } = window as any;
    const opened = bootstrap.Dropdown.getInstance(oldToggle) !== null;
    await htmx.ajax('GET', '/ordering', { source: '#replace', target: '#slot' });
    return { opened, disposed: bootstrap.Dropdown.getInstance(oldToggle) === null };
  })).toEqual({ opened: true, disposed: true });
  await expect(page.locator('#slot .dropdown')).toHaveCount(1);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
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
