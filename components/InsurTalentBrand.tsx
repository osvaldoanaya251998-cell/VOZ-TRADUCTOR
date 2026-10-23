import React from "react";
import styles from "./InsurTalentBrand.module.css";

const lightLogo="/_cdn/static/1f5b715b-b0cc-4ee2-8cb1-6366a8de1ab1-insurtalent-logo-transparent.png";
const darkLogo="/_cdn/static/f71617de-51c0-406a-8d1a-b243eea41e4d-insurtalent-logo-dark.png";

export default function InsurTalentBrand(){
 return <span className={styles.brand}>
  <img className={styles.lightLogo} src={lightLogo} alt="InsurTalent"/>
  <img className={styles.darkLogo} src={darkLogo} alt="" aria-hidden="true"/>
 </span>;
}
