// Downloads public character reference images from MyAnimeList.
// Run manually with Node.js and curl installed; no API keys are required.
// Existing verified local assets are preserved. Use --refresh to fetch all 48 again.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
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
  ['sakura', 145, 'Sakura'], ['kakashi', 85, 'Kakashi'], ['sasuke', 13, 'Sasuke'],
  ['zoro', 62, 'Zoro'], ['nami', 723, 'Nami'], ['robin', 61, 'Robin'],
  ['nobara', 164472, 'Nobara'], ['megumi', 164470, 'Megumi'],
  ['nezuko', 146157, 'Nezuko'], ['shinobu', 146736, 'Shinobu'],
  ['armin', 46494, 'Armin'], ['hange', 71121, 'Hange'],
  ['kurapika', 28, 'Kurapika'], ['hisoka', 31, 'Hisoka'],
  ['light', 80, 'Light'], ['ryuk', 75, 'Ryuk'], ['kageyama', 64771, 'Kageyama'],
  ['howl', 507, 'Howl'], ['san', 2727, 'San'], ['sophie', 508, 'Sophie'],
  ['alphonse', 12, 'Alphonse'], ['roy', 68, 'Roy'], ['riza', 70, 'Riza'],
  ['winry', 63, 'Winry'], ['vegeta', 913, 'Vegeta'], ['bulma', 678, 'Bulma'],
  ['yor', 170329, 'Yor'], ['frieren', 184947, 'Frieren'], ['maomao', 155904, 'Maomao'],
  ['spike', 1, 'Spike'], ['lelouch', 417, 'Lelouch'], ['asuka', 94, 'Asuka'],
];
const curl = process.platform === 'win32' ? 'curl.exe' : 'curl';
const creditPath = path.join(root, 'public', 'asset-credits.json');
const previous = existsSync(creditPath) ? JSON.parse(readFileSync(creditPath, 'utf8')) : [];
const credits = [];
const refresh = process.argv.includes('--refresh');
for (const [key, id, expectedName] of characters) {
  const prior = previous.find(item => item.key === key);
  const destination = path.join(directory, key + '.jpg');
  if (!refresh && prior && existsSync(destination)) {
    const bytes = readFileSync(destination);
    if (bytes[0] === 0xff && bytes[1] === 0xd8) { credits.push(prior); continue; }
  }
  const page = `https://myanimelist.net/character/${id}`;
  const html = execFileSync(curl, ['-L', '-sS', '--fail', '--connect-timeout', '10', '--max-time', '25', page], { encoding: 'utf8' });
  const image = html.match(/property="og:image"\s+content="([^"]+)"/)?.[1];
  const name = html.match(/property="og:title"\s+content="([^"]+)"/)?.[1];
  if (expectedName && !name?.toLowerCase().includes(expectedName.toLowerCase())) throw new Error(`Wrong identity: ${key}: ${name}`);
  if (!image?.startsWith('https://cdn.myanimelist.net/')) throw new Error(`Missing image: ${key}`);
  const local = `/images/${key}.jpg`;
  execFileSync(curl, ['-L', '-sS', '--fail', '--connect-timeout', '10', '--max-time', '25', image, '-o', destination]);
  const bytes = readFileSync(destination);
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error(`Expected JPG: ${key}`);
  credits.push({ key, name, source: page, originalImage: image, local, credit: 'Character reference image via MyAnimeList. Characters and artwork belong to their respective rights holders.' });
  console.log(`${key}: ${name} → ${local}`);
}
writeFileSync(creditPath, JSON.stringify(credits, null, 2) + '\n');
