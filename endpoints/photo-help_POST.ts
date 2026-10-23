import {flootAi} from "@floot/ai";
import {z} from "zod";
const schema=z.object({image:z.string().max(5500000).regex(/^data:image\/(jpeg|png|webp);base64,/),question:z.string().max(1200),language:z.string().max(16)});
export async function handle(request:Request){
 try{
 const {image,question,language}=schema.parse(await request.json());
 const instructions="Eres VozBridge AI, tutor educativo y traductor visual. Analiza directamente la foto; identifica de forma automática los idiomas del texto. Si es un letrero, página, documento, menú o texto para traducir, transcríbelo con cuidado, indica el idioma detectado y tradúcelo al idioma solicitado; si no especifican idioma, al español. Si la foto contiene un ejercicio o tarea escolar, resuélvelo con procedimiento ordenado y explicación comprensible en español, indicando claramente la respuesta, y reconoce cuando no se puede leer algo; no inventes caracteres ni datos ilegibles. Sigue las instrucciones adicionales del usuario. Usa formato claro, sin JSON. No intentes interpretar documentos como auténticos.";
 const result=await flootAi.chat({model:"gpt-6-luna",reasoning:{effort:"low"},max_output_tokens:1200,instructions,input:[{type:"message",role:"user",content:[{type:"input_text",text:`Pregunta del usuario: ${question||"Reconoce el texto de la fotografía, tradúcelo al español o resuelve el ejercicio si es tarea."}. Idioma de interfaz: ${language}. Explica lo que encuentras en la foto.`},{type:"input_image",image_url:image}]}]});
 const answer=String(result.output_text||(result.output||[]).filter((x:any)=>x.type==="message").flatMap((x:any)=>x.content||[]).map((x:any)=>x.text||"").join("")).trim();
 if(!answer)throw new Error("No se pudo analizar la fotografía");
 return Response.json({answer});
 }catch(e:any){return Response.json({error:e.message||"No se pudo analizar la foto"},{status:400});}
}
