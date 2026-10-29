import { cp, mkdir, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
await mkdir(resolve(root, 'dist'), { recursive: true });
await cp(resolve(root, 'public'), resolve(root, 'dist'), { recursive: true });
async function size(directory) {
  let total = 0;
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, item.name);
    total += item.isDirectory() ? await size(path) : (await stat(path)).size;
  }
  return total;
}
console.log(`Build listo: dist/ · ${(await size(resolve(root, 'dist')) / 1024).toFixed(0)} KB`);
