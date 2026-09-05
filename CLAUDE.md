# Code style

- Don't inline a function call as an argument to another call (e.g. `outer(inner(x))`). Assign the inner call's result to a well-named variable first, then pass that variable to the outer call. This applies to `await`ed calls too. It makes the intermediate value easier to read and gives a distinct line to set a debugger breakpoint on.
- Always use braces around `if`/`else` bodies, even for a single statement (e.g. `if (!x) return;` should be `if (!x) {\n  return;\n}`). Prettier (printWidth 100) collapses a brace-less multi-line `if` back onto one line on save, so braces are the only form that survives formatting consistently.
- Don't use SHOUTY_SNAKE_CASE for constants in TypeScript/JavaScript. Every `const` is already immutable, so there's no need to case it differently from any other variable — use ordinary `camelCase` (e.g. `const maxRetries = 5;`, not `const MAX_RETRIES = 5;`).
