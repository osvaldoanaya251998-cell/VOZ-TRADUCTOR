/**
 * Traducción local mediante la API integrada del navegador.
 * No utiliza endpoints, claves ni servicios de pago de VozBridge.
 */
type TranslatorInstance={translate:(text:string)=>Promise<string>;destroy?:()=>void};
type TranslatorConstructor={
  availability:(options:{sourceLanguage:string;targetLanguage:string})=>Promise<string>;
  create:(options:{sourceLanguage:string;targetLanguage:string})=>Promise<TranslatorInstance>;
};
const instances=new Map<string,Promise<TranslatorInstance>>();
function api():TranslatorConstructor{
  const translator=(globalThis as typeof globalThis & {Translator?:TranslatorConstructor}).Translator;
  if(!translator)throw new Error("Tu navegador no ofrece traducción integrada. Prueba Chrome actualizado en una computadora; en móviles aún puede no estar disponible.");
  return translator;
}
export async function translateInBrowser(text:string,source:string,target:string):Promise<string>{
  if(!text.trim())throw new Error("Escribe o di una frase para traducir.");
  const from=source.split("-")[0].toLowerCase();
  const to=target.split("-")[0].toLowerCase();
  if(from===to)return text;
  const provider=api();
  const options={sourceLanguage:from,targetLanguage:to};
  const availability=await provider.availability(options);
  if(availability==="unavailable")throw new Error("Este navegador no tiene disponible el paquete para esos idiomas.");
  const key=from+":"+to;
  if(!instances.has(key))instances.set(key,provider.create(options).catch(error=>{instances.delete(key);throw error;}));
  try{return await (await instances.get(key)!).translate(text);}
  catch(error){throw new Error("No se pudo traducir en este dispositivo. Revisa el idioma, la conexión para descargar el modelo o inténtalo de nuevo.");}
}
export function browserTranslationAvailable():boolean{
  return typeof (globalThis as typeof globalThis & {Translator?:unknown}).Translator!=="undefined";
}
