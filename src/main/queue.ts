import type { Track } from '../shared/contracts';
export function moveTrack(queue:readonly Track[],id:string,direction:-1|1):readonly Track[]{
 const index=queue.findIndex(t=>t.id===id);const target=index+direction;
 if(index<0||target<0||target>=queue.length)return queue;
 const result=[...queue];const item=result.splice(index,1)[0];if(item)result.splice(target,0,item);return result;
}
export function removeTrack(queue:readonly Track[],id:string):readonly Track[]{return queue.filter(t=>t.id!==id);}
export class PlaybackClock {
 private anchor=0;private value=0;private active=false;
 constructor(private readonly now:()=>number=()=>performance.now()){}
 start(position:number):void{this.value=position;this.anchor=this.now();this.active=true;}
 pause():void{this.value=this.position;this.active=false;}
 seek(position:number):void{this.value=position;this.anchor=this.now();}
 get position():number{return this.value+(this.active?(this.now()-this.anchor)/1000:0);}
 get playing():boolean{return this.active;}
}
