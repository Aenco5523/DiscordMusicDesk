import { describe, expect, it, vi } from 'vitest';
import { Client } from 'discord.js';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { AudioPlayerStatus } from '@discordjs/voice';
import { VoiceAudio } from '../src/main/voice';
import { DiscordService } from '../src/main/discord';
import type { Connection } from '../src/shared/contracts';

describe('Discord service without credentials', () => {
 it('redacts an SDK login failure containing a token', async () => {
  // Given: Discord has no sandbox; mock only the login network boundary.
  const token='SECRET_TEST_TOKEN_NOT_REAL';
  const login=vi.spyOn(Client.prototype,'login').mockRejectedValue(new Error(token));
  const states:Connection[]=[];
  const service=new DiscordService({ffmpegPath:'missing',onConnection:s=>states.push(s),onAdd:async()=>{},onError:()=>{}});
  try {
   // When / Then
   await expect(service.connect(token)).rejects.toMatchObject({code:'DISCORD_LOGIN'});
   expect(JSON.stringify(states)).not.toContain(token);
   expect(states.at(-1)?.status).toBe('error');
  } finally {login.mockRestore();service.dispose();}
 });
 it('rejects joining when the client is offline', async () => {
  // Given
  const service = new DiscordService({ffmpegPath:'missing',onConnection:()=>{},onAdd:async()=>{},onError:()=>{}});
  // When / Then
  await expect(service.join('123456789012345678')).rejects.toMatchObject({code:'DISCORD_OFFLINE'});
  service.dispose();
 });
 it('publishes offline state when disposed', () => {
  // Given
  const states: Connection[]=[];
  const service = new DiscordService({ffmpegPath:'missing',onConnection:s=>states.push(s),onAdd:async()=>{},onError:()=>{}});
  // When
  service.dispose();
  // Then
  expect(states.at(-1)).toMatchObject({status:'offline',channelId:null,botName:null});
 });
});

it('decodes a real local file and reaches idle without voice listeners', async () => {
 // Given
 const directory=mkdtempSync(join(tmpdir(),'music-voice-'));
 const file=join(directory,'tone.wav');
 const ffmpeg=resolve('vendor/ffmpeg.exe');
 execFileSync(ffmpeg,['-nostdin','-f','lavfi','-i','sine=frequency=440:duration=0.15',file],{windowsHide:true,stdio:'ignore'});
 const errors:string[]=[];
 const audio=new VoiceAudio(ffmpeg,message=>errors.push(message));
 const finished=new Promise<void>(done=>audio.player.once(AudioPlayerStatus.Idle,()=>done()));
 try {
  // When
  audio.play(file,0);
  await finished;
  // Then
  expect(errors).toEqual([]);
  expect(audio.player.state.status).toBe(AudioPlayerStatus.Idle);
 } finally {audio.stop();rmSync(directory,{recursive:true,force:true});}
},10_000);
