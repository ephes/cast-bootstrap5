var W=Object.defineProperty;var U=(l,r,e)=>r in l?W(l,r,{enumerable:!0,configurable:!0,writable:!0,value:e}):l[r]=e;var c=(l,r,e)=>U(l,typeof r!="symbol"?r+"":r,e);let y=null,F=0,L=null,w=null,P=null;const C="data-podlove-embed",S="data-podlove-embed-loaded",_="data-podlove-embed-failed",q="podlove-player-styles",O="color_scheme",X="#292524",j="#ffffff",V=297,G=312,J=100,Q=900,Z=2500,ee=8e3,b="data-cast-iframe-masked",f="data-cast-mask-active",I="podlove-player-reveal-shield",te=80,oe=180,$=120,N="#paging-area",re=".pagination a, .cast-pagination a",v="data-cast-paging-remask",ie=1600,ae="data-cast-paging-mask-active",le=50;function ne(){return document.readyState==="complete"?Promise.resolve():(L||(L=new Promise(l=>{window.addEventListener("load",()=>l(),{once:!0})})),L)}function M(l){const r=l?"--cast-bg-alt":"--cast-surface",e=l?X:j;return getComputedStyle(document.documentElement).getPropertyValue(r).trim()||e}const T="podlove-player-facade-btn",g="podlove-player-facade-loading";function se(){return w||(w=new IntersectionObserver((l,r)=>{l.forEach(e=>{if(!e.isIntersecting)return;const t=e.target;r.unobserve(t),t instanceof k&&t.showFacade()})})),w}function de(l){if(typeof podlovePlayer=="function")return Promise.resolve();const r=document.querySelector(`script[${S}="true"]`);return r&&(r.remove(),y=null),y||(y=new Promise((e,t)=>{const o=document.querySelector(`script[${C}]`);if(o){if(o.getAttribute(S)==="true"&&typeof podlovePlayer=="function"){e();return}if(o.getAttribute(_)==="true")o.remove();else{o.addEventListener("load",()=>{o.setAttribute(S,"true"),e()},{once:!0}),o.addEventListener("error",()=>{o.setAttribute(_,"true"),o.remove(),t(new Error("Failed to load Podlove embed script"))},{once:!0});return}}const i=document.createElement("script");i.src=l,i.async=!0,i.setAttribute(C,"true"),i.addEventListener("load",()=>{i.setAttribute(S,"true"),e()},{once:!0}),i.addEventListener("error",()=>{i.setAttribute(_,"true"),i.remove(),t(new Error("Failed to load Podlove embed script"))},{once:!0}),document.head.appendChild(i)}).then(()=>{if(typeof podlovePlayer!="function")throw new Error("Podlove embed script did not register.")}).catch(e=>{var t;throw(t=document.querySelector(`script[${C}]`))==null||t.remove(),y=null,e}),y)}function E(){var r,e;const l=document.documentElement.getAttribute("data-bs-theme")||document.documentElement.getAttribute("data-theme")||((r=document.body)==null?void 0:r.getAttribute("data-bs-theme"))||((e=document.body)==null?void 0:e.getAttribute("data-theme"));return l==="light"||l==="dark"?l:typeof window.matchMedia=="function"&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":null}function ce(l){const r=E();if(!r)return l;const e=l.indexOf("#"),t=e===-1?l:l.slice(0,e),o=e===-1?"":l.slice(e+1),i=t.indexOf("?"),n=i===-1?t:t.slice(0,i),u=i===-1?"":t.slice(i+1),p=new URLSearchParams(u);p.has(O)||p.set(O,r);const s=p.toString(),d=o?`#${o}`:"";return s?`${n}?${s}${d}`:`${n}${d}`}function z(){return typeof window.matchMedia=="function"&&window.matchMedia("(max-width: 768px)").matches?G:V}function ue(l,r){r.getAttribute(v)!=="true"&&(r.setAttribute(v,"true"),r.setAttribute(b,"true"),r.style.opacity="0",r.style.pointerEvents="none",r.style.backgroundColor="inherit",r.style.colorScheme="inherit",l.setAttribute(f,"true"),window.setTimeout(()=>{!r.isConnected||r.getAttribute(v)!=="true"||(r.removeAttribute(v),r.getAttribute(b)==="true"&&r.removeAttribute(b),r.style.opacity="1",r.style.pointerEvents="",r.style.removeProperty("background-color"),r.style.removeProperty("color-scheme"),l.querySelector(`iframe[${v}="true"]`)||l.removeAttribute(f))},ie))}function pe(l){const r=l.target;if(!(r instanceof Element)||!r.closest(re))return;const e=document.querySelector(N);e&&e.querySelectorAll(".podlove-player-container").forEach(t=>{t instanceof HTMLElement&&t.querySelectorAll("iframe").forEach(o=>{o instanceof HTMLIFrameElement&&o.getAttribute(b)!=="true"&&ue(t,o)})})}class k extends HTMLElement{constructor(){super();c(this,"observer");c(this,"isInitialized");c(this,"playerDiv");c(this,"initVersion");c(this,"iframeObserver");c(this,"iframeRevealDelayTimeoutId");c(this,"iframeRevealTimeoutId");c(this,"iframeRevealShieldTimeoutId");c(this,"facadeAbortController");c(this,"retryShouldFocus",!1);c(this,"originalFacadeButton",null);this.observer=null,this.isInitialized=!1,this.playerDiv=null,this.initVersion=0,this.iframeObserver=null,this.iframeRevealDelayTimeoutId=null,this.iframeRevealTimeoutId=null,this.iframeRevealShieldTimeoutId=null,this.facadeAbortController=null}isFacadeMode(){return this.getAttribute("data-load-mode")==="facade"}reinitializePlayer(){if(!this.isInitialized||!this.isConnected)return;this.clearIframeMasking(),this.playerDiv&&(this.playerDiv.remove(),this.playerDiv=null);const e=this.querySelector(".podlove-player-container");e instanceof HTMLElement&&e.style.removeProperty("min-height"),this.style.removeProperty("min-height"),this.isInitialized=!1,delete this.dataset.playerInstanceId,this.initializePlayer()}connectedCallback(){if(this.renderPlaceholder(),this.isFacadeMode()){this.setupFacadeInteraction();return}if(document.readyState==="complete"){this.observeElement();return}ne().then(()=>this.observeElement())}disconnectedCallback(){var o,i,n;this.observer&&this.observer.unobserve(this),this.facadeAbortController&&(this.facadeAbortController.abort(),this.facadeAbortController=null),this.clearIframeMasking(),this.restoreFacadeButton(),(o=this.querySelector(".podlove-player-error"))==null||o.remove(),this.retryShouldFocus=!1,(i=this.querySelector(`.${g}`))==null||i.remove(),(n=this.querySelector(`.${T}`))==null||n.remove();const e=this.querySelector(".podlove-facade-inner");e instanceof HTMLElement&&(e.style.removeProperty("position"),e.style.removeProperty("inset"),e.style.removeProperty("z-index"),e.style.removeProperty("padding"));const t=this.querySelector(".podlove-player-container");t instanceof HTMLElement&&(this.isFacadeMode()&&t.classList.add("podlove-facade"),t.classList.remove("is-loading"),t.style.removeProperty("min-height")),this.style.removeProperty("min-height"),this.initVersion+=1,this.isInitialized=!1}clearIframeMasking(){this.iframeObserver&&(this.iframeObserver.disconnect(),this.iframeObserver=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.iframeRevealShieldTimeoutId!==null&&(window.clearTimeout(this.iframeRevealShieldTimeoutId),this.iframeRevealShieldTimeoutId=null),this.querySelectorAll(".podlove-player-container").forEach(e=>{e instanceof HTMLElement&&(e.removeAttribute(f),e.querySelectorAll(`.${I}`).forEach(t=>{t.remove()}))})}applyReservedHeight(e){const t=`${z()}px`;e.style.minHeight=t,this.style.minHeight=t}getOrCreateRevealShield(e){const t=e.querySelector(`.${I}`);if(t instanceof HTMLDivElement)return t.style.backgroundColor=e.style.backgroundColor||window.getComputedStyle(e).backgroundColor,t.style.opacity="1",t;const o=document.createElement("div");return o.classList.add(I),o.style.backgroundColor=e.style.backgroundColor||window.getComputedStyle(e).backgroundColor,o.style.opacity="1",e.appendChild(o),o}scheduleRevealShieldRelease(e,t){this.iframeRevealShieldTimeoutId!==null&&(window.clearTimeout(this.iframeRevealShieldTimeoutId),this.iframeRevealShieldTimeoutId=null);const o=this.getOrCreateRevealShield(e),i=e.style.colorScheme==="dark"?oe:te;this.iframeRevealShieldTimeoutId=window.setTimeout(()=>{this.initVersion===t&&(this.releaseReservedHeight(e),o.style.opacity="0",this.iframeRevealShieldTimeoutId=window.setTimeout(()=>{this.initVersion===t&&(o.remove(),this.iframeRevealShieldTimeoutId=null)},$))},i)}maskIframeUntilReady(e,t){if(!(e instanceof HTMLElement))return;this.clearIframeMasking(),e.setAttribute(f,"true");const o=e.style.colorScheme==="dark"?Q:J,i=new WeakSet;let n=null;const u=()=>{const a=document.querySelector(N);return(a==null?void 0:a.getAttribute(ae))==="true"},p=a=>a.getAttribute(v)==="true"?!0:u(),s=a=>{var h,m;if(this.initVersion===t&&!(!(a instanceof HTMLIFrameElement)||!e.contains(a))){if(p(a)){this.iframeRevealDelayTimeoutId!==null&&window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=window.setTimeout(()=>s(a),le);return}(h=e.querySelector(".podlove-facade-inner"))==null||h.remove(),(m=this.querySelector(".podlove-facade-inner"))==null||m.remove(),a.style.opacity="1",a.style.pointerEvents="",a.style.removeProperty("transition"),a.style.removeProperty("background-color"),a.style.removeProperty("color-scheme"),a.removeAttribute(b),e.removeAttribute(f),this.scheduleRevealShieldRelease(e,t),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null)}},d=a=>{this.iframeRevealDelayTimeoutId!==null&&window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=window.setTimeout(()=>s(a),o)},R=a=>{var H,x;if(i.has(a))return;i.add(a),n=a,this.getOrCreateRevealShield(e);const h=e.querySelector(`.${g}`);h&&h.remove();const m=e.querySelector(".podlove-facade-inner");m instanceof HTMLElement&&(m.style.position="absolute",m.style.inset="0",m.style.zIndex="1",m.style.padding="inherit"),(H=e.querySelector(".podlove-facade-content"))==null||H.remove(),(x=e.querySelector(".podlove-facade-play:not(.podlove-facade-inner .podlove-facade-play)"))==null||x.remove();const D=getComputedStyle(e);e.style.border=D.border,e.style.borderRadius=D.borderRadius,e.classList.remove("podlove-facade"),a.setAttribute(b,"true"),a.style.opacity="0",a.style.pointerEvents="none",a.style.transition="opacity 160ms ease",a.style.backgroundColor="inherit",a.style.colorScheme="inherit",a.addEventListener("load",()=>{n===a&&d(a)},{once:!0}),this.iframeRevealTimeoutId!==null&&window.clearTimeout(this.iframeRevealTimeoutId);const Y=e.style.colorScheme==="dark"?ee:Z;this.iframeRevealTimeoutId=window.setTimeout(()=>s(n),Y)},A=()=>{e.querySelectorAll("iframe").forEach(h=>{h instanceof HTMLIFrameElement&&R(h)})};A(),this.iframeObserver=new MutationObserver(()=>{A()}),this.iframeObserver.observe(e,{childList:!0,subtree:!0})}applyLoadingTheme(e){if(!(e instanceof HTMLElement))return;const t=E()==="dark"?"dark":"light";e.style.backgroundColor=M(t==="dark"),e.style.colorScheme=t}ensurePlayerStyles(){if(document.getElementById(q))return;const e=document.createElement("style");e.id=q;const t=M(!0),o=M(!1);e.textContent=`
      podlove-player .podlove-player-container {
        width: 100%;
        max-width: 936px;
        margin: 0 auto;
        position: relative;
        overflow: hidden;
        background-color: var(--cast-surface, ${o});
      }
      podlove-player .podlove-player-container:not(.podlove-facade) {
        min-height: ${V}px;
      }
      @media (max-width: 768px) {
        podlove-player .podlove-player-container {
          max-width: 366px;
        }
        podlove-player .podlove-player-container:not(.podlove-facade) {
          min-height: ${G}px;
        }
      }
      podlove-player .podlove-player-container iframe {
        display: block;
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
      podlove-player .podlove-player-retry-btn {
        width: auto;
        max-width: 90%;
        padding: 0 20px;
        border-radius: 8px;
        color: white;
      }
      podlove-player .podlove-player-error {
        text-align: center;
      }
      podlove-player .podlove-player-container:not(.podlove-facade) .podlove-player-error {
        position: absolute;
        top: 16px;
        width: 100%;
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
        transition: opacity ${$}ms ease;
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
    `,document.head.appendChild(e)}renderPlaceholder(){if(this.ensurePlayerStyles(),this.querySelector(".podlove-player-container"))return;const e=document.createElement("div");e.classList.add("podlove-player-container"),this.applyLoadingTheme(e),this.applyReservedHeight(e),this.appendChild(e)}observeElement(){this.observer=se(),this.observer.observe(this)}setupFacadeInteraction(){const e=this.querySelector(".podlove-player-container");if(!e||!(e instanceof HTMLElement))return;const t=e.querySelector(".podlove-facade-play");this.facadeAbortController=new AbortController;const o=this.facadeAbortController.signal,i=()=>{this.facadeAbortController&&(this.facadeAbortController.abort(),this.facadeAbortController=null),this.handleFacadeLoad()};e.addEventListener("mouseenter",i,{once:!0,signal:o}),e.addEventListener("touchstart",i,{once:!0,passive:!0,signal:o}),t&&(t.addEventListener("focus",i,{once:!0,signal:o}),t.addEventListener("click",i,{once:!0,signal:o}))}handleFacadeLoad(){var n;if(this.isInitialized||!this.isConnected)return;const e=this.querySelector(".podlove-player-container");if(!e||!(e instanceof HTMLElement))return;this.retryShouldFocus=document.activeElement===e.querySelector(".podlove-facade-play"),this.restoreFacadeButton(),(n=this.querySelector(".podlove-player-error"))==null||n.remove();const t=e.getBoundingClientRect().height,o=Math.max(t,z());e.style.minHeight=`${o}px`,this.style.minHeight=`${o}px`,e.classList.add("is-loading");const i=document.createElement("div");i.className=g,e.appendChild(i),this.initializePlayer()}showFacade(e=!1){if(this.isInitialized||!this.getAttribute("data-url"))return;const t=this.querySelector(".podlove-player-container");if(!t||t.querySelector(`.${T}`))return;const o=document.createElement("button");o.type="button",o.className=T,o.setAttribute("aria-label",e?"Retry loading player":"Play"),e?(o.classList.add("podlove-player-retry-btn"),o.textContent="Retry loading player"):o.innerHTML='<svg viewBox="0 0 24 24" width="28" height="28" fill="white" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',o.addEventListener("click",()=>this.handleFacadeClick(),{once:!0}),t.appendChild(o)}handleFacadeClick(){var i;if(this.isInitialized||!this.isConnected||!this.getAttribute("data-url"))return;const e=this.querySelector(".podlove-player-container");if(!e)return;const t=e.querySelector(`.${T}`);this.retryShouldFocus=document.activeElement===t,(i=this.querySelector(".podlove-player-error"))==null||i.remove(),t&&t.remove();const o=document.createElement("div");o.className=g,e.appendChild(o),this.initializePlayer()}initializePlayer(){if(this.isInitialized||!this.isConnected)return;const e=this.querySelector(".podlove-player-container");if(!e)return;e instanceof HTMLElement&&!this.isFacadeMode()&&this.applyReservedHeight(e),this.isFacadeMode()?e instanceof HTMLElement&&(e.style.colorScheme=E()==="dark"?"dark":"light"):this.applyLoadingTheme(e);let t=this.getAttribute("id");t||(t=`podlove-player-${Date.now()}`,this.setAttribute("id",t)),this.dataset.playerInstanceId||(F+=1,this.dataset.playerInstanceId=String(F));const o=`${t}-player-${this.dataset.playerInstanceId}`,i=this.getAttribute("data-url");if(!i)return;this.isInitialized=!0,this.initVersion+=1;const n=this.initVersion;let u=this.getAttribute("data-config")||"/api/audios/player_config/";u=ce(u);const p=this.getAttribute("data-template");let s=this.getAttribute("data-embed")||"https://cdn.podlove.org/web-player/5.x/embed.js";const{hostname:d,port:R}=window.location,A=this.getOrCreatePlayerDiv(e,o,p),a=()=>{if(!(n!==this.initVersion||!this.isConnected)){try{if(typeof podlovePlayer!="function")throw new Error("Podlove embed script did not register.");podlovePlayer(A,i,u)}catch(h){this.recoverInitialization(e,n);return}n===this.initVersion&&this.isConnected&&this.maskIframeUntilReady(e,n)}};typeof podlovePlayer=="function"?a():(d==="localhost"&&s.startsWith("/")&&(s=`http://localhost:${R}${s}`),de(s).then(a,()=>{this.recoverInitialization(e,n)}))}recoverInitialization(e,t){var n,u,p,s;if(t!==this.initVersion||!this.isConnected)return;this.isInitialized=!1,this.clearReservedHeight(e),e.classList.remove("is-loading"),(n=this.querySelector(`.${g}`))==null||n.remove(),(u=this.playerDiv)==null||u.remove(),this.playerDiv=null,(p=this.facadeAbortController)==null||p.abort(),this.facadeAbortController=null;const o=document.createElement("p");o.className="podlove-player-error",o.setAttribute("role","alert"),o.textContent="Player failed to load. Please retry.",(s=this.querySelector(".podlove-player-error"))==null||s.remove(),e.appendChild(o);const i=e.querySelector(".podlove-facade-play");if(i?(this.originalFacadeButton={button:i,html:i.innerHTML,label:i.getAttribute("aria-label")},i.textContent="Retry loading player",i.setAttribute("aria-label","Retry loading player"),this.facadeAbortController=new AbortController,i.addEventListener("click",()=>{var d;(d=this.facadeAbortController)==null||d.abort(),this.facadeAbortController=null,this.handleFacadeLoad()},{once:!0,signal:this.facadeAbortController.signal})):this.showFacade(!0),this.retryShouldFocus){const d=e.querySelector(".podlove-facade-play, .podlove-player-retry-btn");d==null||d.focus()}}restoreFacadeButton(){if(!this.originalFacadeButton)return;const{button:e,html:t,label:o}=this.originalFacadeButton;e.innerHTML=t,o===null?e.removeAttribute("aria-label"):e.setAttribute("aria-label",o),this.originalFacadeButton=null}getOrCreatePlayerDiv(e,t,o){return this.playerDiv||(this.playerDiv=document.createElement("div"),this.playerDiv.classList.add("podlove-player-host")),e.contains(this.playerDiv)||e.appendChild(this.playerDiv),this.playerDiv.id=t,o!==null?this.playerDiv.setAttribute("data-template",o):this.playerDiv.removeAttribute("data-template"),this.playerDiv}releaseReservedHeight(e){e instanceof HTMLElement&&(e.style.minHeight="0",e.style.removeProperty("border"),e.style.removeProperty("border-radius")),this.style.minHeight="0"}clearReservedHeight(e){e instanceof HTMLElement&&(e.style.removeProperty("min-height"),e.style.removeProperty("border"),e.style.removeProperty("border-radius")),this.style.removeProperty("min-height")}}customElements.define("podlove-player",k);P=E();const K=new MutationObserver(()=>{const l=E();l!==P&&(P=l,document.querySelectorAll("podlove-player").forEach(r=>{r instanceof k&&r.reinitializePlayer()}))});K.observe(document.documentElement,{attributes:!0,attributeFilter:["data-bs-theme","data-theme"]});const B=()=>{document.body&&K.observe(document.body,{attributes:!0,attributeFilter:["data-bs-theme","data-theme"]})};document.body?B():window.addEventListener("DOMContentLoaded",B,{once:!0});typeof document!="undefined"&&document.addEventListener("htmx:beforeRequest",pe,!0);
