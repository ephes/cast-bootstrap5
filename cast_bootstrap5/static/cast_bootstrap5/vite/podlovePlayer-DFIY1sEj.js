var W=Object.defineProperty;var j=(l,r,e)=>r in l?W(l,r,{enumerable:!0,configurable:!0,writable:!0,value:e}):l[r]=e;var u=(l,r,e)=>j(l,typeof r!="symbol"?r+"":r,e);let S=null,f=null,F=0,L=null,w=null,_=null;const X=1e4,M="data-podlove-embed",q="data-podlove-embed-loaded",x="data-podlove-embed-failed",O="podlove-player-styles",$="color_scheme",J="#292524",Q="#ffffff",N=297,G=312,Z=100,ee=900,te=2500,oe=8e3,E="data-cast-iframe-masked",g="data-cast-mask-active",T="podlove-player-reveal-shield",re=80,ie=180,z=120,K="#paging-area",ae=".pagination a, .cast-pagination a",b="data-cast-paging-remask",le=1600,ne="data-cast-paging-mask-active",se=50;function de(){return document.readyState==="complete"?Promise.resolve():(L||(L=new Promise(l=>{window.addEventListener("load",()=>l(),{once:!0})})),L)}function C(l){const r=l?"--cast-bg-alt":"--cast-surface",e=l?J:Q;return getComputedStyle(document.documentElement).getPropertyValue(r).trim()||e}const R="podlove-player-facade-btn",A="podlove-player-facade-loading";function ce(){return w||(w=new IntersectionObserver((l,r)=>{l.forEach(e=>{if(!e.isIntersecting)return;const t=e.target;r.unobserve(t),t instanceof P&&t.showFacade()})})),w}function ue(l){const r=new URL(l,document.baseURI);r.hash="";const e=document.querySelector(`script[${M}]`);if(S===null&&e){const t=new URL(e.src,document.baseURI);t.hash="",S=t.href}if(S!==null&&S!==r.href)throw new Error("A different Podlove embed implementation already owns this document.");return S=r.href,r.href}function pe(l){if(typeof podlovePlayer=="function")return Promise.resolve();const r=document.querySelector(`script[${q}="true"]`);if(r&&(r.remove(),f=null),f)return f;const e=new Promise((t,o)=>{let i=document.querySelector(`script[${M}]`);(i==null?void 0:i.getAttribute(x))==="true"&&(i.remove(),i=null);const n=!i,s=i!=null?i:document.createElement("script");let c=!1;const d=()=>{clearTimeout(a),s.removeEventListener("load",h),s.removeEventListener("error",m)},p=y=>{c||(c=!0,d(),s.setAttribute(x,"true"),s.remove(),o(new Error(y)))},h=()=>{if(!c){if(typeof podlovePlayer!="function"){p("Podlove embed script did not register.");return}c=!0,d(),s.setAttribute(q,"true"),t()}},m=()=>p("Failed to load Podlove embed script"),a=setTimeout(()=>p("Podlove embed script load timed out"),X);s.addEventListener("load",h),s.addEventListener("error",m),n&&(s.src=l,s.async=!0,s.setAttribute(M,"true"),document.head.appendChild(s))}).catch(t=>{throw f===e&&(f=null),t});return f=e,f}function I(){var r,e;const l=document.documentElement.getAttribute("data-bs-theme")||document.documentElement.getAttribute("data-theme")||((r=document.body)==null?void 0:r.getAttribute("data-bs-theme"))||((e=document.body)==null?void 0:e.getAttribute("data-theme"));return l==="light"||l==="dark"?l:typeof window.matchMedia=="function"&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":null}function he(l){const r=I();if(!r)return l;const e=l.indexOf("#"),t=e===-1?l:l.slice(0,e),o=e===-1?"":l.slice(e+1),i=t.indexOf("?"),n=i===-1?t:t.slice(0,i),s=i===-1?"":t.slice(i+1),c=new URLSearchParams(s);c.has($)||c.set($,r);const d=c.toString(),p=o?`#${o}`:"";return d?`${n}?${d}${p}`:`${n}${p}`}function V(){return typeof window.matchMedia=="function"&&window.matchMedia("(max-width: 768px)").matches?G:N}function me(l,r){r.getAttribute(b)!=="true"&&(r.setAttribute(b,"true"),r.setAttribute(E,"true"),r.style.opacity="0",r.style.pointerEvents="none",r.style.backgroundColor="inherit",r.style.colorScheme="inherit",l.setAttribute(g,"true"),window.setTimeout(()=>{!r.isConnected||r.getAttribute(b)!=="true"||(r.removeAttribute(b),r.getAttribute(E)==="true"&&r.removeAttribute(E),r.style.opacity="1",r.style.pointerEvents="",r.style.removeProperty("background-color"),r.style.removeProperty("color-scheme"),l.querySelector(`iframe[${b}="true"]`)||l.removeAttribute(g))},le))}function ye(l){const r=l.target;if(!(r instanceof Element)||!r.closest(ae))return;const e=document.querySelector(K);e&&e.querySelectorAll(".podlove-player-container").forEach(t=>{t instanceof HTMLElement&&t.querySelectorAll("iframe").forEach(o=>{o instanceof HTMLIFrameElement&&o.getAttribute(E)!=="true"&&me(t,o)})})}class P extends HTMLElement{constructor(){super();u(this,"observer");u(this,"isInitialized");u(this,"playerDiv");u(this,"initVersion");u(this,"iframeObserver");u(this,"iframeRevealDelayTimeoutId");u(this,"iframeRevealTimeoutId");u(this,"iframeRevealShieldTimeoutId");u(this,"facadeAbortController");u(this,"connectionVersion",0);u(this,"retryShouldFocus",!1);u(this,"originalFacadeButton",null);u(this,"facadeSnapshot",null);this.observer=null,this.isInitialized=!1,this.playerDiv=null,this.initVersion=0,this.iframeObserver=null,this.iframeRevealDelayTimeoutId=null,this.iframeRevealTimeoutId=null,this.iframeRevealShieldTimeoutId=null,this.facadeAbortController=null}isFacadeMode(){return this.getAttribute("data-load-mode")==="facade"}reinitializePlayer(){if(!this.isInitialized||!this.isConnected)return;this.clearIframeMasking(),this.playerDiv&&(this.playerDiv.remove(),this.playerDiv=null);const e=this.querySelector(".podlove-player-container");e instanceof HTMLElement&&e.style.removeProperty("min-height"),this.style.removeProperty("min-height"),this.isInitialized=!1,delete this.dataset.playerInstanceId,this.initializePlayer()}connectedCallback(){const e=++this.connectionVersion;if(this.renderPlaceholder(),this.isFacadeMode()){this.captureFacadeSnapshot(),this.setupFacadeInteraction();return}if(document.readyState==="complete"){this.observeElement();return}de().then(()=>{this.isConnected&&this.connectionVersion===e&&this.observeElement()})}disconnectedCallback(){var o,i,n,s;this.connectionVersion+=1,this.initVersion+=1,this.observer&&this.observer.unobserve(this),this.facadeAbortController&&(this.facadeAbortController.abort(),this.facadeAbortController=null),this.clearIframeMasking(),this.restoreFacadeButton(),(o=this.querySelector(".podlove-player-error"))==null||o.remove(),this.retryShouldFocus=!1,(i=this.querySelector(`.${A}`))==null||i.remove(),(n=this.querySelector(`.${R}`))==null||n.remove();const e=this.querySelector(".podlove-facade-inner");e instanceof HTMLElement&&(e.style.removeProperty("position"),e.style.removeProperty("inset"),e.style.removeProperty("z-index"),e.style.removeProperty("padding"));const t=this.querySelector(".podlove-player-container");t instanceof HTMLElement&&(this.isFacadeMode()&&t.classList.add("podlove-facade"),t.classList.remove("is-loading"),t.style.removeProperty("min-height")),this.style.removeProperty("min-height"),(s=this.playerDiv)==null||s.remove(),this.playerDiv=null,this.restoreFacadeSnapshot(),delete this.dataset.playerInstanceId,this.isInitialized=!1}captureFacadeSnapshot(){if(this.facadeSnapshot)return;const e=this.querySelector(".podlove-player-container");e!=null&&e.querySelector(".podlove-facade-play")&&(this.facadeSnapshot=Array.from(e.childNodes,t=>t.cloneNode(!0)))}restoreFacadeSnapshot(){if(!this.isFacadeMode()||!this.facadeSnapshot)return;const e=this.querySelector(".podlove-player-container");!(e instanceof HTMLElement)||e.querySelector(".podlove-facade-play")||(e.replaceChildren(...this.facadeSnapshot.map(t=>t.cloneNode(!0))),e.style.removeProperty("border"),e.style.removeProperty("border-radius"),e.style.removeProperty("color-scheme"))}clearIframeMasking(){this.iframeObserver&&(this.iframeObserver.disconnect(),this.iframeObserver=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.iframeRevealShieldTimeoutId!==null&&(window.clearTimeout(this.iframeRevealShieldTimeoutId),this.iframeRevealShieldTimeoutId=null),this.querySelectorAll(".podlove-player-container").forEach(e=>{e instanceof HTMLElement&&(e.removeAttribute(g),e.querySelectorAll(`.${T}`).forEach(t=>{t.remove()}))})}applyReservedHeight(e){const t=`${V()}px`;e.style.minHeight=t,this.style.minHeight=t}getOrCreateRevealShield(e){const t=e.querySelector(`.${T}`);if(t instanceof HTMLDivElement)return t.style.backgroundColor=e.style.backgroundColor||window.getComputedStyle(e).backgroundColor,t.style.opacity="1",t;const o=document.createElement("div");return o.classList.add(T),o.style.backgroundColor=e.style.backgroundColor||window.getComputedStyle(e).backgroundColor,o.style.opacity="1",e.appendChild(o),o}scheduleRevealShieldRelease(e,t){this.iframeRevealShieldTimeoutId!==null&&(window.clearTimeout(this.iframeRevealShieldTimeoutId),this.iframeRevealShieldTimeoutId=null);const o=this.getOrCreateRevealShield(e),i=e.style.colorScheme==="dark"?ie:re;this.iframeRevealShieldTimeoutId=window.setTimeout(()=>{this.initVersion===t&&(this.releaseReservedHeight(e),o.style.opacity="0",this.iframeRevealShieldTimeoutId=window.setTimeout(()=>{this.initVersion===t&&(o.remove(),this.iframeRevealShieldTimeoutId=null)},z))},i)}maskIframeUntilReady(e,t){if(!(e instanceof HTMLElement))return;this.clearIframeMasking(),e.setAttribute(g,"true");const o=e.style.colorScheme==="dark"?ee:Z,i=new WeakSet;let n=null;const s=()=>{const a=document.querySelector(K);return(a==null?void 0:a.getAttribute(ne))==="true"},c=a=>a.getAttribute(b)==="true"?!0:s(),d=a=>{var y,v;if(this.initVersion===t&&!(!(a instanceof HTMLIFrameElement)||!e.contains(a))){if(c(a)){this.iframeRevealDelayTimeoutId!==null&&window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=window.setTimeout(()=>d(a),se);return}(y=e.querySelector(".podlove-facade-inner"))==null||y.remove(),(v=this.querySelector(".podlove-facade-inner"))==null||v.remove(),a.style.opacity="1",a.style.pointerEvents="",a.style.removeProperty("transition"),a.style.removeProperty("background-color"),a.style.removeProperty("color-scheme"),a.removeAttribute(E),e.removeAttribute(g),this.scheduleRevealShieldRelease(e,t),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null)}},p=a=>{this.initVersion!==t||!this.isConnected||(this.iframeRevealDelayTimeoutId!==null&&window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=window.setTimeout(()=>d(a),o))},h=a=>{var D,H;if(i.has(a))return;i.add(a),n=a,this.getOrCreateRevealShield(e);const y=e.querySelector(`.${A}`);y&&y.remove();const v=e.querySelector(".podlove-facade-inner");v instanceof HTMLElement&&(v.style.position="absolute",v.style.inset="0",v.style.zIndex="1",v.style.padding="inherit"),(D=e.querySelector(".podlove-facade-content"))==null||D.remove(),(H=e.querySelector(".podlove-facade-play:not(.podlove-facade-inner .podlove-facade-play)"))==null||H.remove();const k=getComputedStyle(e);e.style.border=k.border,e.style.borderRadius=k.borderRadius,e.classList.remove("podlove-facade"),a.setAttribute(E,"true"),a.style.opacity="0",a.style.pointerEvents="none",a.style.transition="opacity 160ms ease",a.style.backgroundColor="inherit",a.style.colorScheme="inherit",a.addEventListener("load",()=>{n===a&&p(a)},{once:!0}),this.iframeRevealTimeoutId!==null&&window.clearTimeout(this.iframeRevealTimeoutId);const Y=e.style.colorScheme==="dark"?oe:te;this.iframeRevealTimeoutId=window.setTimeout(()=>d(n),Y)},m=()=>{e.querySelectorAll("iframe").forEach(y=>{y instanceof HTMLIFrameElement&&h(y)})};m(),this.iframeObserver=new MutationObserver(()=>{m()}),this.iframeObserver.observe(e,{childList:!0,subtree:!0})}applyLoadingTheme(e){if(!(e instanceof HTMLElement))return;const t=I()==="dark"?"dark":"light";e.style.backgroundColor=C(t==="dark"),e.style.colorScheme=t}ensurePlayerStyles(){if(document.getElementById(O))return;const e=document.createElement("style");e.id=O;const t=C(!0),o=C(!1);e.textContent=`
      podlove-player .podlove-player-container {
        width: 100%;
        max-width: 936px;
        margin: 0 auto;
        position: relative;
        overflow: hidden;
        background-color: var(--cast-surface, ${o});
      }
      podlove-player .podlove-player-container:not(.podlove-facade) {
        min-height: ${N}px;
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
      podlove-player .podlove-player-container .${T} {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 2;
        opacity: 1;
        transition: opacity ${z}ms ease;
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
    `,document.head.appendChild(e)}renderPlaceholder(){if(this.ensurePlayerStyles(),this.querySelector(".podlove-player-container"))return;const e=document.createElement("div");e.classList.add("podlove-player-container"),this.applyLoadingTheme(e),this.applyReservedHeight(e),this.appendChild(e)}observeElement(){this.isConnected&&(this.observer=ce(),this.observer.observe(this))}setupFacadeInteraction(){const e=this.querySelector(".podlove-player-container");if(!e||!(e instanceof HTMLElement))return;const t=e.querySelector(".podlove-facade-play");this.facadeAbortController=new AbortController;const o=this.facadeAbortController.signal,i=()=>{this.facadeAbortController&&(this.facadeAbortController.abort(),this.facadeAbortController=null),this.handleFacadeLoad()};e.addEventListener("mouseenter",i,{once:!0,signal:o}),e.addEventListener("touchstart",i,{once:!0,passive:!0,signal:o}),t&&(t.addEventListener("focus",i,{once:!0,signal:o}),t.addEventListener("click",i,{once:!0,signal:o}))}handleFacadeLoad(){var n;if(this.isInitialized||!this.isConnected)return;const e=this.querySelector(".podlove-player-container");if(!e||!(e instanceof HTMLElement))return;this.retryShouldFocus=document.activeElement===e.querySelector(".podlove-facade-play"),this.restoreFacadeButton(),(n=this.querySelector(".podlove-player-error"))==null||n.remove();const t=e.getBoundingClientRect().height,o=Math.max(t,V());e.style.minHeight=`${o}px`,this.style.minHeight=`${o}px`,e.classList.add("is-loading");const i=document.createElement("div");i.className=A,e.appendChild(i),this.initializePlayer()}showFacade(e=!1){if(this.isInitialized||!this.getAttribute("data-url"))return;const t=this.querySelector(".podlove-player-container");if(!t||t.querySelector(`.${R}`))return;const o=document.createElement("button");o.type="button",o.className=R,o.setAttribute("aria-label",e?"Retry loading player":"Play"),e?(o.classList.add("podlove-player-retry-btn"),o.textContent="Retry loading player"):o.innerHTML='<svg viewBox="0 0 24 24" width="28" height="28" fill="white" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',o.addEventListener("click",()=>this.handleFacadeClick(),{once:!0}),t.appendChild(o)}handleFacadeClick(){var i;if(this.isInitialized||!this.isConnected||!this.getAttribute("data-url"))return;const e=this.querySelector(".podlove-player-container");if(!e)return;const t=e.querySelector(`.${R}`);this.retryShouldFocus=document.activeElement===t,(i=this.querySelector(".podlove-player-error"))==null||i.remove(),t&&t.remove();const o=document.createElement("div");o.className=A,e.appendChild(o),this.initializePlayer()}initializePlayer(){if(this.isInitialized||!this.isConnected)return;const e=this.querySelector(".podlove-player-container");if(!e)return;e instanceof HTMLElement&&!this.isFacadeMode()&&this.applyReservedHeight(e),this.isFacadeMode()?e instanceof HTMLElement&&(e.style.colorScheme=I()==="dark"?"dark":"light"):this.applyLoadingTheme(e);let t=this.getAttribute("id");t||(t=`podlove-player-${Date.now()}`,this.setAttribute("id",t)),this.dataset.playerInstanceId||(F+=1,this.dataset.playerInstanceId=String(F));const o=`${t}-player-${this.dataset.playerInstanceId}`,i=this.getAttribute("data-url");if(!i)return;this.isInitialized=!0,this.initVersion+=1;const n=this.initVersion;let s=this.getAttribute("data-config")||"/api/audios/player_config/";s=he(s);const c=this.getAttribute("data-template");let d=this.getAttribute("data-embed")||"https://cdn.podlove.org/web-player/5.x/embed.js";const p=this.getOrCreatePlayerDiv(e,o,c),h=()=>{if(!(n!==this.initVersion||!this.isConnected)){try{if(typeof podlovePlayer!="function")throw new Error("Podlove embed script did not register.");podlovePlayer(p,i,s)}catch(m){this.recoverInitialization(e,n);return}n===this.initVersion&&this.isConnected&&this.maskIframeUntilReady(e,n)}};try{d=ue(d)}catch(m){this.recoverInitialization(e,n);return}typeof podlovePlayer=="function"?h():pe(d).then(h,()=>{this.recoverInitialization(e,n)})}recoverInitialization(e,t){var d,p,h,m;if(t!==this.initVersion||!this.isConnected)return;this.isInitialized=!1,this.clearReservedHeight(e),e.classList.remove("is-loading"),(d=this.querySelector(`.${A}`))==null||d.remove(),(p=this.playerDiv)==null||p.remove(),this.playerDiv=null,(h=this.facadeAbortController)==null||h.abort(),this.facadeAbortController=null;const o=document.createElement("p");o.className="podlove-player-error",o.setAttribute("role","alert"),o.textContent="Player failed to load. Please retry.",(m=this.querySelector(".podlove-player-error"))==null||m.remove(),e.appendChild(o);const i=e.querySelector(".podlove-facade-inner");this.isFacadeMode()&&i instanceof HTMLElement&&(i.style.removeProperty("position"),i.style.removeProperty("inset"),i.style.removeProperty("z-index"),i.style.removeProperty("padding"),e.classList.add("podlove-facade"));const n=e.querySelector(".podlove-facade-play");n?(this.originalFacadeButton={button:n,html:n.innerHTML,label:n.getAttribute("aria-label")},n.textContent="Retry loading player",n.setAttribute("aria-label","Retry loading player"),this.facadeAbortController=new AbortController,n.addEventListener("click",()=>{var a;(a=this.facadeAbortController)==null||a.abort(),this.facadeAbortController=null,this.handleFacadeLoad()},{once:!0,signal:this.facadeAbortController.signal})):this.showFacade(!0);const s=document.activeElement,c=s===null||s===document.body||this.contains(s);if(this.retryShouldFocus&&c){const a=e.querySelector(".podlove-facade-play, .podlove-player-retry-btn");a==null||a.focus()}this.retryShouldFocus=!1}restoreFacadeButton(){if(!this.originalFacadeButton)return;const{button:e,html:t,label:o}=this.originalFacadeButton;e.innerHTML=t,o===null?e.removeAttribute("aria-label"):e.setAttribute("aria-label",o),this.originalFacadeButton=null}getOrCreatePlayerDiv(e,t,o){return this.playerDiv||(this.playerDiv=document.createElement("div"),this.playerDiv.classList.add("podlove-player-host")),e.contains(this.playerDiv)||e.appendChild(this.playerDiv),this.playerDiv.id=t,o!==null?this.playerDiv.setAttribute("data-template",o):this.playerDiv.removeAttribute("data-template"),this.playerDiv}releaseReservedHeight(e){e instanceof HTMLElement&&(e.style.minHeight="0",e.style.removeProperty("border"),e.style.removeProperty("border-radius")),this.style.minHeight="0"}clearReservedHeight(e){e instanceof HTMLElement&&(e.style.removeProperty("min-height"),e.style.removeProperty("border"),e.style.removeProperty("border-radius")),this.style.removeProperty("min-height")}}customElements.define("podlove-player",P);_=I();const U=new MutationObserver(()=>{const l=I();l!==_&&(_=l,document.querySelectorAll("podlove-player").forEach(r=>{if(r instanceof P&&!r.isInitialized){const e=r.querySelector(".podlove-player-container");e&&!r.isFacadeMode()&&r.applyLoadingTheme(e)}}))});U.observe(document.documentElement,{attributes:!0,attributeFilter:["data-bs-theme","data-theme"]});const B=()=>{document.body&&U.observe(document.body,{attributes:!0,attributeFilter:["data-bs-theme","data-theme"]})};document.body?B():window.addEventListener("DOMContentLoaded",B,{once:!0});typeof document!="undefined"&&document.addEventListener("htmx:beforeRequest",ye,!0);
