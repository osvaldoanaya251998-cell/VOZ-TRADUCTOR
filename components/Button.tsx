import React from "react";
import styles from "./Button.module.css";
type Props=React.ButtonHTMLAttributes<HTMLButtonElement>&{
 variant?:"primary"|"outline"|"ghost"|"link"|"secondary"|"destructive";
 size?:"sm"|"md"|"lg"|"icon"|"icon-sm"|"icon-md"|"icon-lg";
 shape?:"default"|"pill";asChild?:boolean
};
export const Button=React.forwardRef<HTMLButtonElement,Props>(({children,variant="primary",size="md",shape="default",asChild,className,disabled,...rest},ref)=>
 <button ref={ref} className={[styles.button,styles[variant],styles[size],shape==="pill"?styles.pill:"",disabled?styles.disabled:"",className||""].join(" ")} disabled={disabled} {...rest}>{children}</button>
);
Button.displayName="Button";
