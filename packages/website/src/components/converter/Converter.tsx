import { useEffect } from "preact/hooks";
import { initPersistence } from "../../lib/converter/store";
import ConversionTray from "./ConversionTray";
import DropOverlay from "./DropOverlay";

/**
 * The single hydration island `BaseLayout` mounts on every page. It's just a
 * shell around the two pieces of converter UI — the full-page drag scrim and
 * the docked tray — which share state through `lib/converter/store` rather than
 * through this tree, so they could equally be two islands; one keeps the
 * hydration cost and the wiring in `BaseLayout` to a single line.
 *
 * It also owns the one-time call that rehydrates the queue from IndexedDB and
 * keeps it synced across tabs (`initPersistence`).
 */
const Converter = () => {
  useEffect(() => {
    let teardown: (() => void) | undefined;
    let disposed = false;

    void initPersistence().then(dispose => {
      if (disposed) {
        dispose();
        return;
      }
      teardown = dispose;
    });

    return () => {
      disposed = true;
      teardown?.();
    };
  }, []);

  return (
    <>
      <DropOverlay />
      <ConversionTray />
    </>
  );
};

export default Converter;
