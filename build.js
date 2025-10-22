import { build } from 'bun';

await build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'bun',
  minify: true,
  sourcemap: true,
});

console.log('✅ Build completed successfully!');
