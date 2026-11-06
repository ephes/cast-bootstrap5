var W=Object.defineProperty;var U=(l,r,e)=>r in l?W(l,r,{enumerable:!0,configurable:!0,writable:!0,value:e}):l[r]=e;var p=(l,r,e)=>U(l,typeof r!="symbol"?r+"":r,e);let f=null,D=0,R=null,L=null,_=null;const j=1e4,H="data-podlove-embed",F="data-podlove-embed-loaded",x="data-podlove-embed-failed",q="podlove-player-styles",O="color_scheme",X="#292524",J="#ffffff",V=297,N=312,Q=100,Z=900,ee=2500,te=8e3,E="data-cast-iframe-masked",g="data-cast-mask-active",I="podlove-player-reveal-shield",oe=80,re=180,$=120,G="#paging-area",ie=".pagination a, .cast-pagination a",b="data-cast-paging-remask",ae=1600,le="data-cast-paging-mask-active",ne=50;function se(){return document.readyState==="complete"?Promise.resolve():(R||(R=new Promise(l=>{window.addEventListener("load",()=>l(),{once:!0})})),R)}function w(l){const r=l?"--cast-bg-alt":"--cast-surface",e=l?X:J;return getComputedStyle(document.documentElement).getPropertyValue(r).trim()||e}const T="podlove-player-facade-btn",A="podlove-player-facade-loading";function de(){return L||(L=new IntersectionObserver((l,r)=>{l.forEach(e=>{if(!e.isIntersecting)return;const t=e.target;r.unobserve(t),t instanceof C&&t.showFacade()})})),L}function ce(l){if(typeof podlovePlayer=="function")return Promise.resolve();const r=document.querySelector(`script[${F}="true"]`);if(r&&(r.remove(),f=null),f)return f;const e=new Promise((t,o)=>{let a=document.querySelector(`script[${H}]`);(a==null?void 0:a.getAttribute(x))==="true"&&(a.remove(),a=null);const n=!a,s=a!=null?a:document.createElement("script");let c=!1;const d=()=>{clearTimeout(i),s.removeEventListener("load",y),s.removeEventListener("error",m)},u=h=>{c||(c=!0,d(),s.setAttribute(x,"true"),s.remove(),o(new Error(h)))},y=()=>{if(!c){if(typeof podlovePlayer!="function"){u("Podlove embed script did not register.");return}c=!0,d(),s.setAttribute(F,"true"),t()}},m=()=>u("Failed to load Podlove embed script"),i=setTimeout(()=>u("Podlove embed script load timed out"),j);s.addEventListener("load",y),s.addEventListener("error",m),n&&(s.src=l,s.async=!0,s.setAttribute(H,"true"),document.head.appendChild(s))}).catch(t=>{throw f===e&&(f=null),t});return f=e,f}function S(){var r,e;const l=document.documentElement.getAttribute("data-bs-theme")||document.documentElement.getAttribute("data-theme")||((r=document.body)==null?void 0:r.getAttribute("data-bs-theme"))||((e=document.body)==null?void 0:e.getAttribute("data-theme"));return l==="light"||l==="dark"?l:typeof window.matchMedia=="function"&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":null}function ue(l){const r=S();if(!r)return l;const e=l.indexOf("#"),t=e===-1?l:l.slice(0,e),o=e===-1?"":l.slice(e+1),a=t.indexOf("?"),n=a===-1?t:t.slice(0,a),s=a===-1?"":t.slice(a+1),c=new URLSearchParams(s);c.has(O)||c.set(O,r);const d=c.toString(),u=o?`#${o}`:"";return d?`${n}?${d}${u}`:`${n}${u}`}function z(){return typeof window.matchMedia=="function"&&window.matchMedia("(max-width: 768px)").matches?N:V}function pe(l,r){r.getAttribute(b)!=="true"&&(r.setAttribute(b,"true"),r.setAttribute(E,"true"),r.style.opacity="0",r.style.pointerEvents="none",r.style.backgroundColor="inherit",r.style.colorScheme="inherit",l.setAttribute(g,"true"),window.setTimeout(()=>{!r.isConnected||r.getAttribute(b)!=="true"||(r.removeAttribute(b),r.getAttribute(E)==="true"&&r.removeAttribute(E),r.style.opacity="1",r.style.pointerEvents="",r.style.removeProperty("background-color"),r.style.removeProperty("color-scheme"),l.querySelector(`iframe[${b}="true"]`)||l.removeAttribute(g))},ae))}function he(l){const r=l.target;if(!(r instanceof Element)||!r.closest(ie))return;const e=document.querySelector(G);e&&e.querySelectorAll(".podlove-player-container").forEach(t=>{t instanceof HTMLElement&&t.querySelectorAll("iframe").forEach(o=>{o instanceof HTMLIFrameElement&&o.getAttribute(E)!=="true"&&pe(t,o)})})}class C extends HTMLElement{constructor(){super();p(this,"observer");p(this,"isInitialized");p(this,"playerDiv");p(this,"initVersion");p(this,"iframeObserver");p(this,"iframeRevealDelayTimeoutId");p(this,"iframeRevealTimeoutId");p(this,"iframeRevealShieldTimeoutId");p(this,"facadeAbortController");p(this,"retryShouldFocus",!1);p(this,"originalFacadeButton",null);this.observer=null,this.isInitialized=!1,this.playerDiv=null,this.initVersion=0,this.iframeObserver=null,this.iframeRevealDelayTimeoutId=null,this.iframeRevealTimeoutId=null,this.iframeRevealShieldTimeoutId=null,this.facadeAbortController=null}isFacadeMode(){return this.getAttribute("data-load-mode")==="facade"}reinitializePlayer(){if(!this.isInitialized||!this.isConnected)return;this.clearIframeMasking(),this.playerDiv&&(this.playerDiv.remove(),this.playerDiv=null);const e=this.querySelector(".podlove-player-container");e instanceof HTMLElement&&e.style.removeProperty("min-height"),this.style.removeProperty("min-height"),this.isInitialized=!1,delete this.dataset.playerInstanceId,this.initializePlayer()}connectedCallback(){if(this.renderPlaceholder(),this.isFacadeMode()){this.setupFacadeInteraction();return}if(document.readyState==="complete"){this.observeElement();return}se().then(()=>this.observeElement())}disconnectedCallback(){var o,a,n;this.observer&&this.observer.unobserve(this),this.facadeAbortController&&(this.facadeAbortController.abort(),this.facadeAbortController=null),this.clearIframeMasking(),this.restoreFacadeButton(),(o=this.querySelector(".podlove-player-error"))==null||o.remove(),this.retryShouldFocus=!1,(a=this.querySelector(`.${A}`))==null||a.remove(),(n=this.querySelector(`.${T}`))==null||n.remove();const e=this.querySelector(".podlove-facade-inner");e instanceof HTMLElement&&(e.style.removeProperty("position"),e.style.removeProperty("inset"),e.style.removeProperty("z-index"),e.style.removeProperty("padding"));const t=this.querySelector(".podlove-player-container");t instanceof HTMLElement&&(this.isFacadeMode()&&t.classList.add("podlove-facade"),t.classList.remove("is-loading"),t.style.removeProperty("min-height")),this.style.removeProperty("min-height"),this.initVersion+=1,this.isInitialized=!1}clearIframeMasking(){this.iframeObserver&&(this.iframeObserver.disconnect(),this.iframeObserver=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.iframeRevealShieldTimeoutId!==null&&(window.clearTimeout(this.iframeRevealShieldTimeoutId),this.iframeRevealShieldTimeoutId=null),this.querySelectorAll(".podlove-player-container").forEach(e=>{e instanceof HTMLElement&&(e.removeAttribute(g),e.querySelectorAll(`.${I}`).forEach(t=>{t.remove()}))})}applyReservedHeight(e){const t=`${z()}px`;e.style.minHeight=t,this.style.minHeight=t}getOrCreateRevealShield(e){const t=e.querySelector(`.${I}`);if(t instanceof HTMLDivElement)return t.style.backgroundColor=e.style.backgroundColor||window.getComputedStyle(e).backgroundColor,t.style.opacity="1",t;const o=document.createElement("div");return o.classList.add(I),o.style.backgroundColor=e.style.backgroundColor||window.getComputedStyle(e).backgroundColor,o.style.opacity="1",e.appendChild(o),o}scheduleRevealShieldRelease(e,t){this.iframeRevealShieldTimeoutId!==null&&(window.clearTimeout(this.iframeRevealShieldTimeoutId),this.iframeRevealShieldTimeoutId=null);const o=this.getOrCreateRevealShield(e),a=e.style.colorScheme==="dark"?re:oe;this.iframeRevealShieldTimeoutId=window.setTimeout(()=>{this.initVersion===t&&(this.releaseReservedHeight(e),o.style.opacity="0",this.iframeRevealShieldTimeoutId=window.setTimeout(()=>{this.initVersion===t&&(o.remove(),this.iframeRevealShieldTimeoutId=null)},$))},a)}maskIframeUntilReady(e,t){if(!(e instanceof HTMLElement))return;this.clearIframeMasking(),e.setAttribute(g,"true");const o=e.style.colorScheme==="dark"?Z:Q,a=new WeakSet;let n=null;const s=()=>{const i=document.querySelector(G);return(i==null?void 0:i.getAttribute(le))==="true"},c=i=>i.getAttribute(b)==="true"?!0:s(),d=i=>{var h,v;if(this.initVersion===t&&!(!(i instanceof HTMLIFrameElement)||!e.contains(i))){if(c(i)){this.iframeRevealDelayTimeoutId!==null&&window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=window.setTimeout(()=>d(i),ne);return}(h=e.querySelector(".podlove-facade-inner"))==null||h.remove(),(v=this.querySelector(".podlove-facade-inner"))==null||v.remove(),i.style.opacity="1",i.style.pointerEvents="",i.style.removeProperty("transition"),i.style.removeProperty("background-color"),i.style.removeProperty("color-scheme"),i.removeAttribute(E),e.removeAttribute(g),this.scheduleRevealShieldRelease(e,t),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null)}},u=i=>{this.iframeRevealDelayTimeoutId!==null&&window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=window.setTimeout(()=>d(i),o)},y=i=>{var P,k;if(a.has(i))return;a.add(i),n=i,this.getOrCreateRevealShield(e);const h=e.querySelector(`.${A}`);h&&h.remove();const v=e.querySelector(".podlove-facade-inner");v instanceof HTMLElement&&(v.style.position="absolute",v.style.inset="0",v.style.zIndex="1",v.style.padding="inherit"),(P=e.querySelector(".podlove-facade-content"))==null||P.remove(),(k=e.querySelector(".podlove-facade-play:not(.podlove-facade-inner .podlove-facade-play)"))==null||k.remove();const M=getComputedStyle(e);e.style.border=M.border,e.style.borderRadius=M.borderRadius,e.classList.remove("podlove-facade"),i.setAttribute(E,"true"),i.style.opacity="0",i.style.pointerEvents="none",i.style.transition="opacity 160ms ease",i.style.backgroundColor="inherit",i.style.colorScheme="inherit",i.addEventListener("load",()=>{n===i&&u(i)},{once:!0}),this.iframeRevealTimeoutId!==null&&window.clearTimeout(this.iframeRevealTimeoutId);const Y=e.style.colorScheme==="dark"?te:ee;this.iframeRevealTimeoutId=window.setTimeout(()=>d(n),Y)},m=()=>{e.querySelectorAll("iframe").forEach(h=>{h instanceof HTMLIFrameElement&&y(h)})};m(),this.iframeObserver=new MutationObserver(()=>{m()}),this.iframeObserver.observe(e,{childList:!0,subtree:!0})}applyLoadingTheme(e){if(!(e instanceof HTMLElement))return;const t=S()==="dark"?"dark":"light";e.style.backgroundColor=w(t==="dark"),e.style.colorScheme=t}ensurePlayerStyles(){if(document.getElementById(q))return;const e=document.createElement("style");e.id=q;const t=w(!0),o=w(!1);e.textContent=`
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
          min-height: ${N}px;
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
      podlove-player .podlove-player-container[${g}="true"] iframe {
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
    `,document.head.appendChild(e)}renderPlaceholder(){if(this.ensurePlayerStyles(),this.querySelector(".podlove-player-container"))return;const e=document.createElement("div");e.classList.add("podlove-player-container"),this.applyLoadingTheme(e),this.applyReservedHeight(e),this.appendChild(e)}observeElement(){this.observer=de(),this.observer.observe(this)}setupFacadeInteraction(){const e=this.querySelector(".podlove-player-container");if(!e||!(e instanceof HTMLElement))return;const t=e.querySelector(".podlove-facade-play");this.facadeAbortController=new AbortController;const o=this.facadeAbortController.signal,a=()=>{this.facadeAbortController&&(this.facadeAbortController.abort(),this.facadeAbortController=null),this.handleFacadeLoad()};e.addEventListener("mouseenter",a,{once:!0,signal:o}),e.addEventListener("touchstart",a,{once:!0,passive:!0,signal:o}),t&&(t.addEventListener("focus",a,{once:!0,signal:o}),t.addEventListener("click",a,{once:!0,signal:o}))}handleFacadeLoad(){var n;if(this.isInitialized||!this.isConnected)return;const e=this.querySelector(".podlove-player-container");if(!e||!(e instanceof HTMLElement))return;this.retryShouldFocus=document.activeElement===e.querySelector(".podlove-facade-play"),this.restoreFacadeButton(),(n=this.querySelector(".podlove-player-error"))==null||n.remove();const t=e.getBoundingClientRect().height,o=Math.max(t,z());e.style.minHeight=`${o}px`,this.style.minHeight=`${o}px`,e.classList.add("is-loading");const a=document.createElement("div");a.className=A,e.appendChild(a),this.initializePlayer()}showFacade(e=!1){if(this.isInitialized||!this.getAttribute("data-url"))return;const t=this.querySelector(".podlove-player-container");if(!t||t.querySelector(`.${T}`))return;const o=document.createElement("button");o.type="button",o.className=T,o.setAttribute("aria-label",e?"Retry loading player":"Play"),e?(o.classList.add("podlove-player-retry-btn"),o.textContent="Retry loading player"):o.innerHTML='<svg viewBox="0 0 24 24" width="28" height="28" fill="white" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',o.addEventListener("click",()=>this.handleFacadeClick(),{once:!0}),t.appendChild(o)}handleFacadeClick(){var a;if(this.isInitialized||!this.isConnected||!this.getAttribute("data-url"))return;const e=this.querySelector(".podlove-player-container");if(!e)return;const t=e.querySelector(`.${T}`);this.retryShouldFocus=document.activeElement===t,(a=this.querySelector(".podlove-player-error"))==null||a.remove(),t&&t.remove();const o=document.createElement("div");o.className=A,e.appendChild(o),this.initializePlayer()}initializePlayer(){if(this.isInitialized||!this.isConnected)return;const e=this.querySelector(".podlove-player-container");if(!e)return;e instanceof HTMLElement&&!this.isFacadeMode()&&this.applyReservedHeight(e),this.isFacadeMode()?e instanceof HTMLElement&&(e.style.colorScheme=S()==="dark"?"dark":"light"):this.applyLoadingTheme(e);let t=this.getAttribute("id");t||(t=`podlove-player-${Date.now()}`,this.setAttribute("id",t)),this.dataset.playerInstanceId||(D+=1,this.dataset.playerInstanceId=String(D));const o=`${t}-player-${this.dataset.playerInstanceId}`,a=this.getAttribute("data-url");if(!a)return;this.isInitialized=!0,this.initVersion+=1;const n=this.initVersion;let s=this.getAttribute("data-config")||"/api/audios/player_config/";s=ue(s);const c=this.getAttribute("data-template");let d=this.getAttribute("data-embed")||"https://cdn.podlove.org/web-player/5.x/embed.js";const{hostname:u,port:y}=window.location,m=this.getOrCreatePlayerDiv(e,o,c),i=()=>{if(!(n!==this.initVersion||!this.isConnected)){try{if(typeof podlovePlayer!="function")throw new Error("Podlove embed script did not register.");podlovePlayer(m,a,s)}catch(h){this.recoverInitialization(e,n);return}n===this.initVersion&&this.isConnected&&this.maskIframeUntilReady(e,n)}};typeof podlovePlayer=="function"?i():(u==="localhost"&&d.startsWith("/")&&(d=`http://localhost:${y}${d}`),ce(d).then(i,()=>{this.recoverInitialization(e,n)}))}recoverInitialization(e,t){var d,u,y,m;if(t!==this.initVersion||!this.isConnected)return;this.isInitialized=!1,this.clearReservedHeight(e),e.classList.remove("is-loading"),(d=this.querySelector(`.${A}`))==null||d.remove(),(u=this.playerDiv)==null||u.remove(),this.playerDiv=null,(y=this.facadeAbortController)==null||y.abort(),this.facadeAbortController=null;const o=document.createElement("p");o.className="podlove-player-error",o.setAttribute("role","alert"),o.textContent="Player failed to load. Please retry.",(m=this.querySelector(".podlove-player-error"))==null||m.remove(),e.appendChild(o);const a=e.querySelector(".podlove-facade-inner");this.isFacadeMode()&&a instanceof HTMLElement&&(a.style.removeProperty("position"),a.style.removeProperty("inset"),a.style.removeProperty("z-index"),a.style.removeProperty("padding"),e.classList.add("podlove-facade"));const n=e.querySelector(".podlove-facade-play");n?(this.originalFacadeButton={button:n,html:n.innerHTML,label:n.getAttribute("aria-label")},n.textContent="Retry loading player",n.setAttribute("aria-label","Retry loading player"),this.facadeAbortController=new AbortController,n.addEventListener("click",()=>{var i;(i=this.facadeAbortController)==null||i.abort(),this.facadeAbortController=null,this.handleFacadeLoad()},{once:!0,signal:this.facadeAbortController.signal})):this.showFacade(!0);const s=document.activeElement,c=s===null||s===document.body||this.contains(s);if(this.retryShouldFocus&&c){const i=e.querySelector(".podlove-facade-play, .podlove-player-retry-btn");i==null||i.focus()}this.retryShouldFocus=!1}restoreFacadeButton(){if(!this.originalFacadeButton)return;const{button:e,html:t,label:o}=this.originalFacadeButton;e.innerHTML=t,o===null?e.removeAttribute("aria-label"):e.setAttribute("aria-label",o),this.originalFacadeButton=null}getOrCreatePlayerDiv(e,t,o){return this.playerDiv||(this.playerDiv=document.createElement("div"),this.playerDiv.classList.add("podlove-player-host")),e.contains(this.playerDiv)||e.appendChild(this.playerDiv),this.playerDiv.id=t,o!==null?this.playerDiv.setAttribute("data-template",o):this.playerDiv.removeAttribute("data-template"),this.playerDiv}releaseReservedHeight(e){e instanceof HTMLElement&&(e.style.minHeight="0",e.style.removeProperty("border"),e.style.removeProperty("border-radius")),this.style.minHeight="0"}clearReservedHeight(e){e instanceof HTMLElement&&(e.style.removeProperty("min-height"),e.style.removeProperty("border"),e.style.removeProperty("border-radius")),this.style.removeProperty("min-height")}}customElements.define("podlove-player",C);_=S();const K=new MutationObserver(()=>{const l=S();l!==_&&(_=l,document.querySelectorAll("podlove-player").forEach(r=>{r instanceof C&&r.reinitializePlayer()}))});K.observe(document.documentElement,{attributes:!0,attributeFilter:["data-bs-theme","data-theme"]});const B=()=>{document.body&&K.observe(document.body,{attributes:!0,attributeFilter:["data-bs-theme","data-theme"]})};document.body?B():window.addEventListener("DOMContentLoaded",B,{once:!0});typeof document!="undefined"&&document.addEventListener("htmx:beforeRequest",he,!0);
