import { spawn, type ChildProcess } from 'node:child_process';
import { AudioPlayerStatus, createAudioPlayer, createAudioResource, NoSubscriberBehavior, StreamType, type AudioResource } from '@discordjs/voice';

export class VoiceAudio {
 readonly player = createAudioPlayer({behaviors:{noSubscriber:NoSubscriberBehavior.Play}});
 private process: ChildProcess | null = null;
 private resource: AudioResource | null = null;
 private volume = 1;
 constructor(private readonly path:string, private readonly onError:(message:string)=>void) {
  this.player.on(AudioPlayerStatus.Idle,()=>this.stop());
  this.player.on('error',()=>{this.stop();this.onError('Discord 오디오를 재생하지 못했습니다. 다시 재생해 주세요.');});
 }
 play(file:string,position:number):void {
  this.stop();
  const child=spawn(this.path,['-nostdin','-hide_banner','-loglevel','error','-ss',String(Math.max(0,position)),'-i',file,'-vn','-f','s16le','-ar','48000','-ac','2','pipe:1'],{shell:false,windowsHide:true,stdio:['ignore','pipe','ignore']});
  this.process=child;
  const fail=():void=>{if(this.process===child){this.stop();this.onError('음성 변환에 실패했습니다. FFmpeg 설치와 파일을 확인해 주세요.');}};
  child.once('error',fail);
  child.once('exit',code=>{if(code!==0&&code!==null)fail();});
  if(!child.stdout){fail();return;}
  const resource=createAudioResource(child.stdout,{inputType:StreamType.Raw,inlineVolume:true});
  resource.volume?.setVolume(this.volume);
  this.resource=resource;
  this.player.play(resource);
 }
 pause():void {this.player.pause();}
 resume():void {this.player.unpause();}
 setVolume(value:number):void {this.volume=Math.max(0,Math.min(100,value))/100;this.resource?.volume?.setVolume(this.volume);}
 stop():void {
  const child=this.process;this.process=null;this.resource=null;
  child?.kill();this.player.stop(true);
 }
}
