var N=Object.defineProperty;var K=(a,o,e)=>o in a?N(a,o,{enumerable:!0,configurable:!0,writable:!0,value:e}):a[o]=e;var d=(a,o,e)=>K(a,typeof o!="symbol"?o+"":o,e);let p=null,M=0,_=null,w=null,L=null;const P="data-podlove-embed",C="data-podlove-embed-loaded",k="data-podlove-embed-failed",H="podlove-player-styles",O="color_scheme",g="#1e293b",E="#ffffff",q=297,F=309,B=100,U=900,Y=2500,W=8e3,v="data-cast-iframe-masked",y="data-cast-mask-active",I="podlove-player-reveal-shield",X=80,j=180,x=120,V="#paging-area",J=".pagination a, .cast-pagination a",m="data-cast-paging-remask",Q=1600,Z="data-cast-paging-mask-active",ee=50;function te(){return document.readyState==="complete"?Promise.resolve():(_||(_=new Promise(a=>{window.addEventListener("load",()=>a(),{once:!0})})),_)}const A="podlove-player-facade-btn",T="podlove-player-facade-loading";function oe(){return w||(w=new IntersectionObserver((a,o)=>{a.forEach(e=>{if(!e.isIntersecting)return;const t=e.target;o.unobserve(t),t instanceof D&&t.showFacade()})})),w}function re(a){return typeof podlovePlayer=="function"?Promise.resolve():p||(p=new Promise((o,e)=>{const t=document.querySelector(`script[${P}]`);if(t){if(t.getAttribute(C)==="true"&&typeof podlovePlayer=="function"){o();return}if(t.getAttribute(k)==="true")t.remove();else{t.addEventListener("load",()=>o(),{once:!0}),t.addEventListener("error",()=>{t.setAttribute(k,"true"),t.remove(),p=null,e(new Error("Failed to load Podlove embed script"))},{once:!0});return}}const r=document.createElement("script");r.src=a,r.async=!0,r.setAttribute(P,"true"),r.addEventListener("load",()=>{r.setAttribute(C,"true"),o()},{once:!0}),r.addEventListener("error",()=>{r.setAttribute(k,"true"),r.remove(),p=null,e(new Error("Failed to load Podlove embed script"))},{once:!0}),document.head.appendChild(r)}),p)}function R(){var o,e;const a=document.documentElement.getAttribute("data-bs-theme")||document.documentElement.getAttribute("data-theme")||((o=document.body)==null?void 0:o.getAttribute("data-bs-theme"))||((e=document.body)==null?void 0:e.getAttribute("data-theme"));return a==="light"||a==="dark"?a:typeof window.matchMedia=="function"&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":null}function ie(a){const o=R();if(!o)return a;const e=a.indexOf("#"),t=e===-1?a:a.slice(0,e),r=e===-1?"":a.slice(e+1),l=t.indexOf("?"),n=l===-1?t:t.slice(0,l),c=l===-1?"":t.slice(l+1),u=new URLSearchParams(c);u.has(O)||u.set(O,o);const s=u.toString(),h=r?`#${r}`:"";return s?`${n}?${s}${h}`:`${n}${h}`}function ae(){return typeof window.matchMedia=="function"&&window.matchMedia("(max-width: 768px)").matches?F:q}function le(a,o){o.getAttribute(m)!=="true"&&(o.setAttribute(m,"true"),o.setAttribute(v,"true"),o.style.opacity="0",o.style.pointerEvents="none",o.style.backgroundColor="inherit",o.style.colorScheme="inherit",a.setAttribute(y,"true"),window.setTimeout(()=>{!o.isConnected||o.getAttribute(m)!=="true"||(o.removeAttribute(m),o.getAttribute(v)==="true"&&o.removeAttribute(v),o.style.opacity="1",o.style.pointerEvents="",o.style.removeProperty("background-color"),o.style.removeProperty("color-scheme"),a.querySelector(`iframe[${m}="true"]`)||a.removeAttribute(y))},Q))}function ne(a){const o=a.target;if(!(o instanceof Element)||!o.closest(J))return;const e=document.querySelector(V);e&&e.querySelectorAll(".podlove-player-container").forEach(t=>{t instanceof HTMLElement&&t.querySelectorAll("iframe").forEach(r=>{r instanceof HTMLIFrameElement&&r.getAttribute(v)!=="true"&&le(t,r)})})}class D extends HTMLElement{constructor(){super();d(this,"observer");d(this,"isInitialized");d(this,"playerDiv");d(this,"initVersion");d(this,"iframeObserver");d(this,"iframeRevealDelayTimeoutId");d(this,"iframeRevealTimeoutId");d(this,"iframeRevealShieldTimeoutId");this.observer=null,this.isInitialized=!1,this.playerDiv=null,this.initVersion=0,this.iframeObserver=null,this.iframeRevealDelayTimeoutId=null,this.iframeRevealTimeoutId=null,this.iframeRevealShieldTimeoutId=null}reinitializePlayer(){!this.isInitialized||!this.isConnected||(this.clearIframeMasking(),this.playerDiv&&(this.playerDiv.remove(),this.playerDiv=null),this.isInitialized=!1,delete this.dataset.playerInstanceId,this.initializePlayer())}connectedCallback(){if(this.renderPlaceholder(),document.readyState==="complete"){this.observeElement();return}te().then(()=>this.observeElement())}disconnectedCallback(){var e,t;this.observer&&this.observer.unobserve(this),this.clearIframeMasking(),(e=this.querySelector(`.${T}`))==null||e.remove(),(t=this.querySelector(`.${A}`))==null||t.remove(),this.initVersion+=1,this.isInitialized=!1}clearIframeMasking(){this.iframeObserver&&(this.iframeObserver.disconnect(),this.iframeObserver=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.iframeRevealShieldTimeoutId!==null&&(window.clearTimeout(this.iframeRevealShieldTimeoutId),this.iframeRevealShieldTimeoutId=null),this.querySelectorAll(".podlove-player-container").forEach(e=>{e instanceof HTMLElement&&(e.removeAttribute(y),e.querySelectorAll(`.${I}`).forEach(t=>{t.remove()}))})}applyReservedHeight(e){const t=`${ae()}px`;e.style.minHeight=t,this.style.minHeight=t}getOrCreateRevealShield(e){const t=e.querySelector(`.${I}`);if(t instanceof HTMLDivElement)return t.style.backgroundColor=e.style.backgroundColor||window.getComputedStyle(e).backgroundColor,t.style.opacity="1",t;const r=document.createElement("div");return r.classList.add(I),r.style.backgroundColor=e.style.backgroundColor||window.getComputedStyle(e).backgroundColor,r.style.opacity="1",e.appendChild(r),r}scheduleRevealShieldRelease(e,t){this.iframeRevealShieldTimeoutId!==null&&(window.clearTimeout(this.iframeRevealShieldTimeoutId),this.iframeRevealShieldTimeoutId=null);const r=this.getOrCreateRevealShield(e),l=e.style.colorScheme==="dark"?j:X;this.iframeRevealShieldTimeoutId=window.setTimeout(()=>{this.initVersion===t&&(r.style.opacity="0",this.iframeRevealShieldTimeoutId=window.setTimeout(()=>{this.initVersion===t&&(r.remove(),this.releaseReservedHeight(e),this.iframeRevealShieldTimeoutId=null)},x))},l)}maskIframeUntilReady(e,t){if(!(e instanceof HTMLElement))return;this.clearIframeMasking(),e.setAttribute(y,"true");const r=e.style.colorScheme==="dark"?U:B,l=new WeakSet;let n=null;const c=()=>{const i=document.querySelector(V);return(i==null?void 0:i.getAttribute(Z))==="true"},u=i=>i.getAttribute(m)==="true"?!0:c(),s=i=>{if(this.initVersion===t&&!(!(i instanceof HTMLIFrameElement)||!e.contains(i))){if(u(i)){this.iframeRevealDelayTimeoutId!==null&&window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=window.setTimeout(()=>s(i),ee);return}i.style.opacity="1",i.style.pointerEvents="",i.style.removeProperty("transition"),i.style.removeProperty("background-color"),i.style.removeProperty("color-scheme"),i.removeAttribute(v),e.removeAttribute(y),this.scheduleRevealShieldRelease(e,t),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null)}},h=i=>{this.iframeRevealDelayTimeoutId!==null&&window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=window.setTimeout(()=>s(i),r)},S=i=>{if(l.has(i))return;l.add(i),n=i,this.getOrCreateRevealShield(e);const b=e.querySelector(`.${T}`);b&&b.remove(),i.setAttribute(v,"true"),i.style.opacity="0",i.style.pointerEvents="none",i.style.transition="opacity 160ms ease",i.style.backgroundColor="inherit",i.style.colorScheme="inherit",i.addEventListener("load",()=>{n===i&&h(i)},{once:!0}),this.iframeRevealTimeoutId!==null&&window.clearTimeout(this.iframeRevealTimeoutId);const z=e.style.colorScheme==="dark"?W:Y;this.iframeRevealTimeoutId=window.setTimeout(()=>s(n),z)},f=()=>{e.querySelectorAll("iframe").forEach(b=>{b instanceof HTMLIFrameElement&&S(b)})};f(),this.iframeObserver=new MutationObserver(()=>{f()}),this.iframeObserver.observe(e,{childList:!0,subtree:!0})}applyLoadingTheme(e){if(!(e instanceof HTMLElement))return;const t=R()==="dark"?"dark":"light";e.style.backgroundColor=t==="dark"?g:E,e.style.colorScheme=t}renderPlaceholder(){if(this.querySelector(".podlove-player-container"))return;if(!document.getElementById(H)){const t=document.createElement("style");t.id=H,t.textContent=`
        podlove-player .podlove-player-container {
          width: 100%;
          max-width: 936px;
          min-height: ${q}px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
          background-color: ${E};
        }
        @media (max-width: 768px) {
          podlove-player .podlove-player-container {
            max-width: 366px;
            min-height: ${F}px;
          }
        }
        podlove-player .podlove-player-container iframe {
          width: 100%;
          height: 100%;
          border: none;
          background-color: inherit;
          color-scheme: inherit;
        }
        podlove-player .podlove-player-host {
          position: relative;
          z-index: 1;
        }
        podlove-player .podlove-player-facade-btn {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 68px;
          height: 68px;
          border-radius: 50%;
          border: none;
          background: rgba(0, 0, 0, 0.6);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
          transition: transform 0.15s ease, background-color 0.15s ease;
        }
        podlove-player .podlove-player-facade-btn:hover {
          transform: translate(-50%, -50%) scale(1.1);
          background: rgba(0, 0, 0, 0.8);
        }
        podlove-player .podlove-player-facade-btn:focus-visible {
          outline: 3px solid #6aa5ff;
          outline-offset: 3px;
        }
        podlove-player .podlove-player-facade-loading {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 40px;
          height: 40px;
          margin: -20px 0 0 -20px;
          border: 4px solid rgba(0, 0, 0, 0.15);
          border-top-color: #1a1a1a;
          border-radius: 50%;
          animation: podlove-facade-spin 0.8s linear infinite;
          z-index: 1;
        }
        @keyframes podlove-facade-spin {
          to { transform: rotate(360deg); }
        }
        podlove-player .podlove-player-container .${I} {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 2;
          opacity: 1;
          transition: opacity ${x}ms ease;
        }
        podlove-player .podlove-player-container[${y}="true"] iframe {
          opacity: 0 !important;
          pointer-events: none !important;
        }
        @media (prefers-color-scheme: dark) {
          podlove-player .podlove-player-container {
            background-color: ${g};
          }
          podlove-player .podlove-player-container iframe {
            background-color: ${g};
            color-scheme: dark;
          }
          podlove-player .podlove-player-facade-loading {
            border-color: rgba(255, 255, 255, 0.15);
            border-top-color: #ffffff;
          }
        }
        html[data-bs-theme="dark"] podlove-player .podlove-player-container,
        html[data-theme="dark"] podlove-player .podlove-player-container,
        body[data-bs-theme="dark"] podlove-player .podlove-player-container,
        body[data-theme="dark"] podlove-player .podlove-player-container {
          background-color: ${g};
        }
        html[data-bs-theme="dark"] podlove-player .podlove-player-facade-loading,
        html[data-theme="dark"] podlove-player .podlove-player-facade-loading,
        body[data-bs-theme="dark"] podlove-player .podlove-player-facade-loading,
        body[data-theme="dark"] podlove-player .podlove-player-facade-loading {
          border-color: rgba(255, 255, 255, 0.15);
          border-top-color: #ffffff;
        }
        html[data-bs-theme="dark"] podlove-player .podlove-player-container iframe,
        html[data-theme="dark"] podlove-player .podlove-player-container iframe,
        body[data-bs-theme="dark"] podlove-player .podlove-player-container iframe,
        body[data-theme="dark"] podlove-player .podlove-player-container iframe {
          background-color: ${g};
          color-scheme: dark;
        }
        html[data-bs-theme="light"] podlove-player .podlove-player-container,
        html[data-theme="light"] podlove-player .podlove-player-container,
        body[data-bs-theme="light"] podlove-player .podlove-player-container,
        body[data-theme="light"] podlove-player .podlove-player-container {
          background-color: ${E};
        }
        html[data-bs-theme="light"] podlove-player .podlove-player-container iframe,
        html[data-theme="light"] podlove-player .podlove-player-container iframe,
        body[data-bs-theme="light"] podlove-player .podlove-player-container iframe,
        body[data-theme="light"] podlove-player .podlove-player-container iframe {
          background-color: ${E};
          color-scheme: light;
        }
      `,document.head.appendChild(t)}const e=document.createElement("div");e.classList.add("podlove-player-container"),this.applyLoadingTheme(e),this.applyReservedHeight(e),this.appendChild(e)}observeElement(){this.observer=oe(),this.observer.observe(this)}showFacade(){if(this.isInitialized||!this.getAttribute("data-url"))return;const e=this.querySelector(".podlove-player-container");if(!e||e.querySelector(`.${A}`))return;const t=document.createElement("button");t.type="button",t.className=A,t.setAttribute("aria-label","Play"),t.innerHTML='<svg viewBox="0 0 24 24" width="28" height="28" fill="white" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',t.addEventListener("click",()=>this.handleFacadeClick(),{once:!0}),e.appendChild(t)}handleFacadeClick(){if(this.isInitialized||!this.isConnected||!this.getAttribute("data-url"))return;const e=this.querySelector(".podlove-player-container");if(!e)return;const t=e.querySelector(`.${A}`);t&&t.remove();const r=document.createElement("div");r.className=T,e.appendChild(r),this.initializePlayer()}initializePlayer(){if(this.isInitialized||!this.isConnected)return;const e=this.querySelector(".podlove-player-container");if(!e)return;e instanceof HTMLElement&&this.applyReservedHeight(e),this.applyLoadingTheme(e);let t=this.getAttribute("id");t||(t=`podlove-player-${Date.now()}`,this.setAttribute("id",t)),this.dataset.playerInstanceId||(M+=1,this.dataset.playerInstanceId=String(M));const r=`${t}-player-${this.dataset.playerInstanceId}`,l=this.getAttribute("data-url");if(!l)return;this.isInitialized=!0,this.initVersion+=1;const n=this.initVersion;let c=this.getAttribute("data-config")||"/api/audios/player_config/";c=ie(c);const u=this.getAttribute("data-template");let s=this.getAttribute("data-embed")||"https://cdn.podlove.org/web-player/5.x/embed.js";const{hostname:h,port:S}=window.location,f=this.getOrCreatePlayerDiv(e,r,u);typeof podlovePlayer=="function"?(this.maskIframeUntilReady(e,n),podlovePlayer(f,l,c),this.maskIframeUntilReady(e,n)):(h==="localhost"&&s.startsWith("/")&&(s=`http://localhost:${S}${s}`),re(s).then(()=>{if(!(n!==this.initVersion||!this.isConnected)){if(typeof podlovePlayer=="function"){this.maskIframeUntilReady(e,n),podlovePlayer(f,l,c),this.maskIframeUntilReady(e,n);return}throw new Error("Podlove embed script did not register.")}}).catch(()=>{if(n===this.initVersion){this.isInitialized=!1,this.clearReservedHeight(e);const i=this.querySelector(`.${T}`);i&&i.remove()}}))}getOrCreatePlayerDiv(e,t,r){return this.playerDiv||(this.playerDiv=document.createElement("div"),this.playerDiv.classList.add("podlove-player-host")),e.contains(this.playerDiv)||e.appendChild(this.playerDiv),this.playerDiv.id=t,r!==null?this.playerDiv.setAttribute("data-template",r):this.playerDiv.removeAttribute("data-template"),this.playerDiv}releaseReservedHeight(e){e instanceof HTMLElement&&(e.style.minHeight="auto"),this.style.minHeight="auto"}clearReservedHeight(e){e instanceof HTMLElement&&e.style.removeProperty("min-height"),this.style.removeProperty("min-height")}}customElements.define("podlove-player",D);L=R();const G=new MutationObserver(()=>{const a=R();a!==L&&(L=a,document.querySelectorAll("podlove-player").forEach(o=>{o instanceof D&&o.reinitializePlayer()}))});G.observe(document.documentElement,{attributes:!0,attributeFilter:["data-bs-theme","data-theme"]});const $=()=>{document.body&&G.observe(document.body,{attributes:!0,attributeFilter:["data-bs-theme","data-theme"]})};document.body?$():window.addEventListener("DOMContentLoaded",$,{once:!0});typeof document!="undefined"&&document.addEventListener("htmx:beforeRequest",ne,!0);
