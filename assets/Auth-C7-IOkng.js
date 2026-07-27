import{a as t,j as e}from"./framer-motion-DfXMriiy.js";import{u as Ie,L as G}from"./index-wuUEPhxk.js";import{L as We}from"./LanguageSwitcher-Ch0TnyE5.js";import{b as He}from"./react-vendor-DKIK6waW.js";import"./radix-ui-BE5y1QC1.js";import"./charts-DbZXHn5i.js";

const LOGO="/logo.svg";
const DB_NAME="produktor-identity";
const DB_STORE="keys";
const SESSION_KEY="produktor-auth-session";
const ALG={name:"ECDSA",namedCurve:"P-256"};

const COPY={
  en:{
    titleCreate:"Create identity",
    titleUnlock:"Welcome back",
    titleImport:"Import identity",
    titleSigned:"Signed in",
    subCreate:"No email. Device keypair stays in this browser. Download a backup.",
    subUnlock:"Local key found. Continue, export backup, or import another.",
    subImport:"Paste a backup JSON (public + private JWK) from another device.",
    subSigned:"You are in. Public fingerprint is your id on this device.",
    create:"Generate keypair",
    unlock:"Continue",
    importTab:"Import backup",
    createTab:"New identity",
    unlockTab:"This device",
    importBtn:"Import & sign in",
    exportBtn:"Download backup",
    signOut:"Sign out",
    destroy:"Destroy local keys",
    nickname:"Nickname (optional)",
    nicknamePh:"e.g. arc-1",
    backupPh:"Paste backup JSON…",
    fingerprint:"Fingerprint",
    secured:"Keys in IndexedDB · backup file recommended",
    errGeneric:"Something went wrong.",
    errImport:"Invalid backup JSON.",
    errNoKey:"No local identity yet.",
    warn:"Private key never leaves this device unless you export. Clear site data = lose access without backup."
  },
  de:{
    titleCreate:"Identität erstellen",
    titleUnlock:"Willkommen zurück",
    titleImport:"Identität importieren",
    titleSigned:"Angemeldet",
    subCreate:"Ohne E-Mail. Schlüsselpaar bleibt im Browser. Backup herunterladen.",
    subUnlock:"Lokaler Schlüssel gefunden. Weiter, Backup oder Import.",
    subImport:"Backup-JSON (public + private JWK) einfügen.",
    subSigned:"Angemeldet. Öffentlicher Fingerprint = lokale ID.",
    create:"Schlüsselpaar erzeugen",
    unlock:"Weiter",
    importTab:"Backup importieren",
    createTab:"Neue Identität",
    unlockTab:"Dieses Gerät",
    importBtn:"Import & anmelden",
    exportBtn:"Backup laden",
    signOut:"Abmelden",
    destroy:"Lokale Schlüssel löschen",
    nickname:"Spitzname (optional)",
    nicknamePh:"z. B. arc-1",
    backupPh:"Backup-JSON einfügen…",
    fingerprint:"Fingerprint",
    secured:"Schlüssel in IndexedDB · Backup empfohlen",
    errGeneric:"Etwas ist schiefgelaufen.",
    errImport:"Ungültiges Backup-JSON.",
    errNoKey:"Noch keine lokale Identität.",
    warn:"Privater Schlüssel bleibt hier, außer Export. Seitendaten löschen = Zugang weg ohne Backup."
  }
};

function useCopy(){
  const{i18n}=Ie();
  const lang=(i18n?.language||document.documentElement.lang||"en").slice(0,2);
  return COPY[lang]==null?COPY.en:COPY[lang];
}

function openDb(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains(DB_STORE))db.createObjectStore(DB_STORE,{keyPath:"id"});
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}

async function idbGetAll(){
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(DB_STORE,"readonly");
    const req=tx.objectStore(DB_STORE).getAll();
    req.onsuccess=()=>resolve(req.result||[]);
    req.onerror=()=>reject(req.error);
  });
}

async function idbPut(record){
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(DB_STORE,"readwrite");
    tx.objectStore(DB_STORE).put(record);
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
  });
}

