import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),pkg=JSON.parse(await readFile(new URL('package.json',root),'utf8'));
await writeFile(new URL('game-info.js',root),`// Generated from package.json by scripts/sync-info.mjs.\nexport const VERSION=${JSON.stringify(pkg.version)};\n`);
