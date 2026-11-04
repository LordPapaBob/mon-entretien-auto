import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const dist = new URL('../dist/', import.meta.url);
async function listFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const name = prefix + entry.name;
    if (entry.isDirectory()) files.push(...await listFiles(new URL(entry.name + '/', directory), name + '/'));
    else if (name !== 'sw.js') files.push(name);
  }
  return files.sort();
}
const files = await listFiles(dist);
const hash = createHash('sha256');
for (const file of files) hash.update(file).update(await readFile(new URL(file, dist)));
const version = hash.digest('hex').slice(0, 12);
let worker = await readFile(new URL('sw.js', dist), 'utf8');
worker = worker.replace(/const CACHE = '[^']+';/, `const CACHE = 'mea-v021-test-${version}';`);
worker = worker.replace(/const ASSETS = \[[\s\S]*?\];/, `const ASSETS = ${JSON.stringify(['./', ...files])}.map(path => new URL(path, BASE_URL).href);`);
await writeFile(new URL('sw.js', dist), worker);
await writeFile(new URL('version.json', dist), JSON.stringify({ version: '0.2.1-test', build: version }));
await writeFile(new URL('.nojekyll', dist), '');
console.log(`PWA : ${files.length} ressources précachées, build ${version}.`);