async function idbClear(){
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(DB_STORE,"readwrite");
    tx.objectStore(DB_STORE).clear();
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
  });
}

function b64url(buf){
  const bytes=buf instanceof ArrayBuffer?new Uint8Array(buf):buf;
  let s="";
  for(let i=0;i<bytes.length;i++)s+=String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}

async function fingerprintFromJwk(jwk){
  const raw=new TextEncoder().encode(JSON.stringify({kty:jwk.kty,crv:jwk.crv,x:jwk.x,y:jwk.y}));
  const dig=await crypto.subtle.digest("SHA-256",raw);
  return b64url(dig).slice(0,22);
}

async function generateIdentity(nickname){
  const pair=await crypto.subtle.generateKey(ALG,{extractable:!0},["sign","verify"]);
  const publicKeyJwk=await crypto.subtle.exportKey("jwk",pair.publicKey);
  const privateKeyJwk=await crypto.subtle.exportKey("jwk",pair.privateKey);
  const id=await fingerprintFromJwk(publicKeyJwk);
  const record={
    id,
    nickname:(nickname||"").trim()||null,
    publicKeyJwk,
    privateKeyJwk,
    createdAt:new Date().toISOString(),
    alg:"ECDSA-P256"
  };
  await idbPut(record);
  return record;
}

function toBackup(record){
  return{
    version:1,
    kind:"produktor-identity",
    id:record.id,
    nickname:record.nickname,
    createdAt:record.createdAt,
    alg:record.alg,
    publicKeyJwk:record.publicKeyJwk,
    privateKeyJwk:record.privateKeyJwk
  };
}

