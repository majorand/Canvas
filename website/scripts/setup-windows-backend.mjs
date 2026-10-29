import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
const token=randomBytes(32).toString('hex');
const origin='http://127.0.0.1:3031';
const html=`<!doctype html><html><head><meta charset="utf-8"><title>Private Canvas backend setup</title><style>body{font:17px system-ui;background:#13241b;color:#e2f3e9;max-width:650px;margin:65px auto;padding:24px}input{box-sizing:border-box;width:100%;padding:14px;font-size:18px;margin:16px 0}button{padding:14px 24px;font-size:17px}small{display:block;line-height:1.7}#status{padding:15px 0}</style></head><body><h1>Private Canvas backend setup</h1><p>This page runs only on your computer.</p><p>Paste the existing Canvas Supabase <strong>secret / service_role</strong> key. Use project <strong>pmbcyvcsjxqkpcztwcet</strong>.</p><small>Supabase Dashboard → Canvas → Settings → API keys.<br>Do not use the publishable/anon key. The key is encrypted under your Windows account and is never sent to GitHub or chat.</small><form id="setup"><label for="key">Supabase server key</label><input id="key" type="password" autocomplete="off" required><button>Save encrypted key</button></form><p id="status" role="status"></p><script nonce="${token}">document.getElementById('setup').addEventListener('submit',async e=>{e.preventDefault();const input=document.getElementById('key'),button=e.target.querySelector('button'),status=document.getElementById('status');button.disabled=true;try{const r=await fetch('/save',{method:'POST',headers:{'Content-Type':'application/json','X-Setup-Token':'${token}'},body:JSON.stringify({key:input.value})});input.value='';if(!r.ok)throw Error(await r.text());e.target.hidden=true;status.textContent='Saved securely. Return to chat and reply saved.';}catch(error){status.textContent=error.message;button.disabled=false;}});</script></body></html>`;
const server=http.createServer(async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Security-Policy',`default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${token}'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'`);
 if(req.headers.host!=='127.0.0.1:3031'){res.writeHead(403);res.end();return;}
 if(req.method==='GET'&&req.url==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);return;}
 if(req.method!=='POST'||req.url!=='/save'||req.headers.origin!==origin||req.headers['x-setup-token']!==token||req.headers['content-type']!=='application/json'){res.writeHead(403);res.end();return;}
 try{
  let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>4096)throw Error('Invalid input');}
  const value=JSON.parse(raw).key; const key=typeof value==='string'?value.trim():value;
  if(typeof key!=='string'||key.length<40||!/^(sb_secret_|eyJ)/.test(key))throw Error('Invalid key');
  const command="$ErrorActionPreference='Stop'; $env:PSModulePath=Join-Path $env:WINDIR 'System32\\WindowsPowerShell\\v1.0\\Modules'; Import-Module Microsoft.PowerShell.Security; $canvasPrivateKey=[Console]::In.ReadToEnd(); $canvasSecret=ConvertTo-SecureString -String $canvasPrivateKey -AsPlainText -Force; $canvasSecret | ConvertFrom-SecureString | Set-Content -LiteralPath (Join-Path $env:LOCALAPPDATA 'CanvasBackend\\secret.dpapi')";
  await new Promise((resolve,reject)=>{const child=spawn('powershell.exe',['-NoProfile','-Command',command],{windowsHide:true,stdio:['pipe','ignore','ignore']});child.on('error',()=>reject(Error('Save failed')));child.on('exit',code=>code===0?resolve():reject(Error('Save failed')));child.stdin.end(key.trim());});
  res.end('Saved');server.close();
 }catch{res.writeHead(400);res.end('Could not save privately. Check the server key format, or ask me to check the local encryption tool.');}
});
server.listen(3031,'127.0.0.1',()=>console.log('Private setup ready at '+origin));
