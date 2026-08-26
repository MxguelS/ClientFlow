import { DEFAULT_THEME } from "@/lib/theme/config";

/**
 * Script inline ejecutado ANTES del primer pintado.
 * Lee localStorage, resuelve system/light/dark contra
 * prefers-color-scheme y coloca data-appearance + data-theme
 * en <html>: sin FOUC.
 *
 * Autocontenido a propósito: no puede depender de módulos
 * porque se ejecuta antes de que cargue el bundle.
 */
export const THEME_SCRIPT = `(function(){try{
var d=document.documentElement;
var a=localStorage.getItem("cf.appearance");
if(a!=="light"&&a!=="dark")a="system";
var dark=a==="dark"||(a==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);
d.setAttribute("data-appearance",dark?"dark":"light");
var t=localStorage.getItem("cf.theme");
var valid=["midnight","crimson","ocean","aurora","ember","forest","mono"];
if(!t||valid.indexOf(t)===-1)t="${DEFAULT_THEME}";
d.setAttribute("data-theme",t);
}catch(e){}})();`;
