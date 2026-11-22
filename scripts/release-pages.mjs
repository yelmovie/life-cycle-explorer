import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, unlinkSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const project = 'life-clock-lab';
const production = 'https://life-clock-lab.pages.dev/';
const repo = 'https://github.com/yelmovie/life-cycle-explorer.git';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const clean = () => {
  const files = git('status', '--porcelain=v1', '-z').split('\0').filter(line =>
    line && !(line.startsWith('?? ') && /(?:^|\/)\._[^/]+\/?$/.test(line.slice(3))));
  if (files.length) throw new Error('Use a clean GitHub main checkout to release.\n' + files.join('\n'));
};
const latest = () => git('ls-remote', '--exit-code', repo, 'refs/heads/main').split(/\s+/)[0];
const requireMain = commit => {
  if (commit !== latest()) throw new Error('GitHub main changed or this checkout is behind; release the latest main.');
};
const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.status ?? result.signal})`);
};
const dist = new URL('../dist/', import.meta.url);
const readDist = file => readFileSync(new URL(file, dist));
function verifyFiles(allowed, dir=dist, prefix='') {
  for (const entry of readdirSync(dir,{withFileTypes:true})) {
    const name = prefix+entry.name;
    const url = new URL(encodeURIComponent(entry.name)+(entry.isDirectory()?'/':''),dir);
    if (entry.isDirectory()) { verifyFiles(allowed,url,name+'/'); continue; }
    if (entry.isFile()&&allowed.has(name)) continue;
    // On exFAT macOS creates AppleDouble files even when copying plain bytes.
    if (entry.isFile()&&entry.name.startsWith('._')&&readFileSync(url).subarray(0,4).toString('hex')==='00051607') {
      unlinkSync(url);
      continue;
    }
    throw new Error('Unexpected release file: '+name);
  }
}
const keyFiles = [
  'build-manifest.json', 'index.html', 'service-worker.js', 'src/game.css',
  'src/glass-ui.css', 'src/map-encounters.js', 'assets/fonts/NanumSquareNeoTTF-bRg.woff'
];

async function verify(commit) {
  const mismatch = [];
  for (const file of keyFiles) {
    const url = new URL(file === 'index.html' ? './' : file, production);
    url.searchParams.set('verify', commit);
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== hash(readDist(file))) {
      mismatch.push(file);
    }
  }
  if (mismatch.length) throw new Error('Production file mismatch: ' + mismatch.join(', '));
}

try {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--deploy') || args.length > 1) throw new Error('Usage: npm run release:pages [-- --deploy]');
  clean();
  const commit = git('rev-parse', 'HEAD');
  requireMain(commit);
  run('npm', ['run', 'check']);
  run('npm', ['test']);
  run('npm', ['run', 'build']);
  clean();
  // Check the output against the build inventory, including all bundled assets.
  const {files} = JSON.parse(readDist('build-manifest.json'));
  verifyFiles(new Set([...files.map(file=>file.path),'build-manifest.json','service-worker.js','_headers']));
  for (const file of files) {
    if (hash(readDist(file.path)) !== file.sha256) throw new Error('Build file mismatch: ' + file.path);
  }
  requireMain(commit);
  if (!args.length) {
    console.log(`Release preflight passed for ${commit}: ${production}`);
  } else {
    run(process.env.PAGES_WRANGLER || 'wrangler', ['pages', 'deploy', 'dist', '--project-name', project,
      '--branch', 'main', '--commit-hash', commit, '--commit-dirty=false']);
    for (let attempt = 0; ; attempt++) {
      try { await verify(commit); break; }
      catch (error) { if (attempt === 5) throw error; await delay(3000); }
    }
    requireMain(commit);
    console.log(`Verified deployed files for ${commit}: ${production}`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
