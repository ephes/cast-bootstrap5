var U=Object.defineProperty;var W=(a,r,e)=>r in a?U(a,r,{enumerable:!0,configurable:!0,writable:!0,value:e}):a[r]=e;var d=(a,r,e)=>W(a,typeof r!="symbol"?r+"":r,e);let y=null,H=0,R=null,L=null,M=null;const x="data-podlove-embed",O="data-podlove-embed-loaded",_="data-podlove-embed-failed",q="podlove-player-styles",$="color_scheme",X="#292524",j="#ffffff",G=297,N=312,J=100,Q=900,Z=2500,ee=8e3,b="data-cast-iframe-masked",f="data-cast-mask-active",I="podlove-player-reveal-shield",te=80,oe=180,F=120,B="#paging-area",re=".pagination a, .cast-pagination a",v="data-cast-paging-remask",ie=1600,ae="data-cast-paging-mask-active",le=50;function ne(){return document.readyState==="complete"?Promise.resolve():(R||(R=new Promise(a=>{window.addEventListener("load",()=>a(),{once:!0})})),R)}function w(a){const r=a?"--cast-bg-alt":"--cast-surface",e=a?X:j;return getComputedStyle(document.documentElement).getPropertyValue(r).trim()||e}const S="podlove-player-facade-btn",E="podlove-player-facade-loading";function se(){return L||(L=new IntersectionObserver((a,r)=>{a.forEach(e=>{if(!e.isIntersecting)return;const t=e.target;r.unobserve(t),t instanceof k&&t.showFacade()})})),L}function de(a){return typeof podlovePlayer=="function"?Promise.resolve():y||(y=new Promise((r,e)=>{const t=document.querySelector(`script[${x}]`);if(t){if(t.getAttribute(O)==="true"&&typeof podlovePlayer=="function"){r();return}if(t.getAttribute(_)==="true")t.remove();else{t.addEventListener("load",()=>r(),{once:!0}),t.addEventListener("error",()=>{t.setAttribute(_,"true"),t.remove(),y=null,e(new Error("Failed to load Podlove embed script"))},{once:!0});return}}const o=document.createElement("script");o.src=a,o.async=!0,o.setAttribute(x,"true"),o.addEventListener("load",()=>{o.setAttribute(O,"true"),r()},{once:!0}),o.addEventListener("error",()=>{o.setAttribute(_,"true"),o.remove(),y=null,e(new Error("Failed to load Podlove embed script"))},{once:!0}),document.head.appendChild(o)}),y)}function A(){var r,e;const a=document.documentElement.getAttribute("data-bs-theme")||document.documentElement.getAttribute("data-theme")||((r=document.body)==null?void 0:r.getAttribute("data-bs-theme"))||((e=document.body)==null?void 0:e.getAttribute("data-theme"));return a==="light"||a==="dark"?a:typeof window.matchMedia=="function"&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":null}function ce(a){const r=A();if(!r)return a;const e=a.indexOf("#"),t=e===-1?a:a.slice(0,e),o=e===-1?"":a.slice(e+1),l=t.indexOf("?"),n=l===-1?t:t.slice(0,l),c=l===-1?"":t.slice(l+1),h=new URLSearchParams(c);h.has($)||h.set($,r);const s=h.toString(),m=o?`#${o}`:"";return s?`${n}?${s}${m}`:`${n}${m}`}function z(){return typeof window.matchMedia=="function"&&window.matchMedia("(max-width: 768px)").matches?N:G}function ue(a,r){r.getAttribute(v)!=="true"&&(r.setAttribute(v,"true"),r.setAttribute(b,"true"),r.style.opacity="0",r.style.pointerEvents="none",r.style.backgroundColor="inherit",r.style.colorScheme="inherit",a.setAttribute(f,"true"),window.setTimeout(()=>{!r.isConnected||r.getAttribute(v)!=="true"||(r.removeAttribute(v),r.getAttribute(b)==="true"&&r.removeAttribute(b),r.style.opacity="1",r.style.pointerEvents="",r.style.removeProperty("background-color"),r.style.removeProperty("color-scheme"),a.querySelector(`iframe[${v}="true"]`)||a.removeAttribute(f))},ie))}function pe(a){const r=a.target;if(!(r instanceof Element)||!r.closest(re))return;const e=document.querySelector(B);e&&e.querySelectorAll(".podlove-player-container").forEach(t=>{t instanceof HTMLElement&&t.querySelectorAll("iframe").forEach(o=>{o instanceof HTMLIFrameElement&&o.getAttribute(b)!=="true"&&ue(t,o)})})}class k extends HTMLElement{constructor(){super();d(this,"observer");d(this,"isInitialized");d(this,"playerDiv");d(this,"initVersion");d(this,"iframeObserver");d(this,"iframeRevealDelayTimeoutId");d(this,"iframeRevealTimeoutId");d(this,"iframeRevealShieldTimeoutId");d(this,"facadeAbortController");this.observer=null,this.isInitialized=!1,this.playerDiv=null,this.initVersion=0,this.iframeObserver=null,this.iframeRevealDelayTimeoutId=null,this.iframeRevealTimeoutId=null,this.iframeRevealShieldTimeoutId=null,this.facadeAbortController=null}isFacadeMode(){return this.getAttribute("data-load-mode")==="facade"}reinitializePlayer(){if(!this.isInitialized||!this.isConnected)return;this.clearIframeMasking(),this.playerDiv&&(this.playerDiv.remove(),this.playerDiv=null);const e=this.querySelector(".podlove-player-container");e instanceof HTMLElement&&e.style.removeProperty("min-height"),this.style.removeProperty("min-height"),this.isInitialized=!1,delete this.dataset.playerInstanceId,this.initializePlayer()}connectedCallback(){if(this.renderPlaceholder(),this.isFacadeMode()){this.setupFacadeInteraction();return}if(document.readyState==="complete"){this.observeElement();return}ne().then(()=>this.observeElement())}disconnectedCallback(){var o,l;this.observer&&this.observer.unobserve(this),this.facadeAbortController&&(this.facadeAbortController.abort(),this.facadeAbortController=null),this.clearIframeMasking(),(o=this.querySelector(`.${E}`))==null||o.remove(),(l=this.querySelector(`.${S}`))==null||l.remove();const e=this.querySelector(".podlove-facade-inner");e instanceof HTMLElement&&(e.style.removeProperty("position"),e.style.removeProperty("inset"),e.style.removeProperty("z-index"),e.style.removeProperty("padding"));const t=this.querySelector(".podlove-player-container");t instanceof HTMLElement&&(this.isFacadeMode()&&t.classList.add("podlove-facade"),t.classList.remove("is-loading"),t.style.removeProperty("min-height")),this.style.removeProperty("min-height"),this.initVersion+=1,this.isInitialized=!1}clearIframeMasking(){this.iframeObserver&&(this.iframeObserver.disconnect(),this.iframeObserver=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.iframeRevealShieldTimeoutId!==null&&(window.clearTimeout(this.iframeRevealShieldTimeoutId),this.iframeRevealShieldTimeoutId=null),this.querySelectorAll(".podlove-player-container").forEach(e=>{e instanceof HTMLElement&&(e.removeAttribute(f),e.querySelectorAll(`.${I}`).forEach(t=>{t.remove()}))})}applyReservedHeight(e){const t=`${z()}px`;e.style.minHeight=t,this.style.minHeight=t}getOrCreateRevealShield(e){const t=e.querySelector(`.${I}`);if(t instanceof HTMLDivElement)return t.style.backgroundColor=e.style.backgroundColor||window.getComputedStyle(e).backgroundColor,t.style.opacity="1",t;const o=document.createElement("div");return o.classList.add(I),o.style.backgroundColor=e.style.backgroundColor||window.getComputedStyle(e).backgroundColor,o.style.opacity="1",e.appendChild(o),o}scheduleRevealShieldRelease(e,t){this.iframeRevealShieldTimeoutId!==null&&(window.clearTimeout(this.iframeRevealShieldTimeoutId),this.iframeRevealShieldTimeoutId=null);const o=this.getOrCreateRevealShield(e),l=e.style.colorScheme==="dark"?oe:te;this.iframeRevealShieldTimeoutId=window.setTimeout(()=>{this.initVersion===t&&(o.style.opacity="0",this.iframeRevealShieldTimeoutId=window.setTimeout(()=>{this.initVersion===t&&(o.remove(),this.releaseReservedHeight(e),this.iframeRevealShieldTimeoutId=null)},F))},l)}maskIframeUntilReady(e,t){if(!(e instanceof HTMLElement))return;this.clearIframeMasking(),e.setAttribute(f,"true");const o=e.style.colorScheme==="dark"?Q:J,l=new WeakSet;let n=null;const c=()=>{const i=document.querySelector(B);return(i==null?void 0:i.getAttribute(ae))==="true"},h=i=>i.getAttribute(v)==="true"?!0:c(),s=i=>{var u,p;if(this.initVersion===t&&!(!(i instanceof HTMLIFrameElement)||!e.contains(i))){if(h(i)){this.iframeRevealDelayTimeoutId!==null&&window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=window.setTimeout(()=>s(i),le);return}(u=e.querySelector(".podlove-facade-inner"))==null||u.remove(),(p=this.querySelector(".podlove-facade-inner"))==null||p.remove(),i.style.opacity="1",i.style.pointerEvents="",i.style.removeProperty("transition"),i.style.removeProperty("background-color"),i.style.removeProperty("color-scheme"),i.removeAttribute(b),e.removeAttribute(f),this.scheduleRevealShieldRelease(e,t),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null)}},m=i=>{this.iframeRevealDelayTimeoutId!==null&&window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=window.setTimeout(()=>s(i),o)},T=i=>{var P,D;if(l.has(i))return;l.add(i),n=i,this.getOrCreateRevealShield(e);const u=e.querySelector(`.${E}`);u&&u.remove();const p=e.querySelector(".podlove-facade-inner");p instanceof HTMLElement&&(p.style.position="absolute",p.style.inset="0",p.style.zIndex="1",p.style.padding="inherit"),(P=e.querySelector(".podlove-facade-content"))==null||P.remove(),(D=e.querySelector(".podlove-facade-play:not(.podlove-facade-inner .podlove-facade-play)"))==null||D.remove();const C=getComputedStyle(e);e.style.border=C.border,e.style.borderRadius=C.borderRadius,e.classList.remove("podlove-facade"),i.setAttribute(b,"true"),i.style.opacity="0",i.style.pointerEvents="none",i.style.transition="opacity 160ms ease",i.style.backgroundColor="inherit",i.style.colorScheme="inherit",i.addEventListener("load",()=>{n===i&&m(i)},{once:!0}),this.iframeRevealTimeoutId!==null&&window.clearTimeout(this.iframeRevealTimeoutId);const Y=e.style.colorScheme==="dark"?ee:Z;this.iframeRevealTimeoutId=window.setTimeout(()=>s(n),Y)},g=()=>{e.querySelectorAll("iframe").forEach(u=>{u instanceof HTMLIFrameElement&&T(u)})};g(),this.iframeObserver=new MutationObserver(()=>{g()}),this.iframeObserver.observe(e,{childList:!0,subtree:!0})}applyLoadingTheme(e){if(!(e instanceof HTMLElement))return;const t=A()==="dark"?"dark":"light";e.style.backgroundColor=w(t==="dark"),e.style.colorScheme=t}ensurePlayerStyles(){if(document.getElementById(q))return;const e=document.createElement("style");e.id=q;const t=w(!0),o=w(!1);e.textContent=`
      podlove-player .podlove-player-container {
        width: 100%;
        max-width: 936px;
        margin: 0 auto;
        position: relative;
        overflow: hidden;
        background-color: var(--cast-surface, ${o});
      }
      podlove-player .podlove-player-container:not(.podlove-facade) {
        min-height: ${G}px;
      }
      @media (max-width: 768px) {
        podlove-player .podlove-player-container {
          max-width: 366px;
        }
        podlove-player .podlove-player-container:not(.podlove-facade) {
          min-height: ${N}px;
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
        transition: opacity ${F}ms ease;
      }
      podlove-player .podlove-player-container[${f}="true"] iframe {
        opacity: 0 !important;
        pointer-events: none !important;
      }
      @media (prefers-color-scheme: dark) {
        podlove-player .podlove-player-container {
          background-color: var(--cast-bg-alt, ${t});
        }
        podlove-player .podlove-player-container iframe {
          background-color: var(--cast-bg-alt, ${t});
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
        background-color: var(--cast-bg-alt, ${t});
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
        background-color: var(--cast-bg-alt, ${t});
        color-scheme: dark;
      }
      html[data-bs-theme="light"] podlove-player .podlove-player-container,
      html[data-theme="light"] podlove-player .podlove-player-container,
      body[data-bs-theme="light"] podlove-player .podlove-player-container,
      body[data-theme="light"] podlove-player .podlove-player-container {
        background-color: var(--cast-surface, ${o});
      }
      html[data-bs-theme="light"] podlove-player .podlove-player-container iframe,
      html[data-theme="light"] podlove-player .podlove-player-container iframe,
      body[data-bs-theme="light"] podlove-player .podlove-player-container iframe,
      body[data-theme="light"] podlove-player .podlove-player-container iframe {
        background-color: var(--cast-surface, ${o});
        color-scheme: light;
      }
    `,document.head.appendChild(e)}renderPlaceholder(){if(this.ensurePlayerStyles(),this.querySelector(".podlove-player-container"))return;const e=document.createElement("div");e.classList.add("podlove-player-container"),this.applyLoadingTheme(e),this.applyReservedHeight(e),this.appendChild(e)}observeElement(){this.observer=se(),this.observer.observe(this)}setupFacadeInteraction(){const e=this.querySelector(".podlove-player-container");if(!e||!(e instanceof HTMLElement))return;const t=e.querySelector(".podlove-facade-play");this.facadeAbortController=new AbortController;const o=this.facadeAbortController.signal,l=()=>{this.facadeAbortController&&(this.facadeAbortController.abort(),this.facadeAbortController=null),this.handleFacadeLoad()};e.addEventListener("mouseenter",l,{once:!0,signal:o}),e.addEventListener("touchstart",l,{once:!0,passive:!0,signal:o}),t&&(t.addEventListener("focus",l,{once:!0,signal:o}),t.addEventListener("click",l,{once:!0,signal:o}))}handleFacadeLoad(){if(this.isInitialized||!this.isConnected)return;const e=this.querySelector(".podlove-player-container");if(!e||!(e instanceof HTMLElement))return;const t=e.getBoundingClientRect().height,o=Math.max(t,z());e.style.minHeight=`${o}px`,this.style.minHeight=`${o}px`,e.classList.add("is-loading");const l=document.createElement("div");l.className=E,e.appendChild(l),this.initializePlayer()}showFacade(){if(this.isInitialized||!this.getAttribute("data-url"))return;const e=this.querySelector(".podlove-player-container");if(!e||e.querySelector(`.${S}`))return;const t=document.createElement("button");t.type="button",t.className=S,t.setAttribute("aria-label","Play"),t.innerHTML='<svg viewBox="0 0 24 24" width="28" height="28" fill="white" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',t.addEventListener("click",()=>this.handleFacadeClick(),{once:!0}),e.appendChild(t)}handleFacadeClick(){if(this.isInitialized||!this.isConnected||!this.getAttribute("data-url"))return;const e=this.querySelector(".podlove-player-container");if(!e)return;const t=e.querySelector(`.${S}`);t&&t.remove();const o=document.createElement("div");o.className=E,e.appendChild(o),this.initializePlayer()}initializePlayer(){if(this.isInitialized||!this.isConnected)return;const e=this.querySelector(".podlove-player-container");if(!e)return;e instanceof HTMLElement&&!this.isFacadeMode()&&this.applyReservedHeight(e),this.isFacadeMode()?e instanceof HTMLElement&&(e.style.colorScheme=A()==="dark"?"dark":"light"):this.applyLoadingTheme(e);let t=this.getAttribute("id");t||(t=`podlove-player-${Date.now()}`,this.setAttribute("id",t)),this.dataset.playerInstanceId||(H+=1,this.dataset.playerInstanceId=String(H));const o=`${t}-player-${this.dataset.playerInstanceId}`,l=this.getAttribute("data-url");if(!l)return;this.isInitialized=!0,this.initVersion+=1;const n=this.initVersion;let c=this.getAttribute("data-config")||"/api/audios/player_config/";c=ce(c);const h=this.getAttribute("data-template");let s=this.getAttribute("data-embed")||"https://cdn.podlove.org/web-player/5.x/embed.js";const{hostname:m,port:T}=window.location,g=this.getOrCreatePlayerDiv(e,o,h);typeof podlovePlayer=="function"?(podlovePlayer(g,l,c),this.maskIframeUntilReady(e,n)):(m==="localhost"&&s.startsWith("/")&&(s=`http://localhost:${T}${s}`),de(s).then(()=>{if(!(n!==this.initVersion||!this.isConnected)){if(typeof podlovePlayer=="function"){podlovePlayer(g,l,c),this.maskIframeUntilReady(e,n);return}throw new Error("Podlove embed script did not register.")}}).catch(()=>{if(n===this.initVersion){this.isInitialized=!1,this.clearReservedHeight(e);const i=this.querySelector(`.${E}`);i&&i.remove()}}))}getOrCreatePlayerDiv(e,t,o){return this.playerDiv||(this.playerDiv=document.createElement("div"),this.playerDiv.classList.add("podlove-player-host")),e.contains(this.playerDiv)||e.appendChild(this.playerDiv),this.playerDiv.id=t,o!==null?this.playerDiv.setAttribute("data-template",o):this.playerDiv.removeAttribute("data-template"),this.playerDiv}releaseReservedHeight(e){e instanceof HTMLElement&&(e.style.minHeight="0",e.style.removeProperty("border"),e.style.removeProperty("border-radius")),this.style.minHeight="0"}clearReservedHeight(e){e instanceof HTMLElement&&(e.style.removeProperty("min-height"),e.style.removeProperty("border"),e.style.removeProperty("border-radius")),this.style.removeProperty("min-height")}}customElements.define("podlove-player",k);M=A();const K=new MutationObserver(()=>{const a=A();a!==M&&(M=a,document.querySelectorAll("podlove-player").forEach(r=>{r instanceof k&&r.reinitializePlayer()}))});K.observe(document.documentElement,{attributes:!0,attributeFilter:["data-bs-theme","data-theme"]});const V=()=>{document.body&&K.observe(document.body,{attributes:!0,attributeFilter:["data-bs-theme","data-theme"]})};document.body?V():window.addEventListener("DOMContentLoaded",V,{once:!0});typeof document!="undefined"&&document.addEventListener("htmx:beforeRequest",pe,!0);
