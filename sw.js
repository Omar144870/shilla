/* Shilla offline support: keeps the site and fonts on the phone after the first visit. */
const VER='shilla-v5';
const CORE=['./','./app.js?v=5','./peerjs.min.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable.png','./apple-touch-icon.png'];
const FONTS='shilla-fonts';

self.addEventListener('install',e=>{e.waitUntil(caches.open(VER).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VER&&k!==FONTS).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});

self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const url=new URL(req.url);
 // Google Fonts: keep a copy, use it when offline
 if(url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com'){
  e.respondWith(caches.open(FONTS).then(c=>c.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok||r.type==='opaque')c.put(req,r.clone());return r}).catch(()=>new Response('',{status:503})))));return}
 if(url.origin!==location.origin)return;
 // The page itself (also room links like /?r=ABCD): newest copy when online, saved copy when offline
 if(req.mode==='navigate'){
  e.respondWith(fetch(req).then(r=>{if(r.ok&&!r.redirected){const cp=r.clone();caches.open(VER).then(c=>c.put('./',cp))}return r}).catch(()=>caches.match('./')));return}
 // Scripts, icons: saved copy right away, refreshed in the background
 e.respondWith(caches.open(VER).then(c=>c.match(req,{ignoreSearch:true}).then(hit=>{const net=fetch(req).then(r=>{if(r.ok)c.put(req,r.clone());return r}).catch(()=>hit);return hit||net})))});
