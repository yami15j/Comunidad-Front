import { useEffect, useState } from "react";

const THEME_KEY = "traction_theme";

function savedTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(savedTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // El cambio sigue funcionando si el navegador bloquea el almacenamiento.
    }
  }, [theme]);

  useEffect(() => {
    const syncTheme = (event) => {
      if (event.key === THEME_KEY || event.key === null) setTheme(savedTheme());
    };
    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  return {
    theme,
    toggleTheme: () =>
      setTheme((current) => (current === "dark" ? "light" : "dark")),
  };
}
