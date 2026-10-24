import React,{useEffect,useRef,useState} from "react";
import {Mic,MicOff,Languages,Volume2,Copy,Trash2,ArrowLeftRight,Radio,Headphones,Check,Square,Globe2,Tv,Smartphone} from "lucide-react";
import {Button} from "../components/Button";
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from "../components/Select";
import {postTranslate} from "../endpoints/translate_POST.schema";
import styles from "./_index.module.css";
import TravelInterpreter from "../components/TravelInterpreter";
import InsurTalentBrand from "../components/InsurTalentBrand";
import ThemeToggle from "../components/ThemeToggle";
import {Link} from "react-router-dom";
const langs=[["en-US","Inglés"],["es-MX","Español"],["fr-FR","Francés"],["de-DE","Alemán"],["it-IT","Italiano"],["pt-BR","Portugués"],["ja-JP","Japonés"],["ko-KR","Coreano"],["zh-CN","Chino"],["ru-RU","Ruso"],["ar-SA","Árabe"],["hi-IN","Hindi"]];
type Line={id:number;original:string;translated:string;pending:boolean;failed?:boolean};
export default function Home(){
 const [audioMode,setAudioMode]=useState<"voice"|"ambient"|"travel">("travel");
 const [source,setSource]=useState("en-US"),[target,setTarget]=useState("es-MX"),[listening,setListening]=useState(false),[autoVoice,setAutoVoice]=useState(false),[lines,setLines]=useState<Line[]>([]),[interim,setInterim]=useState(""),[error,setError]=useState(""),[copied,setCopied]=useState(false);
 const rec=useRef<any>(null),wanted=useRef(false),counter=useRef(0),bottom=useRef<HTMLDivElement>(null),settings=useRef({source,target,autoVoice}),earlyTimer=useRef<ReturnType<typeof setTimeout>|null>(null),earlySent=useRef(""),lastFinal=useRef("");
 const normalize=(s:string)=>s.toLowerCase().replace(/[.,!?¿¡;:]/g,"").replace(/\s+/g," ").trim();
 const clearEarly=()=>{if(earlyTimer.current){clearTimeout(earlyTimer.current);earlyTimer.current=null;}};
 useEffect(()=>{settings.current={source,target,autoVoice};},[source,target,autoVoice]);
 useEffect(()=>{bottom.current?.scrollIntoView({behavior:"smooth",block:"nearest"});},[lines,interim]);
 useEffect(()=>()=>{wanted.current=false;rec.current?.abort?.();window.speechSynthesis?.cancel();},[]);
 const speak=(text:string,language:string)=>{if(!("speechSynthesis" in window))return;window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang=language;utterance.rate=.95;window.speechSynthesis.speak(utterance);};
 const translate=async(text:string)=>{
  const id=++counter.current;setLines(old=>[...old,{id,original:text,translated:"",pending:true}]);
  const s=settings.current;
  try{const data=await postTranslate({text,source:s.source,target:s.target});setLines(old=>old.map(x=>x.id===id?{...x,translated:data.translation,pending:false}:x));if(s.autoVoice)speak(data.translation,s.target);}
  catch(e:any){setLines(old=>old.map(x=>x.id===id?{...x,translated:"No se pudo traducir. Intenta otra vez.",pending:false,failed:true}:x));setError(e.message||"Falló la traducción");}
 };
 const stop=()=>{wanted.current=false;setListening(false);setInterim("");try{rec.current?.stop();}catch{}};
 const start=()=>{
  setError("");const API=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
  if(!API){setError("Este navegador no permite reconocimiento de voz. Abre la app en Chrome o Edge actualizado.");return;}
  try{
   const r=new API();rec.current=r;wanted.current=true;r.lang=settings.current.source;r.continuous=true;r.interimResults=true;r.maxAlternatives=1;
   r.onresult=(e:any)=>{let preview="";for(let i=e.resultIndex;i<e.results.length;i++){const text=e.results[i][0].transcript.trim();if(e.results[i].isFinal&&text){clearEarly();const normalized=normalize(text);if(normalized!==normalize(earlySent.current)){translate(text);}lastFinal.current=text;earlySent.current="";}else if(!e.results[i].isFinal)preview+=text+" ";}const pending=preview.trim();setInterim(pending);clearEarly();if(pending.split(/\s+/).length>=4&&normalize(pending)!==normalize(earlySent.current)){earlyTimer.current=setTimeout(()=>{if(!wanted.current)return;earlySent.current=pending;translate(pending);setInterim("");},850);}};
   r.onerror=(e:any)=>{if(e.error==="not-allowed"||e.error==="service-not-allowed"){setError("Permite el acceso al micrófono en el navegador.");wanted.current=false;setListening(false);}else if(e.error==="audio-capture"){setError("No se detectó un micrófono.");wanted.current=false;setListening(false);}else if(e.error!=="no-speech"&&e.error!=="aborted"){setError("Reconocimiento de voz: "+e.error);}};
   r.onend=()=>{if(wanted.current){try{r.start();}catch{setListening(false);wanted.current=false;}}else setListening(false);};
   r.start();setListening(true);
  }catch{wanted.current=false;setError("No se pudo iniciar el micrófono. Revisa sus permisos.");}
 };
 const copy=async()=>{const value=lines.filter(x=>!x.failed&&!x.pending).map(x=>x.translated).join("\n");if(!value)return;try{await navigator.clipboard.writeText(value);setCopied(true);setTimeout(()=>setCopied(false),1800);}catch{setError("No se pudo copiar al portapapeles.");}};
 const swap=()=>{if(listening)stop();setSource(target);setTarget(source);};
 return <main className={styles.page}>
  <div className={styles.glow}/>
  <div className={styles.shell}>
   <header className={styles.header}><div className={styles.brand}><InsurTalentBrand/></div><div className={styles.headerRight}><a className={styles.portalLink} href="https://talent.insurtalentmx.workers.dev/" title="Ir a la bolsa de trabajo InsurTalent">↗ InsurTalent</a><ThemeToggle/><span className={styles.onlineDot}/> Traducción local <span className={styles.headerTag}>BETA</span></div></header>
   <nav className={styles.sectionNav}><Link className={styles.navActive} to="/">🎙️ Traductor en vivo</Link><Link className={styles.navLink} to="/practicar">📝 Traductor de frases</Link></nav><section className={styles.intro}><div className={styles.eyebrow}><span className={styles.dot}/> COMUNICACIÓN SIN FRONTERAS</div><h1>Tu voz, en <em>cualquier idioma.</em></h1><p>Traduce frases con funciones del navegador, sin pagar una API. Requiere un navegador compatible en computadora.</p></section>
   <section className={styles.workspace}><div className={styles.modeTabs}><button className={audioMode==="travel"?styles.activeTab:""} onClick={()=>{stop();setAudioMode("travel");}}>🌏 Conversación por turnos</button><button className={audioMode!=="travel"?styles.activeTab:""} onClick={()=>{setAudioMode("ambient");}}>🎧 Escuchar audio externo</button></div>
    {audioMode==="travel"?<TravelInterpreter/>:<><div className={styles.config}><div className={styles.field}><label>IDIOMA QUE ESCUCHAS</label><Select value={source} onValueChange={v=>{if(listening)stop();setSource(v)}}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{langs.map(([v,n])=><SelectItem key={v} value={v}>{n}</SelectItem>)}</SelectContent></Select></div><button className={styles.swap} title="Intercambiar idiomas" onClick={swap}><ArrowLeftRight size={20}/></button><div className={styles.field}><label>TRADUCIR A</label><Select value={target} onValueChange={setTarget}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{langs.map(([v,n])=><SelectItem key={v} value={v}>{n}</SelectItem>)}</SelectContent></Select></div></div>
    <div className={styles.listenPanel}><div className={styles.modeChooser}><Button variant={audioMode==="ambient"?"primary":"outline"} onClick={()=>{if(listening)stop();setAudioMode("ambient");}}><Tv size={17}/> TV, teléfono o bocina</Button><Button variant={audioMode==="voice"?"primary":"outline"} onClick={()=>{if(listening)stop();setAudioMode("voice");}}><Mic size={17}/> Conversación</Button></div><div className={styles.modeHelp}>{audioMode==="ambient"?"Acerca este dispositivo a la televisión, teléfono o bocina. El micrófono captará el sonido que salga de sus altavoces.":"Habla cerca del micrófono para traducir conversaciones."}</div><div className={styles.status}><span className={listening?styles.liveBadge:styles.readyBadge}><Radio size={13}/>{listening?" ESCUCHANDO EN VIVO":" LISTO PARA ESCUCHAR"}</span></div><div className={styles.micHalo}><button className={listening?styles.micActive:styles.mic} onClick={listening?stop:start} aria-label={listening?"Detener micrófono":"Comenzar a escuchar"}>{listening?<Square size={30} fill="currentColor"/>:<Mic size={40}/>}</button></div><h2>{listening?"Estoy escuchando...":audioMode==="ambient"?"Traduce el audio a tu alrededor":"Comienza a traducir"}</h2><p>{listening?"El audio captado por el micrófono aparecerá traducido abajo.":audioMode==="ambient"?"Pon el sonido del televisor o teléfono a un volumen claro y evita otros ruidos.":"Presiona el micrófono para escuchar y traducir la conversación."}</p><Button size="lg" onClick={listening?stop:start} className={styles.mainButton}>{listening?<><MicOff size={18}/> Detener traducción</>:<><Mic size={19}/> {audioMode==="ambient"?"Escuchar audio externo":"Empezar a escuchar"}</>}</Button><label className={styles.voiceSetting}><input type="checkbox" checked={autoVoice} onChange={e=>setAutoVoice(e.target.checked)}/><Volume2 size={16}/> Reproducir traducciones automáticamente</label></div>
    {error&&<div className={styles.error}>{error}</div>}
    <div className={styles.transcriptHeader}><div><h3>Conversación en vivo</h3><p>Traducciones locales en navegadores compatibles</p></div><div className={styles.actions}><Button variant="ghost" size="sm" onClick={copy} disabled={!lines.length}>{copied?<Check size={16}/>:<Copy size={16}/>} {copied?"Copiado":"Copiar"}</Button><Button variant="ghost" size="sm" onClick={()=>{setLines([]);setInterim("");}} disabled={!lines.length}><Trash2 size={16}/> Limpiar</Button></div></div>
    <div className={styles.transcript}>{lines.length===0&&!interim?<div className={styles.empty}><Headphones size={28}/><strong>Tu conversación aparece aquí</strong><span>Cuando empieces a hablar, verás el texto original y su traducción.</span></div>:<>{lines.map(line=><div className={styles.line} key={line.id}><div className={styles.original}><span>ORIGINAL · {langs.find(l=>l[0]===source)?.[1]}</span><p>{line.original}</p></div><div className={styles.translation}><div className={styles.translationLabel}><span>TRADUCCIÓN · {langs.find(l=>l[0]===target)?.[1]}</span>{!line.pending&&!line.failed&&<button title="Escuchar" onClick={()=>speak(line.translated,target)}><Volume2 size={17}/></button>}</div><p>{line.pending?"Traduciendo…":line.translated}</p></div></div>)}{interim&&<div className={styles.interim}><span>ESCUCHANDO...</span><p>{interim}</p></div>}<div ref={bottom}/></>}</div>
   </>}</section><footer className={styles.footer}><span><Globe2 size={15}/> VozBridge Basic · Sin API de pago</span><span>Traducción integrada disponible en navegadores y equipos compatibles</span></footer>
  </div>
 </main>;
}
