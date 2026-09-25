import {expect,it} from 'vitest';import {seekTarget} from '../src/renderer/media-sync';
const base={ready:true,seeking:false,seekableEnd:100,position:12,currentTime:12,generation:2,appliedGeneration:2,elapsedSinceSeek:3000};
it('never seeks metadata-only media with no seekable range',()=>{expect(seekTarget({...base,seekableEnd:0,currentTime:0})).toBe(null);});
it('does not seek again while drift correction is in flight',()=>{expect(seekTarget({...base,seeking:true,currentTime:0})).toBe(null);});
it('applies a new explicit seek once',()=>{expect(seekTarget({...base,generation:3,position:35})).toBe(35);expect(seekTarget({...base,generation:3,appliedGeneration:3,position:35,currentTime:35})).toBe(null);});
it('ignores small startup and IPC drift',()=>{expect(seekTarget({...base,currentTime:11.3})).toBe(null);});
it('bounds repeated drift correction frequency',()=>{expect(seekTarget({...base,currentTime:0,elapsedSinceSeek:500})).toBe(null);expect(seekTarget({...base,currentTime:0})).toBe(12);});
