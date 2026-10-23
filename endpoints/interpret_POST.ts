import {flootAi} from "@floot/ai";
export async function handle(request:Request){
 try{
  const input=await request.json();
  const {audio,mime,mine,theirs}=input;
  const encoded=typeof audio==="string"?audio.replace(/^data:audio\/[^,]+,/i,""):"";
  if(!encoded||encoded.length>4200000||!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)||typeof mine!=="string"||typeof theirs!=="string")return Response.json({error:"Audio inválido"},{status:400});
  const transcript=await flootAi.transcribe({model:"gemini-3.5-transcribe",input:[{type:"audio",data:encoded,mime_type:String(mime||"audio/webm").split(";")[0]}],generation_config:{transcription_config:{mode:"smart"}}});
  const text=String(transcript.output_text||"").trim();
  if(!text)return Response.json({empty:true});
  const result=await flootAi.chat({model:"gpt-6-luna",reasoning:{effort:"none"},max_output_tokens:380,instructions:`You are a two-way travel interpreter. User language: ${mine}, travel partner language: ${theirs}. Determine which of these two languages the spoken transcript is in. Translate it into the OTHER language naturally and accurately. Return ONLY valid JSON: {"source":"${mine} or ${theirs}","translation":"translated text"}. If ambiguous, choose the most likely source based on grammar and vocabulary. Preserve names and addresses.`,input:text});
  const raw=String(result.output_text||(result.output||[]).filter((x:any)=>x.type==="message").flatMap((x:any)=>x.content||[]).map((x:any)=>x.text||"").join("")).trim();
  const parsed=JSON.parse(raw.replace(/^```(?:json)?/i,"").replace(/```$/,"").trim());
  const source=parsed.source===theirs?theirs:mine;
  return Response.json({text,source,translation:String(parsed.translation||""),target:source===mine?theirs:mine});
 }catch(e:any){return Response.json({error:e.message||"Falló reconocimiento automático"},{status:400});}
}