function downloadBackup(record){
  const blob=new Blob([JSON.stringify(toBackup(record),null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=`produktor-identity-${record.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importBackup(text){
  let data;
  try{data=JSON.parse(text)}catch{throw new Error("import")}
  if(!data||!data.publicKeyJwk||!data.privateKeyJwk)throw new Error("import");
  await crypto.subtle.importKey("jwk",data.privateKeyJwk,ALG,!0,["sign"]);
  await crypto.subtle.importKey("jwk",data.publicKeyJwk,ALG,!0,["verify"]);
  const id=data.id||await fingerprintFromJwk(data.publicKeyJwk);
  const record={
    id,
    nickname:data.nickname||null,
    publicKeyJwk:data.publicKeyJwk,
    privateKeyJwk:data.privateKeyJwk,
    createdAt:data.createdAt||new Date().toISOString(),
    alg:data.alg||"ECDSA-P256"
  };
  await idbPut(record);
  return record;
}

function setSession(id){
  sessionStorage.setItem(SESSION_KEY,id);
  localStorage.setItem(SESSION_KEY,id);
}

function clearSession(){
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
}

function getSession(){
  return sessionStorage.getItem(SESSION_KEY)||localStorage.getItem(SESSION_KEY);
}

const btnNeo="border-[3px] border-black shadow-[4px_4px_0_0_#0a0a0a] hover:shadow-[2px_2px_0_0_#0a0a0a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 disabled:hover:shadow-[4px_4px_0_0_#0a0a0a] disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:opacity-60";

function pt({redirectAfterAuth:n}={}){
  const x=He();
  const a=useCopy();
  const[ready,setReady]=t.useState(!1);
  const[identity,setIdentity]=t.useState(null);
  const[sessionId,setSessionId]=t.useState(null);
  const[tab,setTab]=t.useState("create");
  const[nickname,setNickname]=t.useState("");
  const[backupText,setBackupText]=t.useState("");
  const[busy,setBusy]=t.useState(null);
  const[err,setErr]=t.useState(null);

  t.useEffect(()=>{(async()=>{
    try{
      const all=await idbGetAll();
      const sid=getSession();
      const current=all.find(r=>r.id===sid)||all[0]||null;
      setIdentity(current);
      setSessionId(sid&&current&&current.id===sid?sid:null);
      setTab(current?"unlock":"create");
    }catch{
      setErr(a.errGeneric);
    }finally{
      setReady(!0);
    }
  })()},[]);

  t.useEffect(()=>{
    if(ready&&sessionId&&identity)x(n||"/");
  },[ready,sessionId,identity,x,n]);

  const run=async(kind,fn)=>{
    setBusy(kind);setErr(null);
    try{
      await fn();
    }catch(ex){
      setErr(ex&&ex.message==="import"?a.errImport:a.errGeneric);
    }finally{
      setBusy(null);
    }
  };

  const onCreate=()=>run("create",async()=>{
    const rec=await generateIdentity(nickname);
    downloadBackup(rec);
    setIdentity(rec);
    setSession(rec.id);
    setSessionId(rec.id);
  });

  const onUnlock=()=>run("unlock",async()=>{
    if(!identity)throw new Error("nokey");
    setSession(identity.id);
    setSessionId(identity.id);
  });

  const onImport=()=>run("import",async()=>{
    const rec=await importBackup(backupText);
    setIdentity(rec);
    setSession(rec.id);
    setSessionId(rec.id);
  });

  const onExport=()=>{
    if(identity)downloadBackup(identity);
  };

  const onSignOut=()=>{
    clearSession();
    setSessionId(null);
    setTab(identity?"unlock":"create");
  };

  const onDestroy=()=>run("destroy",async()=>{
    await idbClear();
    clearSession();
    setIdentity(null);
    setSessionId(null);
    setTab("create");
  });

  const title=sessionId?a.titleSigned:tab==="import"?a.titleImport:tab==="unlock"?a.titleUnlock:a.titleCreate;
  const sub=sessionId?a.subSigned:tab==="import"?a.subImport:tab==="unlock"?a.subUnlock:a.subCreate;
  const j=btnNeo;

  if(!ready){
    return e.jsx("div",{className:"min-h-screen flex items-center justify-center bg-[#faf5ea]",children:e.jsx(G,{className:"h-8 w-8 animate-spin"})});
  }

  return e.jsxs("div",{className:"min-h-screen flex flex-col bg-[#faf5ea]",children:[
    e.jsx("header",{className:"border-b-[3px] border-black",children:e.jsxs("div",{className:"max-w-7xl mx-auto h-16 px-5 sm:px-8 flex items-center justify-between",children:[
      e.jsxs("button",{type:"button",onClick:()=>x("/"),className:"flex items-center gap-3",children:[
        e.jsx("img",{src:LOGO,alt:"Logo",width:32,height:32,className:"border-[3px] border-black"}),
        e.jsx("span",{className:"font-black uppercase tracking-tight text-base sm:text-lg",children:"produktor.io"})
      ]}),
      e.jsx(We,{})
    ]})}),
    e.jsx("div",{className:"flex-1 flex items-center justify-center p-6",children:e.jsx("div",{className:"w-full max-w-[460px]",children:e.jsxs("div",{className:"border-[3px] border-black bg-[#faf5ea] shadow-[6px_6px_0_0_#0a0a0a]",children:[
      e.jsxs("div",{className:"px-6 pt-6 pb-2 text-center",children:[
        e.jsx("img",{src:LOGO,alt:"Logo",width:56,height:56,className:"cursor-pointer mx-auto mb-3 border-[3px] border-black",onClick:()=>x("/")}),
        e.jsx("h2",{className:"font-black uppercase tracking-tight text-2xl mb-1",children:title}),
        e.jsx("p",{className:"text-sm text-black/70",children:sub})
      ]}),
      e.jsxs("div",{className:"px-6 pt-4 pb-6 space-y-4",children:[
        !sessionId&&e.jsxs("div",{className:"grid grid-cols-3 gap-2",children:[
          [["create",a.createTab],["unlock",a.unlockTab],["import",a.importTab]].map(([k,label])=>
            e.jsx("button",{type:"button",onClick:()=>{setTab(k);setErr(null)},className:`h-10 text-[10px] font-black uppercase tracking-wide border-[2px] border-black ${tab===k?"bg-[#f2c849]":"bg-white"}`,children:label},k)
          )
        ]}),
        identity&&e.jsxs("div",{className:"border-[2px] border-black bg-white p-3 text-left",children:[
          e.jsx("div",{className:"text-[10px] font-black uppercase tracking-[0.2em] mb-1",children:a.fingerprint}),
          e.jsx("code",{className:"text-xs break-all",children:identity.id}),
          identity.nickname?e.jsx("div",{className:"text-xs mt-1 text-black/60",children:identity.nickname}):null
        ]}),
        tab==="create"&&!sessionId&&e.jsxs("div",{className:"space-y-3",children:[
          e.jsx("input",{value:nickname,onChange:ev=>setNickname(ev.target.value),placeholder:a.nicknamePh,"aria-label":a.nickname,className:"w-full h-12 px-3 border-[3px] border-black bg-white font-medium outline-none focus:bg-[#fff8dc]"}),
          e.jsxs("button",{type:"button",onClick:onCreate,disabled:busy!==null,className:`w-full h-12 px-4 inline-flex items-center justify-center gap-2 bg-[#f2c849] font-bold uppercase tracking-wide text-sm ${j}`,children:[
            busy==="create"?e.jsx(G,{className:"h-5 w-5 animate-spin"}):null,
            a.create
          ]})
        ]}),
        tab==="unlock"&&!sessionId&&e.jsxs("div",{className:"space-y-3",children:[
          e.jsxs("button",{type:"button",onClick:onUnlock,disabled:busy!==null||!identity,className:`w-full h-12 px-4 inline-flex items-center justify-center gap-2 bg-[#f2c849] font-bold uppercase tracking-wide text-sm ${j}`,children:[
            busy==="unlock"?e.jsx(G,{className:"h-5 w-5 animate-spin"}):null,
            a.unlock
          ]}),
          !identity&&e.jsx("p",{className:"text-sm text-red-700",children:a.errNoKey})
        ]}),
        tab==="import"&&!sessionId&&e.jsxs("div",{className:"space-y-3",children:[
          e.jsx("textarea",{value:backupText,onChange:ev=>setBackupText(ev.target.value),placeholder:a.backupPh,rows:6,className:"w-full px-3 py-2 border-[3px] border-black bg-white font-mono text-xs outline-none focus:bg-[#fff8dc]"}),
          e.jsxs("button",{type:"button",onClick:onImport,disabled:busy!==null||!backupText.trim(),className:`w-full h-12 px-4 inline-flex items-center justify-center gap-2 bg-[#f2c849] font-bold uppercase tracking-wide text-sm ${j}`,children:[
            busy==="import"?e.jsx(G,{className:"h-5 w-5 animate-spin"}):null,
            a.importBtn
          ]})
        ]}),
        (sessionId||identity)&&e.jsxs("div",{className:"space-y-2",children:[
          e.jsx("button",{type:"button",onClick:onExport,disabled:!identity,className:`w-full h-11 px-4 bg-white font-bold uppercase tracking-wide text-sm ${j}`,children:a.exportBtn}),
          sessionId&&e.jsx("button",{type:"button",onClick:onSignOut,className:`w-full h-11 px-4 bg-white font-bold uppercase tracking-wide text-sm ${j}`,children:a.signOut}),
          e.jsx("button",{type:"button",onClick:onDestroy,disabled:busy!==null,className:`w-full h-11 px-4 bg-white font-bold uppercase tracking-wide text-sm text-red-800 ${j}`,children:a.destroy})
        ]}),
        err&&e.jsx("p",{className:"text-sm text-red-700 font-medium",children:err}),
        e.jsx("p",{className:"text-[11px] text-black/60 leading-snug",children:a.warn})
      ]}),
      e.jsx("div",{className:"py-3 px-6 text-[10px] text-center uppercase tracking-[0.2em] font-black bg-[#143a6f] text-[#faf5ea] border-t-[3px] border-black",children:a.secured})
    ]})})}),
  ]});
}

function yt(n){return e.jsx(t.Suspense,{children:e.jsx(pt,{...n})})}
export{yt as default};
