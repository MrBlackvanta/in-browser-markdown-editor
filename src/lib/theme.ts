export const THEME_STORAGE_KEY = "theme";

export const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

export const THEME_SCRIPT_ID = "theme-script";

export const applyStoredTheme = `{let t;try{t=localStorage.getItem("${THEME_STORAGE_KEY}")}catch{}if(t!=="dark"&&t!=="light")t=matchMedia("${DARK_SCHEME_QUERY}").matches?"dark":"light";document.documentElement.dataset.theme=t}`;
