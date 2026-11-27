/**
 * Loads the rich-text editor (TipTap, about 130 KB compressed, half the admin's
 * script) only when needed, and lets the admin shell fetch it in idle time so it
 * is usually ready before anyone opens an editor. Deliberately not next/dynamic
 * or React.lazy: those show their placeholder through Suspense, which React
 * keeps on screen for at least 300 ms.
 */
type Editor = typeof import("./rich-text-editor");

let loaded: Editor | null = null;
let pending: Promise<Editor> | null = null;
const listeners = new Set<() => void>();

export function preloadRichText(): Promise<Editor> {
  pending ??= import("./rich-text-editor").then(
    (module) => {
      loaded = module;
      for (const listener of listeners) listener();
      return module;
    },
    (error: unknown) => {
      pending = null; // a failed download (say, offline) can be tried again
      throw error;
    },
  );
  return pending;
}

export const subscribeRichText = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const richTextModule = () => loaded;
/** Always null on the server and during hydration, so the first render matches the server's. */
export const richTextOnServer = () => null;

/** Fetches the editor once the browser is idle (or after 2 seconds). Returns a cancel function. */
export function preloadRichTextWhenIdle(): () => void {
  if (loaded || pending) return () => {};
  const run = () => void preloadRichText().catch(() => {});
  if ("requestIdleCallback" in window) {
    const handle = window.requestIdleCallback(run, { timeout: 4000 });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = setTimeout(run, 2000);
  return () => clearTimeout(handle);
}
