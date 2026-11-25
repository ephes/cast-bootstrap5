import { afterEach, expect, test, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { destroyPagingContentVisibility, initPagingContentVisibility } from '@/theme/paging-content-visibility';
import { initOrderingDropdowns } from '@/ordering/ordering-dropdown';

// Stub only the public XHR transport; request admission, swaps, cleanup and all
// event details below are produced by the actual shipped HTMX bundle.
class ControlledXHR extends EventTarget {
  static requests: ControlledXHR[] = [];
  upload = new EventTarget();
  status = 200;
  response = '';
  responseText = '';
  responseURL = window.location.href;
  onload: (() => void) | null = null;
  open() { /* transport is completed explicitly below */ }
  setRequestHeader() {}
  overrideMimeType() {}
  getAllResponseHeaders() { return 'Content-Type: text/html\r\n'; }
  getResponseHeader() { return null; }
  send() { ControlledXHR.requests.push(this); }
  finish(html: string) { this.response = this.responseText = html; this.onload?.(); }
}

afterEach(() => {
  destroyPagingContentVisibility();
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete (window as any).htmx;
});

function htmx() {
  vi.stubGlobal('XMLHttpRequest', ControlledXHR);
  ControlledXHR.requests = [];
  // jsdom requires an explicit XPath result type where browsers default to ANY.
  const evaluate = window.XPathExpression.prototype.evaluate;
  vi.spyOn(window.XPathExpression.prototype, 'evaluate').mockImplementation(function (this: XPathExpression, node: Node, type = 0, result = null) {
    return evaluate.call(this, node, type, result);
  });
  window.eval(readFileSync(resolve('../cast_bootstrap5/static/cast_bootstrap5/js/htmx.min.js'), 'utf8'));
  return (window as any).htmx;
}

test('real HTMX settle keeps the mask owned by the newer XHR', async () => {
  vi.useFakeTimers();
  document.body.innerHTML = '<button id="a"></button><button id="b"></button><div id="paging-area"><podlove-player></podlove-player></div>';
  const api = htmx();
  initPagingContentVisibility();
  const details: XMLHttpRequest[] = [];
  const settled = (event: Event) => details.push((event as CustomEvent).detail.xhr);
  document.addEventListener('htmx:afterSettle', settled);
  try {
    const a = api.ajax('GET', '/a', { source: '#a', target: '#paging-area', swap: 'innerHTML settle:0ms' });
    const b = api.ajax('GET', '/b', { source: '#b', target: '#paging-area', swap: 'innerHTML settle:0ms' });
    expect(ControlledXHR.requests).toHaveLength(2);
    ControlledXHR.requests[0].finish('<podlove-player></podlove-player>');
    await a;
    vi.advanceTimersByTime(350);
    expect(details[0]).toBe(ControlledXHR.requests[0]);
    expect(document.getElementById('paging-area')!.getAttribute('data-cast-paging-mask-active')).toBe('true');
    ControlledXHR.requests[1].finish('<podlove-player></podlove-player>');
    await b;
    vi.advanceTimersByTime(300);
    expect(document.getElementById('paging-area')!.hasAttribute('data-cast-paging-mask-active')).toBe(false);
  } finally { document.removeEventListener('htmx:afterSettle', settled); }
});

test('real HTMX 204 releases its own paging mask and preserves a newer swap', async () => {
  vi.useFakeTimers();
  document.body.innerHTML = '<button id="empty"></button><button id="next"></button><div id="paging-area"><podlove-player></podlove-player></div>';
  const api = htmx();
  initPagingContentVisibility();
  const area = document.getElementById('paging-area')!;
  const mask = 'data-cast-paging-mask-active';

  const stale = api.ajax('GET', '/empty', { source: '#empty', target: area });
  expect(area.getAttribute(mask)).toBe('true');
  const next = api.ajax('GET', '/next', { source: '#next', target: area, swap: 'innerHTML settle:0ms' });
  ControlledXHR.requests[0].status = 204;
  ControlledXHR.requests[0].finish('');
  await stale;
  expect(area.getAttribute(mask)).toBe('true');

  ControlledXHR.requests[1].finish('<p>Next page</p><podlove-player></podlove-player>');
  await next;
  expect(area.textContent).toBe('Next page');
  expect(area.getAttribute(mask)).toBe('true');
  vi.advanceTimersByTime(300);
  expect(area.hasAttribute(mask)).toBe(false);

  const empty = api.ajax('GET', '/empty', { source: '#empty', target: area });
  expect(area.getAttribute(mask)).toBe('true');
  ControlledXHR.requests[2].status = 204;
  ControlledXHR.requests[2].finish('');
  await empty;
  expect(area.hasAttribute(mask)).toBe(false);
  expect(area.textContent).toBe('Next page');
});

test('a later HTMX beforeSwap listener can opt a paging 204 into a delayed swap', async () => {
  vi.useFakeTimers();
  document.body.innerHTML = '<div id="paging-area"><podlove-player></podlove-player></div>';
  const api = htmx();
  initPagingContentVisibility();
  const area = document.getElementById('paging-area')!;
  const mask = 'data-cast-paging-mask-active';
  document.addEventListener('htmx:beforeSwap', event => {
    const detail = (event as CustomEvent<{ shouldSwap: boolean; serverResponse: string }>).detail;
    detail.shouldSwap = true;
    detail.serverResponse = '<p>Custom page</p>';
  }, { once: true });

  const request = api.ajax('GET', '/custom', { target: area, swap: 'innerHTML swap:400ms settle:0ms' });
  ControlledXHR.requests[0].status = 204;
  ControlledXHR.requests[0].finish('');
  await request;
  vi.advanceTimersByTime(399);
  expect(area.getAttribute(mask)).toBe('true');
  expect(area.querySelector('podlove-player')).not.toBeNull();
  vi.advanceTimersByTime(1);
  expect(area.textContent).toBe('Custom page');
  expect(area.getAttribute(mask)).toBe('true');
  vi.advanceTimersByTime(300);
  expect(area.hasAttribute(mask)).toBe(false);
});

test('a late beforeRequest veto neither starts paging nor retires an active request', async () => {
  vi.useFakeTimers();
  document.body.innerHTML = '<button id="a"></button><button id="b"></button><div id="paging-area"><podlove-player></podlove-player></div>';
  const api = htmx();
  initPagingContentVisibility();
  const pagingArea = document.getElementById('paging-area')!;
  const vetoRequest = () => {
    document.addEventListener('htmx:beforeRequest', event => event.preventDefault(), { once: true });
    return api.ajax('GET', '/b', { source: '#b', target: '#paging-area' });
  };
  await vetoRequest();
  expect(ControlledXHR.requests).toHaveLength(0);
  expect(pagingArea.hasAttribute('data-cast-paging-mask-active')).toBe(false);

  const a = api.ajax('GET', '/a', { source: '#a', target: '#paging-area', swap: 'innerHTML settle:0ms' });
  await vetoRequest();
  expect(ControlledXHR.requests).toHaveLength(1);
  expect(pagingArea.getAttribute('data-cast-paging-mask-active')).toBe('true');

  ControlledXHR.requests[0].finish('<podlove-player></podlove-player>');
  await a;
  vi.advanceTimersByTime(300);
  expect(pagingArea.hasAttribute('data-cast-paging-mask-active')).toBe(false);
});

test('real HTMX cleanup releases reset listeners before replacing controls in a surviving form', async () => {
  vi.useFakeTimers();
  document.body.innerHTML = '<button id="source"></button><form><div id="slot"></div></form>';
  const api = htmx();
  const markup = '<div id="div_id_o"><select name="o"><option>A</option><option selected>B</option></select></div>';
  const form = document.querySelector('form')!;
  const remove = vi.spyOn(form, 'removeEventListener');
  const slot = document.getElementById('slot')!;
  slot.innerHTML = markup;
  initOrderingDropdowns();
  for (let i = 0; i < 3; i++) {
    form.reset();
    const removedBefore = remove.mock.calls.filter(([name]) => name === 'reset').length;
    const request = api.ajax('GET', '/ordering', { source: '#source', target: '#slot', swap: 'innerHTML settle:0ms' });
    ControlledXHR.requests[i].finish(markup);
    await request;
    expect(remove.mock.calls.filter(([name]) => name === 'reset')).toHaveLength(removedBefore + 1);
    initOrderingDropdowns(slot);
    expect(slot.querySelectorAll('.dropdown')).toHaveLength(1);
    vi.runAllTimers();
  }
});
