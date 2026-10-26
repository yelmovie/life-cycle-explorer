import { copyFile, lstat, mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(root, 'dist');
const required = ['field-writing.js','game-motion.js','field-quests.js','field-quest-state.js','field-world-effects.js','field-clock.js','field-observation-scenes.js','field-plant-scenes.js','field-story-scenes.js','field-notebook.js','field-notebook.css','field-specimen-3d.js','vendor/three-gltf-0.170.0.min.js','vendor/THREE-LICENSE.md','assets/fonts/NanumPenScript-OFL.txt','index.html','game-app.js','game-model.js','game-records.js','game-assets.js','game-metadata.js','game.css','game-info.js','game-audio.js','game-settings.js','settings-content.js','ui-icons.js','field-concepts.js','field-companion.js','field-certificate.js','field-record-art.js','field-model.js','field-content.js','field-flow.js','field-scenes.js','field-room-scenes.js','field-dialogs.js','expedition.js','adventure-core.js','adventure-export.js','inquiry-core.js','vendor/phaser-3.90.0.min.js','vendor/PHASER-LICENSE.md','assets/fonts/Jua-OFL.txt','assets/audio/KENNEY-INTERFACE-LICENSE.txt','assets/audio/KENNEY-IMPACT-LICENSE.txt'];
const sourceOnly = new Set(['source','raw','raw-png','originals','original-downloads']);
const assetExtension = /\.(?:png|webp|svg|jpe?g|gif|avif|ico|woff2|mp4|webm|wav|mp3|glb)$/i;
const dryRun = process.argv.includes('--dry-run');

async function exists(file) {
  try {return (await stat(file)).isFile();} catch {return false;}
}
async function filesWithin(directory, prefix = '', inspectOutput = false) {
  let entries;
  try {entries = await readdir(directory,{withFileTypes:true});} catch (error) {if(error.code === 'ENOENT')return [];throw error;}
  const files = [];
  for (const entry of entries) {
    const relative = prefix + entry.name;
    // Never follow links or include working originals in a release package.
    if (entry.isSymbolicLink()) {if(inspectOutput)throw new Error(`Refusing linked output path: ${relative}`);continue;}
    if (!inspectOutput && (entry.name.startsWith('.') || sourceOnly.has(entry.name.toLowerCase()))) continue;
    if (entry.isDirectory()) files.push(...await filesWithin(path.join(directory,entry.name),relative+'/',inspectOutput));
    else if (entry.isFile()) files.push(relative);
  }
  return files;
}
function patternFor(reference) {
  if (reference.split('/').some(part => part === '..' || sourceOnly.has(part.toLowerCase()))) throw new Error(`Source-only or unsafe asset reference: ${reference}`);
  return new RegExp('^'+reference.split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('[^/]*')+'$');
}

required.push('game-bootstrap.js','game-network.js','game-shell.css','field-preview.js','field-mission-data.js','offline-config.json','manifest.webmanifest');
const generated=new Map([['offline-config.json',Buffer.from('{"enabled":true}\n')]]);
const runtime = [...new Set(required)];
for (const relative of required) if (!await exists(path.join(root,relative))) throw new Error(`Required runtime file missing: ${relative}`);
const availableAssets = (await filesWithin(path.join(root,'assets'),'assets/')).filter(relative => assetExtension.test(relative));
const selectedAssets = new Set();
for (const relative of runtime) {
  // Templates such as scene-${String(n + 1).padStart(2,'0')}.webp become
  // a bounded filename pattern. No application code is executed by this build.
  const source = (await readFile(path.join(root,relative),'utf8')).replace(/\$\{[^}]*\}/g,'*');
  const references = new Set(source.match(/\bassets\/[A-Za-z0-9_./*\-]+\.(?:png|webp|svg|jpe?g|gif|avif|ico|woff2|mp4|webm|wav|mp3|glb)\b/gi) || []);
  for (const reference of references) {
    const pattern = patternFor(reference);
    const matches = availableAssets.filter(asset => pattern.test(asset));
    if (!matches.length) throw new Error(`Asset referenced by ${relative} is missing: ${reference}`);
    for (const asset of matches) selectedAssets.add(asset);
  }
  // Catch missing local scripts/styles, including newly added runtime files.
  for (const match of source.matchAll(/(?:src|href)=["'](?:\.\/)?([^"'#?]+\.(?:js|css))["']/g)) {
    if (!runtime.includes(match[1])) throw new Error(`Runtime file referenced by ${relative} is not packaged: ${match[1]}`);
  }
  for (const match of source.matchAll(/(?:from\s*|import\s*)["']\.\/([^"']+\.js)["']/g)) {
    if (!runtime.includes(match[1])) throw new Error(`Module imported by ${relative} is not packaged: ${match[1]}`);
  }
}
const selected = [...runtime,...selectedAssets].sort();
const entries = [];
for (const relative of selected) {
  const content=generated.get(relative)||await readFile(path.join(root,relative));
  entries.push({path:relative,bytes:content.length,sha256:createHash('sha256').update(content).digest('hex')});
}
const totalBytes = entries.reduce((sum,entry) => sum+entry.bytes,0);
const cacheVersion=createHash('sha256').update(JSON.stringify(entries)).digest('hex').slice(0,20);
const worker=(await readFile(path.join(root,'scripts/service-worker-template.js'),'utf8')).replace('__CACHE_VERSION__',JSON.stringify(cacheVersion)).replace('__CACHE_FILES__',JSON.stringify(entries));

if (!dryRun) {
  const allowed = new Set([...selected,'build-manifest.json','service-worker.js']);
  try {if ((await lstat(destination)).isSymbolicLink()) throw new Error('Refusing linked dist directory.');} catch(error) {if(error.code !== 'ENOENT')throw error;}
  const previous = await filesWithin(destination,'',true);
  const stale = previous.filter(relative => !allowed.has(relative));
  // Preserve the previous delivery intact when the runtime changes. Both resolved
  // endpoints are checked before moving; source folders are never moved/deleted.
  if (stale.length) {
    const archiveRoot = path.resolve(root,'archive','builds');
    const archive = path.resolve(archiveRoot,`dist-${new Date().toISOString().replace(/[:.]/g,'-')}-${randomUUID().slice(0,8)}`);
    if (destination !== path.join(root,'dist') || !destination.startsWith(root+path.sep) || !archive.startsWith(root+path.sep) || !archive.startsWith(archiveRoot+path.sep)) throw new Error('Unsafe build archive path.');
    if (!(await lstat(destination)).isDirectory()) throw new Error('dist must be a real directory.');
    try {if ((await lstat(archiveRoot)).isSymbolicLink()) throw new Error('Refusing linked archive directory.');} catch(error) {if(error.code !== 'ENOENT')throw error;}
    await mkdir(archiveRoot,{recursive:true});
    try {await lstat(archive);throw new Error('Build archive already exists.');} catch(error) {if(error.code !== 'ENOENT')throw error;}
    await rename(destination,archive);
    console.log(`Preserved prior dist in ${path.relative(root,archive)} (${stale.length} outdated paths); nothing deleted.`);
  }
  await mkdir(destination,{recursive:true});
  for (const relative of selected) {
    const target = path.join(destination,relative);
    await mkdir(path.dirname(target),{recursive:true});
    if(generated.has(relative))await writeFile(target,generated.get(relative));
    else await copyFile(path.join(root,relative),target);
  }
  await writeFile(path.join(destination,'service-worker.js'),worker);
  await writeFile(path.join(destination,'build-manifest.json'),JSON.stringify({version:3,cacheVersion,generatedAt:new Date().toISOString(),files:entries,totalBytes},null,2)+'\n');
}
console.log(`${dryRun?'Build check':'Built dist'}: ${runtime.length} runtime files, ${selectedAssets.size} assets, ${(totalBytes/1024/1024).toFixed(2)} MiB. Source originals are excluded.`);
