export const WORKSPACE_THEME_STORAGE_KEY = 'rukny-workspace-theme';

/** Runs before paint to avoid a light flash when the stored theme is dark. */
export const WORKSPACE_THEME_INIT_SCRIPT = `(function(){try{var k=${JSON.stringify(WORKSPACE_THEME_STORAGE_KEY)};var t=localStorage.getItem(k);var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.remove('light','dark');r.classList.add(d?'dark':'light');}catch(e){}})();`;
