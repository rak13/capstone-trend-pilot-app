import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "@/lib/theme-store";

const ThemeToggle = () => {
  const { theme, toggle } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="w-9 h-9 rounded-lg flex items-center justify-center
        text-muted-foreground hover:text-foreground hover:bg-white/5
        border border-transparent hover:border-border/40
        transition-all duration-200"
    >
      {isDark ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
};

export default ThemeToggle;
