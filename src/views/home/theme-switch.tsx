import { DarkModeIcon, LightModeIcon } from "@/components/icons";
import { toggleTheme, useTheme } from "@/lib/theme-store";

export default function ThemeSwitch() {
  const isDark = useTheme() === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Dark mode"
      onClick={toggleTheme}
      className="flex shrink-0 items-center gap-2.5 self-start"
    >
      <DarkModeIcon className="text-divider motion-safe:transition-[color] dark:text-white" />
      <span className="relative h-6 w-12 rounded-full bg-divider">
        <span className="absolute top-1.5 left-1.5 size-3 translate-x-6 rounded-full bg-white motion-safe:transition-transform dark:translate-x-0" />
      </span>
      <LightModeIcon className="text-white motion-safe:transition-[color] dark:text-divider" />
    </button>
  );
}
