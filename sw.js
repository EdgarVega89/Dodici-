
const CACHE="dodici-console-v1";
const ASSETS=["/","/index.html","/styles.css","/data.js","/app.js","/manifest.webmanifest","/assets/logo.jpeg","/assets/interior.jpeg","/assets/food-menu.jpeg","/assets/wine-menu.jpeg"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{
    const copy=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return resp;
  }).catch(()=>caches.match("/index.html"))));
});
