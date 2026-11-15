import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';

test.beforeEach(async ({ page }) => {
  await page.goto('/browser/enhancements.html');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => {
    for (const id of ['a', 'b']) {
      document.body.insertAdjacentHTML('beforeend', `<button id="trigger-${id}">Open ${id}</button>
        <cast-search-modal id="${id}" data-trigger="#trigger-${id}">
        <div data-cast-search-overlay hidden><div class="cast-search-modal" role="dialog">
        <form action="/blog/"><input name="search"><button type="button" data-cast-search-close>Close</button>
        <details open data-cast-filter-panel="tag_facets"><summary>Tags</summary>
        <div data-cast-facet-group="tag_facets"><a href="/blog/" class="selected">All</a>
        <a href="/blog/?tag_facets=synthetic">Synthetic</a></div></details>
        <a href="/blog/" class="cast-btn-clear">Clear</a></form></div></div></cast-search-modal>`);
    }
  });
});

test('removed Bootstrap owners release scrolling while remaining search owners retain it', async ({ page }) => {
  await page.addScriptTag({ path: resolve('../cast_bootstrap5/static/cast_bootstrap5/js/bootstrap5/bootstrap.bundle.min.js') });
  for (const searchOpen of [false, true]) {
    await page.evaluate(open => {
      document.body.style.overflow = 'scroll';
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.innerHTML = '<div class="modal-dialog"><div class="modal-content">Synthetic</div></div>';
      document.body.append(modal);
      new (window as any).bootstrap.Modal(modal, { backdrop: false, focus: false }).show();
      if (open) (document.querySelector('#a') as any).openModal();
      modal.dispatchEvent(new Event('htmx:beforeCleanupElement', { bubbles: true }));
      modal.remove();
    }, searchOpen);
    await expect(page.locator('body')).toHaveCSS('overflow', searchOpen ? 'hidden' : 'scroll');
    if (searchOpen) await page.locator('#a').evaluate(modal => (modal as any).closeModal());
    await expect(page.locator('body')).toHaveCSS('overflow', 'scroll');
  }
});

test('search focus and Escape belong to the newest overlay; shortcuts have one owner', async ({ page }) => {
  await page.keyboard.press('Control+k');
  await expect(page.locator('#a [data-cast-search-overlay]')).toBeVisible();
  await expect(page.locator('#b [data-cast-search-overlay]')).toBeHidden();
  await page.locator('#b').evaluate(modal => (modal as any).openModal());
  await expect(page.locator('#b input')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#b [data-cast-search-overlay]')).toBeHidden();
  await expect(page.locator('#a [data-cast-search-overlay]')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.locator('#a input')).toBeFocused();
  await page.locator('#b').evaluate(modal => (modal as any).openModal());
  await page.locator('#a').evaluate(modal => (modal as any).closeModal());
  await expect(page.locator('#b input')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#trigger-b')).toBeFocused();
  await page.locator('#a').evaluate(modal => (modal as any).openModal());
  await page.locator('#trigger-a').evaluate(trigger => trigger.remove());
  await page.keyboard.press('Escape');
  await expect(page.locator('#b input')).not.toBeFocused();
});

for (const selector of ['[data-cast-facet-group] a:last-child', '.cast-btn-clear']) {
  test(`facet link gestures keep native defaults: ${selector}`, async ({ page }) => {
    await page.locator('#a').evaluate(modal => (modal as any).openModal());
    const link = page.locator(`#a ${selector}`);
    // Inspect the actual browser-generated click after the enhancement; avoid
    // navigating this fixture for platform-dependent Ctrl/Meta/Alt gestures.
    await page.evaluate(() => document.addEventListener('click', event => {
      if (!(event.target instanceof HTMLAnchorElement)) return;
      (window as any).lastLinkClick = { prevented: event.defaultPrevented, href: event.target.href };
      event.preventDefault();
    }));
    const href = await link.getAttribute('href');
    // macOS turns Control+click into a contextmenu gesture without a click event.
    const modifiers = (['Control', 'Meta', 'Shift', 'Alt'] as const)
      .filter(modifier => !(modifier === 'Control' && process.platform === 'darwin'));
    for (const modifier of modifiers) {
      await page.evaluate(() => { delete (window as any).lastLinkClick; });
      await link.click({ modifiers: [modifier] });
      expect(await page.evaluate(() => (window as any).lastLinkClick.prevented)).toBe(false);
      await expect(page.locator('#a [name="tag_facets"]')).toHaveCount(0);
      await expect(link).toHaveAttribute('href', href!);
    }
    await page.evaluate(() => { delete (window as any).lastLinkClick; });
    await link.click();
    expect(await page.evaluate(() => (window as any).lastLinkClick.prevented)).toBe(true);
  });

  test(`target and download links navigate natively: ${selector}`, async ({ page }) => {
    await page.route('**/blog/**', route => route.fulfill({ body: '<title>Synthetic destination</title>' }));
    await page.locator('#a').evaluate(modal => (modal as any).openModal());
    const link = page.locator(`#a ${selector}`);
    const href = await link.getAttribute('href');
    await link.evaluate(anchor => anchor.setAttribute('target', '_blank'));
    const popupReady = page.waitForEvent('popup');
    await link.click();
    const popup = await popupReady;
    await expect(popup).toHaveURL(new URL(href!, page.url()).href);
    await popup.close();
    await expect(page.locator('#a [name="tag_facets"]')).toHaveCount(0);
    await link.evaluate(anchor => { anchor.removeAttribute('target'); anchor.setAttribute('download', 'synthetic.html'); });
    const downloadReady = page.waitForEvent('download');
    await link.click();
    expect((await downloadReady).suggestedFilename()).toBe('synthetic.html');
    await expect(page.locator('#a [name="tag_facets"]')).toHaveCount(0);
  });
}
