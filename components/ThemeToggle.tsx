import React,{useEffect,useState} from "react";
import {Moon,Sun} from "lucide-react";
import styles from "./ThemeToggle.module.css";
const KEY="vozbridge-color-theme";
export default function ThemeToggle(){
 const [dark,setDark]=useState(false);
 useEffect(()=>{const saved=localStorage.getItem(KEY);const chosen=saved==="dark"||(saved===null&&window.matchMedia("(prefers-color-scheme: dark)").matches);setDark(chosen);document.documentElement.dataset.vbTheme=chosen?"dark":"light";},[]);
 const toggle=()=>{const next=!dark;setDark(next);document.documentElement.dataset.vbTheme=next?"dark":"light";localStorage.setItem(KEY,next?"dark":"light");};
 return <button className={styles.toggle} type="button" onClick={toggle} aria-label={dark?"Cambiar a modo claro":"Cambiar a modo nocturno"} title={dark?"Modo claro":"Modo nocturno"}>{dark?<Sun size={19}/>:<Moon size={19}/>}<span>{dark?"Claro":"Nocturno"}</span></button>;
}
