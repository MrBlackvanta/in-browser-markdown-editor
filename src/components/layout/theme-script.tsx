import { applyStoredTheme, THEME_SCRIPT_ID } from "@/lib/theme";

export default function ThemeScript() {
  return (
    <>
      <link rel="expect" href={`#${THEME_SCRIPT_ID}`} blocking="render" />
      <script
        id={THEME_SCRIPT_ID}
        dangerouslySetInnerHTML={{ __html: applyStoredTheme }}
      />
    </>
  );
}
