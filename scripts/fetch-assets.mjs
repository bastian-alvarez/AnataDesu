// Downloads public character reference images from MyAnimeList.
// Run manually with Node.js and curl installed; no API keys are required.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.join(root, 'public', 'images');
mkdirSync(directory, { recursive: true });
const characters = [
  ['naruto', 17], ['luffy', 40], ['gojo', 164471], ['levi', 45627],
  ['tanjiro', 146156], ['mikasa', 40881], ['killua', 27], ['l', 71],
  ['hinata', 64769], ['violet', 141354], ['itachi', 14], ['usagi', 2030],
  ['chihiro', 384], ['edward', 11], ['goku', 246], ['anya', 170256],
];
const curl = process.platform === 'win32' ? 'curl.exe' : 'curl';
const credits = [];
for (const [key, id] of characters) {
  const page = `https://myanimelist.net/character/${id}`;
  const html = execFileSync(curl, ['-L', '-sS', '--fail', '--connect-timeout', '10', '--max-time', '25', page], { encoding: 'utf8' });
  const image = html.match(/property="og:image"\s+content="([^"]+)"/)?.[1];
  const name = html.match(/property="og:title"\s+content="([^"]+)"/)?.[1];
  if (!image?.startsWith('https://cdn.myanimelist.net/')) throw new Error(`Missing image: ${key}`);
  const ext = new URL(image).pathname.split('.').at(-1);
  const local = `/images/${key}.${ext}`;
  execFileSync(curl, ['-L', '-sS', '--fail', '--connect-timeout', '10', '--max-time', '25', image, '-o', path.join(directory, `${key}.${ext}`)]);
  credits.push({ key, name, source: page, originalImage: image, local, credit: 'Character reference image via MyAnimeList. Characters and artwork belong to their respective rights holders.' });
  console.log(`${key}: ${name} → ${local}`);
}
writeFileSync(path.join(root, 'public', 'asset-credits.json'), JSON.stringify(credits, null, 2) + '\n');
