import { z } from 'zod';

export const trackSchema = z.object({
  id: z.string().uuid(), url: z.string(), title: z.string(), duration: z.number().nonnegative(),
  addedBy: z.string(), status: z.enum(['queued','preparing','ready','error']), error: z.string().nullable(),
});
export type Track = Readonly<z.infer<typeof trackSchema>>;
export const settingsSchema = z.object({ pcVolume: z.number().min(0).max(100), discordVolume: z.number().min(0).max(100), channelId: z.string() });
export type Settings = Readonly<z.infer<typeof settingsSchema>>;
export type Connection = Readonly<{ status: 'offline'|'connecting'|'online'|'joining'|'joined'|'error'; botName: string|null; channelId: string|null; channelName: string|null; error: string|null }>;
export type Playback = Readonly<{ trackId: string|null; status:'idle'|'preparing'|'playing'|'paused'|'error'; position:number; duration:number; generation:number; mediaUrl:string|null }>;
export type Snapshot = Readonly<{ revision:number; queue:readonly Track[]; playback:Playback; settings:Settings; hasToken:boolean; connection:Connection; notice:string|null; busy:boolean }>;
export const commandSchema = z.discriminatedUnion('type',[
 z.object({type:z.literal('add'),url:z.string().max(2048)}),
 z.object({type:z.literal('remove'),id:z.string().uuid()}),
 z.object({type:z.literal('move'),id:z.string().uuid(),direction:z.union([z.literal(-1),z.literal(1)])}),
 z.object({type:z.literal('select'),id:z.string().uuid()}),
 z.object({type:z.literal('toggle')}), z.object({type:z.literal('next')}), z.object({type:z.literal('previous')}),
 z.object({type:z.literal('seek'),position:z.number().finite().nonnegative()}),
 z.object({type:z.literal('volume'),target:z.enum(['pc','discord']),value:z.number().finite().min(0).max(100)}),
 z.object({type:z.literal('saveToken'),token:z.string().trim().min(20).max(256)}),
 z.object({type:z.literal('forgetToken')}), z.object({type:z.literal('connect')}),
 z.object({type:z.literal('join'),channelId:z.string().regex(/^\d{17,20}$/)}),
 z.object({type:z.literal('leave')}), z.object({type:z.literal('dismiss')}),
]);
export type Command = z.infer<typeof commandSchema>;
export type Reply = Readonly<{ok:true}|{ok:false;error:string}>;
export interface MusicBridge {
 readonly snapshot:()=>Promise<Snapshot>;
 readonly command:(command:Command)=>Promise<Reply>;
 readonly subscribe:(listener:(snapshot:Snapshot)=>void)=>()=>void;
}
export class AppError extends Error { constructor(readonly code:string,message:string){super(message);this.name='AppError';} }
export function assertNever(value:never):never {throw new AppError('UNREACHABLE',`Unknown operation: ${String(value)}`);}
export function userMessage(error:unknown):string {
 if(error instanceof AppError)return error.message;
 if(error instanceof z.ZodError)return '입력값을 확인해 주세요. 채널 ID는 17~20자리 숫자여야 합니다.';
 return '작업을 완료하지 못했습니다. 연결 상태와 설정을 확인한 뒤 다시 시도해 주세요.';
}
