import { useLayoutEffect, useState } from "preact/hooks";

/**
 * False on every server-rendered and first-hydrated-frame render, then
 * flips to true from a layout effect right after mount. Consumers start
 * hidden via CSS and fade in once this is true - by then hydration has
 * already corrected any server-rendered OS fallback (see `lib/installOrder`
 * and `HeroCommand`/`InstallMethods`'s lazy `useState` initializers), so
 * nothing wrong is ever visible, just briefly nothing.
 *
 * Each consumer needs its own `<noscript>` override forcing visibility back
 * on - without JS this never flips, and the content would otherwise stay
 * hidden forever.
 */
const useReveal = (): boolean => {
  const [revealed, setRevealed] = useState(false);

  useLayoutEffect(() => {
    setRevealed(true);
  }, []);

  return revealed;
};

export default useReveal;
