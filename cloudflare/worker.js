const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const languages={"es-MX":"español","en-US":"inglés","fr-FR":"francés","de-DE":"alemán","it-IT":"italiano","pt-BR":"portugués","ja-JP":"japonés"};
async function chat(env,messages,json=false,max=800){
 const response=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{Authorization:"Bearer "+env.OPENAI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:env.OPENAI_MODEL||"gpt-4.1-mini",messages,max_completion_tokens:max,...(json?{response_format:{type:"json_object"}}:{})})});
 if(!response.ok)throw await upstreamError("chat",response);
 const data=await response.json();return String(data.choices?.[0]?.message?.content||"").trim();
}
async function upstreamError(stage,response){
 let code="unknown";
 try{const body=await response.json();code=String(body?.error?.code||body?.error?.type||"unknown").slice(0,80);}catch{}
 const error=new Error("OpenAI "+stage+" HTTP "+response.status+" ("+code+")");
 error.stage=stage;error.httpStatus=response.status;error.code=code;
 return error;
}
function safeError(error){
 if(error?.httpStatus===401)return "La clave OPENAI_API_KEY fue rechazada (401). Revisa el secreto en Cloudflare.";
 if(error?.httpStatus===429)return "OpenAI devolvió 429. Revisa créditos, límites o facturación de tu cuenta API.";
 if(error?.httpStatus===403)return "OpenAI devolvió 403. Tu proyecto API no tiene permiso para esta operación.";
 if(error?.httpStatus===400)return "OpenAI devolvió 400 en "+(error.stage==="transcription"?"transcripción de audio":"respuesta de IA")+". Verifica el formato del audio o el modelo configurado.";
 return "La IA no pudo responder. Revisa el registro de Cloudflare.";
}
function unpack(body){return body&&typeof body==="object"&&"json" in body?body.json:body}
const lang=x=>languages[x]||x||"idioma no especificado";
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(!url.pathname.startsWith("/_api/"))return env.ASSETS.fetch(request);
 if(request.method!=="POST")return reply({error:"Método no permitido"},405);
 if(!env.OPENAI_API_KEY)return reply({error:"Falta configurar OPENAI_API_KEY como secreto en Cloudflare."},503);
 const path=url.pathname;
 try{
  const body=unpack(await request.json());
  if(path==="/_api/translate"){
   const {text,source,target}=body;
   if(typeof text!=="string"||!text.trim()||text.length>4000)return reply({json:{error:"Texto inválido"}},400);
   const translation=await chat(env,[{role:"system",content:"Traduce con precisión de "+lang(source)+" a "+lang(target)+". Devuelve únicamente la traducción."},{role:"user",content:text}],false,400);
   return reply({json:{translation,detected:source==="auto"?"Detección automática":source}});
  }
  if(path==="/_api/practice"){
   const {message,language,level,history=[]}=body;
   if(typeof message!=="string"||!message.trim()||message.length>1500||!Array.isArray(history))return reply({json:{error:"Mensaje inválido"}},400);
   const conversation=history.slice(-12).filter(x=>typeof x.text==="string").map(x=>({role:x.role==="student"?"user":"assistant",content:x.text.slice(0,1000)}));
   const instruction="Eres VozBridge AI, asistente conversacional y tutor. Habla naturalmente en el idioma del usuario. Si pide traducir, traduce solamente lo pedido al idioma indicado. Ayuda a practicar "+lang(language)+" al nivel "+level+". Devuelve JSON con cuatro campos de texto: reply, correction, explanation, praise. Deja los campos opcionales vacíos cuando no apliquen.";
   const result=JSON.parse(await chat(env,[{role:"system",content:instruction},...conversation,{role:"user",content:message}],true,650));
   return reply({json:{reply:String(result.reply||""),correction:String(result.correction||""),explanation:String(result.explanation||""),praise:String(result.praise||"")}});
  }
  if(path==="/_api/photo-help"){
   const {image,question,language}=body;
   if(typeof image!=="string"||image.length>5500000||!/^data:image\/(png|jpeg|webp);base64,/.test(image))return reply({error:"Imagen inválida"},400);
   const answer=await chat(env,[{role:"system",content:"Eres VozBridge AI. Analiza fotografías. Reconoce texto e idioma, traduce cuando corresponda, ayuda con ejercicios paso a paso sin inventar datos ilegibles."},{role:"user",content:[{type:"text",text:(typeof question==="string"&&question.trim())||"Traduce al español lo que aparece o resuelve el ejercicio. Idioma: "+lang(language)},{type:"image_url",image_url:{url:image}}]}],false,1400);
   return reply({answer});
  }
  if(path==="/_api/interpret"){
   const {audio,mime,mine,theirs}=body;
   if(typeof audio!=="string"||audio.length>4500000||!mine||!theirs)return reply({error:"Audio inválido"},400);
   const b64=audio.replace(/^data:audio\/[^,]+,/,"");
   if(!/^[a-zA-Z0-9+/]+={0,2}$/.test(b64))return reply({error:"Audio inválido"},400);
   const bytes=Uint8Array.from(atob(b64),x=>x.charCodeAt(0));
   const kind=typeof mime==="string"?mime.split(";")[0]:"audio/webm";
   const ext=kind.includes("mp4")?"mp4":kind.includes("wav")?"wav":"webm";
   const form=new FormData();form.append("model","whisper-1");form.append("file",new Blob([bytes],{type:kind}),"speech."+ext);
   const t=await fetch("https://api.openai.com/v1/audio/transcriptions",{method:"POST",headers:{Authorization:"Bearer "+env.OPENAI_API_KEY},body:form});
   if(!t.ok)throw await upstreamError("transcription",t);
   const text=String((await t.json()).text||"").trim();if(!text)return reply({empty:true});
   const instruction="Interpreta conversación bidireccional. Los idiomas son "+lang(mine)+" código "+mine+" y "+lang(theirs)+" código "+theirs+". Detecta cuál está hablando y traduce al otro. Responde JSON con source (código exacto) y translation. Conserva nombres propios.";
   const result=JSON.parse(await chat(env,[{role:"system",content:instruction},{role:"user",content:text}],true,480));
   const source=result.source===theirs?theirs:mine;
   return reply({text,source,target:source===mine?theirs:mine,translation:String(result.translation||"")});
  }
  return reply({error:"Ruta no encontrada"},404);
  }catch(e){console.error("vozbridge_ai_error",JSON.stringify({stage:e?.stage||"worker",httpStatus:e?.httpStatus||null,code:e?.code||null,message:e instanceof Error?e.message:"unknown"}));const message=safeError(e);return reply(path==="/_api/translate"||path==="/_api/practice"?{json:{error:message}}:{error:message},502);}
}};
