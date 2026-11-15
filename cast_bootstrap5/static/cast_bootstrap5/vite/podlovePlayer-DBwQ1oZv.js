var X=Object.defineProperty;var J=(a,o,e)=>o in a?X(a,o,{enumerable:!0,configurable:!0,writable:!0,value:e}):a[o]=e;var d=(a,o,e)=>J(a,typeof o!="symbol"?o+"":o,e);let A=null,f=null,q=0,P=null,g=null;const T=new Map;let M=null;const Q=1e4,_="data-podlove-embed",x="data-podlove-embed-loaded",O="data-podlove-embed-failed",V="podlove-player-styles",$="color_scheme",Z="#292524",ee="#ffffff",U=297,G=312,te=100,oe=900,re=2500,ie=8e3,E="data-cast-iframe-masked",S="data-cast-mask-active",L="podlove-player-reveal-shield",ae=80,le=180,z=120,K="#paging-area",ne=".pagination a, .cast-pagination a",b="data-cast-paging-remask",se=1600,de="data-cast-paging-mask-active",ce=50;function ue(){return document.readyState==="complete"?Promise.resolve():(P||(P=new Promise(a=>{window.addEventListener("load",()=>a(),{once:!0})})),P)}function w(a){const o=a?"--cast-bg-alt":"--cast-surface",e=a?Z:ee;return getComputedStyle(document.documentElement).getPropertyValue(o).trim()||e}const C="podlove-player-facade-btn",I="podlove-player-facade-loading";function Y(a,o){for(const e of a){const t=e.target;!e.isIntersecting||!(t instanceof k)||!t.isConnected||T.get(t)!==o||(T.delete(t),o.unobserve(t),t.showFacade())}}function pe(){return g!=null||(g=new IntersectionObserver(Y)),g}function he(a){const o=a.observer;if(a.observer=null,T.delete(a),o==null||o.unobserve(a),!(!o||o!==g)){Y(o.takeRecords(),o),o.disconnect(),g=null;for(const e of T.keys())e.observeElement()}}function ye(a){const o=new URL(a,document.baseURI);o.hash="";const e=document.querySelector(`script[${_}]`);if(A===null&&e){const t=new URL(e.src,document.baseURI);t.hash="",A=t.href}if(A!==null&&A!==o.href)throw new Error("A different Podlove embed implementation already owns this document.");return A=o.href,o.href}function me(a){if(typeof podlovePlayer=="function")return Promise.resolve();const o=document.querySelector(`script[${x}="true"]`);if(o&&(o.remove(),f=null),f)return f;const e=new Promise((t,r)=>{let i=document.querySelector(`script[${_}]`);(i==null?void 0:i.getAttribute(O))==="true"&&(i.remove(),i=null);const n=!i,s=i!=null?i:document.createElement("script");let u=!1;const c=()=>{clearTimeout(l),s.removeEventListener("load",h),s.removeEventListener("error",y)},p=m=>{u||(u=!0,c(),s.setAttribute(O,"true"),s.remove(),r(new Error(m)))},h=()=>{if(!u){if(typeof podlovePlayer!="function"){p("Podlove embed script did not register.");return}u=!0,c(),s.setAttribute(x,"true"),t()}},y=()=>p("Failed to load Podlove embed script"),l=setTimeout(()=>p("Podlove embed script load timed out"),Q);s.addEventListener("load",h),s.addEventListener("error",y),n&&(s.src=a,s.async=!0,s.setAttribute(_,"true"),document.head.appendChild(s))}).catch(t=>{throw f===e&&(f=null),t});return f=e,f}function R(){var o,e;const a=document.documentElement.getAttribute("data-bs-theme")||document.documentElement.getAttribute("data-theme")||((o=document.body)==null?void 0:o.getAttribute("data-bs-theme"))||((e=document.body)==null?void 0:e.getAttribute("data-theme"));return a==="light"||a==="dark"?a:typeof window.matchMedia=="function"&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":null}function ve(a){const o=R();if(!o)return a;const e=a.indexOf("#"),t=e===-1?a:a.slice(0,e),r=e===-1?"":a.slice(e+1),i=t.indexOf("?"),n=i===-1?t:t.slice(0,i),s=i===-1?"":t.slice(i+1),u=new URLSearchParams(s);u.has($)||u.set($,o);const c=u.toString(),p=r?`#${r}`:"";return c?`${n}?${c}${p}`:`${n}${p}`}function B(){return typeof window.matchMedia=="function"&&window.matchMedia("(max-width: 768px)").matches?G:U}function fe(a,o){o.getAttribute(b)!=="true"&&(o.setAttribute(b,"true"),o.setAttribute(E,"true"),o.style.opacity="0",o.style.pointerEvents="none",o.style.backgroundColor="inherit",o.style.colorScheme="inherit",a.setAttribute(S,"true"),window.setTimeout(()=>{!o.isConnected||o.getAttribute(b)!=="true"||(o.removeAttribute(b),o.getAttribute(E)==="true"&&o.removeAttribute(E),o.style.opacity="1",o.style.pointerEvents="",o.style.removeProperty("background-color"),o.style.removeProperty("color-scheme"),a.querySelector(`iframe[${b}="true"]`)||a.removeAttribute(S))},se))}function be(a){const o=a.target;if(!(o instanceof Element)||!o.closest(ne))return;const e=document.querySelector(K);e&&e.querySelectorAll(".podlove-player-container").forEach(t=>{t instanceof HTMLElement&&t.querySelectorAll("iframe").forEach(r=>{r instanceof HTMLIFrameElement&&r.getAttribute(E)!=="true"&&fe(t,r)})})}class k extends HTMLElement{constructor(){super();d(this,"observer");d(this,"isInitialized");d(this,"playerDiv");d(this,"initVersion");d(this,"iframeObserver");d(this,"iframeRevealDelayTimeoutId");d(this,"iframeRevealTimeoutId");d(this,"iframeRevealShieldTimeoutId");d(this,"facadeAbortController");d(this,"connectionVersion",0);d(this,"sourceUpdateVersion",0);d(this,"sourceUpdatePending",!1);d(this,"restartAfterSourceUpdate",!1);d(this,"retryShouldFocus",!1);d(this,"originalFacadeButton",null);d(this,"facadeSnapshot",null);this.observer=null,this.isInitialized=!1,this.playerDiv=null,this.initVersion=0,this.iframeObserver=null,this.iframeRevealDelayTimeoutId=null,this.iframeRevealTimeoutId=null,this.iframeRevealShieldTimeoutId=null,this.facadeAbortController=null}isFacadeMode(){return this.getAttribute("data-load-mode")==="facade"}reinitializePlayer(){if(!this.isInitialized||!this.isConnected)return;this.clearIframeMasking(),this.playerDiv&&(this.playerDiv.remove(),this.playerDiv=null);const e=this.querySelector(".podlove-player-container");e instanceof HTMLElement&&e.style.removeProperty("min-height"),this.style.removeProperty("min-height"),this.isInitialized=!1,delete this.dataset.playerInstanceId,this.initializePlayer()}static get observedAttributes(){return["data-url","data-config","data-template","data-embed"]}attributeChangedCallback(e,t,r){if(t===r||!this.isConnected)return;this.restartAfterSourceUpdate||(this.restartAfterSourceUpdate=this.isInitialized),this.sourceUpdatePending=!0,this.initVersion+=1,this.connectionVersion+=1;const i=++this.sourceUpdateVersion;queueMicrotask(()=>{if(!this.isConnected||i!==this.sourceUpdateVersion)return;const n=this.restartAfterSourceUpdate;this.retirePlayer(),this.connectPlayer(),n&&(this.isFacadeMode()?this.handleFacadeLoad():this.initializePlayer())})}connectedCallback(){this.connectPlayer()}connectPlayer(){const e=++this.connectionVersion;if(this.renderPlaceholder(),this.isFacadeMode()){this.captureFacadeSnapshot(),this.setupFacadeInteraction();return}if(document.readyState==="complete"){this.observeElement();return}ue().then(()=>{this.isConnected&&this.connectionVersion===e&&this.observeElement()})}disconnectedCallback(){this.retirePlayer()}retirePlayer(){var r,i,n,s;this.sourceUpdatePending=!1,this.restartAfterSourceUpdate=!1,this.sourceUpdateVersion+=1,this.connectionVersion+=1,this.initVersion+=1,he(this),this.facadeAbortController&&(this.facadeAbortController.abort(),this.facadeAbortController=null),this.clearIframeMasking(),this.restoreFacadeButton(),(r=this.querySelector(".podlove-player-error"))==null||r.remove(),this.retryShouldFocus=!1,(i=this.querySelector(`.${I}`))==null||i.remove(),(n=this.querySelector(`.${C}`))==null||n.remove();const e=this.querySelector(".podlove-facade-inner");e instanceof HTMLElement&&(e.style.removeProperty("position"),e.style.removeProperty("inset"),e.style.removeProperty("z-index"),e.style.removeProperty("padding"));const t=this.querySelector(".podlove-player-container");t instanceof HTMLElement&&(this.isFacadeMode()&&t.classList.add("podlove-facade"),t.classList.remove("is-loading"),t.style.removeProperty("min-height")),this.style.removeProperty("min-height"),(s=this.playerDiv)==null||s.remove(),this.playerDiv=null,this.restoreFacadeSnapshot(),delete this.dataset.playerInstanceId,this.isInitialized=!1}captureFacadeSnapshot(){if(this.facadeSnapshot)return;const e=this.querySelector(".podlove-player-container");e!=null&&e.querySelector(".podlove-facade-play")&&(this.facadeSnapshot=Array.from(e.childNodes,t=>t.cloneNode(!0)))}restoreFacadeSnapshot(){if(!this.isFacadeMode()||!this.facadeSnapshot)return;const e=this.querySelector(".podlove-player-container");!(e instanceof HTMLElement)||e.querySelector(".podlove-facade-play")||(e.replaceChildren(...this.facadeSnapshot.map(t=>t.cloneNode(!0))),e.style.removeProperty("border"),e.style.removeProperty("border-radius"),e.style.removeProperty("color-scheme"))}clearIframeMasking(){this.iframeObserver&&(this.iframeObserver.disconnect(),this.iframeObserver=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.iframeRevealShieldTimeoutId!==null&&(window.clearTimeout(this.iframeRevealShieldTimeoutId),this.iframeRevealShieldTimeoutId=null),this.querySelectorAll(".podlove-player-container").forEach(e=>{e instanceof HTMLElement&&(e.removeAttribute(S),e.querySelectorAll(`.${L}`).forEach(t=>{t.remove()}))})}applyReservedHeight(e){const t=`${B()}px`;e.style.minHeight=t,this.style.minHeight=t}getOrCreateRevealShield(e){const t=e.querySelector(`.${L}`);if(t instanceof HTMLDivElement)return t.style.backgroundColor=e.style.backgroundColor||window.getComputedStyle(e).backgroundColor,t.style.opacity="1",t;const r=document.createElement("div");return r.classList.add(L),r.style.backgroundColor=e.style.backgroundColor||window.getComputedStyle(e).backgroundColor,r.style.opacity="1",e.appendChild(r),r}scheduleRevealShieldRelease(e,t){this.iframeRevealShieldTimeoutId!==null&&(window.clearTimeout(this.iframeRevealShieldTimeoutId),this.iframeRevealShieldTimeoutId=null);const r=this.getOrCreateRevealShield(e),i=e.style.colorScheme==="dark"?le:ae;this.iframeRevealShieldTimeoutId=window.setTimeout(()=>{this.initVersion===t&&(this.releaseReservedHeight(e),r.style.opacity="0",this.iframeRevealShieldTimeoutId=window.setTimeout(()=>{this.initVersion===t&&(r.remove(),this.iframeRevealShieldTimeoutId=null)},z))},i)}maskIframeUntilReady(e,t){if(!(e instanceof HTMLElement))return;this.clearIframeMasking(),e.setAttribute(S,"true");const r=e.style.colorScheme==="dark"?oe:te,i=new WeakSet;let n=null;const s=()=>{const l=document.querySelector(K);return(l==null?void 0:l.getAttribute(de))==="true"},u=l=>l.getAttribute(b)==="true"?!0:s(),c=l=>{var m,v;if(this.initVersion===t&&!(!(l instanceof HTMLIFrameElement)||!e.contains(l))){if(u(l)){this.iframeRevealDelayTimeoutId!==null&&window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=window.setTimeout(()=>c(l),ce);return}(m=e.querySelector(".podlove-facade-inner"))==null||m.remove(),(v=this.querySelector(".podlove-facade-inner"))==null||v.remove(),l.style.opacity="1",l.style.pointerEvents="",l.style.removeProperty("transition"),l.style.removeProperty("background-color"),l.style.removeProperty("color-scheme"),l.removeAttribute(E),e.removeAttribute(S),this.scheduleRevealShieldRelease(e,t),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null)}},p=l=>{this.initVersion!==t||!this.isConnected||(this.iframeRevealDelayTimeoutId!==null&&window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=window.setTimeout(()=>c(l),r))},h=l=>{var F,H;if(i.has(l))return;i.add(l),n=l,this.getOrCreateRevealShield(e);const m=e.querySelector(`.${I}`);m&&m.remove();const v=e.querySelector(".podlove-facade-inner");v instanceof HTMLElement&&(v.style.position="absolute",v.style.inset="0",v.style.zIndex="1",v.style.padding="inherit"),(F=e.querySelector(".podlove-facade-content"))==null||F.remove(),(H=e.querySelector(".podlove-facade-play:not(.podlove-facade-inner .podlove-facade-play)"))==null||H.remove();const D=getComputedStyle(e);e.style.border=D.border,e.style.borderRadius=D.borderRadius,e.classList.remove("podlove-facade"),l.setAttribute(E,"true"),l.style.opacity="0",l.style.pointerEvents="none",l.style.transition="opacity 160ms ease",l.style.backgroundColor="inherit",l.style.colorScheme="inherit",l.addEventListener("load",()=>{n===l&&p(l)},{once:!0}),this.iframeRevealTimeoutId!==null&&window.clearTimeout(this.iframeRevealTimeoutId);const j=e.style.colorScheme==="dark"?ie:re;this.iframeRevealTimeoutId=window.setTimeout(()=>c(n),j)},y=()=>{e.querySelectorAll("iframe").forEach(m=>{m instanceof HTMLIFrameElement&&h(m)})};y(),this.iframeObserver=new MutationObserver(()=>{y()}),this.iframeObserver.observe(e,{childList:!0,subtree:!0})}applyLoadingTheme(e){if(!(e instanceof HTMLElement))return;const t=R()==="dark"?"dark":"light";e.style.backgroundColor=w(t==="dark"),e.style.colorScheme=t}ensurePlayerStyles(){if(document.getElementById(V))return;const e=document.createElement("style");e.id=V;const t=w(!0),r=w(!1);e.textContent=`
      podlove-player .podlove-player-container {
        width: 100%;
        max-width: 936px;
        margin: 0 auto;
        position: relative;
        overflow: hidden;
        background-color: var(--cast-surface, ${r});
      }
      podlove-player .podlove-player-container:not(.podlove-facade) {
        min-height: ${U}px;
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
      podlove-player .podlove-player-container .${L} {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 2;
        opacity: 1;
        transition: opacity ${z}ms ease;
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
        background-color: var(--cast-surface, ${r});
      }
      html[data-bs-theme="light"] podlove-player .podlove-player-container iframe,
      html[data-theme="light"] podlove-player .podlove-player-container iframe,
      body[data-bs-theme="light"] podlove-player .podlove-player-container iframe,
      body[data-theme="light"] podlove-player .podlove-player-container iframe {
        background-color: var(--cast-surface, ${r});
        color-scheme: light;
      }
    `,document.head.appendChild(e)}renderPlaceholder(){if(this.ensurePlayerStyles(),this.querySelector(".podlove-player-container"))return;const e=document.createElement("div");e.classList.add("podlove-player-container"),this.applyLoadingTheme(e),this.applyReservedHeight(e),this.appendChild(e)}observeElement(){this.isConnected&&(this.observer=pe(),T.set(this,this.observer),this.observer.observe(this))}setupFacadeInteraction(){const e=this.querySelector(".podlove-player-container");if(!e||!(e instanceof HTMLElement))return;const t=e.querySelector(".podlove-facade-play");this.facadeAbortController=new AbortController;const r=this.facadeAbortController.signal,i=()=>{this.facadeAbortController&&(this.facadeAbortController.abort(),this.facadeAbortController=null),this.handleFacadeLoad()};e.addEventListener("mouseenter",i,{once:!0,signal:r}),e.addEventListener("touchstart",i,{once:!0,passive:!0,signal:r}),t&&(t.addEventListener("focus",i,{once:!0,signal:r}),t.addEventListener("click",i,{once:!0,signal:r}))}handleFacadeLoad(){var n;if(this.isInitialized||!this.isConnected)return;const e=this.querySelector(".podlove-player-container");if(!e||!(e instanceof HTMLElement))return;this.retryShouldFocus=document.activeElement===e.querySelector(".podlove-facade-play"),this.restoreFacadeButton(),(n=this.querySelector(".podlove-player-error"))==null||n.remove();const t=e.getBoundingClientRect().height,r=Math.max(t,B());e.style.minHeight=`${r}px`,this.style.minHeight=`${r}px`,e.classList.add("is-loading");const i=document.createElement("div");i.className=I,e.appendChild(i),this.initializePlayer()}showFacade(e=!1){if(!this.isConnected||this.isInitialized||!this.getAttribute("data-url"))return;const t=this.querySelector(".podlove-player-container");if(!t||t.querySelector(`.${C}`))return;const r=document.createElement("button");r.type="button",r.className=C,r.setAttribute("aria-label",e?"Retry loading player":"Play"),e?(r.classList.add("podlove-player-retry-btn"),r.textContent="Retry loading player"):r.innerHTML='<svg viewBox="0 0 24 24" width="28" height="28" fill="white" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',r.addEventListener("click",()=>this.handleFacadeClick(),{once:!0}),t.appendChild(r)}handleFacadeClick(){var i;if(this.isInitialized||!this.isConnected||!this.getAttribute("data-url"))return;const e=this.querySelector(".podlove-player-container");if(!e)return;const t=e.querySelector(`.${C}`);this.retryShouldFocus=document.activeElement===t,(i=this.querySelector(".podlove-player-error"))==null||i.remove(),t&&t.remove();const r=document.createElement("div");r.className=I,e.appendChild(r),this.initializePlayer()}initializePlayer(){if(this.sourceUpdatePending){this.restartAfterSourceUpdate=!0;return}if(this.isInitialized||!this.isConnected)return;const e=this.querySelector(".podlove-player-container");if(!e)return;e instanceof HTMLElement&&!this.isFacadeMode()&&this.applyReservedHeight(e),this.isFacadeMode()?e instanceof HTMLElement&&(e.style.colorScheme=R()==="dark"?"dark":"light"):this.applyLoadingTheme(e);let t=this.getAttribute("id");t||(t=`podlove-player-${Date.now()}`,this.setAttribute("id",t)),this.dataset.playerInstanceId||(q+=1,this.dataset.playerInstanceId=String(q));const r=`${t}-player-${this.dataset.playerInstanceId}`,i=this.getAttribute("data-url");if(!i)return;this.isInitialized=!0,this.initVersion+=1;const n=this.initVersion;let s=this.getAttribute("data-config")||"/api/audios/player_config/";s=ve(s);const u=this.getAttribute("data-template");let c=this.getAttribute("data-embed")||"https://cdn.podlove.org/web-player/5.x/embed.js";const p=this.getOrCreatePlayerDiv(e,r,u),h=()=>{if(!(n!==this.initVersion||!this.isConnected)){try{if(typeof podlovePlayer!="function")throw new Error("Podlove embed script did not register.");podlovePlayer(p,i,s)}catch(y){this.recoverInitialization(e,n);return}n===this.initVersion&&this.isConnected&&this.maskIframeUntilReady(e,n)}};try{c=ye(c)}catch(y){this.recoverInitialization(e,n);return}typeof podlovePlayer=="function"?h():me(c).then(h,()=>{this.recoverInitialization(e,n)})}recoverInitialization(e,t){var c,p,h,y;if(t!==this.initVersion||!this.isConnected)return;this.isInitialized=!1,this.clearReservedHeight(e),e.classList.remove("is-loading"),(c=this.querySelector(`.${I}`))==null||c.remove(),(p=this.playerDiv)==null||p.remove(),this.playerDiv=null,(h=this.facadeAbortController)==null||h.abort(),this.facadeAbortController=null;const r=document.createElement("p");r.className="podlove-player-error",r.setAttribute("role","alert"),r.textContent="Player failed to load. Please retry.",(y=this.querySelector(".podlove-player-error"))==null||y.remove(),e.appendChild(r);const i=e.querySelector(".podlove-facade-inner");this.isFacadeMode()&&i instanceof HTMLElement&&(i.style.removeProperty("position"),i.style.removeProperty("inset"),i.style.removeProperty("z-index"),i.style.removeProperty("padding"),e.classList.add("podlove-facade"));const n=e.querySelector(".podlove-facade-play");n?(this.originalFacadeButton={button:n,html:n.innerHTML,label:n.getAttribute("aria-label")},n.textContent="Retry loading player",n.setAttribute("aria-label","Retry loading player"),this.facadeAbortController=new AbortController,n.addEventListener("click",()=>{var l;(l=this.facadeAbortController)==null||l.abort(),this.facadeAbortController=null,this.handleFacadeLoad()},{once:!0,signal:this.facadeAbortController.signal})):this.showFacade(!0);const s=document.activeElement,u=s===null||s===document.body||this.contains(s);if(this.retryShouldFocus&&u){const l=e.querySelector(".podlove-facade-play, .podlove-player-retry-btn");l==null||l.focus()}this.retryShouldFocus=!1}restoreFacadeButton(){if(!this.originalFacadeButton)return;const{button:e,html:t,label:r}=this.originalFacadeButton;e.innerHTML=t,r===null?e.removeAttribute("aria-label"):e.setAttribute("aria-label",r),this.originalFacadeButton=null}getOrCreatePlayerDiv(e,t,r){return this.playerDiv||(this.playerDiv=document.createElement("div"),this.playerDiv.classList.add("podlove-player-host")),e.contains(this.playerDiv)||e.appendChild(this.playerDiv),this.playerDiv.id=t,r!==null?this.playerDiv.setAttribute("data-template",r):this.playerDiv.removeAttribute("data-template"),this.playerDiv}releaseReservedHeight(e){e instanceof HTMLElement&&(e.style.minHeight="0",e.style.removeProperty("border"),e.style.removeProperty("border-radius")),this.style.minHeight="0"}clearReservedHeight(e){e instanceof HTMLElement&&(e.style.removeProperty("min-height"),e.style.removeProperty("border"),e.style.removeProperty("border-radius")),this.style.removeProperty("min-height")}}customElements.define("podlove-player",k);M=R();const W=new MutationObserver(()=>{const a=R();a!==M&&(M=a,document.querySelectorAll("podlove-player").forEach(o=>{if(o instanceof k&&!o.isInitialized){const e=o.querySelector(".podlove-player-container");e&&!o.isFacadeMode()&&o.applyLoadingTheme(e)}}))});W.observe(document.documentElement,{attributes:!0,attributeFilter:["data-bs-theme","data-theme"]});const N=()=>{document.body&&W.observe(document.body,{attributes:!0,attributeFilter:["data-bs-theme","data-theme"]})};document.body?N():window.addEventListener("DOMContentLoaded",N,{once:!0});typeof document!="undefined"&&document.addEventListener("htmx:beforeRequest",be,!0);
