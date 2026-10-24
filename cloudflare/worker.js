const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const names={"es-MX":"español","en-US":"inglés","fr-FR":"francés","de-DE":"alemán","it-IT":"italiano","pt-BR":"portugués","ja-JP":"japonés","ko-KR":"coreano","zh-CN":"chino","ar-SA":"árabe","hi-IN":"hindi","ru-RU":"ruso"};
const lang=code=>names[code]||"inglés";
const short=code=>String(code||"en").split("-")[0].toLowerCase();
const unpack=body=>body&&typeof body==="object"&&"json" in body?body.json:body;
const messageOf=result=>String(result?.response||result?.text||"").trim();
async function ask(env,messages,max_tokens=500){
  const result=await env.AI.run("@cf/google/gemma-4-26b-a4b-it",{messages,max_tokens,chat_template_kwargs:{enable_thinking:false}});
  const text=messageOf(result);
  if(!text)throw new Error("Respuesta vacía del modelo");
  return text;
}
async function translate(env,text,source,target){
  if(short(source)===short(target))return text;
  const result=await env.AI.run("@cf/meta/m2m100-1.2b",{text,source_lang:short(source),target_lang:short(target)});
  const translated=String(result?.translated_text||result?.translation||"").trim();
  if(!translated)throw new Error("El servicio de traducción no devolvió texto");
  return translated;
}
function jsonAnswer(text){
  const cleaned=text.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"").trim();
  try{return JSON.parse(cleaned);}catch{return null;}
}
function safeError(error){
  const message=String(error?.message||"");
  if(/3036|neurons|quota|limit exceeded|allocation|429/i.test(message))return {status:429,message:"Se agotó la cuota gratuita de Cloudflare AI. Inténtalo mañana."};
  console.error("vozbridge_cloudflare_error",message.slice(0,250));
  return {status:502,message:"No se pudo completar la solicitud. Inténtalo nuevamente."};
}
export default {async fetch(request,env){
  const url=new URL(request.url);
  if(!url.pathname.startsWith("/_api/"))return env.ASSETS.fetch(request);
  if(request.method!=="POST")return reply({error:"Método no permitido"},405);
  if(!env.AI)return reply({error:"Falta configurar el binding AI en Cloudflare."},503);
  if(Number(request.headers.get("content-length")||0)>5000000)return reply({error:"Solicitud demasiado grande"},413);
  const path=url.pathname;
  try{
    const body=unpack(await request.json());
    if(path==="/_api/translate"){
      const {text,source,target}=body||{};
      if(typeof text!=="string"||!text.trim()||text.length>2500||!names[source]||!names[target])return reply({json:{error:"Texto o idioma inválido"}},400);
      const translation=await translate(env,text.trim(),source,target);
      return reply({json:{translation,detected:source}});
    }
    if(path==="/_api/interpret"){
      const {audio,mine,theirs}=body||{};
      if(typeof audio!=="string"||audio.length>4500000||!names[mine]||!names[theirs]||mine===theirs)return reply({error:"Audio o idiomas inválidos"},400);
      const raw=audio.replace(/^data:audio\/[^,]+,/,"");
      if(!/^[a-zA-Z0-9+/]+={0,2}$/.test(raw))return reply({error:"Audio inválido"},400);
      const transcription=await env.AI.run("@cf/openai/whisper-large-v3-turbo",{audio:raw,task:"transcribe"});
      const text=String(transcription?.text||"").trim();
      if(!text)return reply({empty:true});
      const detection=await ask(env,[{role:"system",content:"Identifica el idioma del texto. Responde SOLO A si es "+lang(mine)+" o SOLO B si es "+lang(theirs)+". Si es ambiguo responde A."},{role:"user",content:text.slice(0,1000)}],12);
      const source=/^B\b/i.test(detection)?theirs:mine;
      const target=source===mine?theirs:mine;
      const translation=await translate(env,text.slice(0,2500),source,target);
      return reply({text,source,target,translation});
    }
    if(path==="/_api/practice"){
      const {message,language,level,history=[]}=body||{};
      if(typeof message!=="string"||!message.trim()||message.length>1200||!names[language]||!Array.isArray(history))return reply({json:{error:"Mensaje inválido"}},400);
      const prior=history.slice(-8).filter(x=>typeof x?.text==="string").map(x=>({role:x.role==="student"?"user":"assistant",content:x.text.slice(0,600)}));
      const output=await ask(env,[{role:"system",content:"Eres VozBridge, un tutor amable de idiomas. Responde principalmente en "+lang(language)+" al nivel "+String(level||"A2").slice(0,2)+". Ayuda a traducir y practicar. Responde SOLO un JSON válido con campos reply, correction, explanation, praise, todos de texto. No incluyas markdown."},...prior,{role:"user",content:message}],450);
      const parsed=jsonAnswer(output)||{reply:output,correction:"",explanation:"",praise:""};
      return reply({json:{reply:String(parsed.reply||output),correction:String(parsed.correction||""),explanation:String(parsed.explanation||""),praise:String(parsed.praise||"")}});
    }
    if(path==="/_api/photo-help")return reply({error:"La lectura de fotografías no está disponible en VozBridge Basic. Usa el traductor de texto por ahora."},501);
    return reply({error:"Ruta no encontrada"},404);
  }catch(error){
    const detail=safeError(error);
    return reply(path==="/_api/translate"||path==="/_api/practice"?{json:{error:detail.message}}:{error:detail.message},detail.status);
  }
}};
