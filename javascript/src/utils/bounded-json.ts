export async function readBoundedJson(response: Response, signal: AbortSignal, maxBytes: number): Promise<unknown> {
  if (!response.body) throw new Error("Missing response body");
  const reader = response.body.getReader();
  const cancel = () => { void reader.cancel().catch(() => undefined); };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    // Bound decoded network bytes independently of Content-Length or compression.
    const bytes = new Uint8Array(maxBytes);
    let size = 0;
    while (true) {
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      const { done, value } = await reader.read();
      if (done) break;
      if (value.byteLength > bytes.byteLength - size) throw new Error("Response body too large");
      bytes.set(value, size);
      size += value.byteLength;
    }
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, size)));
  } catch (error) {
    cancel();
    throw error;
  } finally {
    signal.removeEventListener("abort", cancel);
    reader.releaseLock();
  }
}
