import {z} from "zod";
import {translateInBrowser} from "../helpers/browserTranslation";
export const schema=z.object({message:z.string().min(1).max(1500),language:z.string().max(12),level:z.enum(["A1","A2","B1","B2","C1","C2"]),topic:z.string().max(60),history:z.array(z.object({role:z.enum(["student","tutor"]),text:z.string().max(1000)})).max(12)});
export type OutputType={reply:string;correction:string;explanation:string;praise:string};
const locales:Record<string,string>={"inglés":"en-US","ingles":"en-US","english":"en-US","francés":"fr-FR","frances":"fr-FR","alemán":"de-DE","aleman":"de-DE","italiano":"it-IT","portugués":"pt-BR","portugues":"pt-BR","japonés":"ja-JP","japones":"ja-JP","español":"es-MX","espanol":"es-MX"};
export async function postPractice(input:z.infer<typeof schema>):Promise<OutputType>{
 const {message,language}=schema.parse(input);
 const requested=message.match(/(?:traduce|traducir|translate)(?:\s+(?:al|a|en|to))?\s+(inglés|ingles|english|francés|frances|alemán|aleman|italiano|portugués|portugues|japonés|japones|español|espanol)\s*[:,-]?\s*(.*)$/i);
 const destination=requested?locales[requested[1].toLowerCase()]:language;
 const original=requested?.[2]?.trim()||message;
 if(requested&&!requested[2]?.trim())return {reply:"Escribe la frase después del idioma. Ejemplo: Traduce al inglés: buenos días.",correction:"",explanation:"",praise:""};
 const origin=destination.startsWith("es")?"en-US":"es-MX";
 const translation=await translateInBrowser(original,origin,destination);
 return {reply:translation,correction:"",explanation:"Traducción local del navegador. Este modo básico no mantiene conversaciones con una IA.",praise:""};
}
