const CACHE="jarvis-shell-v1";
const FILES=["./","./index.html","./style.css","./app.js","./manifest.webmanifest"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});