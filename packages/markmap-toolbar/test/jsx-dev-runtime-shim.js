// Shim for @gera2ld/jsx-dom/jsx-dev-runtime
// This package doesn't provide a dev runtime, so we map it to the regular runtime
import { jsx, jsxs, Fragment } from '@gera2ld/jsx-dom';

// jsxDEV is the development version of jsx
// It has additional parameters for debugging, but we can ignore them
export function jsxDEV(type, props, key, isStaticChildren, source, self) {
  return jsx(type, props, key);
}

export { jsx, jsxs, Fragment };
