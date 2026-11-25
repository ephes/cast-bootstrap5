var Z=Object.defineProperty;var ee=(i,r,e)=>r in i?Z(i,r,{enumerable:!0,configurable:!0,writable:!0,value:e}):i[r]=e;var d=(i,r,e)=>ee(i,typeof r!="symbol"?r+"":r,e);let E=null,b=null,O=0,C=null,f=null,P=!1;const R=new Map;let k=null;const te=1e4,D="data-podlove-embed",V="data-podlove-embed-loaded",$="data-podlove-embed-failed",z="podlove-player-styles",B="color_scheme",re="#292524",oe="#ffffff",W=297,Y=312,ie=100,ae=900,le=2500,ne=8e3,g="data-cast-iframe-masked",S="data-cast-mask-active",w="podlove-player-reveal-shield",se=80,de=180,N=120,j="#paging-area",ce=".pagination a, .cast-pagination a",T="data-cast-paging-remask",ue=1600,he="data-cast-paging-mask-active",pe=50,M=new WeakMap;function ye(){return document.readyState==="complete"?Promise.resolve():(C||(C=new Promise(i=>{window.addEventListener("load",()=>i(),{once:!0})})),C)}function _(i){const r=i?"--cast-bg-alt":"--cast-surface",e=i?re:oe;return getComputedStyle(document.documentElement).getPropertyValue(r).trim()||e}const A="podlove-player-facade-btn",I="podlove-player-facade-loading";function X(i,r){for(const e of i){if(r!==f)return;const t=e.target;!e.isIntersecting||!(t instanceof F)||!t.isConnected||R.get(t)!==r||(R.delete(t),r.unobserve(t),t.showFacade())}}function me(){if(f)return f;if(typeof IntersectionObserver!="function")return null;try{f=new IntersectionObserver(X)}catch(i){return null}return f}function G(i){const r=i.observer;i.observer=null,R.delete(i),r==null||r.unobserve(i),!(!r||r!==f)&&(X(r.takeRecords(),r),r.disconnect(),f=null,!P&&(P=!0,queueMicrotask(()=>{P=!1;for(const[e,t]of R)t!==f&&e.observeElement()})))}function ve(i){const r=new URL(i,document.baseURI);r.hash="";const e=document.querySelector(`script[${D}]`);if(E===null&&e){const t=new URL(e.src,document.baseURI);t.hash="",E=t.href}if(E!==null&&E!==r.href)throw new Error("A different Podlove embed implementation already owns this document.");return E=r.href,r.href}function fe(i){if(typeof podlovePlayer=="function")return Promise.resolve();const r=document.querySelector(`script[${V}="true"]`);if(r&&(r.remove(),b=null),b)return b;const e=new Promise((t,o)=>{let a=document.querySelector(`script[${D}]`);(a==null?void 0:a.getAttribute($))==="true"&&(a.remove(),a=null);const n=!a,s=a!=null?a:document.createElement("script");let h=!1;const c=()=>{clearTimeout(l),s.removeEventListener("load",y),s.removeEventListener("error",u)},p=m=>{h||(h=!0,c(),s.setAttribute($,"true"),s.remove(),o(new Error(m)))},y=()=>{if(!h){if(typeof podlovePlayer!="function"){p("Podlove embed script did not register.");return}h=!0,c(),s.setAttribute(V,"true"),t()}},u=()=>p("Failed to load Podlove embed script"),l=setTimeout(()=>p("Podlove embed script load timed out"),te);s.addEventListener("load",y),s.addEventListener("error",u),n&&(s.src=i,s.async=!0,s.setAttribute(D,"true"),document.head.appendChild(s))}).catch(t=>{throw b===e&&(b=null),t});return b=e,b}function L(){var r,e;const i=document.documentElement.getAttribute("data-bs-theme")||document.documentElement.getAttribute("data-theme")||((r=document.body)==null?void 0:r.getAttribute("data-bs-theme"))||((e=document.body)==null?void 0:e.getAttribute("data-theme"));return i==="light"||i==="dark"?i:typeof window.matchMedia=="function"&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":null}function be(i){const r=L();if(!r)return i;const e=i.indexOf("#"),t=e===-1?i:i.slice(0,e),o=e===-1?"":i.slice(e),a=t.indexOf("?"),n=a===-1?"":t.slice(a);if(new URLSearchParams(n).has(B))return i;let s="";return a===-1?s="?":n.length>1&&!n.endsWith("&")&&(s="&"),`${t}${s}${B}=${r}${o}`}function U(){return typeof window.matchMedia=="function"&&window.matchMedia("(max-width: 768px)").matches?Y:W}function ge(i,r){window.clearTimeout(M.get(r)),r.setAttribute(T,"true"),r.setAttribute(g,"true"),r.style.opacity="0",r.style.pointerEvents="none",r.style.backgroundColor="inherit",r.style.colorScheme="inherit",i.setAttribute(S,"true");const e=window.setTimeout(()=>{M.delete(r),!(!r.isConnected||r.getAttribute(T)!=="true")&&(r.removeAttribute(T),r.getAttribute(g)==="true"&&r.removeAttribute(g),r.style.opacity="1",r.style.pointerEvents="",r.style.removeProperty("background-color"),r.style.removeProperty("color-scheme"),i.querySelector(`iframe[${g}="true"]`)||i.removeAttribute(S))},ue);M.set(r,e)}function Se(i){const r=i.target;if(!(r instanceof Element)||!r.closest(ce))return;const e=document.querySelector(j);e&&e.querySelectorAll(".podlove-player-container").forEach(t=>{t instanceof HTMLElement&&t.querySelectorAll("iframe").forEach(o=>{o instanceof HTMLIFrameElement&&(o.getAttribute(g)==="true"&&o.getAttribute(T)!=="true"||ge(t,o))})})}class F extends HTMLElement{constructor(){super();d(this,"observer");d(this,"isInitialized");d(this,"playerDiv");d(this,"initVersion");d(this,"iframeObserver");d(this,"iframeRevealDelayTimeoutId");d(this,"iframeRevealTimeoutId");d(this,"iframeRevealShieldTimeoutId");d(this,"facadeAbortController");d(this,"connectionVersion",0);d(this,"sourceUpdateVersion",0);d(this,"sourceUpdatePending",!1);d(this,"restartAfterSourceUpdate",!1);d(this,"connectionStarted",!1);d(this,"retryShouldFocus",!1);d(this,"originalFacadeButton",null);d(this,"facadeSnapshot",null);this.observer=null,this.isInitialized=!1,this.playerDiv=null,this.initVersion=0,this.iframeObserver=null,this.iframeRevealDelayTimeoutId=null,this.iframeRevealTimeoutId=null,this.iframeRevealShieldTimeoutId=null,this.facadeAbortController=null}isFacadeMode(){return this.getAttribute("data-load-mode")==="facade"}reinitializePlayer(){if(!this.isInitialized||!this.isConnected)return;this.clearIframeMasking(),this.playerDiv&&(this.playerDiv.remove(),this.playerDiv=null);const e=this.querySelector(".podlove-player-container");e instanceof HTMLElement&&e.style.removeProperty("min-height"),this.style.removeProperty("min-height"),this.isInitialized=!1,delete this.dataset.playerInstanceId,this.initializePlayer()}static get observedAttributes(){return["data-url","data-config","data-template","data-embed"]}attributeChangedCallback(e,t,o){if(t===o||!this.isConnected||!this.connectionStarted)return;this.restartAfterSourceUpdate||(this.restartAfterSourceUpdate=this.isInitialized),this.sourceUpdatePending=!0,this.initVersion+=1,this.connectionVersion+=1;const a=++this.sourceUpdateVersion;queueMicrotask(()=>{if(!this.isConnected||a!==this.sourceUpdateVersion)return;const n=this.restartAfterSourceUpdate;this.retirePlayer(),this.connectPlayer(),n&&(this.isFacadeMode()?this.handleFacadeLoad():this.initializePlayer())})}connectedCallback(){this.connectionStarted=!0,this.connectPlayer()}connectPlayer(){const e=++this.connectionVersion;if(this.renderPlaceholder(),this.isFacadeMode()){this.captureFacadeSnapshot(),this.setupFacadeInteraction();return}if(document.readyState==="complete"){this.observeElement();return}ye().then(()=>{this.isConnected&&this.connectionVersion===e&&this.observeElement()})}disconnectedCallback(){this.connectionStarted=!1,this.retirePlayer()}retirePlayer(){var o,a,n,s;this.sourceUpdatePending=!1,this.restartAfterSourceUpdate=!1,this.sourceUpdateVersion+=1,this.connectionVersion+=1,this.initVersion+=1,G(this),this.facadeAbortController&&(this.facadeAbortController.abort(),this.facadeAbortController=null),this.clearIframeMasking(),this.restoreFacadeButton(),(o=this.querySelector(".podlove-player-error"))==null||o.remove(),this.retryShouldFocus=!1,(a=this.querySelector(`.${I}`))==null||a.remove(),(n=this.querySelector(`.${A}`))==null||n.remove();const e=this.querySelector(".podlove-facade-inner");e instanceof HTMLElement&&(e.style.removeProperty("position"),e.style.removeProperty("inset"),e.style.removeProperty("z-index"),e.style.removeProperty("padding"));const t=this.querySelector(".podlove-player-container");t instanceof HTMLElement&&(this.isFacadeMode()&&t.classList.add("podlove-facade"),t.classList.remove("is-loading"),t.style.removeProperty("min-height")),this.style.removeProperty("min-height"),(s=this.playerDiv)==null||s.remove(),this.playerDiv=null,this.restoreFacadeSnapshot(),delete this.dataset.playerInstanceId,this.isInitialized=!1}captureFacadeSnapshot(){if(this.facadeSnapshot)return;const e=this.querySelector(".podlove-player-container");e!=null&&e.querySelector(".podlove-facade-play")&&(this.facadeSnapshot=Array.from(e.childNodes,t=>t.cloneNode(!0)))}restoreFacadeSnapshot(){if(!this.isFacadeMode()||!this.facadeSnapshot)return;const e=this.querySelector(".podlove-player-container");!(e instanceof HTMLElement)||e.querySelector(".podlove-facade-play")||(e.replaceChildren(...this.facadeSnapshot.map(t=>t.cloneNode(!0))),e.style.removeProperty("border"),e.style.removeProperty("border-radius"),e.style.removeProperty("color-scheme"))}clearIframeMasking(){this.iframeObserver&&(this.iframeObserver.disconnect(),this.iframeObserver=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.iframeRevealShieldTimeoutId!==null&&(window.clearTimeout(this.iframeRevealShieldTimeoutId),this.iframeRevealShieldTimeoutId=null),this.querySelectorAll(".podlove-player-container").forEach(e=>{e instanceof HTMLElement&&(e.removeAttribute(S),e.querySelectorAll(`.${w}`).forEach(t=>{t.remove()}))})}applyReservedHeight(e){const t=`${U()}px`;e.style.minHeight=t,this.style.minHeight=t}getOrCreateRevealShield(e){const t=e.querySelector(`.${w}`);if(t instanceof HTMLDivElement)return t.style.backgroundColor=e.style.backgroundColor||window.getComputedStyle(e).backgroundColor,t.style.opacity="1",t;const o=document.createElement("div");return o.classList.add(w),o.style.backgroundColor=e.style.backgroundColor||window.getComputedStyle(e).backgroundColor,o.style.opacity="1",e.appendChild(o),o}scheduleRevealShieldRelease(e,t){this.iframeRevealShieldTimeoutId!==null&&(window.clearTimeout(this.iframeRevealShieldTimeoutId),this.iframeRevealShieldTimeoutId=null);const o=this.getOrCreateRevealShield(e),a=e.style.colorScheme==="dark"?de:se;this.iframeRevealShieldTimeoutId=window.setTimeout(()=>{this.initVersion===t&&(this.releaseReservedHeight(e),o.style.opacity="0",this.iframeRevealShieldTimeoutId=window.setTimeout(()=>{this.initVersion===t&&(o.remove(),this.iframeRevealShieldTimeoutId=null)},N))},a)}maskIframeUntilReady(e,t){if(!(e instanceof HTMLElement))return;this.clearIframeMasking(),e.setAttribute(S,"true");const o=e.style.colorScheme==="dark"?ae:ie,a=new WeakSet;let n=null;const s=()=>{const l=document.querySelector(j);return(l==null?void 0:l.getAttribute(he))==="true"},h=l=>l.getAttribute(T)==="true"?!0:s(),c=l=>{var m,v;if(this.initVersion===t&&!(!(l instanceof HTMLIFrameElement)||!e.contains(l))){if(h(l)){this.iframeRevealDelayTimeoutId!==null&&window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=window.setTimeout(()=>c(l),pe);return}(m=e.querySelector(".podlove-facade-inner"))==null||m.remove(),(v=this.querySelector(".podlove-facade-inner"))==null||v.remove(),l.style.opacity="1",l.style.pointerEvents="",l.style.removeProperty("transition"),l.style.removeProperty("background-color"),l.style.removeProperty("color-scheme"),l.removeAttribute(g),e.removeAttribute(S),this.scheduleRevealShieldRelease(e,t),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null)}},p=l=>{this.initVersion!==t||!this.isConnected||(this.iframeRevealDelayTimeoutId!==null&&window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=window.setTimeout(()=>c(l),o))},y=l=>{var q,x;if(a.has(l))return;a.add(l),n=l,this.getOrCreateRevealShield(e);const m=e.querySelector(`.${I}`);m&&m.remove();const v=e.querySelector(".podlove-facade-inner");v instanceof HTMLElement&&(v.style.position="absolute",v.style.inset="0",v.style.zIndex="1",v.style.padding="inherit"),(q=e.querySelector(".podlove-facade-content"))==null||q.remove(),(x=e.querySelector(".podlove-facade-play:not(.podlove-facade-inner .podlove-facade-play)"))==null||x.remove();const H=getComputedStyle(e);e.style.border=H.border,e.style.borderRadius=H.borderRadius,e.classList.remove("podlove-facade"),l.setAttribute(g,"true"),l.style.opacity="0",l.style.pointerEvents="none",l.style.transition="opacity 160ms ease",l.style.backgroundColor="inherit",l.style.colorScheme="inherit",l.addEventListener("load",()=>{n===l&&p(l)},{once:!0}),this.iframeRevealTimeoutId!==null&&window.clearTimeout(this.iframeRevealTimeoutId);const J=e.style.colorScheme==="dark"?ne:le;this.iframeRevealTimeoutId=window.setTimeout(()=>c(n),J)},u=()=>{e.querySelectorAll("iframe").forEach(m=>{m instanceof HTMLIFrameElement&&y(m)})};u(),this.iframeObserver=new MutationObserver(()=>{u()}),this.iframeObserver.observe(e,{childList:!0,subtree:!0})}applyLoadingTheme(e){if(!(e instanceof HTMLElement))return;const t=L()==="dark"?"dark":"light";e.style.backgroundColor=_(t==="dark"),e.style.colorScheme=t}ensurePlayerStyles(){if(document.getElementById(z))return;const e=document.createElement("style");e.id=z;const t=_(!0),o=_(!1);e.textContent=`
      podlove-player .podlove-player-container {
        width: 100%;
        max-width: 936px;
        margin: 0 auto;
        position: relative;
        overflow: hidden;
        background-color: var(--cast-surface, ${o});
      }
      podlove-player .podlove-player-container:not(.podlove-facade) {
        min-height: ${W}px;
      }
      @media (max-width: 768px) {
        podlove-player .podlove-player-container {
          max-width: 366px;
        }
        podlove-player .podlove-player-container:not(.podlove-facade) {
          min-height: ${Y}px;
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
      podlove-player .podlove-player-container .${w} {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 2;
        opacity: 1;
        transition: opacity ${N}ms ease;
      }
      podlove-player .podlove-player-container[${S}="true"] iframe {
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
    `,document.head.appendChild(e)}renderPlaceholder(){if(this.ensurePlayerStyles(),this.querySelector(".podlove-player-container"))return;const e=document.createElement("div");e.classList.add("podlove-player-container"),this.applyLoadingTheme(e),this.applyReservedHeight(e),this.appendChild(e)}observeElement(){if(!this.isConnected)return;const e=me();if(!e){G(this),this.showFacade();return}this.observer=e,R.set(this,e),e.observe(this)}setupFacadeInteraction(){const e=this.querySelector(".podlove-player-container");if(!e||!(e instanceof HTMLElement))return;const t=e.querySelector(".podlove-facade-play");this.facadeAbortController=new AbortController;const o=this.facadeAbortController.signal,a=()=>{this.facadeAbortController&&(this.facadeAbortController.abort(),this.facadeAbortController=null),this.handleFacadeLoad()};e.addEventListener("mouseenter",a,{once:!0,signal:o}),e.addEventListener("touchstart",a,{once:!0,passive:!0,signal:o}),t&&(t.addEventListener("focus",a,{once:!0,signal:o}),t.addEventListener("click",a,{once:!0,signal:o}))}handleFacadeLoad(){var n;if(this.isInitialized||!this.isConnected)return;const e=this.querySelector(".podlove-player-container");if(!e||!(e instanceof HTMLElement))return;this.retryShouldFocus=document.activeElement===e.querySelector(".podlove-facade-play"),this.restoreFacadeButton(),(n=this.querySelector(".podlove-player-error"))==null||n.remove();const t=e.getBoundingClientRect().height,o=Math.max(t,U());e.style.minHeight=`${o}px`,this.style.minHeight=`${o}px`,e.classList.add("is-loading");const a=document.createElement("div");a.className=I,e.appendChild(a),this.initializePlayer()}showFacade(e=!1){if(!this.isConnected||this.isInitialized||!this.getAttribute("data-url"))return;const t=this.querySelector(".podlove-player-container");if(!t||t.querySelector(`.${A}`))return;const o=document.createElement("button");o.type="button",o.className=A,o.setAttribute("aria-label",e?"Retry loading player":"Play"),e?(o.classList.add("podlove-player-retry-btn"),o.textContent="Retry loading player"):o.innerHTML='<svg viewBox="0 0 24 24" width="28" height="28" fill="white" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',o.addEventListener("click",()=>this.handleFacadeClick(),{once:!0}),t.appendChild(o)}handleFacadeClick(){var a;if(this.isInitialized||!this.isConnected||!this.getAttribute("data-url"))return;const e=this.querySelector(".podlove-player-container");if(!e)return;const t=e.querySelector(`.${A}`);this.retryShouldFocus=document.activeElement===t,(a=this.querySelector(".podlove-player-error"))==null||a.remove(),t&&t.remove();const o=document.createElement("div");o.className=I,e.appendChild(o),this.initializePlayer()}initializePlayer(){var u;if(this.sourceUpdatePending){this.restartAfterSourceUpdate=!0;return}if(this.isInitialized||!this.isConnected)return;const e=this.querySelector(".podlove-player-container");if(!e)return;e instanceof HTMLElement&&!this.isFacadeMode()&&this.applyReservedHeight(e),this.isFacadeMode()?e instanceof HTMLElement&&(e.style.colorScheme=L()==="dark"?"dark":"light"):this.applyLoadingTheme(e);let t=this.getAttribute("id");t||(t=`podlove-player-${Date.now()}`,this.setAttribute("id",t)),this.dataset.playerInstanceId||(O+=1,this.dataset.playerInstanceId=String(O));const o=`${t}-player-${this.dataset.playerInstanceId}`,a=this.getAttribute("data-url");if(!a)return;this.isInitialized=!0,(u=e.querySelector(`.${A}`))==null||u.remove(),this.initVersion+=1;const n=this.initVersion;let s=this.getAttribute("data-config")||"/api/audios/player_config/";s=be(s);const h=this.getAttribute("data-template");let c=this.getAttribute("data-embed")||"https://cdn.podlove.org/web-player/5.x/embed.js";const p=this.getOrCreatePlayerDiv(e,o,h),y=()=>{if(!(n!==this.initVersion||!this.isConnected)){try{if(typeof podlovePlayer!="function")throw new Error("Podlove embed script did not register.");podlovePlayer(p,a,s)}catch(l){this.recoverInitialization(e,n);return}n===this.initVersion&&this.isConnected&&this.maskIframeUntilReady(e,n)}};try{c=ve(c)}catch(l){this.recoverInitialization(e,n);return}typeof podlovePlayer=="function"?y():fe(c).then(y,()=>{this.recoverInitialization(e,n)})}recoverInitialization(e,t){var c,p,y,u;if(t!==this.initVersion||!this.isConnected)return;this.isInitialized=!1,this.clearReservedHeight(e),e.classList.remove("is-loading"),(c=this.querySelector(`.${I}`))==null||c.remove(),(p=this.playerDiv)==null||p.remove(),this.playerDiv=null,(y=this.facadeAbortController)==null||y.abort(),this.facadeAbortController=null;const o=document.createElement("p");o.className="podlove-player-error",o.setAttribute("role","alert"),o.textContent="Player failed to load. Please retry.",(u=this.querySelector(".podlove-player-error"))==null||u.remove(),e.appendChild(o);const a=e.querySelector(".podlove-facade-inner");this.isFacadeMode()&&a instanceof HTMLElement&&(a.style.removeProperty("position"),a.style.removeProperty("inset"),a.style.removeProperty("z-index"),a.style.removeProperty("padding"),e.classList.add("podlove-facade"));const n=e.querySelector(".podlove-facade-play");n?(this.originalFacadeButton={button:n,html:n.innerHTML,label:n.getAttribute("aria-label")},n.textContent="Retry loading player",n.setAttribute("aria-label","Retry loading player"),this.facadeAbortController=new AbortController,n.addEventListener("click",()=>{var l;(l=this.facadeAbortController)==null||l.abort(),this.facadeAbortController=null,this.handleFacadeLoad()},{once:!0,signal:this.facadeAbortController.signal})):this.showFacade(!0);const s=document.activeElement,h=s===null||s===document.body||this.contains(s);if(this.retryShouldFocus&&h){const l=e.querySelector(".podlove-facade-play, .podlove-player-retry-btn");l==null||l.focus()}this.retryShouldFocus=!1}restoreFacadeButton(){if(!this.originalFacadeButton)return;const{button:e,html:t,label:o}=this.originalFacadeButton;e.innerHTML=t,o===null?e.removeAttribute("aria-label"):e.setAttribute("aria-label",o),this.originalFacadeButton=null}getOrCreatePlayerDiv(e,t,o){return this.playerDiv||(this.playerDiv=document.createElement("div"),this.playerDiv.classList.add("podlove-player-host")),e.contains(this.playerDiv)||e.appendChild(this.playerDiv),this.playerDiv.id=t,o!==null?this.playerDiv.setAttribute("data-template",o):this.playerDiv.removeAttribute("data-template"),this.playerDiv}releaseReservedHeight(e){e instanceof HTMLElement&&(e.style.minHeight="0",e.style.removeProperty("border"),e.style.removeProperty("border-radius")),this.style.minHeight="0"}clearReservedHeight(e){e instanceof HTMLElement&&(e.style.removeProperty("min-height"),e.style.removeProperty("border"),e.style.removeProperty("border-radius")),this.style.removeProperty("min-height")}}customElements.define("podlove-player",F);k=L();const Q=new MutationObserver(()=>{const i=L();i!==k&&(k=i,document.querySelectorAll("podlove-player").forEach(r=>{if(r instanceof F&&!r.isInitialized){const e=r.querySelector(".podlove-player-container");e&&!r.isFacadeMode()&&r.applyLoadingTheme(e)}}))});Q.observe(document.documentElement,{attributes:!0,attributeFilter:["data-bs-theme","data-theme"]});const K=()=>{document.body&&Q.observe(document.body,{attributes:!0,attributeFilter:["data-bs-theme","data-theme"]})};document.body?K():window.addEventListener("DOMContentLoaded",K,{once:!0});typeof document!="undefined"&&document.addEventListener("htmx:beforeSend",Se,!0);
