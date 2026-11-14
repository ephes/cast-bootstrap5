import { expect, test, type Page } from '@playwright/test';
import { resolve } from 'node:path';

async function mountSearch(page: Page) {
  await page.evaluate(() => {
    document.body.insertAdjacentHTML('beforeend', `<cast-search-modal data-cast-dynamic-facets-url="/facets" data-cast-search-suggestions-url="/suggestions">
      <div class="cast-search-overlay" data-cast-search-overlay hidden><div class="cast-search-modal"><form action="/blog/">
      <input name="search" value="defaults"><ul id="suggestions" data-cast-search-suggestions hidden></ul>
      <div data-cast-suggestion-status></div><div data-cast-suggestion-loading hidden></div>
      <div class="cast-search-modal-body"><div data-cast-facet-loading hidden></div><div data-cast-facet-status></div>
      <details open data-cast-filter-panel="tag_facets"><summary>Tags</summary><div data-cast-facet-group="tag_facets">
      <div class="cast-date-facet-container"><a href="/blog/">All</a><a href="/blog/?tag_facets=synthetic" class="selected">Synthetic</a></div>
      </div></details></div><div id="div_id_o"><select name="o"><option value="new" selected>New</option><option value="old">Old</option></select></div>
      <button type="reset">Reset</button><button type="submit">Search</button><button data-cast-search-close type="button">Close</button>
      </form></div></div></cast-search-modal>`);
    (document.querySelector('cast-search-modal') as any).openModal();
  });
}

const facets = { mode: 'modal', result_count: 1, groups: {
  tag_facets: { selected: 'synthetic', all_count: 1, options: [{ slug: 'synthetic', name: 'Synthetic', count: 1 }] },
} };
const suggestions = (query: string) => ({ query, suggestions: [{ id: 1, title: 'Synthetic post', url: '/post/' }] });

test.beforeEach(async ({ page }) => {
  await page.goto('/browser/enhancements.html');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
});

for (const destination of ['/login/', 'https://foreign.invalid/login/', '/other-api/']) {
  test(`search refuses redirect to ${destination} and later admits direct success`, async ({ page }) => {
    let redirect = true;
    let destinationRequests = 0;
    await page.route('**/login/', route => { destinationRequests++; return route.fulfill({ json: suggestions('py') }); });
    await page.route('**/other-api/', route => { destinationRequests++; return route.fulfill({ json: suggestions('py') }); });
    for (const endpoint of ['facets', 'suggestions']) {
      await page.route(`**/${endpoint}?*`, route => redirect
        ? route.fulfill({ status: 302, headers: { location: destination } })
        : route.fulfill({ json: endpoint === 'facets' ? facets : suggestions(new URL(route.request().url()).searchParams.get('search')!) }));
    }
    await mountSearch(page);
    await page.locator('[name="search"]').fill('py');
    await expect(page.locator('[data-cast-facet-status]')).toContainText('Could not refresh');
    await expect(page.locator('[data-cast-suggestion-status]')).toContainText('unavailable');
    await expect(page.locator('#suggestions')).toBeHidden();
    await expect(page.locator('[data-cast-facet-group] a.selected')).toHaveText('Synthetic');
    expect(destinationRequests).toBe(0);
    redirect = false;
    await page.locator('[name="search"]').fill('pyt');
    await expect(page.locator('#suggestions')).toBeVisible();
    await expect(page.locator('[data-cast-facet-status]')).toHaveText('Filters updated.');
  });
}

