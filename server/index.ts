import express from "express";
import {fileURLToPath} from "node:url";
import {dirname,join} from "node:path";
import {existsSync} from "node:fs";
import superjson from "superjson";
import {z} from "zod";

const app=express();
app.disable("x-powered-by");
app.use(express.json({limit:"9mb"}));
const key=process.env.OPENAI_API_KEY;
const model=process.env.OPENAI_MODEL||"gpt-4.1-mini";
const languages:Record<string,string>={"es-MX":"español","en-US":"inglés","ko-KR":"coreano","ja-JP":"japonés","fr-FR":"francés","de-DE":"alemán","it-IT":"italiano","pt-BR":"portugués","zh-CN":"chino","ar-SA":"árabe","hi-IN":"hindi","ru-RU":"ruso"};
const MAX_REQUESTS=40;
const limits=new Map<string,{count:number;until:number}>();
app.use("/_api",(req,res,next)=>{const ip=req.ip||"unknown",now=Date.now();let state=limits.get(ip);if(!state||now>state.until){state={count:0,until:now+60_000};limits.set(ip,state);}if(++state.count>MAX_REQUESTS){res.status(429).json({error:"Demasiadas solicitudes. Intenta en un minuto."});return;}if(!key){res.status(503).json({error:"Falta configurar OPENAI_API_KEY en el servidor."});return;}next();});
function fail(res:any,e:unknown){const message=e instanceof Error?e.message:"Error de IA";console.error("AI request failed:",message);res.status(502).json({error:"No se pudo completar la solicitud de IA. Revisa la clave, saldo y logs del servidor."});}
async function callAI(messages:any[],jsonMode=false,maxTokens=700){
 const response=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model,messages,temperature:0.3,max_completion_tokens:maxTokens,...(jsonMode?{response_format:{type:"json_object"}}:{})})});
 if(!response.ok)throw new Error("OpenAI chat HTTP "+response.status+": "+(await response.text()).slice(0,250));
 const body:any=await response.json();return String(body.choices?.[0]?.message?.content||"").trim();
}
async function transcribe(data:string,mime:string){
 const buffer=Buffer.from(data.replace(/^data:audio\/[^,]+,/,""),"base64");
 if(buffer.length<100||buffer.length>4_000_000)throw new Error("Tamaño de audio inválido");
 const ext=mime.includes("mp4")?"mp4":mime.includes("wav")?"wav":"webm";
 const form=new FormData();form.append("file",new Blob([buffer],{type:mime}),"speech."+ext);form.append("model","whisper-1");
 const response=await fetch("https://api.openai.com/v1/audio/transcriptions",{method:"POST",headers:{"Authorization":"Bearer "+key},body:form});
 if(!response.ok)throw new Error("OpenAI transcription HTTP "+response.status+": "+(await response.text()).slice(0,250));
 const body:any=await response.json();return String(body.text||"").trim();
}
const basic=z.object({text:z.string().min(1).max(4000),source:z.string().max(20),target:z.string().max(20)});
app.post("/_api/translate",async(req,res)=>{try{const {text,source,target}=basic.parse(superjson.parse(JSON.stringify(req.body)));const translation=await callAI([{role:"system",content:"Translate the text accurately and naturally from "+(languages[source]||source)+" to "+(languages[target]||target)+". Return translation only."},{role:"user",content:text}],false,400);res.type("json").send(superjson.stringify({translation,detected:source}));}catch(e){fail(res,e);}});
const practiceSchema=z.object({message:z.string().min(1).max(1500),language:z.string().max(12),level:z.enum(["A1","A2","B1","B2","C1","C2"]),topic:z.string().max(100),history:z.array(z.object({role:z.enum(["student","tutor"]),text:z.string().max(1000)})).max(12)});
app.post("/_api/practice",async(req,res)=>{try{const a=practiceSchema.parse(superjson.parse(JSON.stringify(req.body)));const instruction="Eres VozBridge AI, asistente de voz amable. Conversa normalmente en el idioma del usuario. Cuando te pida traducir a un idioma específico, traduce solo el texto solicitado, sin agregar comentarios. Si pide corregir una frase o está practicando, explica los errores claramente y ayuda a mejorar. Idioma preferido: "+(languages[a.language]||a.language)+". Nivel: "+a.level+". Tema: "+a.topic+". Respuestas breves y naturales. Devuelve únicamente JSON con las claves reply, correction, explanation y praise (todas cadenas).";const history=a.history.map(m=>({role:m.role==="student"?"user":"assistant",content:m.text}));const raw=await callAI([{role:"system",content:instruction},...history,{role:"user",content:a.message}],true,650);const parsed=JSON.parse(raw);res.type("json").send(superjson.stringify({reply:String(parsed.reply||""),correction:String(parsed.correction||""),explanation:String(parsed.explanation||""),praise:String(parsed.praise||"")}));}catch(e){fail(res,e);}});
const imageSchema=z.object({image:z.string().regex(/^data:image\/(png|jpeg|webp);base64,/).max(5_500_000),question:z.string().max(1200),language:z.string().max(20)});
app.post("/_api/photo-help",async(req,res)=>{try{const a=imageSchema.parse(req.body);const answer=await callAI([{role:"system",content:"Eres VozBridge AI. Lee textos visibles en imágenes, identifica el idioma y traduce al español salvo otra indicación. Si es tarea, resuelve paso a paso y explica. Si está borroso, dilo sin inventar."},{role:"user",content:[{type:"text",text:a.question||"Traduce la imagen o resuelve el ejercicio que aparece en ella."},{type:"image_url",image_url:{url:a.image}}]}],false,1400);res.json({answer});}catch(e){fail(res,e);}});
const interpretSchema=z.object({audio:z.string().max(4_500_000),mime:z.string().max(100).optional(),mine:z.string().max(20),theirs:z.string().max(20)});
app.post("/_api/interpret",async(req,res)=>{try{const a=interpretSchema.parse(req.body);const transcript=await transcribe(a.audio,a.mime?.split(";")[0]||"audio/webm");if(!transcript){res.json({empty:true});return;}const raw=await callAI([{role:"system",content:"You are a bidirectional travel interpreter. Identify whether speech is in "+(languages[a.mine]||a.mine)+" ("+a.mine+") or "+(languages[a.theirs]||a.theirs)+" ("+a.theirs+"). Translate into the other language. Output valid JSON with source (EXACT locale code) and translation. Preserve addresses and proper names."},{role:"user",content:transcript}],true,550);const result=JSON.parse(raw);const source=result.source===a.theirs?a.theirs:a.mine;res.json({text:transcript,source,target:source===a.mine?a.theirs:a.mine,translation:String(result.translation||"")});}catch(e){fail(res,e);}});
const root=join(dirname(fileURLToPath(import.meta.url)),"..");const dist=join(root,"dist");if(existsSync(dist)){app.use(express.static(dist));app.get("*",(_,res)=>res.sendFile(join(dist,"index.html")));}
const port=Number(process.env.PORT||3001);app.listen(port,()=>console.log("VozBridge API listening on http://localhost:"+port));
