import { mkdir, cp, copyFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
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
const wisp = process.env.WISP_URL || '';
if (wisp && !/^wss?:\/\//.test(wisp)) throw new Error('WISP_URL must start with ws:// or wss://');
await writeFile(path.join(dist, 'config.js'), `window.SCRAMJET_CONFIG = ${JSON.stringify({ wisp })};\n`);
console.log('Built website and pinned Scramjet assets into dist/.');
