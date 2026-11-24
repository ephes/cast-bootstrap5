var J=Object.defineProperty;var Z=(l,r,e)=>r in l?J(l,r,{enumerable:!0,configurable:!0,writable:!0,value:e}):l[r]=e;var d=(l,r,e)=>Z(l,typeof r!="symbol"?r+"":r,e);let A=null,b=null,x=0,w=null,f=null,P=!1;const R=new Map;let _=null;const ee=1e4,k="data-podlove-embed",O="data-podlove-embed-loaded",V="data-podlove-embed-failed",$="podlove-player-styles",z="color_scheme",te="#292524",re="#ffffff",K=297,Y=312,oe=100,ie=900,ae=2500,le=8e3,E="data-cast-iframe-masked",S="data-cast-mask-active",C="podlove-player-reveal-shield",ne=80,se=180,B=120,W="#paging-area",de=".pagination a, .cast-pagination a",g="data-cast-paging-remask",ce=1600,ue="data-cast-paging-mask-active",he=50;function pe(){return document.readyState==="complete"?Promise.resolve():(w||(w=new Promise(l=>{window.addEventListener("load",()=>l(),{once:!0})})),w)}function M(l){const r=l?"--cast-bg-alt":"--cast-surface",e=l?te:re;return getComputedStyle(document.documentElement).getPropertyValue(r).trim()||e}const I="podlove-player-facade-btn",T="podlove-player-facade-loading";function j(l,r){for(const e of l){if(r!==f)return;const t=e.target;!e.isIntersecting||!(t instanceof D)||!t.isConnected||R.get(t)!==r||(R.delete(t),r.unobserve(t),t.showFacade())}}function ye(){if(f)return f;if(typeof IntersectionObserver!="function")return null;try{f=new IntersectionObserver(j)}catch(l){return null}return f}function N(l){const r=l.observer;l.observer=null,R.delete(l),r==null||r.unobserve(l),!(!r||r!==f)&&(j(r.takeRecords(),r),r.disconnect(),f=null,!P&&(P=!0,queueMicrotask(()=>{P=!1;for(const[e,t]of R)t!==f&&e.observeElement()})))}function me(l){const r=new URL(l,document.baseURI);r.hash="";const e=document.querySelector(`script[${k}]`);if(A===null&&e){const t=new URL(e.src,document.baseURI);t.hash="",A=t.href}if(A!==null&&A!==r.href)throw new Error("A different Podlove embed implementation already owns this document.");return A=r.href,r.href}function ve(l){if(typeof podlovePlayer=="function")return Promise.resolve();const r=document.querySelector(`script[${O}="true"]`);if(r&&(r.remove(),b=null),b)return b;const e=new Promise((t,o)=>{let i=document.querySelector(`script[${k}]`);(i==null?void 0:i.getAttribute(V))==="true"&&(i.remove(),i=null);const n=!i,s=i!=null?i:document.createElement("script");let u=!1;const c=()=>{clearTimeout(a),s.removeEventListener("load",y),s.removeEventListener("error",p)},h=m=>{u||(u=!0,c(),s.setAttribute(V,"true"),s.remove(),o(new Error(m)))},y=()=>{if(!u){if(typeof podlovePlayer!="function"){h("Podlove embed script did not register.");return}u=!0,c(),s.setAttribute(O,"true"),t()}},p=()=>h("Failed to load Podlove embed script"),a=setTimeout(()=>h("Podlove embed script load timed out"),ee);s.addEventListener("load",y),s.addEventListener("error",p),n&&(s.src=l,s.async=!0,s.setAttribute(k,"true"),document.head.appendChild(s))}).catch(t=>{throw b===e&&(b=null),t});return b=e,b}function L(){var r,e;const l=document.documentElement.getAttribute("data-bs-theme")||document.documentElement.getAttribute("data-theme")||((r=document.body)==null?void 0:r.getAttribute("data-bs-theme"))||((e=document.body)==null?void 0:e.getAttribute("data-theme"));return l==="light"||l==="dark"?l:typeof window.matchMedia=="function"&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":null}function fe(l){const r=L();if(!r)return l;const e=l.indexOf("#"),t=e===-1?l:l.slice(0,e),o=e===-1?"":l.slice(e+1),i=t.indexOf("?"),n=i===-1?t:t.slice(0,i),s=i===-1?"":t.slice(i+1),u=new URLSearchParams(s);u.has(z)||u.set(z,r);const c=u.toString(),h=o?`#${o}`:"";return c?`${n}?${c}${h}`:`${n}${h}`}function U(){return typeof window.matchMedia=="function"&&window.matchMedia("(max-width: 768px)").matches?Y:K}function be(l,r){r.getAttribute(g)!=="true"&&(r.setAttribute(g,"true"),r.setAttribute(E,"true"),r.style.opacity="0",r.style.pointerEvents="none",r.style.backgroundColor="inherit",r.style.colorScheme="inherit",l.setAttribute(S,"true"),window.setTimeout(()=>{!r.isConnected||r.getAttribute(g)!=="true"||(r.removeAttribute(g),r.getAttribute(E)==="true"&&r.removeAttribute(E),r.style.opacity="1",r.style.pointerEvents="",r.style.removeProperty("background-color"),r.style.removeProperty("color-scheme"),l.querySelector(`iframe[${g}="true"]`)||l.removeAttribute(S))},ce))}function ge(l){const r=l.target;if(!(r instanceof Element)||!r.closest(de))return;const e=document.querySelector(W);e&&e.querySelectorAll(".podlove-player-container").forEach(t=>{t instanceof HTMLElement&&t.querySelectorAll("iframe").forEach(o=>{o instanceof HTMLIFrameElement&&o.getAttribute(E)!=="true"&&be(t,o)})})}class D extends HTMLElement{constructor(){super();d(this,"observer");d(this,"isInitialized");d(this,"playerDiv");d(this,"initVersion");d(this,"iframeObserver");d(this,"iframeRevealDelayTimeoutId");d(this,"iframeRevealTimeoutId");d(this,"iframeRevealShieldTimeoutId");d(this,"facadeAbortController");d(this,"connectionVersion",0);d(this,"sourceUpdateVersion",0);d(this,"sourceUpdatePending",!1);d(this,"restartAfterSourceUpdate",!1);d(this,"connectionStarted",!1);d(this,"retryShouldFocus",!1);d(this,"originalFacadeButton",null);d(this,"facadeSnapshot",null);this.observer=null,this.isInitialized=!1,this.playerDiv=null,this.initVersion=0,this.iframeObserver=null,this.iframeRevealDelayTimeoutId=null,this.iframeRevealTimeoutId=null,this.iframeRevealShieldTimeoutId=null,this.facadeAbortController=null}isFacadeMode(){return this.getAttribute("data-load-mode")==="facade"}reinitializePlayer(){if(!this.isInitialized||!this.isConnected)return;this.clearIframeMasking(),this.playerDiv&&(this.playerDiv.remove(),this.playerDiv=null);const e=this.querySelector(".podlove-player-container");e instanceof HTMLElement&&e.style.removeProperty("min-height"),this.style.removeProperty("min-height"),this.isInitialized=!1,delete this.dataset.playerInstanceId,this.initializePlayer()}static get observedAttributes(){return["data-url","data-config","data-template","data-embed"]}attributeChangedCallback(e,t,o){if(t===o||!this.isConnected||!this.connectionStarted)return;this.restartAfterSourceUpdate||(this.restartAfterSourceUpdate=this.isInitialized),this.sourceUpdatePending=!0,this.initVersion+=1,this.connectionVersion+=1;const i=++this.sourceUpdateVersion;queueMicrotask(()=>{if(!this.isConnected||i!==this.sourceUpdateVersion)return;const n=this.restartAfterSourceUpdate;this.retirePlayer(),this.connectPlayer(),n&&(this.isFacadeMode()?this.handleFacadeLoad():this.initializePlayer())})}connectedCallback(){this.connectionStarted=!0,this.connectPlayer()}connectPlayer(){const e=++this.connectionVersion;if(this.renderPlaceholder(),this.isFacadeMode()){this.captureFacadeSnapshot(),this.setupFacadeInteraction();return}if(document.readyState==="complete"){this.observeElement();return}pe().then(()=>{this.isConnected&&this.connectionVersion===e&&this.observeElement()})}disconnectedCallback(){this.connectionStarted=!1,this.retirePlayer()}retirePlayer(){var o,i,n,s;this.sourceUpdatePending=!1,this.restartAfterSourceUpdate=!1,this.sourceUpdateVersion+=1,this.connectionVersion+=1,this.initVersion+=1,N(this),this.facadeAbortController&&(this.facadeAbortController.abort(),this.facadeAbortController=null),this.clearIframeMasking(),this.restoreFacadeButton(),(o=this.querySelector(".podlove-player-error"))==null||o.remove(),this.retryShouldFocus=!1,(i=this.querySelector(`.${T}`))==null||i.remove(),(n=this.querySelector(`.${I}`))==null||n.remove();const e=this.querySelector(".podlove-facade-inner");e instanceof HTMLElement&&(e.style.removeProperty("position"),e.style.removeProperty("inset"),e.style.removeProperty("z-index"),e.style.removeProperty("padding"));const t=this.querySelector(".podlove-player-container");t instanceof HTMLElement&&(this.isFacadeMode()&&t.classList.add("podlove-facade"),t.classList.remove("is-loading"),t.style.removeProperty("min-height")),this.style.removeProperty("min-height"),(s=this.playerDiv)==null||s.remove(),this.playerDiv=null,this.restoreFacadeSnapshot(),delete this.dataset.playerInstanceId,this.isInitialized=!1}captureFacadeSnapshot(){if(this.facadeSnapshot)return;const e=this.querySelector(".podlove-player-container");e!=null&&e.querySelector(".podlove-facade-play")&&(this.facadeSnapshot=Array.from(e.childNodes,t=>t.cloneNode(!0)))}restoreFacadeSnapshot(){if(!this.isFacadeMode()||!this.facadeSnapshot)return;const e=this.querySelector(".podlove-player-container");!(e instanceof HTMLElement)||e.querySelector(".podlove-facade-play")||(e.replaceChildren(...this.facadeSnapshot.map(t=>t.cloneNode(!0))),e.style.removeProperty("border"),e.style.removeProperty("border-radius"),e.style.removeProperty("color-scheme"))}clearIframeMasking(){this.iframeObserver&&(this.iframeObserver.disconnect(),this.iframeObserver=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.iframeRevealShieldTimeoutId!==null&&(window.clearTimeout(this.iframeRevealShieldTimeoutId),this.iframeRevealShieldTimeoutId=null),this.querySelectorAll(".podlove-player-container").forEach(e=>{e instanceof HTMLElement&&(e.removeAttribute(S),e.querySelectorAll(`.${C}`).forEach(t=>{t.remove()}))})}applyReservedHeight(e){const t=`${U()}px`;e.style.minHeight=t,this.style.minHeight=t}getOrCreateRevealShield(e){const t=e.querySelector(`.${C}`);if(t instanceof HTMLDivElement)return t.style.backgroundColor=e.style.backgroundColor||window.getComputedStyle(e).backgroundColor,t.style.opacity="1",t;const o=document.createElement("div");return o.classList.add(C),o.style.backgroundColor=e.style.backgroundColor||window.getComputedStyle(e).backgroundColor,o.style.opacity="1",e.appendChild(o),o}scheduleRevealShieldRelease(e,t){this.iframeRevealShieldTimeoutId!==null&&(window.clearTimeout(this.iframeRevealShieldTimeoutId),this.iframeRevealShieldTimeoutId=null);const o=this.getOrCreateRevealShield(e),i=e.style.colorScheme==="dark"?se:ne;this.iframeRevealShieldTimeoutId=window.setTimeout(()=>{this.initVersion===t&&(this.releaseReservedHeight(e),o.style.opacity="0",this.iframeRevealShieldTimeoutId=window.setTimeout(()=>{this.initVersion===t&&(o.remove(),this.iframeRevealShieldTimeoutId=null)},B))},i)}maskIframeUntilReady(e,t){if(!(e instanceof HTMLElement))return;this.clearIframeMasking(),e.setAttribute(S,"true");const o=e.style.colorScheme==="dark"?ie:oe,i=new WeakSet;let n=null;const s=()=>{const a=document.querySelector(W);return(a==null?void 0:a.getAttribute(ue))==="true"},u=a=>a.getAttribute(g)==="true"?!0:s(),c=a=>{var m,v;if(this.initVersion===t&&!(!(a instanceof HTMLIFrameElement)||!e.contains(a))){if(u(a)){this.iframeRevealDelayTimeoutId!==null&&window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=window.setTimeout(()=>c(a),he);return}(m=e.querySelector(".podlove-facade-inner"))==null||m.remove(),(v=this.querySelector(".podlove-facade-inner"))==null||v.remove(),a.style.opacity="1",a.style.pointerEvents="",a.style.removeProperty("transition"),a.style.removeProperty("background-color"),a.style.removeProperty("color-scheme"),a.removeAttribute(E),e.removeAttribute(S),this.scheduleRevealShieldRelease(e,t),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null)}},h=a=>{this.initVersion!==t||!this.isConnected||(this.iframeRevealDelayTimeoutId!==null&&window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=window.setTimeout(()=>c(a),o))},y=a=>{var H,q;if(i.has(a))return;i.add(a),n=a,this.getOrCreateRevealShield(e);const m=e.querySelector(`.${T}`);m&&m.remove();const v=e.querySelector(".podlove-facade-inner");v instanceof HTMLElement&&(v.style.position="absolute",v.style.inset="0",v.style.zIndex="1",v.style.padding="inherit"),(H=e.querySelector(".podlove-facade-content"))==null||H.remove(),(q=e.querySelector(".podlove-facade-play:not(.podlove-facade-inner .podlove-facade-play)"))==null||q.remove();const F=getComputedStyle(e);e.style.border=F.border,e.style.borderRadius=F.borderRadius,e.classList.remove("podlove-facade"),a.setAttribute(E,"true"),a.style.opacity="0",a.style.pointerEvents="none",a.style.transition="opacity 160ms ease",a.style.backgroundColor="inherit",a.style.colorScheme="inherit",a.addEventListener("load",()=>{n===a&&h(a)},{once:!0}),this.iframeRevealTimeoutId!==null&&window.clearTimeout(this.iframeRevealTimeoutId);const Q=e.style.colorScheme==="dark"?le:ae;this.iframeRevealTimeoutId=window.setTimeout(()=>c(n),Q)},p=()=>{e.querySelectorAll("iframe").forEach(m=>{m instanceof HTMLIFrameElement&&y(m)})};p(),this.iframeObserver=new MutationObserver(()=>{p()}),this.iframeObserver.observe(e,{childList:!0,subtree:!0})}applyLoadingTheme(e){if(!(e instanceof HTMLElement))return;const t=L()==="dark"?"dark":"light";e.style.backgroundColor=M(t==="dark"),e.style.colorScheme=t}ensurePlayerStyles(){if(document.getElementById($))return;const e=document.createElement("style");e.id=$;const t=M(!0),o=M(!1);e.textContent=`
      podlove-player .podlove-player-container {
        width: 100%;
        max-width: 936px;
        margin: 0 auto;
        position: relative;
        overflow: hidden;
        background-color: var(--cast-surface, ${o});
      }
      podlove-player .podlove-player-container:not(.podlove-facade) {
        min-height: ${K}px;
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
      podlove-player .podlove-player-container .${C} {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 2;
        opacity: 1;
        transition: opacity ${B}ms ease;
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
    `,document.head.appendChild(e)}renderPlaceholder(){if(this.ensurePlayerStyles(),this.querySelector(".podlove-player-container"))return;const e=document.createElement("div");e.classList.add("podlove-player-container"),this.applyLoadingTheme(e),this.applyReservedHeight(e),this.appendChild(e)}observeElement(){if(!this.isConnected)return;const e=ye();if(!e){N(this),this.showFacade();return}this.observer=e,R.set(this,e),e.observe(this)}setupFacadeInteraction(){const e=this.querySelector(".podlove-player-container");if(!e||!(e instanceof HTMLElement))return;const t=e.querySelector(".podlove-facade-play");this.facadeAbortController=new AbortController;const o=this.facadeAbortController.signal,i=()=>{this.facadeAbortController&&(this.facadeAbortController.abort(),this.facadeAbortController=null),this.handleFacadeLoad()};e.addEventListener("mouseenter",i,{once:!0,signal:o}),e.addEventListener("touchstart",i,{once:!0,passive:!0,signal:o}),t&&(t.addEventListener("focus",i,{once:!0,signal:o}),t.addEventListener("click",i,{once:!0,signal:o}))}handleFacadeLoad(){var n;if(this.isInitialized||!this.isConnected)return;const e=this.querySelector(".podlove-player-container");if(!e||!(e instanceof HTMLElement))return;this.retryShouldFocus=document.activeElement===e.querySelector(".podlove-facade-play"),this.restoreFacadeButton(),(n=this.querySelector(".podlove-player-error"))==null||n.remove();const t=e.getBoundingClientRect().height,o=Math.max(t,U());e.style.minHeight=`${o}px`,this.style.minHeight=`${o}px`,e.classList.add("is-loading");const i=document.createElement("div");i.className=T,e.appendChild(i),this.initializePlayer()}showFacade(e=!1){if(!this.isConnected||this.isInitialized||!this.getAttribute("data-url"))return;const t=this.querySelector(".podlove-player-container");if(!t||t.querySelector(`.${I}`))return;const o=document.createElement("button");o.type="button",o.className=I,o.setAttribute("aria-label",e?"Retry loading player":"Play"),e?(o.classList.add("podlove-player-retry-btn"),o.textContent="Retry loading player"):o.innerHTML='<svg viewBox="0 0 24 24" width="28" height="28" fill="white" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',o.addEventListener("click",()=>this.handleFacadeClick(),{once:!0}),t.appendChild(o)}handleFacadeClick(){var i;if(this.isInitialized||!this.isConnected||!this.getAttribute("data-url"))return;const e=this.querySelector(".podlove-player-container");if(!e)return;const t=e.querySelector(`.${I}`);this.retryShouldFocus=document.activeElement===t,(i=this.querySelector(".podlove-player-error"))==null||i.remove(),t&&t.remove();const o=document.createElement("div");o.className=T,e.appendChild(o),this.initializePlayer()}initializePlayer(){var p;if(this.sourceUpdatePending){this.restartAfterSourceUpdate=!0;return}if(this.isInitialized||!this.isConnected)return;const e=this.querySelector(".podlove-player-container");if(!e)return;e instanceof HTMLElement&&!this.isFacadeMode()&&this.applyReservedHeight(e),this.isFacadeMode()?e instanceof HTMLElement&&(e.style.colorScheme=L()==="dark"?"dark":"light"):this.applyLoadingTheme(e);let t=this.getAttribute("id");t||(t=`podlove-player-${Date.now()}`,this.setAttribute("id",t)),this.dataset.playerInstanceId||(x+=1,this.dataset.playerInstanceId=String(x));const o=`${t}-player-${this.dataset.playerInstanceId}`,i=this.getAttribute("data-url");if(!i)return;this.isInitialized=!0,(p=e.querySelector(`.${I}`))==null||p.remove(),this.initVersion+=1;const n=this.initVersion;let s=this.getAttribute("data-config")||"/api/audios/player_config/";s=fe(s);const u=this.getAttribute("data-template");let c=this.getAttribute("data-embed")||"https://cdn.podlove.org/web-player/5.x/embed.js";const h=this.getOrCreatePlayerDiv(e,o,u),y=()=>{if(!(n!==this.initVersion||!this.isConnected)){try{if(typeof podlovePlayer!="function")throw new Error("Podlove embed script did not register.");podlovePlayer(h,i,s)}catch(a){this.recoverInitialization(e,n);return}n===this.initVersion&&this.isConnected&&this.maskIframeUntilReady(e,n)}};try{c=me(c)}catch(a){this.recoverInitialization(e,n);return}typeof podlovePlayer=="function"?y():ve(c).then(y,()=>{this.recoverInitialization(e,n)})}recoverInitialization(e,t){var c,h,y,p;if(t!==this.initVersion||!this.isConnected)return;this.isInitialized=!1,this.clearReservedHeight(e),e.classList.remove("is-loading"),(c=this.querySelector(`.${T}`))==null||c.remove(),(h=this.playerDiv)==null||h.remove(),this.playerDiv=null,(y=this.facadeAbortController)==null||y.abort(),this.facadeAbortController=null;const o=document.createElement("p");o.className="podlove-player-error",o.setAttribute("role","alert"),o.textContent="Player failed to load. Please retry.",(p=this.querySelector(".podlove-player-error"))==null||p.remove(),e.appendChild(o);const i=e.querySelector(".podlove-facade-inner");this.isFacadeMode()&&i instanceof HTMLElement&&(i.style.removeProperty("position"),i.style.removeProperty("inset"),i.style.removeProperty("z-index"),i.style.removeProperty("padding"),e.classList.add("podlove-facade"));const n=e.querySelector(".podlove-facade-play");n?(this.originalFacadeButton={button:n,html:n.innerHTML,label:n.getAttribute("aria-label")},n.textContent="Retry loading player",n.setAttribute("aria-label","Retry loading player"),this.facadeAbortController=new AbortController,n.addEventListener("click",()=>{var a;(a=this.facadeAbortController)==null||a.abort(),this.facadeAbortController=null,this.handleFacadeLoad()},{once:!0,signal:this.facadeAbortController.signal})):this.showFacade(!0);const s=document.activeElement,u=s===null||s===document.body||this.contains(s);if(this.retryShouldFocus&&u){const a=e.querySelector(".podlove-facade-play, .podlove-player-retry-btn");a==null||a.focus()}this.retryShouldFocus=!1}restoreFacadeButton(){if(!this.originalFacadeButton)return;const{button:e,html:t,label:o}=this.originalFacadeButton;e.innerHTML=t,o===null?e.removeAttribute("aria-label"):e.setAttribute("aria-label",o),this.originalFacadeButton=null}getOrCreatePlayerDiv(e,t,o){return this.playerDiv||(this.playerDiv=document.createElement("div"),this.playerDiv.classList.add("podlove-player-host")),e.contains(this.playerDiv)||e.appendChild(this.playerDiv),this.playerDiv.id=t,o!==null?this.playerDiv.setAttribute("data-template",o):this.playerDiv.removeAttribute("data-template"),this.playerDiv}releaseReservedHeight(e){e instanceof HTMLElement&&(e.style.minHeight="0",e.style.removeProperty("border"),e.style.removeProperty("border-radius")),this.style.minHeight="0"}clearReservedHeight(e){e instanceof HTMLElement&&(e.style.removeProperty("min-height"),e.style.removeProperty("border"),e.style.removeProperty("border-radius")),this.style.removeProperty("min-height")}}customElements.define("podlove-player",D);_=L();const X=new MutationObserver(()=>{const l=L();l!==_&&(_=l,document.querySelectorAll("podlove-player").forEach(r=>{if(r instanceof D&&!r.isInitialized){const e=r.querySelector(".podlove-player-container");e&&!r.isFacadeMode()&&r.applyLoadingTheme(e)}}))});X.observe(document.documentElement,{attributes:!0,attributeFilter:["data-bs-theme","data-theme"]});const G=()=>{document.body&&X.observe(document.body,{attributes:!0,attributeFilter:["data-bs-theme","data-theme"]})};document.body?G():window.addEventListener("DOMContentLoaded",G,{once:!0});typeof document!="undefined"&&document.addEventListener("htmx:beforeSend",ge,!0);
