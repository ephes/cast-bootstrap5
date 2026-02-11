import { afterEach, beforeEach, describe, expect, it } from "vitest";

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

  it("ignores non-http schemes", () => {
    document.body.innerHTML = `
      <a href="mailto:test@example.com" data-cast-prefetch>Email</a>
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
