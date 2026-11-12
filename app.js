const API_URL = "https://YOUR-BACKEND.example.com/ask"; // замени после публикации сервера
const statusEl = document.querySelector("#status");
const logEl = document.querySelector("#log");
const input = document.querySelector("#message");
const mic = document.querySelector("#mic");
const hint = document.querySelector("#hint");
let voiceEnabled = true;
let recognition = null;

function setStatus(value){ statusEl.textContent = value; }
function addMessage(text, who){
  const p=document.createElement("p");
  p.className=who;
  p.textContent=(who==="user"?"Вы: ":"JARVIS: ")+text;
  logEl.appendChild(p);
  logEl.scrollTop=logEl.scrollHeight;
}
function speak(text){
  if(!voiceEnabled || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.lang="ru-RU"; u.rate=0.92; u.pitch=0.82;
  const voices=window.speechSynthesis.getVoices();
  const ru=voices.find(v=>v.lang.toLowerCase().startsWith("ru"));
  if(ru) u.voice=ru;
  window.speechSynthesis.speak(u);
}
async function ask(text){
  const clean=text.trim();
  if(!clean) return;
  addMessage(clean,"user");
  input.value="";
  setStatus("АНАЛИЗИРУЮ ЗАПРОС...");
  try{
    if(API_URL.includes("YOUR-BACKEND")) throw new Error("Сначала настрой адрес сервера в app.js");
    const response=await fetch(API_URL,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({message:clean})
    });
    if(!response.ok) throw new Error("Сервер вернул ошибку "+response.status);
    const data=await response.json();
    if(!data.reply) throw new Error("Пустой ответ сервера");
    addMessage(data.reply,"assistant");
    speak(data.reply);
    setStatus("СИСТЕМА ГОТОВА");
  }catch(err){
    addMessage("Не удалось получить ответ. Проверь подключение и настройку сервера. "+err.message,"assistant");
    setStatus("ОШИБКА СОЕДИНЕНИЯ");
  }
}
document.querySelector("#chat-form").addEventListener("submit",e=>{
  e.preventDefault(); ask(input.value);
});
mic.addEventListener("click",()=>{
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){
    hint.textContent="РАСПОЗНАВАНИЕ РЕЧИ НЕ ПОДДЕРЖИВАЕТСЯ — ВВЕДИТЕ ТЕКСТ";
    setStatus("ГОЛОСОВОЙ ВВОД НЕДОСТУПЕН");
    return;
  }
  if(recognition){ try{recognition.stop()}catch{} recognition=null; mic.classList.remove("listening"); return; }
  recognition=new SR();
  recognition.lang="ru-RU";
  recognition.interimResults=false;
  recognition.maxAlternatives=1;
  recognition.onstart=()=>{mic.classList.add("listening");hint.textContent="СЛУШАЮ ВАС...";setStatus("ОЖИДАЮ КОМАНДУ");};
  recognition.onresult=e=>{const said=e.results[0][0].transcript; recognition=null;mic.classList.remove("listening");hint.textContent="КОМАНДА РАСПОЗНАНА";ask(said);};
  recognition.onerror=()=>{recognition=null;mic.classList.remove("listening");hint.textContent="НЕ УДАЛОСЬ РАСПОЗНАТЬ РЕЧЬ";setStatus("ПРОВЕРЬТЕ ДОСТУП К МИКРОФОНУ");};
  recognition.onend=()=>{recognition=null;mic.classList.remove("listening");};
  try{recognition.start()}catch{recognition=null;mic.classList.remove("listening");}
});
document.querySelector("#voice-toggle").addEventListener("click",e=>{
  voiceEnabled=!voiceEnabled;
  e.currentTarget.textContent="ГОЛОС: "+(voiceEnabled?"ВКЛ.":"ВЫКЛ.");
  if(!voiceEnabled) window.speechSynthesis?.cancel();
});
document.querySelector("#clear").addEventListener("click",()=>{
  logEl.innerHTML='<p class="assistant">Диалог очищен. Чем могу помочь, сэр?</p>';
});
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
