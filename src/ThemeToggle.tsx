import { useEffect, useState } from "react";

/**
 * Light/dark switch for the panel.
 *
 * Deliberately manual: it opens light and only goes dark when you ask.
 * It does not follow prefers-color-scheme — the panel previews a site
 * whose canonical palette is light, so the OS shouldn't silently flip
 * what you're checking your work against.
 *
 * The choice persists to localStorage and is re-applied before first
 * paint by the inline script in index.html, so a reload doesn't flash.
 */
export function ThemeToggle() {
  // Seeded from the DOM: the inline script has already applied the
  // stored choice to <html> by the time React mounts.
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("lsf-panel-theme", theme);
    } catch {
      // Blocked storage — the toggle still works for this page view,
      // it just won't be remembered.
    }
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      title={isDark ? "Light theme" : "Dark theme"}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        aria-hidden="true"
      >
        {isDark ? (
          /* Sun — click to go back to light */
          <>
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6" />
          </>
        ) : (
          /* Crescent — click to go dark */
          <path d="M20.5 14.2A8.6 8.6 0 1 1 9.8 3.5a6.9 6.9 0 0 0 10.7 10.7Z" />
        )}
      </svg>
    </button>
  );
}
