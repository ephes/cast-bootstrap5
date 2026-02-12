var H=Object.defineProperty;var O=(i,o,e)=>o in i?H(i,o,{enumerable:!0,configurable:!0,writable:!0,value:e}):i[o]=e;var c=(i,o,e)=>O(i,typeof o!="symbol"?o+"":o,e);let h=null,R=0,v=null,f=null,I=null;const w="data-podlove-embed",D="data-podlove-embed-loaded",b="data-podlove-embed-failed",A="podlove-player-styles",P="color_scheme",m="#1e293b",p="#ffffff",k=297,M=309,C=100,x=700,$=2500,g="data-cast-iframe-masked";function V(){return document.readyState==="complete"?Promise.resolve():(v||(v=new Promise(i=>{window.addEventListener("load",()=>i(),{once:!0})})),v)}function z(){return f||(f=new IntersectionObserver((i,o)=>{i.forEach(e=>{if(!e.isIntersecting)return;const t=e.target;t instanceof E&&t.initializePlayer(),o.unobserve(t)})})),f}function F(i){return typeof podlovePlayer=="function"?Promise.resolve():h||(h=new Promise((o,e)=>{const t=document.querySelector(`script[${w}]`);if(t){if(t.getAttribute(D)==="true"&&typeof podlovePlayer=="function"){o();return}if(t.getAttribute(b)==="true")t.remove();else{t.addEventListener("load",()=>o(),{once:!0}),t.addEventListener("error",()=>{t.setAttribute(b,"true"),t.remove(),h=null,e(new Error("Failed to load Podlove embed script"))},{once:!0});return}}const a=document.createElement("script");a.src=i,a.async=!0,a.setAttribute(w,"true"),a.addEventListener("load",()=>{a.setAttribute(D,"true"),o()},{once:!0}),a.addEventListener("error",()=>{a.setAttribute(b,"true"),a.remove(),h=null,e(new Error("Failed to load Podlove embed script"))},{once:!0}),document.head.appendChild(a)}),h)}function y(){var o,e;const i=document.documentElement.getAttribute("data-bs-theme")||document.documentElement.getAttribute("data-theme")||((o=document.body)==null?void 0:o.getAttribute("data-bs-theme"))||((e=document.body)==null?void 0:e.getAttribute("data-theme"));return i==="light"||i==="dark"?i:typeof window.matchMedia=="function"&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":null}function q(i){const o=y();if(!o)return i;const e=i.indexOf("#"),t=e===-1?i:i.slice(0,e),a=e===-1?"":i.slice(e+1),l=t.indexOf("?"),n=l===-1?t:t.slice(0,l),s=l===-1?"":t.slice(l+1),d=new URLSearchParams(s);d.has(P)||d.set(P,o);const r=d.toString(),u=a?`#${a}`:"";return r?`${n}?${r}${u}`:`${n}${u}`}function B(){return typeof window.matchMedia=="function"&&window.matchMedia("(max-width: 768px)").matches?M:k}class E extends HTMLElement{constructor(){super();c(this,"observer");c(this,"isInitialized");c(this,"playerDiv");c(this,"initVersion");c(this,"iframeObserver");c(this,"iframeRevealDelayTimeoutId");c(this,"iframeRevealTimeoutId");this.observer=null,this.isInitialized=!1,this.playerDiv=null,this.initVersion=0,this.iframeObserver=null,this.iframeRevealDelayTimeoutId=null,this.iframeRevealTimeoutId=null}reinitializePlayer(){!this.isInitialized||!this.isConnected||(this.clearIframeMasking(),this.playerDiv&&(this.playerDiv.remove(),this.playerDiv=null),this.isInitialized=!1,delete this.dataset.playerInstanceId,this.initializePlayer())}connectedCallback(){if(this.renderPlaceholder(),document.readyState==="complete"){this.observeElement();return}V().then(()=>this.observeElement())}disconnectedCallback(){this.observer&&this.observer.unobserve(this),this.clearIframeMasking(),this.initVersion+=1,this.isInitialized=!1}clearIframeMasking(){this.iframeObserver&&(this.iframeObserver.disconnect(),this.iframeObserver=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null)}applyReservedHeight(e){const t=`${B()}px`;e.style.minHeight=t,this.style.minHeight=t}maskIframeUntilReady(e,t){if(!(e instanceof HTMLElement))return;this.clearIframeMasking();const a=e.style.colorScheme==="dark"?x:C,l=r=>{this.initVersion===t&&(r.style.opacity="1",r.style.pointerEvents="",r.style.removeProperty("transition"),r.style.removeProperty("background-color"),r.style.removeProperty("color-scheme"),r.removeAttribute(g),this.releaseReservedHeight(e),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null))},n=r=>{this.iframeRevealDelayTimeoutId!==null&&window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=window.setTimeout(()=>l(r),a)},s=r=>{r.getAttribute(g)!=="true"&&(r.setAttribute(g,"true"),r.style.opacity="0",r.style.pointerEvents="none",r.style.transition="opacity 160ms ease",r.style.backgroundColor="inherit",r.style.colorScheme="inherit",r.addEventListener("load",()=>n(r),{once:!0}),this.iframeRevealTimeoutId=window.setTimeout(()=>l(r),$))},d=e.querySelector("iframe");if(d instanceof HTMLIFrameElement){s(d);return}this.iframeObserver=new MutationObserver(()=>{const r=e.querySelector("iframe");r instanceof HTMLIFrameElement&&(s(r),this.iframeObserver&&(this.iframeObserver.disconnect(),this.iframeObserver=null))}),this.iframeObserver.observe(e,{childList:!0,subtree:!0})}applyLoadingTheme(e){if(!(e instanceof HTMLElement))return;const t=y()==="dark"?"dark":"light";e.style.backgroundColor=t==="dark"?m:p,e.style.colorScheme=t}renderPlaceholder(){if(this.querySelector(".podlove-player-container"))return;if(!document.getElementById(A)){const t=document.createElement("style");t.id=A,t.textContent=`
        podlove-player .podlove-player-container {
          width: 100%;
          max-width: 936px;
          min-height: ${k}px;
          margin: 0 auto;
          background-color: ${p};
        }
        @media (max-width: 768px) {
          podlove-player .podlove-player-container {
            max-width: 366px;
            min-height: ${M}px;
          }
        }
        podlove-player .podlove-player-container iframe {
          width: 100%;
          height: 100%;
          border: none;
          background-color: inherit;
          color-scheme: inherit;
        }
        @media (prefers-color-scheme: dark) {
          podlove-player .podlove-player-container {
            background-color: ${m};
          }
          podlove-player .podlove-player-container iframe {
            background-color: ${m};
            color-scheme: dark;
          }
        }
        html[data-bs-theme="dark"] podlove-player .podlove-player-container,
        html[data-theme="dark"] podlove-player .podlove-player-container,
        body[data-bs-theme="dark"] podlove-player .podlove-player-container,
        body[data-theme="dark"] podlove-player .podlove-player-container {
          background-color: ${m};
        }
        html[data-bs-theme="dark"] podlove-player .podlove-player-container iframe,
        html[data-theme="dark"] podlove-player .podlove-player-container iframe,
        body[data-bs-theme="dark"] podlove-player .podlove-player-container iframe,
        body[data-theme="dark"] podlove-player .podlove-player-container iframe {
          background-color: ${m};
          color-scheme: dark;
        }
        html[data-bs-theme="light"] podlove-player .podlove-player-container,
        html[data-theme="light"] podlove-player .podlove-player-container,
        body[data-bs-theme="light"] podlove-player .podlove-player-container,
        body[data-theme="light"] podlove-player .podlove-player-container {
          background-color: ${p};
        }
        html[data-bs-theme="light"] podlove-player .podlove-player-container iframe,
        html[data-theme="light"] podlove-player .podlove-player-container iframe,
        body[data-bs-theme="light"] podlove-player .podlove-player-container iframe,
        body[data-theme="light"] podlove-player .podlove-player-container iframe {
          background-color: ${p};
          color-scheme: light;
        }
      `,document.head.appendChild(t)}const e=document.createElement("div");e.classList.add("podlove-player-container"),this.applyLoadingTheme(e),this.applyReservedHeight(e),this.appendChild(e)}observeElement(){this.observer=z(),this.observer.observe(this)}initializePlayer(){if(this.isInitialized||!this.isConnected)return;const e=this.querySelector(".podlove-player-container");if(!e)return;e instanceof HTMLElement&&this.applyReservedHeight(e),this.applyLoadingTheme(e);let t=this.getAttribute("id");t||(t=`podlove-player-${Date.now()}`,this.setAttribute("id",t)),this.dataset.playerInstanceId||(R+=1,this.dataset.playerInstanceId=String(R));const a=`${t}-player-${this.dataset.playerInstanceId}`,l=this.getAttribute("data-url");if(!l)return;this.isInitialized=!0,this.initVersion+=1;const n=this.initVersion;let s=this.getAttribute("data-config")||"/api/audios/player_config/";s=q(s);const d=this.getAttribute("data-template");let r=this.getAttribute("data-embed")||"https://cdn.podlove.org/web-player/5.x/embed.js";const{hostname:u,port:S}=window.location,T=this.getOrCreatePlayerDiv(e,a,d);typeof podlovePlayer=="function"?(podlovePlayer(T,l,s),this.maskIframeUntilReady(e,n)):(u==="localhost"&&r.startsWith("/")&&(r=`http://localhost:${S}${r}`),F(r).then(()=>{if(!(n!==this.initVersion||!this.isConnected)){if(typeof podlovePlayer=="function"){podlovePlayer(T,l,s),this.maskIframeUntilReady(e,n);return}throw new Error("Podlove embed script did not register.")}}).catch(()=>{n===this.initVersion&&(this.isInitialized=!1,this.clearReservedHeight(e))}))}getOrCreatePlayerDiv(e,t,a){return this.playerDiv||(this.playerDiv=document.createElement("div"),this.playerDiv.classList.add("podlove-player-host")),e.contains(this.playerDiv)||e.appendChild(this.playerDiv),this.playerDiv.id=t,a!==null?this.playerDiv.setAttribute("data-template",a):this.playerDiv.removeAttribute("data-template"),this.playerDiv}releaseReservedHeight(e){e instanceof HTMLElement&&(e.style.minHeight="auto"),this.style.minHeight="auto"}clearReservedHeight(e){e instanceof HTMLElement&&e.style.removeProperty("min-height"),this.style.removeProperty("min-height")}}customElements.define("podlove-player",E);I=y();const _=new MutationObserver(()=>{const i=y();i!==I&&(I=i,document.querySelectorAll("podlove-player").forEach(o=>{o instanceof E&&o.reinitializePlayer()}))});_.observe(document.documentElement,{attributes:!0,attributeFilter:["data-bs-theme","data-theme"]});const L=()=>{document.body&&_.observe(document.body,{attributes:!0,attributeFilter:["data-bs-theme","data-theme"]})};document.body?L():window.addEventListener("DOMContentLoaded",L,{once:!0});
