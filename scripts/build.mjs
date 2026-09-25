import { build } from 'esbuild';
import { build as viteBuild } from 'vite';
await build({entryPoints:['src/main/index.ts'],outfile:'dist/main/index.cjs',bundle:true,platform:'node',format:'cjs',packages:'external',sourcemap:true});
await build({entryPoints:['src/preload/index.ts'],outfile:'dist/preload/index.cjs',bundle:true,platform:'node',format:'cjs',external:['electron'],sourcemap:true});
await viteBuild({root:'src/renderer',base:'./',build:{outDir:'../../dist/renderer',emptyOutDir:true}});
