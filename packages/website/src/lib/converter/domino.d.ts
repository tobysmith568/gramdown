// `@mixmark-io/domino` (turndown's DOM dependency) ships no type declarations.
// Only the surface `dom-shim.ts` uses is described here.
declare module "@mixmark-io/domino" {
  interface Domino {
    createDocument(html?: string, force?: boolean): Document;
  }
  const domino: Domino;
  export default domino;
}
