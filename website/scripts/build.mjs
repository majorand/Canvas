import { mkdir, cp, copyFile, writeFile, readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
await mkdir(dist, { recursive: true });
await cp(path.join(root, 'public'), dist, { recursive: true });
for (const [pkg, files, folder] of [
  ['scramjet', ['scramjet.js', 'scramjet.wasm'], 'scramjet'],
  ['scramjet-controller', ['controller.api.js', 'controller.inject.js', 'controller.sw.js'], 'controller'],
  ['libcurl-transport', ['index.js'], 'transport'],
]) {
  await mkdir(path.join(dist, folder), { recursive: true });
  for (const file of files) await copyFile(path.join(root, 'node_modules/@mercuryworkshop', pkg, 'dist', file), path.join(dist, folder, file));
}
const wisp = process.env.WISP_URL || (process.argv.includes('--pages') ? 'wss://scramjet-xi.vercel.app/api/wisp/' : '');
if (wisp) {
  const url = new URL(wisp);
  if (!['ws:', 'wss:'].includes(url.protocol) || url.username || url.password) throw new Error('WISP_URL must be a WebSocket URL without credentials');
  if (process.argv.includes('--pages') && url.protocol !== 'wss:') throw new Error('GitHub Pages requires a secure wss:// relay');
}
await writeFile(path.join(dist, '.nojekyll'), '');
await writeFile(path.join(dist, 'config.js'), `window.SCRAMJET_CONFIG = ${JSON.stringify({ wisp, api: process.env.AUTH_API_URL || (process.argv.includes('--pages') ? 'https://scramjet-xi.vercel.app/api/access' : '') })};\n`);
// A shared revision keeps HTML, configuration, and the entire module graph in sync.
const appFiles = (await readdir(path.join(root, 'public'))).filter(file => /\.(html|js|mjs|css)$/.test(file)).sort();
const sources = await Promise.all(appFiles.map(file => readFile(path.join(dist, file), 'utf8')));
const config = await readFile(path.join(dist, 'config.js'), 'utf8');
const revision = createHash('sha256').update(sources.join('\n') + config).digest('hex').slice(0,16);
for (let index = 0; index < appFiles.length; index++) {
  const source = sources[index].replace(/(['"])(\.\/[^'"\s?]+\.(?:html|js|mjs|css))(?:\?([^'"\s]*))?\1/g, (_match, quote, file, query) => {
    const params = new URLSearchParams(query);
    params.set('v', revision);
    return quote + file + '?' + params.toString() + quote;
  });
  await writeFile(path.join(dist, appFiles[index]), source);
}
console.log('Built website and pinned Scramjet assets into dist/ (' + revision + ').');
