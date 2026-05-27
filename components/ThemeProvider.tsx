"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Theme = "dark" | "light";

type ThemeCtx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const Ctx = createContext<ThemeCtx | null>(null);

const KEY = "siphr:theme";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  // The inline script in layout.tsx already applied the right class so we don't
  // flash the wrong theme. Mirror that into React state here.
  useEffect(() => {
    try {
      const t = (localStorage.getItem(KEY) as Theme | null) ?? "dark";
      setThemeState(t);
    } catch {
      /* no localStorage — fine */
    }
  }, []);

  const apply = useCallback((t: Theme) => {
    document.documentElement.classList.toggle("light", t === "light");
    try { localStorage.setItem(KEY, t); } catch { /* */ }
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    apply(t);
  }, [apply]);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const v = useContext(Ctx);
  if (!v) {
    // Safe fallback when used outside the provider (e.g. SSR snapshot).
    return {
      theme: "dark",
      setTheme: () => {},
      toggle: () => {},
    };
  }
  return v;
}
