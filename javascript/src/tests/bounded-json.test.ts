import { describe, expect, it, vi } from 'vitest';
import { readBoundedJson } from '@/utils/bounded-json';
import { fetchSearchResponse } from '@/utils/search-response';

describe('bounded search JSON', () => {
  it.each([
    '{"query":"old","query":"new"}',
    '{"query":"new","qu\\u0065ry":"old"}',
    '{"results":[],"results":[1]}',
    '{"results":[1],"res\\u0075lts":[]}',
    '{"suggestions":[{"url":"/a/","url":"/b/"}]}',
    '{"suggestions":[{"u\\u0072l":"/b/","url":"/a/"}]}',
    '{"groups":{"tag_facets":{"selected":"a","sel\\u0065cted":"b"}}}',
    '{"groups":{"tag_facets":{},"tag_facets":{}}}',
    '{"__proto__":1,"__pr\\u006fto__":2}',
  ])('refuses duplicate decoded object members: %s', async text => {
    const body = new Response(text).body!;
    await expect(readBoundedJson(new Response(body), new AbortController().signal, 1024))
      .rejects.toThrow('Duplicate JSON member');
    expect(body.locked).toBe(false);
  });

  it('keeps member sets local to each object and preserves ordinary JSON strings', async () => {
    const text = '{"items":[{"name":"a"},{"name":"b"}],"nested":{"name":"c"},"__proto__":0,"text":"\\\\ \\\"name\\\": \\\"name\\\""}';
    await expect(readBoundedJson(new Response(text), new AbortController().signal, 1024))
      .resolves.toEqual(JSON.parse(text));
  });

  it.each(['', '/* comment */ {}', '{"a":1,}', '[1,]', '{"a":}', '{} {}', '{"a":01}'])(
    'retains strict JSON syntax refusal: %s', async text => {
      await expect(readBoundedJson(new Response(text), new AbortController().signal, 1024)).rejects.toThrow();
    });

  it.each([64 * 1024, 256 * 1024])('admits split Unicode at the exact %i byte ceiling and releases the reader', async limit => {
    const text = '"é😀' + ' '.repeat(limit - 8) + '"';
    const bytes = new TextEncoder().encode(text);
    expect(bytes.length).toBe(limit);
    let index = 0;
    const body = new ReadableStream<Uint8Array>({ pull(stream) {
      if (index === bytes.length) stream.close();
      else { const end = Math.min(index + 3, bytes.length); stream.enqueue(bytes.slice(index, end)); index = end; }
    } });
    expect(await readBoundedJson(new Response(body), new AbortController().signal, limit)).toBe(JSON.parse(text));
    expect(body.locked).toBe(false);
  });

  it.each([[0xc3, 0x28], [0xe2, 0x82], [0xc0, 0xaf], [0xed, 0xa0, 0x80]])('refuses invalid UTF-8 %j and releases the reader', async (...invalid) => {
    const body = new ReadableStream<Uint8Array>({ start(stream) {
      stream.enqueue(new Uint8Array([34, ...invalid, 34])); stream.close();
    } });
    await expect(readBoundedJson(new Response(body), new AbortController().signal, 64)).rejects.toThrow();
    expect(body.locked).toBe(false);
  });

  it('cancels and releases a pending stream on abort', async () => {
    const cancel = vi.fn();
    const body = new ReadableStream<Uint8Array>({ cancel });
    const controller = new AbortController();
    const read = readBoundedJson(new Response(body), controller.signal, 64);
    controller.abort();
    await expect(read).rejects.toMatchObject({ name: 'AbortError' });
    expect(cancel).toHaveBeenCalledOnce();
    expect(body.locked).toBe(false);
  });

  it.each(['https://foreign.invalid/search', 'javascript:alert(1)', 'http://user:secret@localhost/search'])(
    'refuses configured endpoint %s before fetch', async url => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      try {
        await expect(fetchSearchResponse(url, new AbortController().signal)).rejects.toThrow();
        expect(fetchMock).not.toHaveBeenCalled();
      } finally { vi.unstubAllGlobals(); }
    });
});
