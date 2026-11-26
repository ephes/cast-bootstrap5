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
  responseHeaders: Record<string, string> = { 'content-type': 'text/html' };
  onload: (() => void) | null = null;
  onabort: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  open() { /* transport is completed explicitly below */ }
  setRequestHeader() {}
  overrideMimeType() {}
  getAllResponseHeaders() {
    return Object.entries(this.responseHeaders).map(([name, value]) => `${name}: ${value}\r\n`).join('');
  }
  getResponseHeader(name: string) { return this.responseHeaders[name.toLowerCase()] ?? null; }
  send() { ControlledXHR.requests.push(this); }
  finish(html: string) { this.response = this.responseText = html; this.onload?.(); }
  fail(type: 'abort' | 'error' | 'timeout') {
    this[`on${type}`]?.();
    this.dispatchEvent(new Event(type));
  }
}

afterEach(() => {
  destroyPagingContentVisibility();
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete (window as any).htmx;
  delete (window as any).bootstrap;
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

test.each([
  'htmx:beforeOnLoad', 'htmx:before-on-load', 'htmx:beforeSwap', 'htmx:before-swap',
])('a late %s veto only releases its paging request', async (eventName) => {
  vi.useFakeTimers();
  document.body.innerHTML = '<button id="a"></button><button id="b"></button><div id="paging-area"><p>Current page</p><podlove-player></podlove-player></div>';
  const api = htmx();
  initPagingContentVisibility();
  const area = document.getElementById('paging-area')!;
  const mask = 'data-cast-paging-mask-active';
  const request = (source: string) => api.ajax('GET', `/${source}`, {
    source: `#${source}`, target: area, swap: 'innerHTML settle:0ms',
  });
  const vetoNextResponse = () => {
    document.addEventListener(eventName, event => event.preventDefault(), { once: true });
  };

  const standalone = request('a');
  expect(area.getAttribute(mask)).toBe('true');
  vetoNextResponse();
  ControlledXHR.requests[0].finish('<p>Vetoed page</p>');
  await standalone;
  expect(area.hasAttribute(mask)).toBe(false);
  expect(area.textContent).toBe('Current page');

  const older = request('a');
  vetoNextResponse();
  ControlledXHR.requests[1].finish('<p>Stale page</p>');
  const newer = request('b');
  await older;
  expect(area.getAttribute(mask)).toBe('true');
  expect(area.textContent).toBe('Current page');

  ControlledXHR.requests[2].finish('<p>Next page</p>');
  await newer;
  expect(area.textContent).toBe('Next page');
  expect(area.getAttribute(mask)).toBe('true');
  vi.advanceTimersByTime(300);
  expect(area.hasAttribute(mask)).toBe(false);
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

test('real HTMX retargeted settle releases the paging mask and refreshes player presence', async () => {
  vi.useFakeTimers();
  document.body.innerHTML = `
    <button id="next"></button><button id="unrelated"></button>
    <div id="paging-area"><div id="player-slot"><podlove-player></podlove-player></div></div>
    <div id="response-target"></div>`;
  const api = htmx();
  initPagingContentVisibility();
  const area = document.getElementById('paging-area')!;
  const mask = 'data-cast-paging-mask-active';
  const presence = 'data-cast-podlove-present';
  const paging = api.ajax('GET', '/next', { source: '#next', target: area, swap: 'innerHTML settle:0ms' });
  expect(area.getAttribute(mask)).toBe('true');

  const unrelated = api.ajax('GET', '/player', {
    source: '#unrelated', target: '#player-slot', swap: 'innerHTML settle:0ms',
  });
  ControlledXHR.requests[1].finish('<p>Player removed</p>');
  await unrelated;
  vi.advanceTimersByTime(300);
  expect(area.getAttribute(mask)).toBe('true');
  expect(area.getAttribute(presence)).toBe('true');

  const pagingXHR = ControlledXHR.requests[0];
  pagingXHR.responseHeaders['hx-retarget'] = '#response-target';
  pagingXHR.finish('<p>Retargeted response</p>');
  await paging;
  expect(document.getElementById('response-target')!.textContent).toBe('Retargeted response');
  expect(area.textContent).toBe('Player removed');
  vi.advanceTimersByTime(300);
  expect(area.hasAttribute(mask)).toBe(false);
  expect(area.hasAttribute(presence)).toBe(false);
});

test.each(['transition', 'plain', 'veto'])('a real HTMX response retargeted into paging masks the player: %s', async mode => {
  vi.useFakeTimers();
  document.body.innerHTML = '<button id="source"></button><div id="other"></div><div id="paging-area"><podlove-player></podlove-player></div>';
  const api = htmx();
  initPagingContentVisibility();
  const area = document.getElementById('paging-area')!;
  const mask = 'data-cast-paging-mask-active';
  const transition = vi.fn((event: Event) => [event.defaultPrevented, area.getAttribute(mask)]);
  const veto = vi.fn((event: Event) => {
    event.preventDefault();
    return area.getAttribute(mask);
  });
  const request = api.ajax('GET', '/retarget', {
    source: '#source', target: '#other',
    swap: `innerHTML transition:${mode === 'transition'} settle:0ms`,
  });
  expect(area.hasAttribute(mask)).toBe(false);
  document.addEventListener('htmx:beforeTransition', transition, { once: true });
  if (mode === 'veto') document.addEventListener('htmx:before-swap', veto, { once: true });
  try {
    const xhr = ControlledXHR.requests[0];
    xhr.responseHeaders['hx-retarget'] = '#paging-area';
    xhr.finish('<p>Retargeted page</p>');
    await request;
    if (mode === 'veto') {
      expect(veto).toHaveReturnedWith('true');
      expect(area.querySelector('podlove-player')).not.toBeNull();
      expect(area.hasAttribute(mask)).toBe(false);
    } else {
      if (mode === 'transition') expect(transition).toHaveReturnedWith([true, 'true']);
      expect(area.textContent).toBe('Retargeted page');
      expect(area.getAttribute(mask)).toBe('true');
      vi.advanceTimersByTime(300);
      expect(area.hasAttribute(mask)).toBe(false);
    }
  } finally {
    document.removeEventListener('htmx:beforeTransition', transition);
    document.removeEventListener('htmx:before-swap', veto);
  }
});

test('a superseded HTMX response retargeted into paging cannot reclaim ownership', async () => {
  vi.useFakeTimers();
  document.body.innerHTML = '<button id="older"></button><button id="newer"></button><div id="other"></div><div id="paging-area"><podlove-player></podlove-player></div>';
  const api = htmx();
  initPagingContentVisibility();
  const area = document.getElementById('paging-area')!;
  const mask = 'data-cast-paging-mask-active';
  const request = (source: string, target: string) => api.ajax('GET', `/${source}`, {
    source: `#${source}`, target, swap: 'innerHTML settle:0ms',
  });

  const older = request('older', '#other');
  const newer = request('newer', '#paging-area');
  ControlledXHR.requests[1].finish('<podlove-player></podlove-player>');
  await newer;
  vi.advanceTimersByTime(300);
  expect(area.hasAttribute(mask)).toBe(false);

  ControlledXHR.requests[0].responseHeaders['hx-retarget'] = '#paging-area';
  ControlledXHR.requests[0].finish('<p>Late response</p>');
  await older;
  expect(area.hasAttribute(mask)).toBe(false);
});

test.each(['abort', 'error', 'timeout'] as const)('a detached source releases only its own paging mask on XHR %s', async type => {
  document.body.innerHTML = `
    <div id="source-slot"><button id="detached"></button></div>
    <button id="older"></button><button id="newer"></button>
    <div id="paging-area"><podlove-player></podlove-player></div>`;
  const api = htmx();
  initPagingContentVisibility();
  const area = document.getElementById('paging-area')!;
  const mask = 'data-cast-paging-mask-active';
  const request = (source: string) => api.ajax('GET', `/${source}`, {
    source: `#${source}`, target: area,
  }).catch(() => {});
  const detached = request('detached');
  expect(area.getAttribute(mask)).toBe('true');

  const unrelated = api.ajax('GET', '/remove-trigger', {
    target: '#source-slot', swap: 'innerHTML settle:0ms',
  });
  ControlledXHR.requests[1].finish('');
  await unrelated;
  expect(document.getElementById('detached')).toBeNull();
  expect(area.getAttribute(mask)).toBe('true');
  ControlledXHR.requests[0].fail(type);
  await detached;
  expect(area.hasAttribute(mask)).toBe(false);

  const older = request('older');
  const removed = vi.spyOn(ControlledXHR.requests[2], 'removeEventListener');
  const newer = request('newer');
  expect(removed.mock.calls.map(([event]) => event)).toEqual(['abort', 'error', 'timeout']);
  document.getElementById('older')!.remove();
  ControlledXHR.requests[2].fail(type);
  await older;
  expect(area.getAttribute(mask)).toBe('true');

  // A connected source also delivers the HTMX failure for the same raw event.
  ControlledXHR.requests[3].fail(type);
  await newer;
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
  window.eval(readFileSync(resolve('../cast_bootstrap5/static/cast_bootstrap5/js/bootstrap5/bootstrap.bundle.min.js'), 'utf8'));
  const Dropdown = (window as any).bootstrap.Dropdown;
  const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
  initOrderingDropdowns();
  for (let i = 0; i < 3; i++) {
    const toggle = slot.querySelector<HTMLButtonElement>('.dropdown-toggle')!;
    const observerCount = disconnect.mock.calls.length;
    toggle.click();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(Dropdown.getInstance(toggle)).not.toBeNull();
    form.reset();
    const removedBefore = remove.mock.calls.filter(([name]) => name === 'reset').length;
    const request = api.ajax('GET', '/ordering', { source: '#source', target: '#slot', swap: 'innerHTML settle:0ms' });
    ControlledXHR.requests[i].finish(markup);
    await request;
    expect(remove.mock.calls.filter(([name]) => name === 'reset')).toHaveLength(removedBefore + 1);
    expect(Dropdown.getInstance(toggle)).toBeNull();
    expect(disconnect).toHaveBeenCalledTimes(observerCount + 1);
    initOrderingDropdowns(slot);
    expect(slot.querySelectorAll('.dropdown')).toHaveLength(1);
    vi.runAllTimers();
  }
});
