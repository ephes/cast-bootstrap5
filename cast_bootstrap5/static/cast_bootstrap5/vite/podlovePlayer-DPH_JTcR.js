var O=Object.defineProperty;var C=(i,o,e)=>o in i?O(i,o,{enumerable:!0,configurable:!0,writable:!0,value:e}):i[o]=e;var c=(i,o,e)=>C(i,typeof o!="symbol"?o+"":o,e);let p=null,A=0,I=null,E=null,T=null;const w="data-podlove-embed",D="data-podlove-embed-loaded",g="data-podlove-embed-failed",k="podlove-player-styles",P="color_scheme",y="#1e293b",v="#ffffff",M=297,S=309,$=100,x=700,V=2500,_="data-cast-iframe-masked",f="data-cast-mask-active";function z(){return document.readyState==="complete"?Promise.resolve():(I||(I=new Promise(i=>{window.addEventListener("load",()=>i(),{once:!0})})),I)}function F(){return E||(E=new IntersectionObserver((i,o)=>{i.forEach(e=>{if(!e.isIntersecting)return;const t=e.target;t instanceof R&&t.initializePlayer(),o.unobserve(t)})})),E}function q(i){return typeof podlovePlayer=="function"?Promise.resolve():p||(p=new Promise((o,e)=>{const t=document.querySelector(`script[${w}]`);if(t){if(t.getAttribute(D)==="true"&&typeof podlovePlayer=="function"){o();return}if(t.getAttribute(g)==="true")t.remove();else{t.addEventListener("load",()=>o(),{once:!0}),t.addEventListener("error",()=>{t.setAttribute(g,"true"),t.remove(),p=null,e(new Error("Failed to load Podlove embed script"))},{once:!0});return}}const a=document.createElement("script");a.src=i,a.async=!0,a.setAttribute(w,"true"),a.addEventListener("load",()=>{a.setAttribute(D,"true"),o()},{once:!0}),a.addEventListener("error",()=>{a.setAttribute(g,"true"),a.remove(),p=null,e(new Error("Failed to load Podlove embed script"))},{once:!0}),document.head.appendChild(a)}),p)}function b(){var o,e;const i=document.documentElement.getAttribute("data-bs-theme")||document.documentElement.getAttribute("data-theme")||((o=document.body)==null?void 0:o.getAttribute("data-bs-theme"))||((e=document.body)==null?void 0:e.getAttribute("data-theme"));return i==="light"||i==="dark"?i:typeof window.matchMedia=="function"&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":null}function B(i){const o=b();if(!o)return i;const e=i.indexOf("#"),t=e===-1?i:i.slice(0,e),a=e===-1?"":i.slice(e+1),n=t.indexOf("?"),l=n===-1?t:t.slice(0,n),s=n===-1?"":t.slice(n+1),h=new URLSearchParams(s);h.has(P)||h.set(P,o);const d=h.toString(),m=a?`#${a}`:"";return d?`${l}?${d}${m}`:`${l}${m}`}function G(){return typeof window.matchMedia=="function"&&window.matchMedia("(max-width: 768px)").matches?S:M}class R extends HTMLElement{constructor(){super();c(this,"observer");c(this,"isInitialized");c(this,"playerDiv");c(this,"initVersion");c(this,"iframeObserver");c(this,"iframeRevealDelayTimeoutId");c(this,"iframeRevealTimeoutId");this.observer=null,this.isInitialized=!1,this.playerDiv=null,this.initVersion=0,this.iframeObserver=null,this.iframeRevealDelayTimeoutId=null,this.iframeRevealTimeoutId=null}reinitializePlayer(){!this.isInitialized||!this.isConnected||(this.clearIframeMasking(),this.playerDiv&&(this.playerDiv.remove(),this.playerDiv=null),this.isInitialized=!1,delete this.dataset.playerInstanceId,this.initializePlayer())}connectedCallback(){if(this.renderPlaceholder(),document.readyState==="complete"){this.observeElement();return}z().then(()=>this.observeElement())}disconnectedCallback(){this.observer&&this.observer.unobserve(this),this.clearIframeMasking(),this.initVersion+=1,this.isInitialized=!1}clearIframeMasking(){this.iframeObserver&&(this.iframeObserver.disconnect(),this.iframeObserver=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.querySelectorAll(".podlove-player-container").forEach(e=>{e instanceof HTMLElement&&e.removeAttribute(f)})}applyReservedHeight(e){const t=`${G()}px`;e.style.minHeight=t,this.style.minHeight=t}maskIframeUntilReady(e,t){if(!(e instanceof HTMLElement))return;this.clearIframeMasking(),e.setAttribute(f,"true");const a=e.style.colorScheme==="dark"?x:$,n=new WeakSet;let l=null;const s=r=>{this.initVersion===t&&(!(r instanceof HTMLIFrameElement)||!e.contains(r)||(r.style.opacity="1",r.style.pointerEvents="",r.style.removeProperty("transition"),r.style.removeProperty("background-color"),r.style.removeProperty("color-scheme"),r.removeAttribute(_),e.removeAttribute(f),this.releaseReservedHeight(e),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null)))},h=r=>{this.iframeRevealDelayTimeoutId!==null&&window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=window.setTimeout(()=>s(r),a)},d=r=>{n.has(r)||(n.add(r),l=r,r.setAttribute(_,"true"),r.style.opacity="0",r.style.pointerEvents="none",r.style.transition="opacity 160ms ease",r.style.backgroundColor="inherit",r.style.colorScheme="inherit",r.addEventListener("load",()=>{l===r&&h(r)},{once:!0}),this.iframeRevealTimeoutId!==null&&window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=window.setTimeout(()=>s(l),V))},m=()=>{e.querySelectorAll("iframe").forEach(u=>{u instanceof HTMLIFrameElement&&d(u)})};m(),this.iframeObserver=new MutationObserver(()=>{m()}),this.iframeObserver.observe(e,{childList:!0,subtree:!0})}applyLoadingTheme(e){if(!(e instanceof HTMLElement))return;const t=b()==="dark"?"dark":"light";e.style.backgroundColor=t==="dark"?y:v,e.style.colorScheme=t}renderPlaceholder(){if(this.querySelector(".podlove-player-container"))return;if(!document.getElementById(k)){const t=document.createElement("style");t.id=k,t.textContent=`
        podlove-player .podlove-player-container {
          width: 100%;
          max-width: 936px;
          min-height: ${M}px;
          margin: 0 auto;
          background-color: ${v};
        }
        @media (max-width: 768px) {
          podlove-player .podlove-player-container {
            max-width: 366px;
            min-height: ${S}px;
          }
        }
        podlove-player .podlove-player-container iframe {
          width: 100%;
          height: 100%;
          border: none;
          background-color: inherit;
          color-scheme: inherit;
        }
        podlove-player .podlove-player-container[${f}="true"] iframe {
          opacity: 0 !important;
          pointer-events: none !important;
        }
        @media (prefers-color-scheme: dark) {
          podlove-player .podlove-player-container {
            background-color: ${y};
          }
          podlove-player .podlove-player-container iframe {
            background-color: ${y};
            color-scheme: dark;
          }
        }
        html[data-bs-theme="dark"] podlove-player .podlove-player-container,
        html[data-theme="dark"] podlove-player .podlove-player-container,
        body[data-bs-theme="dark"] podlove-player .podlove-player-container,
        body[data-theme="dark"] podlove-player .podlove-player-container {
          background-color: ${y};
        }
        html[data-bs-theme="dark"] podlove-player .podlove-player-container iframe,
        html[data-theme="dark"] podlove-player .podlove-player-container iframe,
        body[data-bs-theme="dark"] podlove-player .podlove-player-container iframe,
        body[data-theme="dark"] podlove-player .podlove-player-container iframe {
          background-color: ${y};
          color-scheme: dark;
        }
        html[data-bs-theme="light"] podlove-player .podlove-player-container,
        html[data-theme="light"] podlove-player .podlove-player-container,
        body[data-bs-theme="light"] podlove-player .podlove-player-container,
        body[data-theme="light"] podlove-player .podlove-player-container {
          background-color: ${v};
        }
        html[data-bs-theme="light"] podlove-player .podlove-player-container iframe,
        html[data-theme="light"] podlove-player .podlove-player-container iframe,
        body[data-bs-theme="light"] podlove-player .podlove-player-container iframe,
        body[data-theme="light"] podlove-player .podlove-player-container iframe {
          background-color: ${v};
          color-scheme: light;
        }
      `,document.head.appendChild(t)}const e=document.createElement("div");e.classList.add("podlove-player-container"),this.applyLoadingTheme(e),this.applyReservedHeight(e),this.appendChild(e)}observeElement(){this.observer=F(),this.observer.observe(this)}initializePlayer(){if(this.isInitialized||!this.isConnected)return;const e=this.querySelector(".podlove-player-container");if(!e)return;e instanceof HTMLElement&&this.applyReservedHeight(e),this.applyLoadingTheme(e);let t=this.getAttribute("id");t||(t=`podlove-player-${Date.now()}`,this.setAttribute("id",t)),this.dataset.playerInstanceId||(A+=1,this.dataset.playerInstanceId=String(A));const a=`${t}-player-${this.dataset.playerInstanceId}`,n=this.getAttribute("data-url");if(!n)return;this.isInitialized=!0,this.initVersion+=1;const l=this.initVersion;let s=this.getAttribute("data-config")||"/api/audios/player_config/";s=B(s);const h=this.getAttribute("data-template");let d=this.getAttribute("data-embed")||"https://cdn.podlove.org/web-player/5.x/embed.js";const{hostname:m,port:r}=window.location,u=this.getOrCreatePlayerDiv(e,a,h);typeof podlovePlayer=="function"?(this.maskIframeUntilReady(e,l),podlovePlayer(u,n,s),this.maskIframeUntilReady(e,l)):(m==="localhost"&&d.startsWith("/")&&(d=`http://localhost:${r}${d}`),q(d).then(()=>{if(!(l!==this.initVersion||!this.isConnected)){if(typeof podlovePlayer=="function"){this.maskIframeUntilReady(e,l),podlovePlayer(u,n,s),this.maskIframeUntilReady(e,l);return}throw new Error("Podlove embed script did not register.")}}).catch(()=>{l===this.initVersion&&(this.isInitialized=!1,this.clearReservedHeight(e))}))}getOrCreatePlayerDiv(e,t,a){return this.playerDiv||(this.playerDiv=document.createElement("div"),this.playerDiv.classList.add("podlove-player-host")),e.contains(this.playerDiv)||e.appendChild(this.playerDiv),this.playerDiv.id=t,a!==null?this.playerDiv.setAttribute("data-template",a):this.playerDiv.removeAttribute("data-template"),this.playerDiv}releaseReservedHeight(e){e instanceof HTMLElement&&(e.style.minHeight="auto"),this.style.minHeight="auto"}clearReservedHeight(e){e instanceof HTMLElement&&e.style.removeProperty("min-height"),this.style.removeProperty("min-height")}}customElements.define("podlove-player",R);T=b();const H=new MutationObserver(()=>{const i=b();i!==T&&(T=i,document.querySelectorAll("podlove-player").forEach(o=>{o instanceof R&&o.reinitializePlayer()}))});H.observe(document.documentElement,{attributes:!0,attributeFilter:["data-bs-theme","data-theme"]});const L=()=>{document.body&&H.observe(document.body,{attributes:!0,attributeFilter:["data-bs-theme","data-theme"]})};document.body?L():window.addEventListener("DOMContentLoaded",L,{once:!0});