test('native reset cancels streamed responses and uses defaults; cancelled and closed resets respect ownership', async ({ page }) => {
  await page.evaluate(() => {
    const state = (window as any).searchRequests = { requests: [] as any[], cancellations: 0 };
    window.fetch = async (value, options) => {
      const url = new URL(String(value));
      state.requests.push({ url: url.href, signal: options?.signal });
      if (url.searchParams.get('search') === 'obsolete') {
        return new Response(new ReadableStream({
          start(stream) { stream.enqueue(new TextEncoder().encode('{')); },
          cancel() { state.cancellations++; },
        }));
      }
      return new Response(JSON.stringify(url.pathname === '/facets'
        ? { mode: 'modal', result_count: 1, groups: {} }
        : { query: url.searchParams.get('search'), suggestions: [] }));
    };
  });
  await mountSearch(page);
  const input = page.locator('[name="search"]');
  await input.fill('obsolete');
  await expect.poll(() => page.evaluate(() => (window as any).searchRequests.requests.length)).toBe(2);
  // A listener installed after enhancement may still cancel the native reset.
  await page.locator('form').evaluate(form => form.addEventListener('reset', event => event.preventDefault(), { once: true }));
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(input).toHaveValue('obsolete');
  expect(await page.evaluate(() => (window as any).searchRequests.cancellations)).toBe(0);
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(input).toHaveValue('defaults');
  await expect.poll(() => page.evaluate(() => (window as any).searchRequests.cancellations)).toBe(2);
  await expect.poll(() => page.evaluate(() => (window as any).searchRequests.requests.length)).toBe(4);
  expect(await page.evaluate(() => {
    const requests = (window as any).searchRequests.requests;
    const form = document.querySelector('form')!;
    return requests.slice(0, 2).every((r: any) => r.signal.aborted)
      && requests.slice(2).every((r: any) => new URL(r.url).searchParams.get('search') === new FormData(form).get('search'));
  })).toBe(true);
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await input.evaluate(el => { (el as HTMLInputElement).value = 'closed edit'; (el as HTMLInputElement).defaultValue = 'closed default'; });
  await page.locator('form').evaluate(form => (form as HTMLFormElement).reset());
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => (window as any).searchRequests.requests.length)).toBe(4);
  await page.locator('cast-search-modal').evaluate(modal => (modal as any).openModal());
  await expect.poll(() => page.evaluate(() => (window as any).searchRequests.requests.length)).toBe(6);
  await expect(input).toHaveValue('closed default');
});

test('gallery keyboard navigation keeps live footer focus through rapid changes and failed loads', async ({ page }) => {
  await page.addStyleTag({ path: resolve('../cast_bootstrap5/static/cast_bootstrap5/css/bootstrap5/bootstrap.min.css') });
  await page.addScriptTag({ path: resolve('../cast_bootstrap5/static/cast_bootstrap5/js/bootstrap5/bootstrap.bundle.min.js') });
  await page.route('**/broken*.jpg', route => route.abort());
  await page.evaluate(() => {
    const gallery = document.createElement('image-gallery-bs5');
    gallery.innerHTML = `<div class="cast-gallery-container">${[0, 1, 2].map(i => `<a href="/original-${i}" data-full="/original-${i}" data-bs-target="#gallery-modal"><picture><source><img id="img${i}" alt="Image ${i}" data-prev="${i ? `img${i - 1}` : 'false'}" data-next="${i < 2 ? `img${i + 1}` : 'false'}" data-modal-src="/broken${i}.jpg"></picture></a>`).join('')}</div>
      <div id="gallery-modal" class="modal" tabindex="-1"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><button type="button" data-bs-dismiss="modal">Close</button></div>
      <div class="modal-body"><a><picture><source><img></picture></a></div><div class="modal-footer"></div></div></div></div>`;
    document.body.appendChild(gallery);
  });
  await page.getByAltText('Image 0', { exact: true }).click();
  const next = page.locator('#data-next');
  const prev = page.locator('#data-prev');
  await next.focus();
  await page.keyboard.press('Enter');
  await expect(next).toBeFocused();
  await expect(page.locator('#gallery-modal img')).toHaveAttribute('alt', 'Image 1');
  await page.keyboard.press('Enter');
  await expect(prev).toBeFocused();
  await expect(next).toBeDisabled();
  await expect(page.locator('#gallery-modal img')).toHaveAttribute('alt', 'Image 2');
  await page.keyboard.press('Space');
  await expect(prev).toBeFocused();
  await page.keyboard.press('Space');
  await expect(next).toBeFocused();
  await expect(prev).toBeDisabled();
  await expect(page.locator('#gallery-modal img')).toHaveAttribute('alt', 'Image 0');
  await expect(page.locator('#gallery-modal')).toContainText('Could not load image.');
  await expect(next).toBeFocused();
  // Image changes initiated elsewhere must preserve that control's focus.
  const close = page.locator('#gallery-modal [data-bs-dismiss]');
  await close.focus();
  await page.locator('image-gallery-bs5').evaluate(gallery => (gallery as any).replaceImage('data-next'));
  await expect(close).toBeFocused();
});
