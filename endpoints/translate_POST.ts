import {flootAi} from "@floot/ai";
import superjson from "superjson";
import {schema, type OutputType} from "./translate_POST.schema";
export async function handle(request:Request){
 try{
  const {text,source,target}=schema.parse(superjson.parse(await request.text()));
  const result=await flootAi.chat({model:"gpt-6-luna",reasoning:{effort:"none"},max_output_tokens:220,instructions:"Translate speech accurately and naturally into the target language. Output translation only, with no explanation.",input:`Source language: ${source}. Target language: ${target}. Speech transcript: ${text}`});
  const translation=String(result.output_text || (result.output||[]).filter((o:any)=>o.type==="message").flatMap((o:any)=>o.content||[]).filter((c:any)=>c.type==="output_text").map((c:any)=>c.text||"").join(" ") || "").trim();
  if(!translation)throw new Error("La traducción llegó vacía");
  return new Response(superjson.stringify({translation,detected:source==="auto"?"Detección automática":source} satisfies OutputType),{headers:{"Content-Type":"application/json"}});
 }catch(error:any){return new Response(superjson.stringify({error:error?.message||"Error al traducir"}),{status:400,headers:{"Content-Type":"application/json"}});}
}
