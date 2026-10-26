/**
 * Traducción en el dispositivo: primero API integrada del navegador.
 * Si no existe, modelos abiertos Transformers.js para español ↔ inglés.
 * Los modelos se descargan de Hugging Face una vez, sin consultar una API de pago.
 */
type TranslatorInstance={translate:(text:string)=>Promise<string>};
type TranslatorConstructor={
  availability:(options:{sourceLanguage:string;targetLanguage:string})=>Promise<string>;
  create:(options:{sourceLanguage:string;targetLanguage:string})=>Promise<TranslatorInstance>;
};
type TranslationResult={translation_text?:string};
const nativeInstances=new Map<string,Promise<TranslatorInstance>>();
const localInstances=new Map<string,Promise<(text:string)=>Promise<TranslationResult[]>>>();
const modelIds:Record<string,string>={
  "es:en":"Xenova/opus-mt-es-en",
  "en:es":"Xenova/opus-mt-en-es"
};
function nativeApi():TranslatorConstructor|undefined{
  return (globalThis as typeof globalThis & {Translator?:TranslatorConstructor}).Translator;
}
async function nativeTranslate(text:string,from:string,to:string):Promise<string>{
  const provider=nativeApi();
  if(!provider)throw Error("Traducción nativa no disponible");
  const options={sourceLanguage:from,targetLanguage:to};
  if(await provider.availability(options)==="unavailable")throw Error("Par no admitido");
  const key=from+":"+to;
  if(!nativeInstances.has(key)){
    nativeInstances.set(key,provider.create(options).catch(e=>{nativeInstances.delete(key);throw e;}));
  }
  return (await nativeInstances.get(key)!).translate(text);
}
async function localTranslate(text:string,from:string,to:string):Promise<string>{
  const key=from+":"+to;
  const id=modelIds[key];
  if(!id)throw Error("La traducción en este dispositivo aún no admite ese par de idiomas. Prueba español e inglés o Chrome de escritorio actualizado.");
  if(!localInstances.has(key)){
    const loader=(async()=>{
      const {pipeline}=await import("@huggingface/transformers");
      const worker=await pipeline("translation",id,{dtype:"q8",device:"wasm"});
      return async(value:string)=>await worker(value) as TranslationResult[];
    })().catch(e=>{localInstances.delete(key);throw e;});
    localInstances.set(key,loader);
  }
  const result=await (await localInstances.get(key)!)(text);
  const translated=String(result?.[0]?.translation_text||"").trim();
  if(!translated)throw Error("El modelo local no devolvió una traducción");
  return translated;
}
export async function translateInBrowser(text:string,source:string,target:string):Promise<string>{
  if(!text.trim())throw Error("Escribe o di una frase para traducir.");
  const from=source.split("-")[0].toLowerCase();
  const to=target.split("-")[0].toLowerCase();
  if(from===to)return text;
  try{
    return await nativeTranslate(text,from,to);
  }catch{
    try{return await localTranslate(text,from,to);}
    catch(e){
      if(!modelIds[from+":"+to])throw e;
      throw Error("No se pudo cargar el traductor en este dispositivo. La primera vez necesita descargar un modelo grande; comprueba la conexión y el espacio libre.");
    }
  }
}
export function browserTranslationAvailable():boolean{
  return !!nativeApi()||typeof WebAssembly!=="undefined";
}
