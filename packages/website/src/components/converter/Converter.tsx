import ConversionTray from "./ConversionTray";
import DropOverlay from "./DropOverlay";

/**
 * The single hydration island `BaseLayout` mounts on every page. It's just a
 * shell around the two pieces of converter UI — the full-page drag scrim and
 * the docked tray — which share state through `lib/converter/store` rather than
 * through this tree, so they could equally be two islands; one keeps the
 * hydration cost and the wiring in `BaseLayout` to a single line.
 */
const Converter = () => {
  return (
    <>
      <DropOverlay />
      <ConversionTray />
    </>
  );
};

export default Converter;
