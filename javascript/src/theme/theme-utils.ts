export type ResolvedTheme = "light" | "dark";

export function getThemeFromDocument(doc?: Document | null): ResolvedTheme | null {
  const safeDocument = doc ?? (typeof document !== "undefined" ? document : null);
  if (!safeDocument?.documentElement) {
    return null;
  }

  const theme = safeDocument.documentElement.getAttribute("data-bs-theme");
  if (theme === "light" || theme === "dark") {
    return theme;
  }

  return null;
}

export function resolveAutoTheme(prefersDark: boolean): ResolvedTheme {
  return prefersDark ? "dark" : "light";
}
