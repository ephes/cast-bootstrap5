import { describe, expect, it, vi } from 'vitest';
import { readBoundedJson } from '@/utils/bounded-json';
import { fetchSearchResponse } from '@/utils/search-response';

describe('bounded search JSON', () => {
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
