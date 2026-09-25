import {existsSync,mkdirSync,readFileSync,renameSync,unlinkSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {z} from 'zod';
import {AppError,settingsSchema,trackSchema} from '../shared/contracts';
import type {Settings,Track} from '../shared/contracts';
export interface CryptoPort {isEncryptionAvailable():boolean;encryptString(text:string):Buffer;decryptString(bytes:Buffer):string;}
const stateSchema=z.object({settings:settingsSchema,queue:z.array(trackSchema).max(200)});
export class Storage {
 private readonly statePath:string;private readonly tokenPath:string;private corrupt=false;
 constructor(private readonly directory:string,private readonly crypto:CryptoPort){mkdirSync(directory,{recursive:true});this.statePath=join(directory,'state.json');this.tokenPath=join(directory,'token.bin');}
 load():{settings:Settings;queue:readonly Track[];notice:string|null}{
  const fallback={settings:{pcVolume:50,discordVolume:70,channelId:''},queue:[],notice:null};
  if(!existsSync(this.statePath))return fallback;
  try{const data=stateSchema.parse(JSON.parse(readFileSync(this.statePath,'utf8')));return {settings:data.settings,queue:data.queue.map(t=>({...t,status:'queued',error:null})),notice:null};}
  catch(error){if(error instanceof Error){this.corrupt=true;return {...fallback,notice:'저장된 설정을 읽지 못했습니다. 원본을 보존하고 기본 설정으로 시작합니다.'};}throw error;}
 }
 save(settings:Settings,queue:readonly Track[]):void{
  if(this.corrupt){renameSync(this.statePath,join(this.directory,`state-corrupt-${Date.now()}.json`));this.corrupt=false;}
  const temp=`${this.statePath}.tmp`;writeFileSync(temp,JSON.stringify({settings,queue}));renameSync(temp,this.statePath);
 }
 saveToken(token:string):void{
  if(!this.crypto.isEncryptionAvailable())throw new AppError('CRYPTO','Windows 암호화 저장소를 사용할 수 없어 토큰을 저장하지 않았습니다.');
  const temp=`${this.tokenPath}.tmp`;writeFileSync(temp,this.crypto.encryptString(token));renameSync(temp,this.tokenPath);
 }
 token():string|null{
  if(!existsSync(this.tokenPath))return null;
  try{return this.crypto.decryptString(readFileSync(this.tokenPath));}
  catch(error){if(error instanceof Error)throw new AppError('CRYPTO','저장된 토큰을 복호화하지 못했습니다. 설정에서 다시 저장해 주세요.');throw error;}
 }
 hasToken():boolean{return existsSync(this.tokenPath);}
 forgetToken():void{if(existsSync(this.tokenPath))unlinkSync(this.tokenPath);}
}
