import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchSearchResponse } from "@/utils/search-response";
import { readBoundedJson } from "@/utils/bounded-json";

afterEach(() => vi.unstubAllGlobals());

describe("search response retirement", () => {
  it.each(["status", "redirect", "url"].flatMap(refusal =>
    ["complete", "reject", "pending"].map(cancellation => ({ refusal, cancellation }))
  ))("retires $refusal bodies without waiting for $cancellation cancellation", async ({ refusal, cancellation }) => {
    const cancel = vi.fn(() => {
      if (cancellation === "reject") return Promise.reject(new Error("Cleanup failed"));
      if (cancellation === "pending") return new Promise<void>(() => {});
    });
    const pull = vi.fn();
    const body = new ReadableStream<Uint8Array>({ pull, cancel }, { highWaterMark: 0 });
    const response = new Response(body, { status: refusal === "status" ? 500 : 200 });
    if (refusal === "redirect") Object.defineProperty(response, "redirected", { value: true });
    if (refusal === "url") Object.defineProperty(response, "url", { value: `${window.location.origin}/login/` });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    await expect(fetchSearchResponse("/suggestions", new AbortController().signal))
      .rejects.toThrow("Invalid search response endpoint");
    expect(cancel).toHaveBeenCalledOnce();
    expect(pull).not.toHaveBeenCalled();
  });

  it("preserves refusal for a bodyless response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
    await expect(fetchSearchResponse("/suggestions", new AbortController().signal))
      .rejects.toThrow("Invalid search response endpoint");
  });

  it("leaves accepted streaming bodies to the bounded reader", async () => {
    const cancel = vi.fn();
    const body = new ReadableStream<Uint8Array>({
      start(stream) {
        stream.enqueue(new TextEncoder().encode('{"query":'));
        stream.enqueue(new TextEncoder().encode('"synthetic"}'));
        stream.close();
      }, cancel,
    });
    const response = new Response(body);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
    const signal = new AbortController().signal;
    const accepted = await fetchSearchResponse("/suggestions", signal);
    expect(accepted).toBe(response);
    expect(accepted.bodyUsed).toBe(false);
    await expect(readBoundedJson(accepted, signal, 64)).resolves.toEqual({ query: "synthetic" });
    expect(cancel).not.toHaveBeenCalled();
    expect(body.locked).toBe(false);
  });
});
