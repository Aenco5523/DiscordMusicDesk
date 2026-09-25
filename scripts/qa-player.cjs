const {_electron}=require('playwright');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
(async()=>{
 const profile=path.resolve('.tmp/qa-player-'+Date.now());fs.mkdirSync(profile,{recursive:true});
 const executable=process.argv[2];const report={checks:[],errors:[],screenshots:[]};let app;
 const launch=()=>_electron.launch({...(executable?{executablePath:path.resolve(executable),args:[]}:{args:[path.resolve('.')]}),env:{...process.env,MUSIC_DESK_USER_DATA:profile},timeout:30000});
 const check=(name,value)=>{report.checks.push({name,pass:Boolean(value)});assert.ok(value,name);};
 try{
  app=await launch();let page=await app.firstWindow();page.on('pageerror',e=>report.errors.push(e.message));await page.waitForSelector('.add-form input');
  await page.locator('.add-form input').fill('https://localhost/private');await page.locator('.add-form button').click();await page.waitForSelector('.notice');check('unsafe URL rejected',(await page.locator('.queue-row').count())===0);
  await page.locator('.add-form input').fill('https://www.youtube.com/watch?v=jNQXAC9IVRw');await page.locator('.add-form button').click();await page.waitForSelector('.track-select',{timeout:90000});
  await page.locator('.track-select').click();await page.waitForFunction(()=>document.querySelector('video')?.readyState===4,{},{timeout:120000});
  await page.evaluate(()=>{window.seekEvents=[];document.querySelector('video').addEventListener('seeking',()=>window.seekEvents.push(document.querySelector('video').currentTime));});
  await page.waitForFunction(()=>document.querySelector('video').currentTime>3);
  report.initial=await page.evaluate(async()=>({video:document.querySelector('video').currentTime,frames:document.querySelector('video').getVideoPlaybackQuality().totalVideoFrames,muted:document.querySelector('video').muted,volume:document.querySelector('video').volume,snapshot:(await window.music.snapshot()).playback}));
  check('first video advances',report.initial.frames>20&&Math.abs(report.initial.video-report.initial.snapshot.position)<1);
  report.audible=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].webContents.isCurrentlyAudible());check('PC audio is audibly rendered',report.audible);
  const seek=page.getByRole('slider',{name:'재생 위치',exact:true});let box=await seek.boundingBox();await page.mouse.click(box.x+box.width*.55,box.y+box.height/2);
  await page.waitForFunction(()=>document.querySelector('video').currentTime>10);await page.waitForTimeout(1500);
  report.seek=await page.evaluate(async()=>({video:document.querySelector('video').currentTime,events:window.seekEvents,snapshot:(await window.music.snapshot()).playback}));check('bar click advances without seek loop',report.seek.video>11&&report.seek.events.length<=2&&Math.abs(report.seek.video-report.seek.snapshot.position)<1);
  await page.getByRole('button',{name:'일시 정지',exact:true}).click();const before=await page.locator('video').evaluate(v=>v.currentTime);await page.waitForTimeout(500);check('pause stable',Math.abs(await page.locator('video').evaluate(v=>v.currentTime)-before)<0.15);
  await seek.focus();await seek.press('Home');await page.waitForFunction(()=>document.querySelector('video').currentTime<0.2);check('keyboard seek while paused',(await page.locator('video').evaluate(v=>v.paused))===true);
  for(const [width,height] of [[1320,860],[1000,700],[1600,700]]){
   await app.evaluate(({BrowserWindow},size)=>BrowserWindow.getAllWindows()[0].setSize(...size),[width,height]);await page.waitForTimeout(150);
   const dimensions=await page.evaluate(()=>{const m=document.querySelector('.media-panel'),t=document.querySelector('.transport').getBoundingClientRect();return {height:m.clientHeight,scroll:m.scrollHeight,bottom:t.bottom,viewport:innerHeight};});check(`main fits ${width}x${height}`,dimensions.scroll<=dimensions.height+1&&dimensions.bottom<=dimensions.viewport+1);const file=`evidence/player-${width}x${height}.png`;await page.screenshot({path:file});report.screenshots.push(file);
  }
  await page.getByRole('button',{name:'설정',exact:true}).click();await page.waitForSelector('#bot-token');await page.screenshot({path:'evidence/settings-fixed.png'});report.screenshots.push('evidence/settings-fixed.png');
  await page.getByRole('button',{name:'플레이어',exact:true}).click();await page.getByRole('button',{name:'재생',exact:true}).click();await page.waitForFunction(()=>document.querySelector('video').currentTime>1);
  await app.close();app=null;
  app=await launch();page=await app.firstWindow();await page.waitForSelector('.track-select');check('restart does not autoplay',await page.locator('video').count()===0);await page.locator('.track-select').click();await page.waitForFunction(()=>document.querySelector('video')?.currentTime>2,{},{timeout:30000});check('first cached video after restart advances',true);
  check('no renderer exceptions',report.errors.length===0);report.pass=true;
 }catch(error){report.error=String(error);report.pass=false;process.exitCode=1;}
 finally{if(app)await app.close();fs.rmSync(profile,{recursive:true,force:true});report.cleanup='Electron closed; isolated profile removed';fs.writeFileSync('evidence/qa-player.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
})();
