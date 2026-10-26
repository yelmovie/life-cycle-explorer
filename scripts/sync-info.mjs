import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),pkg=JSON.parse(await readFile(new URL('package.json',root),'utf8'));
await writeFile(new URL('src/game-info.js',root),`// Generated from package.json by scripts/sync-info.mjs.\nexport const VERSION=${JSON.stringify(pkg.version)};\n`);
const data=JSON.parse(await readFile(new URL('content/field-missions.json',root),'utf8'));
const fields=['title','question','goal','start','reward','art','use','guide'];
if(data.chapters?.length!==5||data.discoveries?.length!==5)throw new Error('Mission content must match the five supported chapters.');
for(const chapter of data.chapters)if(fields.some(key=>typeof chapter[key]!=='string'||!chapter[key].trim()))throw new Error('Every chapter needs all text and art keys.');
for(const mission of data.discoveries)if(typeof mission.name!=='string'||!mission.name.trim()||['steps','objectives'].some(key=>mission[key]?.length!==2||mission[key].some(text=>typeof text!=='string'||!text.trim())))throw new Error('Each discovery mission needs a name and two step/objective texts.');
await writeFile(new URL('src/field-mission-data.js',root),`// Generated from content/field-missions.json. Edit the JSON, then run npm run check.\nexport const FIELD_CHAPTERS=${JSON.stringify(data.chapters,null,2)};\nexport const DISCOVERY_MISSIONS=${JSON.stringify(data.discoveries,null,2)};\n`);
