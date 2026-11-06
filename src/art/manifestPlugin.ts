import { readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

/**
 * Lists the PNGs in public/assets at build time as `virtual:art-manifest`,
 * so dropping a file into that folder is all it takes to use real art.
 */
export function artManifest(): Plugin {
  const id = 'virtual:art-manifest';
  const rid = '\0' + id;
  return {
    name: 'art-manifest',
    resolveId: (s) => (s === id ? rid : null),
    load(s) {
      if (s !== rid) return null;
      const dir = resolve(process.cwd(), 'public/assets');
      const files = existsSync(dir) ? readdirSync(dir).filter((f) => /^[a-z0-9-]+\.png$/.test(f)) : [];
      return `export default ${JSON.stringify(files.map((f) => f.replace(/\.png$/, '')))};`;
    },
    configureServer(server) {
      server.watcher.add(resolve(process.cwd(), 'public/assets'));
    },
  };
}
