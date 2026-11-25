var Z=Object.defineProperty;var ee=(a,r,e)=>r in a?Z(a,r,{enumerable:!0,configurable:!0,writable:!0,value:e}):a[r]=e;var d=(a,r,e)=>ee(a,typeof r!="symbol"?r+"":r,e);let I=null,S=null,V=0,P=null,b=null,M=!1;const L=new Map;let D=null;const te=1e4,F="data-podlove-embed",$="data-podlove-embed-loaded",z="data-podlove-embed-failed",B="podlove-player-styles",N="color_scheme",re="#292524",oe="#ffffff",Y=297,j=312,ie=100,ae=900,le=2500,ne=8e3,g="data-cast-iframe-masked",E="data-cast-mask-active",C="podlove-player-reveal-shield",se=80,de=180,G=120,X="#paging-area",ce=".pagination a, .cast-pagination a",A="data-cast-paging-remask",ue=1600,he="data-cast-paging-mask-active",pe=50,_=new WeakMap;function ye(){return document.readyState==="complete"?Promise.resolve():(P||(P=new Promise(a=>{window.addEventListener("load",()=>a(),{once:!0})})),P)}function k(a){const r=a?"--cast-bg-alt":"--cast-surface",e=a?re:oe;return getComputedStyle(document.documentElement).getPropertyValue(r).trim()||e}const T="podlove-player-facade-btn",R="podlove-player-facade-loading";function Q(a,r){for(const e of a){if(r!==b)return;const t=e.target;!e.isIntersecting||!(t instanceof H)||!t.isConnected||L.get(t)!==r||(L.delete(t),r.unobserve(t),t.showFacade())}}function me(){if(b)return b;if(typeof IntersectionObserver!="function")return null;try{b=new IntersectionObserver(Q)}catch(a){return null}return b}function U(a){const r=a.observer;a.observer=null,L.delete(a),r==null||r.unobserve(a),!(!r||r!==b)&&(Q(r.takeRecords(),r),r.disconnect(),b=null,!M&&(M=!0,queueMicrotask(()=>{M=!1;for(const[e,t]of L)t!==b&&e.observeElement()})))}function ve(a){const r=new URL(a,document.baseURI);r.hash="";const e=document.querySelector(`script[${F}]`);if(I===null&&e){const t=new URL(e.src,document.baseURI);t.hash="",I=t.href}if(I!==null&&I!==r.href)throw new Error("A different Podlove embed implementation already owns this document.");return I=r.href,r.href}function fe(a){if(typeof podlovePlayer=="function")return Promise.resolve();const r=document.querySelector(`script[${$}="true"]`);if(r&&(r.remove(),S=null),S)return S;const e=new Promise((t,o)=>{let i=document.querySelector(`script[${F}]`);(i==null?void 0:i.getAttribute(z))==="true"&&(i.remove(),i=null);const n=!i,s=i!=null?i:document.createElement("script");let m=!1;const u=()=>{clearTimeout(h),s.removeEventListener("load",p),s.removeEventListener("error",f)},v=l=>{m||(m=!0,u(),s.setAttribute(z,"true"),s.remove(),o(new Error(l)))},p=()=>{if(!m){if(typeof podlovePlayer!="function"){v("Podlove embed script did not register.");return}m=!0,u(),s.setAttribute($,"true"),t()}},f=()=>v("Failed to load Podlove embed script"),h=setTimeout(()=>v("Podlove embed script load timed out"),te);s.addEventListener("load",p),s.addEventListener("error",f),n&&(s.src=a,s.async=!0,s.setAttribute(F,"true"),document.head.appendChild(s))}).catch(t=>{throw S===e&&(S=null),t});return S=e,S}function w(){var r,e;const a=document.documentElement.getAttribute("data-bs-theme")||document.documentElement.getAttribute("data-theme")||((r=document.body)==null?void 0:r.getAttribute("data-bs-theme"))||((e=document.body)==null?void 0:e.getAttribute("data-theme"));return a==="light"||a==="dark"?a:typeof window.matchMedia=="function"&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":null}function be(a){const r=w();if(!r)return a;const e=a.indexOf("#"),t=e===-1?a:a.slice(0,e),o=e===-1?"":a.slice(e),i=t.indexOf("?"),n=i===-1?"":t.slice(i);if(new URLSearchParams(n).has(N))return a;let s="";return i===-1?s="?":n.length>1&&!n.endsWith("&")&&(s="&"),`${t}${s}${N}=${r}${o}`}function K(){return typeof window.matchMedia=="function"&&window.matchMedia("(max-width: 768px)").matches?j:Y}function ge(a,r){window.clearTimeout(_.get(r)),r.setAttribute(A,"true"),r.setAttribute(g,"true"),r.style.opacity="0",r.style.pointerEvents="none",r.style.backgroundColor="inherit",r.style.colorScheme="inherit",a.setAttribute(E,"true");const e=window.setTimeout(()=>{_.delete(r),!(!r.isConnected||r.getAttribute(A)!=="true")&&(r.removeAttribute(A),r.getAttribute(g)==="true"&&r.removeAttribute(g),r.style.opacity="1",r.style.pointerEvents="",r.style.removeProperty("background-color"),r.style.removeProperty("color-scheme"),a.querySelector(`iframe[${g}="true"]`)||a.removeAttribute(E))},ue);_.set(r,e)}function Se(a){const r=a.target;if(!(r instanceof Element)||!r.closest(ce))return;const e=document.querySelector(X);e&&e.querySelectorAll(".podlove-player-container").forEach(t=>{t instanceof HTMLElement&&t.querySelectorAll("iframe").forEach(o=>{o instanceof HTMLIFrameElement&&(o.getAttribute(g)==="true"&&o.getAttribute(A)!=="true"||ge(t,o))})})}class H extends HTMLElement{constructor(){super();d(this,"observer");d(this,"isInitialized");d(this,"playerDiv");d(this,"initVersion");d(this,"iframeObserver");d(this,"iframeRevealDelayTimeoutId");d(this,"iframeRevealTimeoutId");d(this,"iframeRevealShieldTimeoutId");d(this,"facadeAbortController");d(this,"connectionVersion",0);d(this,"sourceUpdateVersion",0);d(this,"sourceUpdatePending",!1);d(this,"restartAfterSourceUpdate",!1);d(this,"connectionStarted",!1);d(this,"retryShouldFocus",!1);d(this,"originalFacadeButton",null);d(this,"facadeSnapshot",null);this.observer=null,this.isInitialized=!1,this.playerDiv=null,this.initVersion=0,this.iframeObserver=null,this.iframeRevealDelayTimeoutId=null,this.iframeRevealTimeoutId=null,this.iframeRevealShieldTimeoutId=null,this.facadeAbortController=null}isFacadeMode(){return this.getAttribute("data-load-mode")==="facade"}reinitializePlayer(){if(!this.isInitialized||!this.isConnected)return;this.clearIframeMasking(),this.playerDiv&&(this.playerDiv.remove(),this.playerDiv=null);const e=this.querySelector(".podlove-player-container");e instanceof HTMLElement&&e.style.removeProperty("min-height"),this.style.removeProperty("min-height"),this.isInitialized=!1,delete this.dataset.playerInstanceId,this.initializePlayer()}static get observedAttributes(){return["data-url","data-config","data-template","data-embed"]}attributeChangedCallback(e,t,o){if(t===o||!this.isConnected||!this.connectionStarted)return;this.restartAfterSourceUpdate||(this.restartAfterSourceUpdate=this.isInitialized),this.sourceUpdatePending=!0,this.initVersion+=1,this.connectionVersion+=1;const i=++this.sourceUpdateVersion;queueMicrotask(()=>{if(!this.isConnected||i!==this.sourceUpdateVersion)return;const n=this.restartAfterSourceUpdate;this.retirePlayer(),this.connectPlayer(),n&&(this.isFacadeMode()?this.handleFacadeLoad():this.initializePlayer())})}connectedCallback(){this.connectionStarted=!0,this.connectPlayer()}connectPlayer(){const e=++this.connectionVersion;if(this.renderPlaceholder(),this.isFacadeMode()){this.captureFacadeSnapshot(),this.setupFacadeInteraction();return}if(document.readyState==="complete"){this.observeElement();return}ye().then(()=>{this.isConnected&&this.connectionVersion===e&&this.observeElement()})}disconnectedCallback(){this.connectionStarted=!1,this.retirePlayer()}retirePlayer(){var o,i,n,s;this.sourceUpdatePending=!1,this.restartAfterSourceUpdate=!1,this.sourceUpdateVersion+=1,this.connectionVersion+=1,this.initVersion+=1,U(this),this.facadeAbortController&&(this.facadeAbortController.abort(),this.facadeAbortController=null),this.clearIframeMasking(),this.restoreFacadeButton(),(o=this.querySelector(".podlove-player-error"))==null||o.remove(),this.retryShouldFocus=!1,(i=this.querySelector(`.${R}`))==null||i.remove(),(n=this.querySelector(`.${T}`))==null||n.remove();const e=this.querySelector(".podlove-facade-inner");e instanceof HTMLElement&&(e.style.removeProperty("position"),e.style.removeProperty("inset"),e.style.removeProperty("z-index"),e.style.removeProperty("padding"));const t=this.querySelector(".podlove-player-container");t instanceof HTMLElement&&(this.isFacadeMode()&&t.classList.add("podlove-facade"),t.classList.remove("is-loading"),t.style.removeProperty("min-height")),this.style.removeProperty("min-height"),(s=this.playerDiv)==null||s.remove(),this.playerDiv=null,this.restoreFacadeSnapshot(),delete this.dataset.playerInstanceId,this.isInitialized=!1}captureFacadeSnapshot(){if(this.facadeSnapshot)return;const e=this.querySelector(".podlove-player-container");e!=null&&e.querySelector(".podlove-facade-play")&&(this.facadeSnapshot=Array.from(e.childNodes,t=>t.cloneNode(!0)))}restoreFacadeSnapshot(){if(!this.isFacadeMode()||!this.facadeSnapshot)return;const e=this.querySelector(".podlove-player-container");!(e instanceof HTMLElement)||e.querySelector(".podlove-facade-play")||(e.replaceChildren(...this.facadeSnapshot.map(t=>t.cloneNode(!0))),e.style.removeProperty("border"),e.style.removeProperty("border-radius"),e.style.removeProperty("color-scheme"))}clearIframeMasking(){this.iframeObserver&&(this.iframeObserver.disconnect(),this.iframeObserver=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.iframeRevealShieldTimeoutId!==null&&(window.clearTimeout(this.iframeRevealShieldTimeoutId),this.iframeRevealShieldTimeoutId=null),this.querySelectorAll(".podlove-player-container").forEach(e=>{e instanceof HTMLElement&&(e.removeAttribute(E),e.querySelectorAll(`.${C}`).forEach(t=>{t.remove()}))})}applyReservedHeight(e){const t=`${K()}px`;e.style.minHeight=t,this.style.minHeight=t}getOrCreateRevealShield(e){const t=e.querySelector(`.${C}`);if(t instanceof HTMLDivElement)return t.style.backgroundColor=e.style.backgroundColor||window.getComputedStyle(e).backgroundColor,t.style.opacity="1",t;const o=document.createElement("div");return o.classList.add(C),o.style.backgroundColor=e.style.backgroundColor||window.getComputedStyle(e).backgroundColor,o.style.opacity="1",e.appendChild(o),o}scheduleRevealShieldRelease(e,t){this.iframeRevealShieldTimeoutId!==null&&(window.clearTimeout(this.iframeRevealShieldTimeoutId),this.iframeRevealShieldTimeoutId=null);const o=this.getOrCreateRevealShield(e),i=e.style.colorScheme==="dark"?de:se;this.iframeRevealShieldTimeoutId=window.setTimeout(()=>{this.initVersion===t&&(this.releaseReservedHeight(e),o.style.opacity="0",this.iframeRevealShieldTimeoutId=window.setTimeout(()=>{this.initVersion===t&&(o.remove(),this.iframeRevealShieldTimeoutId=null)},G))},i)}maskIframeUntilReady(e,t){if(!(e instanceof HTMLElement))return;this.clearIframeMasking(),e.setAttribute(E,"true");const o=e.style.colorScheme==="dark"?ae:ie,i=new WeakSet;let n=null;const s=()=>{const l=document.querySelector(X);return(l==null?void 0:l.getAttribute(he))==="true"},m=l=>l.getAttribute(A)==="true"?!0:s(),u=l=>{var y,c;if(this.initVersion===t&&!(l!==n||!e.contains(l))){if(m(l)){this.iframeRevealDelayTimeoutId!==null&&window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=window.setTimeout(()=>u(l),pe);return}(y=e.querySelector(".podlove-facade-inner"))==null||y.remove(),(c=this.querySelector(".podlove-facade-inner"))==null||c.remove(),l.style.opacity="1",l.style.pointerEvents="",l.style.removeProperty("transition"),l.style.removeProperty("background-color"),l.style.removeProperty("color-scheme"),l.removeAttribute(g),e.removeAttribute(E),this.scheduleRevealShieldRelease(e,t),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null)}},v=l=>{this.initVersion!==t||!this.isConnected||(this.iframeRevealDelayTimeoutId!==null&&window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=window.setTimeout(()=>u(l),o))},p=l=>{if(n=l,this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),l){const y=e.style.colorScheme==="dark"?ne:le;this.iframeRevealTimeoutId=window.setTimeout(()=>u(l),y)}},f=l=>{var x,O;if(i.has(l))return;i.add(l),p(l),this.getOrCreateRevealShield(e);const y=e.querySelector(`.${R}`);y&&y.remove();const c=e.querySelector(".podlove-facade-inner");c instanceof HTMLElement&&(c.style.position="absolute",c.style.inset="0",c.style.zIndex="1",c.style.padding="inherit"),(x=e.querySelector(".podlove-facade-content"))==null||x.remove(),(O=e.querySelector(".podlove-facade-play:not(.podlove-facade-inner .podlove-facade-play)"))==null||O.remove();const q=getComputedStyle(e);e.style.border=q.border,e.style.borderRadius=q.borderRadius,e.classList.remove("podlove-facade"),l.setAttribute(g,"true"),l.style.opacity="0",l.style.pointerEvents="none",l.style.transition="opacity 160ms ease",l.style.backgroundColor="inherit",l.style.colorScheme="inherit",l.addEventListener("load",()=>{n===l&&v(l)},{once:!0})},h=()=>{const l=e.querySelectorAll("iframe");if(l.forEach(c=>{c instanceof HTMLIFrameElement&&f(c)}),n&&e.contains(n))return;let y=null;l.forEach(c=>{i.has(c)&&c.getAttribute(g)==="true"&&c.getAttribute(A)!=="true"&&(y=c)}),y!==n&&p(y)};h(),this.iframeObserver=new MutationObserver(h),this.iframeObserver.observe(e,{childList:!0,subtree:!0})}applyLoadingTheme(e){if(!(e instanceof HTMLElement))return;const t=w()==="dark"?"dark":"light";e.style.backgroundColor=k(t==="dark"),e.style.colorScheme=t}ensurePlayerStyles(){if(document.getElementById(B))return;const e=document.createElement("style");e.id=B;const t=k(!0),o=k(!1);e.textContent=`
      podlove-player .podlove-player-container {
        width: 100%;
        max-width: 936px;
        margin: 0 auto;
        position: relative;
        overflow: hidden;
        background-color: var(--cast-surface, ${o});
      }
      podlove-player .podlove-player-container:not(.podlove-facade) {
        min-height: ${Y}px;
      }
      @media (max-width: 768px) {
        podlove-player .podlove-player-container {
          max-width: 366px;
        }
        podlove-player .podlove-player-container:not(.podlove-facade) {
          min-height: ${j}px;
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
      podlove-player .podlove-player-container .${C} {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 2;
        opacity: 1;
        transition: opacity ${G}ms ease;
      }
      podlove-player .podlove-player-container[${E}="true"] iframe {
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
    `,document.head.appendChild(e)}renderPlaceholder(){if(this.ensurePlayerStyles(),this.querySelector(".podlove-player-container"))return;const e=document.createElement("div");e.classList.add("podlove-player-container"),this.applyLoadingTheme(e),this.applyReservedHeight(e),this.appendChild(e)}observeElement(){if(!this.isConnected)return;const e=me();if(!e){U(this),this.showFacade();return}this.observer=e,L.set(this,e),e.observe(this)}setupFacadeInteraction(){const e=this.querySelector(".podlove-player-container");if(!e||!(e instanceof HTMLElement))return;const t=e.querySelector(".podlove-facade-play");this.facadeAbortController=new AbortController;const o=this.facadeAbortController.signal,i=()=>{this.facadeAbortController&&(this.facadeAbortController.abort(),this.facadeAbortController=null),this.handleFacadeLoad()};e.addEventListener("mouseenter",i,{once:!0,signal:o}),e.addEventListener("touchstart",i,{once:!0,passive:!0,signal:o}),t&&(t.addEventListener("focus",i,{once:!0,signal:o}),t.addEventListener("click",i,{once:!0,signal:o}))}handleFacadeLoad(){var n;if(this.isInitialized||!this.isConnected)return;const e=this.querySelector(".podlove-player-container");if(!e||!(e instanceof HTMLElement))return;this.retryShouldFocus=document.activeElement===e.querySelector(".podlove-facade-play"),this.restoreFacadeButton(),(n=this.querySelector(".podlove-player-error"))==null||n.remove();const t=e.getBoundingClientRect().height,o=Math.max(t,K());e.style.minHeight=`${o}px`,this.style.minHeight=`${o}px`,e.classList.add("is-loading");const i=document.createElement("div");i.className=R,e.appendChild(i),this.initializePlayer()}showFacade(e=!1){if(!this.isConnected||this.isInitialized||!this.getAttribute("data-url"))return;const t=this.querySelector(".podlove-player-container");if(!t||t.querySelector(`.${T}`))return;const o=document.createElement("button");o.type="button",o.className=T,o.setAttribute("aria-label",e?"Retry loading player":"Play"),e?(o.classList.add("podlove-player-retry-btn"),o.textContent="Retry loading player"):o.innerHTML='<svg viewBox="0 0 24 24" width="28" height="28" fill="white" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',o.addEventListener("click",()=>this.handleFacadeClick(),{once:!0}),t.appendChild(o)}handleFacadeClick(){var i;if(this.isInitialized||!this.isConnected||!this.getAttribute("data-url"))return;const e=this.querySelector(".podlove-player-container");if(!e)return;const t=e.querySelector(`.${T}`);this.retryShouldFocus=document.activeElement===t,(i=this.querySelector(".podlove-player-error"))==null||i.remove(),t&&t.remove();const o=document.createElement("div");o.className=R,e.appendChild(o),this.initializePlayer()}initializePlayer(){var f;if(this.sourceUpdatePending){this.restartAfterSourceUpdate=!0;return}if(this.isInitialized||!this.isConnected)return;const e=this.querySelector(".podlove-player-container");if(!e)return;e instanceof HTMLElement&&!this.isFacadeMode()&&this.applyReservedHeight(e),this.isFacadeMode()?e instanceof HTMLElement&&(e.style.colorScheme=w()==="dark"?"dark":"light"):this.applyLoadingTheme(e);let t=this.getAttribute("id");t||(t=`podlove-player-${Date.now()}`,this.setAttribute("id",t)),this.dataset.playerInstanceId||(V+=1,this.dataset.playerInstanceId=String(V));const o=`${t}-player-${this.dataset.playerInstanceId}`,i=this.getAttribute("data-url");if(!i)return;this.isInitialized=!0,(f=e.querySelector(`.${T}`))==null||f.remove(),this.initVersion+=1;const n=this.initVersion;let s=this.getAttribute("data-config")||"/api/audios/player_config/";s=be(s);const m=this.getAttribute("data-template");let u=this.getAttribute("data-embed")||"https://cdn.podlove.org/web-player/5.x/embed.js";const v=this.getOrCreatePlayerDiv(e,o,m),p=()=>{if(!(n!==this.initVersion||!this.isConnected)){try{if(typeof podlovePlayer!="function")throw new Error("Podlove embed script did not register.");podlovePlayer(v,i,s)}catch(h){this.recoverInitialization(e,n);return}n===this.initVersion&&this.isConnected&&this.maskIframeUntilReady(e,n)}};try{u=ve(u)}catch(h){this.recoverInitialization(e,n);return}typeof podlovePlayer=="function"?p():fe(u).then(p,()=>{this.recoverInitialization(e,n)})}recoverInitialization(e,t){var u,v,p,f;if(t!==this.initVersion||!this.isConnected)return;this.isInitialized=!1,this.clearReservedHeight(e),e.classList.remove("is-loading"),(u=this.querySelector(`.${R}`))==null||u.remove(),(v=this.playerDiv)==null||v.remove(),this.playerDiv=null,(p=this.facadeAbortController)==null||p.abort(),this.facadeAbortController=null;const o=document.createElement("p");o.className="podlove-player-error",o.setAttribute("role","alert"),o.textContent="Player failed to load. Please retry.",(f=this.querySelector(".podlove-player-error"))==null||f.remove(),e.appendChild(o);const i=e.querySelector(".podlove-facade-inner");this.isFacadeMode()&&i instanceof HTMLElement&&(i.style.removeProperty("position"),i.style.removeProperty("inset"),i.style.removeProperty("z-index"),i.style.removeProperty("padding"),e.classList.add("podlove-facade"));const n=e.querySelector(".podlove-facade-play");n?(this.originalFacadeButton={button:n,html:n.innerHTML,label:n.getAttribute("aria-label")},n.textContent="Retry loading player",n.setAttribute("aria-label","Retry loading player"),this.facadeAbortController=new AbortController,n.addEventListener("click",()=>{var h;(h=this.facadeAbortController)==null||h.abort(),this.facadeAbortController=null,this.handleFacadeLoad()},{once:!0,signal:this.facadeAbortController.signal})):this.showFacade(!0);const s=document.activeElement,m=s===null||s===document.body||this.contains(s);if(this.retryShouldFocus&&m){const h=e.querySelector(".podlove-facade-play, .podlove-player-retry-btn");h==null||h.focus()}this.retryShouldFocus=!1}restoreFacadeButton(){if(!this.originalFacadeButton)return;const{button:e,html:t,label:o}=this.originalFacadeButton;e.innerHTML=t,o===null?e.removeAttribute("aria-label"):e.setAttribute("aria-label",o),this.originalFacadeButton=null}getOrCreatePlayerDiv(e,t,o){return this.playerDiv||(this.playerDiv=document.createElement("div"),this.playerDiv.classList.add("podlove-player-host")),e.contains(this.playerDiv)||e.appendChild(this.playerDiv),this.playerDiv.id=t,o!==null?this.playerDiv.setAttribute("data-template",o):this.playerDiv.removeAttribute("data-template"),this.playerDiv}releaseReservedHeight(e){e instanceof HTMLElement&&(e.style.minHeight="0",e.style.removeProperty("border"),e.style.removeProperty("border-radius")),this.style.minHeight="0"}clearReservedHeight(e){e instanceof HTMLElement&&(e.style.removeProperty("min-height"),e.style.removeProperty("border"),e.style.removeProperty("border-radius")),this.style.removeProperty("min-height")}}customElements.define("podlove-player",H);D=w();const J=new MutationObserver(()=>{const a=w();a!==D&&(D=a,document.querySelectorAll("podlove-player").forEach(r=>{if(r instanceof H&&!r.isInitialized){const e=r.querySelector(".podlove-player-container");e&&!r.isFacadeMode()&&r.applyLoadingTheme(e)}}))});J.observe(document.documentElement,{attributes:!0,attributeFilter:["data-bs-theme","data-theme"]});const W=()=>{document.body&&J.observe(document.body,{attributes:!0,attributeFilter:["data-bs-theme","data-theme"]})};document.body?W():window.addEventListener("DOMContentLoaded",W,{once:!0});typeof document!="undefined"&&document.addEventListener("htmx:beforeSend",Se,!0);
