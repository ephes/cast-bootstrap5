import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { destroyPostLinkPrefetch, initPostLinkPrefetch } from "@/theme/post-link-prefetch";

function getPrefetchLinks(): HTMLLinkElement[] {
  return Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel="prefetch"]'));
}

describe("post-link-prefetch", () => {
  beforeEach(() => {
    destroyPostLinkPrefetch();
    document.head.querySelectorAll('link[rel="prefetch"]').forEach((link) => link.remove());
    document.body.innerHTML = "";
  });

  afterEach(() => {
    destroyPostLinkPrefetch();
  });

  it("prefetches same-origin links on mouseover", () => {
    document.body.innerHTML = `
      <a href="/blogs/ephes_blog/post-1/" data-cast-prefetch>Post 1</a>
    `;
    const link = document.querySelector("a") as HTMLAnchorElement;

    initPostLinkPrefetch();
    link.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    const prefetchLinks = getPrefetchLinks();
    expect(prefetchLinks).toHaveLength(1);
    expect(prefetchLinks[0].href).toBe(new URL("/blogs/ephes_blog/post-1/", window.location.href).href);
    expect(prefetchLinks[0].as).toBe("document");
  });

  it("ignores external links", () => {
    document.body.innerHTML = `
      <a href="https://example.com/post/" data-cast-prefetch>External</a>
    `;
    const link = document.querySelector("a") as HTMLAnchorElement;

    initPostLinkPrefetch();
    link.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(getPrefetchLinks()).toHaveLength(0);
  });

  it.each([
    ["reader", ""],
    ["", "synthetic-password"],
    ["reader", "synthetic-password"],
  ])("ignores same-origin credentials %s / %s without changing the anchor", (username, password) => {
    const url = new URL("/post/", window.location.href);
    url.username = username;
    url.password = password;
    const anchor = document.createElement("a");
    anchor.href = url.href;
    anchor.setAttribute("data-cast-prefetch", "");
    document.body.appendChild(anchor);

    initPostLinkPrefetch();
    const event = new MouseEvent("mouseover", { bubbles: true, cancelable: true });
    anchor.dispatchEvent(event);

    expect(getPrefetchLinks()).toHaveLength(0);
    expect(anchor.href).toBe(url.href);
    expect(event.defaultPrevented).toBe(false);
  });

  it("prefetches an absolute same-origin URL", () => {
    const anchor = document.createElement("a");
    anchor.href = new URL("/post/", window.location.href).href;
    anchor.setAttribute("data-cast-prefetch", "");
    document.body.appendChild(anchor);
    initPostLinkPrefetch();

    anchor.dispatchEvent(new Event("focusin", { bubbles: true }));

    expect(getPrefetchLinks().map((link) => link.href)).toEqual([anchor.href]);
  });

  it("prefetches on focusin", () => {
    document.body.innerHTML = `
      <a href="/blogs/ephes_blog/post-1/" data-cast-prefetch>Post 1</a>
    `;
    const link = document.querySelector("a") as HTMLAnchorElement;

    initPostLinkPrefetch();
    link.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

    expect(getPrefetchLinks()).toHaveLength(1);
  });

  it("prefetches on touchstart", () => {
    document.body.innerHTML = `
      <a href="/blogs/ephes_blog/post-1/" data-cast-prefetch>Post 1</a>
    `;
    const link = document.querySelector("a") as HTMLAnchorElement;

    initPostLinkPrefetch();
    link.dispatchEvent(new Event("touchstart", { bubbles: true }));

    expect(getPrefetchLinks()).toHaveLength(1);
  });

  it.each(["mailto:test@example.com", "javascript:void(0)"])("ignores non-http scheme %s", (href) => {
    document.body.innerHTML = `
      <a href="${href}" data-cast-prefetch>Unsupported</a>
    `;
    const link = document.querySelector("a") as HTMLAnchorElement;

    initPostLinkPrefetch();
    link.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(getPrefetchLinks()).toHaveLength(0);
  });

  it("ignores links without href", () => {
    document.body.innerHTML = `
      <a data-cast-prefetch>No href</a>
    `;
    const link = document.querySelector("a") as HTMLAnchorElement;

    initPostLinkPrefetch();
    link.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(getPrefetchLinks()).toHaveLength(0);
  });

  it("ignores same-page hash links", () => {
    document.body.innerHTML = `
      <a href="#comments" data-cast-prefetch>Comments</a>
    `;
    const link = document.querySelector("a") as HTMLAnchorElement;

    initPostLinkPrefetch();
    link.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(getPrefetchLinks()).toHaveLength(0);
  });

  it("deduplicates repeated prefetch triggers", () => {
    document.body.innerHTML = `
      <a href="/blogs/ephes_blog/post-1/" data-cast-prefetch>Post 1</a>
    `;
    const link = document.querySelector("a") as HTMLAnchorElement;

    initPostLinkPrefetch();
    link.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    link.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    link.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    link.dispatchEvent(new Event("touchstart", { bubbles: true }));

    expect(getPrefetchLinks()).toHaveLength(1);
  });

  it("deduplicates fragment variants across triggers while preserving anchor destinations and queries", () => {
    const hrefs = ["/post/?page=1#one", "/post/?page=1#two", "/post/?page=1#three", "/post/?page=2#one"];
    const events = ["mouseover", "focusin", "touchstart", "mouseover"];
    initPostLinkPrefetch();

    hrefs.forEach((href, index) => {
      const anchor = document.createElement("a");
      anchor.setAttribute("href", href);
      anchor.setAttribute("data-cast-prefetch", "");
      document.body.appendChild(anchor);
      const event = new Event(events[index], { bubbles: true, cancelable: true });
      anchor.dispatchEvent(event);
      expect(anchor.getAttribute("href")).toBe(href);
      expect(event.defaultPrevented).toBe(false);
    });

    expect(getPrefetchLinks().map((link) => link.href)).toEqual([
      new URL("/post/?page=1", window.location.href).href,
      new URL("/post/?page=2", window.location.href).href,
    ]);
  });

  it.each(["", "#existing"])("reuses an existing prefetch link with fragment '%s'", (fragment) => {
    const existing = document.createElement("link");
    existing.rel = "prefetch";
    existing.href = `/post/${fragment}`;
    document.head.appendChild(existing);
    document.body.innerHTML = '<a href="/post/#next" data-cast-prefetch>Post</a>';
    initPostLinkPrefetch();

    document.querySelector("a")!.dispatchEvent(new Event("focusin", { bubbles: true }));

    expect(getPrefetchLinks()).toEqual([existing]);
  });

  it("handles links inserted after initialization", () => {
    initPostLinkPrefetch();

    document.body.innerHTML = `
      <div id="paging-area">
        <a href="/blogs/ephes_blog/post-2/" data-cast-prefetch>Post 2</a>
      </div>
    `;

    const dynamicLink = document.querySelector("a") as HTMLAnchorElement;
    dynamicLink.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    const prefetchLinks = getPrefetchLinks();
    expect(prefetchLinks).toHaveLength(1);
    expect(prefetchLinks[0].href).toBe(new URL("/blogs/ephes_blog/post-2/", window.location.href).href);
  });

  it("bounds ownership across 1000 swaps and refetches evicted URLs", () => {
    const foreign = document.createElement("link");
    foreign.rel = "prefetch";
    foreign.href = "/foreign/";
    document.head.append(foreign);
    initPostLinkPrefetch();
    let first: HTMLLinkElement | undefined;
    for (let index = 0; index < 1000; index++) {
      document.body.innerHTML = `<a href="/synthetic/${index}/#section" data-cast-prefetch>Post</a>`;
      initPostLinkPrefetch();
      const anchor = document.querySelector("a")!;
      const event = new Event("focusin", { bubbles: true, cancelable: true });
      anchor.dispatchEvent(event);
      if (index === 0) first = getPrefetchLinks()[1];
      expect(getPrefetchLinks().length).toBeLessThanOrEqual(33);
      expect(event.defaultPrevented).toBe(false);
      expect(anchor.getAttribute("href")).toBe(`/synthetic/${index}/#section`);
    }
    expect(first!.isConnected).toBe(false);
    const anchor = document.querySelector("a")!;
    anchor.href = "/synthetic/0/";
    anchor.dispatchEvent(new Event("focusin", { bubbles: true }));
    expect(getPrefetchLinks()).toHaveLength(33);
    expect(getPrefetchLinks().at(-1)!.href).toBe(anchor.href);
    expect(getPrefetchLinks().at(-1)).not.toBe(first);
    destroyPostLinkPrefetch();
    expect(getPrefetchLinks()).toEqual([foreign]);
    initPostLinkPrefetch();
    anchor.dispatchEvent(new Event("focusin", { bubbles: true }));
    expect(getPrefetchLinks()).toHaveLength(2);
  });

  it("allows one retry after error without duplicates or an error storm", () => {
    document.body.innerHTML = '<a href="/retry/#section" data-cast-prefetch>Post</a>';
    initPostLinkPrefetch();
    const anchor = document.querySelector("a")!;
    const trigger = () => anchor.dispatchEvent(new Event("focusin", { bubbles: true }));
    trigger();
    const first = getPrefetchLinks()[0];
    first.dispatchEvent(new Event("error"));
    expect(first.isConnected).toBe(false);
    expect(getPrefetchLinks()).toHaveLength(0);
    for (let i = 0; i < 10; i++) trigger();
    const retry = getPrefetchLinks()[0];
    expect(getPrefetchLinks()).toHaveLength(1);
    expect(retry).not.toBe(first);
    first.dispatchEvent(new Event("error"));
    expect(getPrefetchLinks()).toEqual([retry]);
    retry.dispatchEvent(new Event("load"));
    trigger();
    expect(getPrefetchLinks()).toEqual([retry]);
  });

  it("stops retrying repeated errors until the URL leaves the bounded cache", () => {
    document.body.innerHTML = '<a href="/failed/" data-cast-prefetch>Post</a>';
    initPostLinkPrefetch();
    const append = vi.spyOn(document.head, "appendChild");
    const anchor = document.querySelector("a")!;
    for (let i = 0; i < 100; i++) {
      anchor.dispatchEvent(new Event("touchstart", { bubbles: true }));
      getPrefetchLinks().forEach(link => link.dispatchEvent(new Event("error")));
    }
    expect(append).toHaveBeenCalledTimes(2);
    expect(getPrefetchLinks()).toHaveLength(0);
    append.mockRestore();
  });

  it("removes listeners on destroy", () => {
    document.body.innerHTML = `
      <a href="/blogs/ephes_blog/post-1/" data-cast-prefetch>Post 1</a>
    `;
    const link = document.querySelector("a") as HTMLAnchorElement;

    initPostLinkPrefetch();
    destroyPostLinkPrefetch();
    link.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(getPrefetchLinks()).toHaveLength(0);
  });
});
