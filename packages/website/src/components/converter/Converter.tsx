import { useEffect } from "preact/hooks";
import { initPersistence } from "../../lib/converter/store";
import DropHint from "./DropHint";
import DropOverlay from "./DropOverlay";

/**
 * The single hydration island `BaseLayout` mounts on every page. It's just a
 * shell around the two site-wide pieces of converter UI — the full-page drag
 * scrim and the bottom-right drop hint. `DropOverlay` shares state through
 * `lib/converter/store` rather than through this tree and `DropHint` is inert,
 * so they could equally be two islands; one keeps the hydration cost and the
 * wiring in `BaseLayout` to a single line. The converter proper is the editor
 * panel on the index page (`ConverterPanel`), a separate island.
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
      <DropHint />
    </>
  );
};

export default Converter;
