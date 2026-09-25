import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Resvg} from '@resvg/resvg-js';

const root=join(fileURLToPath(new URL('..',import.meta.url)));
const source=await readFile(join(root,'assets','app-icon.svg'));
const output=join(root,'build');
const sizes=[16,24,32,48,64,128,256];
await mkdir(output,{recursive:true});

const pngs=sizes.map(size=>new Resvg(source,{fitTo:{mode:'width',value:size}}).render().asPng());
await writeFile(join(output,'icon-256.png'),pngs.at(-1));

const header=Buffer.alloc(6+16*sizes.length);
header.writeUInt16LE(1,2);
header.writeUInt16LE(sizes.length,4);
let offset=header.length;
for(let index=0;index<sizes.length;index++){
 const entry=6+index*16;
 const size=sizes[index];
 header.writeUInt8(size===256?0:size,entry);
 header.writeUInt8(size===256?0:size,entry+1);
 header.writeUInt16LE(1,entry+4);
 header.writeUInt16LE(32,entry+6);
 header.writeUInt32LE(pngs[index].length,entry+8);
 header.writeUInt32LE(offset,entry+12);
 offset+=pngs[index].length;
}
await writeFile(join(output,'icon.ico'),Buffer.concat([header,...pngs]));
