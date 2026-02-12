var C=Object.defineProperty;var $=(i,t,e)=>t in i?C(i,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):i[t]=e;var c=(i,t,e)=>$(i,typeof t!="symbol"?t+"":t,e);let m=null,P=0,I=null,A=null,R=null;const _="data-podlove-embed",S="data-podlove-embed-loaded",T="data-podlove-embed-failed",k="podlove-player-styles",D="color_scheme",f="#1e293b",g="#ffffff",M=297,H=309,x=100,V=900,G=2500,y="data-cast-iframe-masked",p="data-cast-mask-active",q="#paging-area",F=".pagination a, .cast-pagination a",b="data-cast-paging-remask",z=1600;function N(){return document.readyState==="complete"?Promise.resolve():(I||(I=new Promise(i=>{window.addEventListener("load",()=>i(),{once:!0})})),I)}function K(){return A||(A=new IntersectionObserver((i,t)=>{i.forEach(e=>{if(!e.isIntersecting)return;const r=e.target;r instanceof w&&r.initializePlayer(),t.unobserve(r)})})),A}function B(i){return typeof podlovePlayer=="function"?Promise.resolve():m||(m=new Promise((t,e)=>{const r=document.querySelector(`script[${_}]`);if(r){if(r.getAttribute(S)==="true"&&typeof podlovePlayer=="function"){t();return}if(r.getAttribute(T)==="true")r.remove();else{r.addEventListener("load",()=>t(),{once:!0}),r.addEventListener("error",()=>{r.setAttribute(T,"true"),r.remove(),m=null,e(new Error("Failed to load Podlove embed script"))},{once:!0});return}}const a=document.createElement("script");a.src=i,a.async=!0,a.setAttribute(_,"true"),a.addEventListener("load",()=>{a.setAttribute(S,"true"),t()},{once:!0}),a.addEventListener("error",()=>{a.setAttribute(T,"true"),a.remove(),m=null,e(new Error("Failed to load Podlove embed script"))},{once:!0}),document.head.appendChild(a)}),m)}function E(){var t,e;const i=document.documentElement.getAttribute("data-bs-theme")||document.documentElement.getAttribute("data-theme")||((t=document.body)==null?void 0:t.getAttribute("data-bs-theme"))||((e=document.body)==null?void 0:e.getAttribute("data-theme"));return i==="light"||i==="dark"?i:typeof window.matchMedia=="function"&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":null}function U(i){const t=E();if(!t)return i;const e=i.indexOf("#"),r=e===-1?i:i.slice(0,e),a=e===-1?"":i.slice(e+1),n=r.indexOf("?"),l=n===-1?r:r.slice(0,n),s=n===-1?"":r.slice(n+1),u=new URLSearchParams(s);u.has(D)||u.set(D,t);const d=u.toString(),h=a?`#${a}`:"";return d?`${l}?${d}${h}`:`${l}${h}`}function Y(){return typeof window.matchMedia=="function"&&window.matchMedia("(max-width: 768px)").matches?H:M}function W(i,t){t.getAttribute(b)!=="true"&&(t.setAttribute(b,"true"),t.setAttribute(y,"true"),t.style.opacity="0",t.style.pointerEvents="none",t.style.backgroundColor="inherit",t.style.colorScheme="inherit",i.setAttribute(p,"true"),window.setTimeout(()=>{!t.isConnected||t.getAttribute(b)!=="true"||(t.removeAttribute(b),t.getAttribute(y)==="true"&&t.removeAttribute(y),t.style.removeProperty("opacity"),t.style.removeProperty("pointer-events"),t.style.removeProperty("background-color"),t.style.removeProperty("color-scheme"),i.querySelector(`iframe[${b}="true"]`)||i.removeAttribute(p))},z))}function X(i){const t=i.target;if(!(t instanceof Element)||!t.closest(F))return;const e=document.querySelector(q);e&&e.querySelectorAll(".podlove-player-container").forEach(r=>{r instanceof HTMLElement&&r.querySelectorAll("iframe").forEach(a=>{a instanceof HTMLIFrameElement&&a.getAttribute(y)!=="true"&&W(r,a)})})}class w extends HTMLElement{constructor(){super();c(this,"observer");c(this,"isInitialized");c(this,"playerDiv");c(this,"initVersion");c(this,"iframeObserver");c(this,"iframeRevealDelayTimeoutId");c(this,"iframeRevealTimeoutId");this.observer=null,this.isInitialized=!1,this.playerDiv=null,this.initVersion=0,this.iframeObserver=null,this.iframeRevealDelayTimeoutId=null,this.iframeRevealTimeoutId=null}reinitializePlayer(){!this.isInitialized||!this.isConnected||(this.clearIframeMasking(),this.playerDiv&&(this.playerDiv.remove(),this.playerDiv=null),this.isInitialized=!1,delete this.dataset.playerInstanceId,this.initializePlayer())}connectedCallback(){if(this.renderPlaceholder(),document.readyState==="complete"){this.observeElement();return}N().then(()=>this.observeElement())}disconnectedCallback(){this.observer&&this.observer.unobserve(this),this.clearIframeMasking(),this.initVersion+=1,this.isInitialized=!1}clearIframeMasking(){this.iframeObserver&&(this.iframeObserver.disconnect(),this.iframeObserver=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.querySelectorAll(".podlove-player-container").forEach(e=>{e instanceof HTMLElement&&e.removeAttribute(p)})}applyReservedHeight(e){const r=`${Y()}px`;e.style.minHeight=r,this.style.minHeight=r}maskIframeUntilReady(e,r){if(!(e instanceof HTMLElement))return;this.clearIframeMasking(),e.setAttribute(p,"true");const a=e.style.colorScheme==="dark"?V:x,n=new WeakSet;let l=null;const s=o=>{this.initVersion===r&&(!(o instanceof HTMLIFrameElement)||!e.contains(o)||(o.style.opacity="1",o.style.pointerEvents="",o.style.removeProperty("transition"),o.style.removeProperty("background-color"),o.style.removeProperty("color-scheme"),o.removeAttribute(y),e.removeAttribute(p),this.releaseReservedHeight(e),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null)))},u=o=>{this.iframeRevealDelayTimeoutId!==null&&window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=window.setTimeout(()=>s(o),a)},d=o=>{n.has(o)||(n.add(o),l=o,o.setAttribute(y,"true"),o.style.opacity="0",o.style.pointerEvents="none",o.style.transition="opacity 160ms ease",o.style.backgroundColor="inherit",o.style.colorScheme="inherit",o.addEventListener("load",()=>{l===o&&u(o)},{once:!0}),this.iframeRevealTimeoutId!==null&&window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=window.setTimeout(()=>s(l),G))},h=()=>{e.querySelectorAll("iframe").forEach(v=>{v instanceof HTMLIFrameElement&&d(v)})};h(),this.iframeObserver=new MutationObserver(()=>{h()}),this.iframeObserver.observe(e,{childList:!0,subtree:!0})}applyLoadingTheme(e){if(!(e instanceof HTMLElement))return;const r=E()==="dark"?"dark":"light";e.style.backgroundColor=r==="dark"?f:g,e.style.colorScheme=r}renderPlaceholder(){if(this.querySelector(".podlove-player-container"))return;if(!document.getElementById(k)){const r=document.createElement("style");r.id=k,r.textContent=`
        podlove-player .podlove-player-container {
          width: 100%;
          max-width: 936px;
          min-height: ${M}px;
          margin: 0 auto;
          background-color: ${g};
        }
        @media (max-width: 768px) {
          podlove-player .podlove-player-container {
            max-width: 366px;
            min-height: ${H}px;
          }
        }
        podlove-player .podlove-player-container iframe {
          width: 100%;
          height: 100%;
          border: none;
          background-color: inherit;
          color-scheme: inherit;
        }
        podlove-player .podlove-player-container[${p}="true"] iframe {
          opacity: 0 !important;
          pointer-events: none !important;
        }
        @media (prefers-color-scheme: dark) {
          podlove-player .podlove-player-container {
            background-color: ${f};
          }
          podlove-player .podlove-player-container iframe {
            background-color: ${f};
            color-scheme: dark;
          }
        }
        html[data-bs-theme="dark"] podlove-player .podlove-player-container,
        html[data-theme="dark"] podlove-player .podlove-player-container,
        body[data-bs-theme="dark"] podlove-player .podlove-player-container,
        body[data-theme="dark"] podlove-player .podlove-player-container {
          background-color: ${f};
        }
        html[data-bs-theme="dark"] podlove-player .podlove-player-container iframe,
        html[data-theme="dark"] podlove-player .podlove-player-container iframe,
        body[data-bs-theme="dark"] podlove-player .podlove-player-container iframe,
        body[data-theme="dark"] podlove-player .podlove-player-container iframe {
          background-color: ${f};
          color-scheme: dark;
        }
        html[data-bs-theme="light"] podlove-player .podlove-player-container,
        html[data-theme="light"] podlove-player .podlove-player-container,
        body[data-bs-theme="light"] podlove-player .podlove-player-container,
        body[data-theme="light"] podlove-player .podlove-player-container {
          background-color: ${g};
        }
        html[data-bs-theme="light"] podlove-player .podlove-player-container iframe,
        html[data-theme="light"] podlove-player .podlove-player-container iframe,
        body[data-bs-theme="light"] podlove-player .podlove-player-container iframe,
        body[data-theme="light"] podlove-player .podlove-player-container iframe {
          background-color: ${g};
          color-scheme: light;
        }
      `,document.head.appendChild(r)}const e=document.createElement("div");e.classList.add("podlove-player-container"),this.applyLoadingTheme(e),this.applyReservedHeight(e),this.appendChild(e)}observeElement(){this.observer=K(),this.observer.observe(this)}initializePlayer(){if(this.isInitialized||!this.isConnected)return;const e=this.querySelector(".podlove-player-container");if(!e)return;e instanceof HTMLElement&&this.applyReservedHeight(e),this.applyLoadingTheme(e);let r=this.getAttribute("id");r||(r=`podlove-player-${Date.now()}`,this.setAttribute("id",r)),this.dataset.playerInstanceId||(P+=1,this.dataset.playerInstanceId=String(P));const a=`${r}-player-${this.dataset.playerInstanceId}`,n=this.getAttribute("data-url");if(!n)return;this.isInitialized=!0,this.initVersion+=1;const l=this.initVersion;let s=this.getAttribute("data-config")||"/api/audios/player_config/";s=U(s);const u=this.getAttribute("data-template");let d=this.getAttribute("data-embed")||"https://cdn.podlove.org/web-player/5.x/embed.js";const{hostname:h,port:o}=window.location,v=this.getOrCreatePlayerDiv(e,a,u);typeof podlovePlayer=="function"?(this.maskIframeUntilReady(e,l),podlovePlayer(v,n,s),this.maskIframeUntilReady(e,l)):(h==="localhost"&&d.startsWith("/")&&(d=`http://localhost:${o}${d}`),B(d).then(()=>{if(!(l!==this.initVersion||!this.isConnected)){if(typeof podlovePlayer=="function"){this.maskIframeUntilReady(e,l),podlovePlayer(v,n,s),this.maskIframeUntilReady(e,l);return}throw new Error("Podlove embed script did not register.")}}).catch(()=>{l===this.initVersion&&(this.isInitialized=!1,this.clearReservedHeight(e))}))}getOrCreatePlayerDiv(e,r,a){return this.playerDiv||(this.playerDiv=document.createElement("div"),this.playerDiv.classList.add("podlove-player-host")),e.contains(this.playerDiv)||e.appendChild(this.playerDiv),this.playerDiv.id=r,a!==null?this.playerDiv.setAttribute("data-template",a):this.playerDiv.removeAttribute("data-template"),this.playerDiv}releaseReservedHeight(e){e instanceof HTMLElement&&(e.style.minHeight="auto"),this.style.minHeight="auto"}clearReservedHeight(e){e instanceof HTMLElement&&e.style.removeProperty("min-height"),this.style.removeProperty("min-height")}}customElements.define("podlove-player",w);R=E();const O=new MutationObserver(()=>{const i=E();i!==R&&(R=i,document.querySelectorAll("podlove-player").forEach(t=>{t instanceof w&&t.reinitializePlayer()}))});O.observe(document.documentElement,{attributes:!0,attributeFilter:["data-bs-theme","data-theme"]});const L=()=>{document.body&&O.observe(document.body,{attributes:!0,attributeFilter:["data-bs-theme","data-theme"]})};document.body?L():window.addEventListener("DOMContentLoaded",L,{once:!0});typeof document!="undefined"&&document.addEventListener("htmx:beforeRequest",X,!0);
