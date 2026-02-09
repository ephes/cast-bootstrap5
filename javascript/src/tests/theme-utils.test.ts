import { beforeEach, describe, expect, it } from "vitest";

import { getThemeFromDocument, resolveAutoTheme } from "@/theme/theme-utils";

describe("theme-utils", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-bs-theme");
  });

  it("returns light or dark from data-bs-theme", () => {
    document.documentElement.setAttribute("data-bs-theme", "light");
    expect(getThemeFromDocument()).toBe("light");

    document.documentElement.setAttribute("data-bs-theme", "dark");
    expect(getThemeFromDocument()).toBe("dark");
  });

  it("returns null for unsupported values", () => {
    document.documentElement.setAttribute("data-bs-theme", "auto");
    expect(getThemeFromDocument()).toBeNull();

    document.documentElement.removeAttribute("data-bs-theme");
    expect(getThemeFromDocument()).toBeNull();
  });

  it("handles missing document defensively", () => {
    expect(getThemeFromDocument(null)).toBeNull();
    expect(getThemeFromDocument({ documentElement: null } as unknown as Document)).toBeNull();
  });

  it("resolves auto theme from system preference", () => {
    expect(resolveAutoTheme(true)).toBe("dark");
    expect(resolveAutoTheme(false)).toBe("light");
  });
});
