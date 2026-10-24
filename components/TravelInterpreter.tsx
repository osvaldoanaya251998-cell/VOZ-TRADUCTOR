import React,{useEffect,useRef,useState} from "react";
import {Mic,MicOff,Volume2,ArrowLeftRight,Globe2,Trash2} from "lucide-react";
import {Button} from "./Button";
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from "./Select";
import {translateInBrowser} from "../helpers/browserTranslation";
import styles from "./TravelInterpreter.module.css";
const languages=[["es-MX","Español"],["ko-KR","Coreano"],["en-US","Inglés"],["ja-JP","Japonés"],["fr-FR","Francés"],["de-DE","Alemán"],["it-IT","Italiano"],["pt-BR","Portugués"],["zh-CN","Chino"],["ar-SA","Árabe"],["hi-IN","Hindi"],["ru-RU","Ruso"]];
type Side="me"|"other";
type Line={id:number;side:Side;original:string;translation:string;target:string};
const name=(code:string)=>languages.find(l=>l[0]===code)?.[1]||code;
export default function TravelInterpreter(){
 const [mine,setMine]=useState("es-MX"),[theirs,setTheirs]=useState("en-US"),[active,setActive]=useState<Side|null>(null),[busy,setBusy]=useState(false),[lines,setLines]=useState<Line[]>([]),[error,setError]=useState(""),[autoSpeak,setAutoSpeak]=useState(true),[status,setStatus]=useState("Elige quién habla y pulsa su micrófono.");
 const recognition=useRef<any>(null),session=useRef(0),count=useRef(0),bottom=useRef<HTMLDivElement>(null);
 useEffect(()=>{bottom.current?.scrollIntoView({behavior:"smooth",block:"nearest"});},[lines]);
 const stop=()=>{session.current++;try{recognition.current?.abort?.();}catch{}recognition.current=null;setActive(null);setBusy(false);setStatus("Escucha detenida");};
 useEffect(()=>()=>{session.current++;recognition.current?.abort?.();window.speechSynthesis?.cancel();},[]);
 const speak=(value:string,language:string)=>{if(!("speechSynthesis" in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(value);u.lang=language;u.rate=.93;window.speechSynthesis.speak(u);};
 const listen=(side:Side)=>{
  if(active){stop();return;}
  setError("");
  const Speech=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
  if(!Speech){setError("El reconocimiento de voz no está disponible. Usa Chrome de escritorio actualizado.");return;}
  const from=side==="me"?mine:theirs, to=side==="me"?theirs:mine;
  try{
   const current=++session.current;
   const r=new Speech();recognition.current=r;r.lang=from;r.continuous=false;r.interimResults=false;
   r.onresult=async(event:any)=>{
    const transcript=String(event.results?.[0]?.[0]?.transcript||"").trim();
    if(!transcript||current!==session.current)return;
    setActive(null);setBusy(true);setStatus("Traduciendo en el navegador…");
    try{
     const translation=await translateInBrowser(transcript,from,to);
     if(current!==session.current)return;
     setLines(v=>[...v,{id:++count.current,side,original:transcript,translation,target:to}]);
     setStatus("Traducción lista");if(autoSpeak)speak(translation,to);
    }catch(e:any){if(current===session.current)setError(e.message||"No se pudo traducir.");}
    finally{if(current===session.current)setBusy(false);}
   };
   r.onerror=(event:any)=>{if(current!==session.current)return;setActive(null);if(event.error!=="no-speech"&&event.error!=="aborted")setError(event.error==="not-allowed"?"Permite el acceso al micrófono.":"No se pudo reconocer tu voz.");};
   r.onend=()=>{if(current===session.current)setActive(null);};
   r.start();setActive(side);setStatus("Escuchando "+name(from)+"…");
  }catch{setActive(null);setError("No se pudo abrir el micrófono.");}
 };
 const change=(field:"mine"|"theirs",value:string)=>{stop();if(field==="mine")setMine(value);else setTheirs(value);};
 return <div className={styles.wrapper}>
 <div className={styles.title}><span className={styles.eyebrow}><Globe2 size={15}/> INTÉRPRETE BÁSICO SIN API DE PAGO</span><p>Elige quién habla. La traducción se procesa en el navegador compatible.</p></div>
 <div className={styles.pickers}><div><label>TU IDIOMA</label><Select value={mine} onValueChange={v=>change("mine",v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{languages.map(([code,label])=><SelectItem value={code} key={code}>{label}</SelectItem>)}</SelectContent></Select></div><button className={styles.swap} title="Intercambiar idiomas" onClick={()=>{stop();setMine(theirs);setTheirs(mine);}}><ArrowLeftRight size={20}/></button><div><label>IDIOMA DE LA OTRA PERSONA</label><Select value={theirs} onValueChange={v=>change("theirs",v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{languages.map(([code,label])=><SelectItem value={code} key={code}>{label}</SelectItem>)}</SelectContent></Select></div></div>
 <div className={styles.autoPanel}><button type="button" className={active==="me"?styles.autoActive:styles.autoButton} disabled={busy} onClick={()=>listen("me")}>{active==="me"?<MicOff size={41}/>:<Mic size={43}/>}<strong>{active==="me"?"Detener escucha":"Yo hablo · "+name(mine)}</strong></button><p>{status}</p><Button onClick={()=>listen("other")} disabled={busy} variant="outline">{active==="other"?<MicOff size={18}/>:<Mic size={18}/>} {active==="other"?"Detener escucha":"Habla la otra persona · "+name(theirs)}</Button><span>🎙️ Un turno por persona · Sin llamadas a OpenAI ni Cloudflare AI</span></div>
 {error&&<div className={styles.error}>{error}</div>}
 <label className={styles.autosound}><input type="checkbox" checked={autoSpeak} onChange={e=>setAutoSpeak(e.target.checked)}/><Volume2 size={17}/> Leer las traducciones en voz alta</label>
 <div className={styles.conversationHeader}><div><h3>Conversación en ambos idiomas</h3><p>Selecciona el micrófono de cada persona antes de hablar</p></div><Button variant="ghost" size="sm" onClick={()=>setLines([])}><Trash2 size={15}/> Limpiar</Button></div>
 <div className={styles.messages}>{lines.length===0?<div className={styles.empty}><strong>Tu conversación aparecerá aquí</strong><span>Ejemplo: “Disculpe, ¿dónde está la estación de metro?”</span></div>:lines.map(m=><div key={m.id} className={`${styles.message} ${m.side==="me"?styles.myMessage:styles.theirMessage}`}><span>{m.side==="me"?name(mine):name(theirs)} → {name(m.target)}</span><p className={styles.original}>{m.original}</p><p className={styles.translation}>{m.translation}</p><button className={styles.replay} onClick={()=>speak(m.translation,m.target)}><Volume2 size={16}/> Escuchar traducción</button></div>)}<div ref={bottom}/></div>
 <p className={styles.disclaimer}>Esta versión no identifica automáticamente quién habla. El reconocimiento de voz puede utilizar servicios del propio navegador. La traducción local requiere que el navegador admita Translator API y pueda descargar sus modelos.</p></div>;
}
