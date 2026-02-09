import { describe, expect, it } from "vitest";

import {
  destroyPostContentEnhancements,
  mergeConsecutiveBlockquotes,
} from "@/content/post-content-enhancements";

describe("post-content-enhancements", () => {
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
