export interface SyncInput {readonly ready:boolean;readonly seeking:boolean;readonly seekableEnd:number;readonly position:number;readonly currentTime:number;readonly generation:number;readonly appliedGeneration:number;readonly elapsedSinceSeek:number;}
export function seekTarget(input:SyncInput):number|null{
 if(!input.ready||input.seekableEnd<=0)return null;
 const explicit=input.generation!==input.appliedGeneration;
 if(!explicit&&(input.seeking||input.elapsedSinceSeek<2000||Math.abs(input.currentTime-input.position)<2))return null;
 return Math.max(0,Math.min(input.position,input.seekableEnd-0.01));
}
