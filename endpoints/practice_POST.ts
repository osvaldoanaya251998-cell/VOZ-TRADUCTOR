import {flootAi} from "@floot/ai";
import superjson from "superjson";
import {schema,type OutputType} from "./practice_POST.schema";
export async function handle(request:Request){
 try{
  const input=schema.parse(superjson.parse(await request.text()));
  const names:Record<string,string>={"en-US":"English","es-MX":"Spanish","fr-FR":"French","de-DE":"German","it-IT":"Italian","pt-BR":"Portuguese","ja-JP":"Japanese"};
  const language=names[input.language]||"Spanish";
  const messages=input.history.map(x=>(x.role==="student"?"Usuario":"Asistente")+": "+x.text).join("\n");
  const instructions=`Eres VozBridge AI, un asistente conversacional natural, ágil y amable, parecido a un chat de voz. Mantén una conversación normal en el idioma del usuario, salvo que te pida explícitamente otro idioma. Puedes ayudar con preguntas, explicaciones y práctica de idiomas. Si el usuario te dice "oye, tradúceme al inglés lo siguiente: ...", "traduce esto a francés", "dime en japonés..." u órdenes equivalentes, traduce SOLAMENTE el contenido solicitado al idioma indicado. Si falta el contenido, pídeselo. Si falta el idioma, pregúntalo. Detecta el idioma pedido en cada instrucción sin limitarte a la preferencia configurada. Nunca traduzcas conversaciones normales de forma automática. Si solicita corrección de una frase, corrígela y da una explicación breve en español. Si está practicando ${language} a nivel ${input.level}, adapta la complejidad a ese nivel cuando corresponda. Responde de forma breve y natural, adecuada para escucharse en voz alta. Devuelve JSON válido con exactamente cuatro campos de texto: "reply" (respuesta o traducción principal), "correction" (texto corregido SOLO si lo solicita o está practicando y necesita corrección, de otro modo ""), "explanation" (explicación corta en español únicamente si corresponde, de otro modo ""), "praise" (breve felicitación SOLO cuando corresponda, de otro modo ""). Sin formato markdown, sin bloques de código.`;
  const result=await flootAi.chat({model:"gpt-6-luna",reasoning:{effort:"none"},max_output_tokens:420,instructions,input:`Historial:\n${messages}\nUsuario: ${input.message}`});
  const raw=String(result.output_text||result.output?.filter((x:any)=>x.type==="message").flatMap((x:any)=>x.content||[]).map((x:any)=>x.text||"").join("")||"").trim();
  const parsed=JSON.parse(raw.replace(/^```(?:json)?/i,"").replace(/```$/,"").trim());
  const output:OutputType={reply:String(parsed.reply||""),correction:String(parsed.correction||""),explanation:String(parsed.explanation||""),praise:String(parsed.praise||"")};
  if(!output.reply)throw new Error("Respuesta vacía");
  return new Response(superjson.stringify(output),{headers:{"Content-Type":"application/json"}});
 }catch(e:any){return new Response(superjson.stringify({error:e.message||"Error de conversación"}),{status:400,headers:{"Content-Type":"application/json"}});}
}
