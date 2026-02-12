var _=Object.defineProperty;var C=(r,o,e)=>o in r?_(r,o,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[o]=e;var c=(r,o,e)=>C(r,typeof o!="symbol"?o+"":o,e);let u=null,k=0,y=null,v=null,b=null;const A="data-podlove-embed",w="data-podlove-embed-loaded",f="data-podlove-embed-failed",T="podlove-player-styles",D="color_scheme",m="#1e293b",p="#ffffff",M=100,O=700,$=2500,L="data-cast-iframe-masked";function x(){return document.readyState==="complete"?Promise.resolve():(y||(y=new Promise(r=>{window.addEventListener("load",()=>r(),{once:!0})})),y)}function H(){return v||(v=new IntersectionObserver((r,o)=>{r.forEach(e=>{if(!e.isIntersecting)return;const t=e.target;t instanceof E&&t.initializePlayer(),o.unobserve(t)})})),v}function z(r){return typeof podlovePlayer=="function"?Promise.resolve():u||(u=new Promise((o,e)=>{const t=document.querySelector(`script[${A}]`);if(t){if(t.getAttribute(w)==="true"&&typeof podlovePlayer=="function"){o();return}if(t.getAttribute(f)==="true")t.remove();else{t.addEventListener("load",()=>o(),{once:!0}),t.addEventListener("error",()=>{t.setAttribute(f,"true"),t.remove(),u=null,e(new Error("Failed to load Podlove embed script"))},{once:!0});return}}const n=document.createElement("script");n.src=r,n.async=!0,n.setAttribute(A,"true"),n.addEventListener("load",()=>{n.setAttribute(w,"true"),o()},{once:!0}),n.addEventListener("error",()=>{n.setAttribute(f,"true"),n.remove(),u=null,e(new Error("Failed to load Podlove embed script"))},{once:!0}),document.head.appendChild(n)}),u)}function F(r){const o=r.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);if(!o)return null;const[,e,t,n]=o;return[Number(e),Number(t),Number(n)]}function R(r){return r==="transparent"||r==="rgba(0, 0, 0, 0)"}function P(r){const o=F(r);if(!o)return null;const[e,t,n]=o;return(.2126*e+.7152*t+.0722*n)/255<.5}function V(){const r=[document.body,document.documentElement];for(const o of r){if(!o)continue;const e=window.getComputedStyle(o).backgroundColor;if(!e||R(e))continue;const t=P(e);if(t!==null)return t}return null}function g(){var e,t;const r=document.documentElement.getAttribute("data-bs-theme")||document.documentElement.getAttribute("data-theme")||((e=document.body)==null?void 0:e.getAttribute("data-bs-theme"))||((t=document.body)==null?void 0:t.getAttribute("data-theme"));if(r==="light"||r==="dark")return r;if(typeof window.matchMedia=="function"&&window.matchMedia("(prefers-color-scheme: dark)").matches)return"dark";const o=V();return o!==null?o?"dark":"light":null}function q(r){const o=[r,r.parentElement,document.body,document.documentElement];for(const e of o){if(!e)continue;const t=window.getComputedStyle(e).backgroundColor;if(t&&!R(t))return t}return p}function B(r){const o=g();if(!o)return r;const e=r.indexOf("#"),t=e===-1?r:r.slice(0,e),n=e===-1?"":r.slice(e+1),a=t.indexOf("?"),l=a===-1?t:t.slice(0,a),s=a===-1?"":t.slice(a+1),d=new URLSearchParams(s);d.has(D)||d.set(D,o);const i=d.toString(),h=n?`#${n}`:"";return i?`${l}?${i}${h}`:`${l}${h}`}class E extends HTMLElement{constructor(){super();c(this,"observer");c(this,"isInitialized");c(this,"playerDiv");c(this,"initVersion");c(this,"iframeObserver");c(this,"iframeRevealTimeoutId");this.observer=null,this.isInitialized=!1,this.playerDiv=null,this.initVersion=0,this.iframeObserver=null,this.iframeRevealTimeoutId=null}reinitializePlayer(){!this.isInitialized||!this.isConnected||(this.clearIframeMasking(),this.playerDiv&&(this.playerDiv.remove(),this.playerDiv=null),this.isInitialized=!1,delete this.dataset.playerInstanceId,this.initializePlayer())}connectedCallback(){if(this.renderPlaceholder(),document.readyState==="complete"){this.observeElement();return}x().then(()=>this.observeElement())}disconnectedCallback(){this.observer&&this.observer.unobserve(this),this.clearIframeMasking(),this.initVersion+=1,this.isInitialized=!1}clearIframeMasking(){this.iframeObserver&&(this.iframeObserver.disconnect(),this.iframeObserver=null),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null)}maskIframeUntilReady(e,t){if(!(e instanceof HTMLElement))return;this.clearIframeMasking();const n=e.style.colorScheme==="dark"?O:M,a=i=>{this.initVersion===t&&(i.style.opacity="1",i.style.pointerEvents="",i.style.removeProperty("transition"),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null))},l=i=>{window.setTimeout(()=>a(i),n)},s=i=>{i.getAttribute(L)!=="true"&&(i.setAttribute(L,"true"),i.style.opacity="0",i.style.pointerEvents="none",i.style.transition="opacity 160ms ease",i.style.backgroundColor="inherit",i.style.colorScheme="inherit",i.addEventListener("load",()=>l(i),{once:!0}),this.iframeRevealTimeoutId=window.setTimeout(()=>a(i),$))},d=e.querySelector("iframe");if(d instanceof HTMLIFrameElement){s(d);return}this.iframeObserver=new MutationObserver(()=>{const i=e.querySelector("iframe");i instanceof HTMLIFrameElement&&(s(i),this.iframeObserver&&(this.iframeObserver.disconnect(),this.iframeObserver=null))}),this.iframeObserver.observe(e,{childList:!0,subtree:!0})}applyLoadingTheme(e){if(!(e instanceof HTMLElement))return;const t=q(this),n=P(t);e.style.backgroundColor=t,e.style.colorScheme=n===!0?"dark":"light"}renderPlaceholder(){if(this.querySelector(".podlove-player-container"))return;if(!document.getElementById(T)){const t=document.createElement("style");t.id=T,t.textContent=`
        podlove-player .podlove-player-container {
          width: 100%;
          max-width: 936px;
          min-height: 300px;
          margin: 0 auto;
          background-color: ${p};
        }
        @media (max-width: 768px) {
          podlove-player .podlove-player-container {
            max-width: 366px;
            min-height: 500px;
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
      `,document.head.appendChild(t)}const e=document.createElement("div");e.classList.add("podlove-player-container"),this.applyLoadingTheme(e),this.appendChild(e)}observeElement(){this.observer=H(),this.observer.observe(this)}initializePlayer(){if(this.isInitialized||!this.isConnected)return;const e=this.querySelector(".podlove-player-container");if(!e)return;this.applyLoadingTheme(e);let t=this.getAttribute("id");t||(t=`podlove-player-${Date.now()}`,this.setAttribute("id",t)),this.dataset.playerInstanceId||(k+=1,this.dataset.playerInstanceId=String(k));const n=`${t}-player-${this.dataset.playerInstanceId}`,a=this.getAttribute("data-url");if(!a)return;this.isInitialized=!0,this.initVersion+=1;const l=this.initVersion;let s=this.getAttribute("data-config")||"/api/audios/player_config/";s=B(s);const d=this.getAttribute("data-template");let i=this.getAttribute("data-embed")||"https://cdn.podlove.org/web-player/5.x/embed.js";const{hostname:h,port:S}=window.location,I=this.getOrCreatePlayerDiv(e,n,d);typeof podlovePlayer=="function"?(podlovePlayer(I,a,s),this.maskIframeUntilReady(e,l),this.releaseReservedHeight(e)):(h==="localhost"&&i.startsWith("/")&&(i=`http://localhost:${S}${i}`),z(i).then(()=>{if(!(l!==this.initVersion||!this.isConnected)){if(typeof podlovePlayer=="function"){podlovePlayer(I,a,s),this.maskIframeUntilReady(e,l),this.releaseReservedHeight(e);return}throw new Error("Podlove embed script did not register.")}}).catch(()=>{l===this.initVersion&&(this.isInitialized=!1)}))}getOrCreatePlayerDiv(e,t,n){return this.playerDiv||(this.playerDiv=document.createElement("div"),this.playerDiv.classList.add("podlove-player-host")),e.contains(this.playerDiv)||e.appendChild(this.playerDiv),this.playerDiv.id=t,n!==null?this.playerDiv.setAttribute("data-template",n):this.playerDiv.removeAttribute("data-template"),this.playerDiv}releaseReservedHeight(e){e instanceof HTMLElement&&(e.style.minHeight="auto"),this.style.minHeight="auto"}}customElements.define("podlove-player",E);b=g();const G=new MutationObserver(()=>{const r=g();r!==b&&(b=r,document.querySelectorAll("podlove-player").forEach(o=>{o instanceof E&&o.reinitializePlayer()}))});G.observe(document.documentElement,{attributes:!0,attributeFilter:["data-bs-theme"]});
