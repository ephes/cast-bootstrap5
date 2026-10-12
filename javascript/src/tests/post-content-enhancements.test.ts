import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  destroyPostContentEnhancements,
  mergeConsecutiveBlockquotes,
  initPostContentEnhancements,
} from "@/content/post-content-enhancements";

describe("post-content-enhancements", () => {
  beforeEach(() => destroyPostContentEnhancements());
  afterEach(() => { destroyPostContentEnhancements(); vi.restoreAllMocks(); });

  it.each([
    '<blockquote>A</blockquote> prose <blockquote>B</blockquote>',
    '<blockquote>A</blockquote><!-- boundary --><blockquote>B</blockquote>',
    '<blockquote cite="/a">A</blockquote><blockquote cite="/b">B</blockquote>',
    '<blockquote cite="/a">A</blockquote><blockquote cite="/a">B</blockquote>',
    '<blockquote id="a">A</blockquote><blockquote id="b">B</blockquote>',
    '<blockquote>A</blockquote><blockquote id="b">B</blockquote>',
    '<blockquote>A</blockquote><blockquote lang="de">B</blockquote>',
  ])("preserves semantic boundaries: %s", (html) => {
    document.body.innerHTML = html;
    mergeConsecutiveBlockquotes();
    expect(document.body.innerHTML).toBe(html);
  });

  it("cancels pending initialization and reinitializes once", () => {
    vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
    document.body.innerHTML = '<div id="target"><blockquote>A</blockquote><blockquote>B</blockquote></div>';
    const add = vi.spyOn(document.body, "addEventListener");
    initPostContentEnhancements();
    initPostContentEnhancements();
    destroyPostContentEnhancements();
    destroyPostContentEnhancements();
    document.dispatchEvent(new Event("DOMContentLoaded"));
    expect(document.querySelectorAll("blockquote")).toHaveLength(2);
    expect(add).not.toHaveBeenCalled();
    const target = document.getElementById("target")!;
    document.body.dispatchEvent(new CustomEvent("htmx:afterSwap", { detail: { target } }));
    expect(target.querySelectorAll("blockquote")).toHaveLength(2);
    initPostContentEnhancements();
    initPostContentEnhancements();
    document.dispatchEvent(new Event("DOMContentLoaded"));
    document.dispatchEvent(new Event("DOMContentLoaded"));
    expect(target.querySelectorAll("blockquote")).toHaveLength(1);
    expect(add.mock.calls.filter(([name]) => name === "htmx:afterSwap")).toHaveLength(1);
  });

  it("initializes once when loaded and removes its listener", () => {
    vi.spyOn(document, "readyState", "get").mockReturnValue("complete");
    document.body.innerHTML = '<div id="target"></div>';
    const add = vi.spyOn(document.body, "addEventListener");
    initPostContentEnhancements();
    initPostContentEnhancements();
    expect(add.mock.calls.filter(([name]) => name === "htmx:afterSwap")).toHaveLength(1);
    const target = document.getElementById("target")!;
    target.innerHTML = '<blockquote>A</blockquote><blockquote>B</blockquote>';
    document.body.dispatchEvent(new CustomEvent("htmx:afterSwap", { detail: { target } }));
    expect(target.querySelectorAll("blockquote")).toHaveLength(1);
    destroyPostContentEnhancements();
    target.innerHTML = '<blockquote>C</blockquote><blockquote>D</blockquote>';
    document.body.dispatchEvent(new CustomEvent("htmx:afterSwap", { detail: { target } }));
    expect(target.querySelectorAll("blockquote")).toHaveLength(2);
  });
  it("merges editor bookkeeping quotes through all HTML whitespace", () => {
    document.body.innerHTML = '<blockquote data-block-key="a">A</blockquote>\t\n\f\r <blockquote data-block-key="b">B</blockquote>';
    mergeConsecutiveBlockquotes();
    expect(document.querySelectorAll("blockquote")).toHaveLength(1);
    expect(Array.from(document.querySelectorAll(".cast-blockquote-line"), (line) => line.textContent)).toEqual(["A", "B"]);
  });

  it.each(["before", "after"])("merges a plain quote inserted %s merged output", (position) => {
    document.body.innerHTML = '<blockquote>A</blockquote><blockquote>B</blockquote>';
    mergeConsecutiveBlockquotes();
    const quote = document.createElement("blockquote");
    quote.textContent = "C";
    if (position === "before") document.body.prepend(quote);
    else document.body.append(quote);
    mergeConsecutiveBlockquotes();
    mergeConsecutiveBlockquotes();
    expect(document.querySelectorAll("blockquote")).toHaveLength(1);
    expect(Array.from(document.querySelectorAll(".cast-blockquote-line"), (line) => line.textContent))
      .toEqual(position === "before" ? ["C", "A", "B"] : ["A", "B", "C"]);
  });

  it("merges consecutive blockquotes into one", () => {
    document.body.innerHTML = `
      <article>
        <blockquote><p>Line A</p></blockquote>
        <blockquote><p>Line B</p></blockquote>
        <blockquote><p>Line C</p></blockquote>
      </article>
    `;

    mergeConsecutiveBlockquotes();

    const blockquotes = document.querySelectorAll("blockquote");
    expect(blockquotes).toHaveLength(1);

    const merged = blockquotes[0];
    const lines = merged.querySelectorAll(".cast-blockquote-line");
    expect(lines).toHaveLength(3);
    expect(lines[0].textContent?.trim()).toBe("Line A");
    expect(lines[1].textContent?.trim()).toBe("Line B");
    expect(lines[2].textContent?.trim()).toBe("Line C");
    expect((lines[1] as HTMLElement).style.marginTop).toBe("0.35rem");
  });

  it("leaves non-consecutive blockquotes unchanged", () => {
    document.body.innerHTML = `
      <article>
        <blockquote><p>Line A</p></blockquote>
        <p>Separator</p>
        <blockquote><p>Line B</p></blockquote>
      </article>
    `;

    mergeConsecutiveBlockquotes();

    const blockquotes = document.querySelectorAll("blockquote");
    expect(blockquotes).toHaveLength(2);
    expect(blockquotes[0].querySelector(".cast-blockquote-line")).toBeNull();
    expect(blockquotes[1].querySelector(".cast-blockquote-line")).toBeNull();
  });

  it("is idempotent when called repeatedly", () => {
    document.body.innerHTML = `
      <article>
        <blockquote><p>Line A</p></blockquote>
        <blockquote><p>Line B</p></blockquote>
      </article>
    `;

    mergeConsecutiveBlockquotes();
    mergeConsecutiveBlockquotes();

    const blockquotes = document.querySelectorAll("blockquote");
    expect(blockquotes).toHaveLength(1);
    expect(blockquotes[0].querySelectorAll(".cast-blockquote-line")).toHaveLength(2);
  });

  it("handles htmx-style rescans on swapped roots", () => {
    document.body.innerHTML = `<div id="target"></div>`;
    const target = document.getElementById("target") as HTMLElement;

    target.innerHTML = `
      <blockquote><p>Fresh A</p></blockquote>
      <blockquote><p>Fresh B</p></blockquote>
    `;

    mergeConsecutiveBlockquotes(target);

    expect(target.querySelectorAll("blockquote")).toHaveLength(1);
    expect(target.querySelectorAll(".cast-blockquote-line")).toHaveLength(2);
  });

  it("is a no-op when no blockquotes exist", () => {
    document.body.innerHTML = "<p>No quotes here</p>";
    expect(() => mergeConsecutiveBlockquotes()).not.toThrow();
  });

  it("removes htmx listener on destroy", () => {
    document.body.innerHTML = "<div id='target'></div>";
    destroyPostContentEnhancements();

    const target = document.getElementById("target") as HTMLElement;
    target.innerHTML = `
      <blockquote><p>Fresh A</p></blockquote>
      <blockquote><p>Fresh B</p></blockquote>
    `;

    const event = new CustomEvent("htmx:afterSwap", {
      detail: { target },
      bubbles: true,
    });
    document.body.dispatchEvent(event);

    expect(target.querySelectorAll("blockquote")).toHaveLength(2);
  });
});
