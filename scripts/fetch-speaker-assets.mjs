// Verified Bleach portraits for the dialogue cast, kept separate from the test catalogue.
// Node.js and curl are enough. Existing verified files are preserved; --refresh replaces them.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.join(root, 'public', 'images', 'speakers');
const creditPath = path.join(root, 'public', 'speaker-asset-credits.json');
const previous = existsSync(creditPath) ? JSON.parse(readFileSync(creditPath, 'utf8')) : [];
const curl = process.platform === 'win32' ? 'curl.exe' : 'curl';
const refresh = process.argv.includes('--refresh');
const characters = [
  { key: 'ichigo', id: 5, name: 'Ichigo Kurosaki' },
  { key: 'rukia', id: 6, name: 'Rukia Kuchiki' },
  { key: 'renji', id: 906, name: 'Renji Abarai' },
];
mkdirSync(directory, { recursive: true });
function isJpeg(bytes) { return bytes.length > 1000 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9; }
const credits = [];
for (const character of characters) {
  const destination = path.join(directory, `${character.key}.jpg`);
  const source = `https://myanimelist.net/character/${character.id}`;
  const local = `/images/speakers/${character.key}.jpg`;
  const prior = previous.find(entry => entry.key === character.key && entry.source === source);
  if (!refresh && prior && existsSync(destination) && isJpeg(readFileSync(destination))) { credits.push(prior); continue; }
  const html = execFileSync(curl, ['-L', '-sS', '--fail', '--connect-timeout', '10', '--max-time', '25', source], { encoding: 'utf8' });
  const name = html.match(/property="og:title"\s+content="([^"]+)"/)?.[1];
  const originalImage = html.match(/property="og:image"\s+content="([^"]+)"/)?.[1];
  if (name !== character.name) throw new Error(`Unexpected identity for ${character.key}: ${name}`);
  if (!originalImage?.startsWith('https://cdn.myanimelist.net/images/characters/')) throw new Error(`No verified portrait for ${character.key}`);
  const bytes = execFileSync(curl, ['-L', '-sS', '--fail', '--connect-timeout', '10', '--max-time', '25', originalImage], { maxBuffer: 5 * 1024 * 1024 });
  if (!isJpeg(bytes)) throw new Error(`Expected complete JPEG for ${character.key}`);
  writeFileSync(destination, bytes);
  credits.push({ key: character.key, name, source, originalImage, local, credit: 'Character reference image via MyAnimeList. Characters and artwork belong to their respective rights holders.' });
  console.log(`${character.key}: ${name} → ${local}`);
}
writeFileSync(creditPath, JSON.stringify(credits, null, 2) + '\n');
