import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  // Declarations are emitted by `tsc` separately (see the "build" script) —
  // tsup's bundled dts generator doesn't yet support this TypeScript version.
  dts: false,
  sourcemap: true,
  clean: true,
  splitting: false,
  external: ['react', 'react-dom'],
});
