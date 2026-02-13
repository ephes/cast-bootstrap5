var q=Object.defineProperty;var F=(l,i,e)=>i in l?q(l,i,{enumerable:!0,configurable:!0,writable:!0,value:e}):l[i]=e;var d=(l,i,e)=>F(l,typeof i!="symbol"?i+"":i,e);let m=null,D=0,A=null,S=null,w=null;const M="data-podlove-embed",k="data-podlove-embed-loaded",_="data-podlove-embed-failed",P="podlove-player-styles",C="color_scheme",b="#1e293b",I="#ffffff",$=297,x=309,z=100,N=900,K=2500,B=8e3,v="data-cast-iframe-masked",y="data-cast-mask-active",g="podlove-player-reveal-shield",U=80,Y=180,H=120,V="#paging-area",W=".pagination a, .cast-pagination a",p="data-cast-paging-remask",X=1600,j="data-cast-paging-mask-active",J=50;function Q(){return document.readyState==="complete"?Promise.resolve():(A||(A=new Promise(l=>{window.addEventListener("load",()=>l(),{once:!0})})),A)}function Z(){return S||(S=new IntersectionObserver((l,i)=>{l.forEach(e=>{if(!e.isIntersecting)return;const t=e.target;t instanceof L&&t.initializePlayer(),i.unobserve(t)})})),S}function ee(l){return typeof podlovePlayer=="function"?Promise.resolve():m||(m=new Promise((i,e)=>{const t=document.querySelector(`script[${M}]`);if(t){if(t.getAttribute(k)==="true"&&typeof podlovePlayer=="function"){i();return}if(t.getAttribute(_)==="true")t.remove();else{t.addEventListener("load",()=>i(),{once:!0}),t.addEventListener("error",()=>{t.setAttribute(_,"true"),t.remove(),m=null,e(new Error("Failed to load Podlove embed script"))},{once:!0});return}}const r=document.createElement("script");r.src=l,r.async=!0,r.setAttribute(M,"true"),r.addEventListener("load",()=>{r.setAttribute(k,"true"),i()},{once:!0}),r.addEventListener("error",()=>{r.setAttribute(_,"true"),r.remove(),m=null,e(new Error("Failed to load Podlove embed script"))},{once:!0}),document.head.appendChild(r)}),m)}function R(){var i,e;const l=document.documentElement.getAttribute("data-bs-theme")||document.documentElement.getAttribute("data-theme")||((i=document.body)==null?void 0:i.getAttribute("data-bs-theme"))||((e=document.body)==null?void 0:e.getAttribute("data-theme"));return l==="light"||l==="dark"?l:typeof window.matchMedia=="function"&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":null}function te(l){const i=R();if(!i)return l;const e=l.indexOf("#"),t=e===-1?l:l.slice(0,e),r=e===-1?"":l.slice(e+1),a=t.indexOf("?"),n=a===-1?t:t.slice(0,a),c=a===-1?"":t.slice(a+1),u=new URLSearchParams(c);u.has(C)||u.set(C,i);const s=u.toString(),h=r?`#${r}`:"";return s?`${n}?${s}${h}`:`${n}${h}`}function ie(){return typeof window.matchMedia=="function"&&window.matchMedia("(max-width: 768px)").matches?x:$}function re(l,i){i.getAttribute(p)!=="true"&&(i.setAttribute(p,"true"),i.setAttribute(v,"true"),i.style.opacity="0",i.style.pointerEvents="none",i.style.backgroundColor="inherit",i.style.colorScheme="inherit",l.setAttribute(y,"true"),window.setTimeout(()=>{!i.isConnected||i.getAttribute(p)!=="true"||(i.removeAttribute(p),i.getAttribute(v)==="true"&&i.removeAttribute(v),i.style.opacity="1",i.style.pointerEvents="",i.style.removeProperty("background-color"),i.style.removeProperty("color-scheme"),l.querySelector(`iframe[${p}="true"]`)||l.removeAttribute(y))},X))}function oe(l){const i=l.target;if(!(i instanceof Element)||!i.closest(W))return;const e=document.querySelector(V);e&&e.querySelectorAll(".podlove-player-container").forEach(t=>{t instanceof HTMLElement&&t.querySelectorAll("iframe").forEach(r=>{r instanceof HTMLIFrameElement&&r.getAttribute(v)!=="true"&&re(t,r)})})}class L extends HTMLElement{constructor(){super();d(this,"observer");d(this,"isInitialized");d(this,"playerDiv");d(this,"initVersion");d(this,"iframeObserver");d(this,"iframeRevealDelayTimeoutId");d(this,"iframeRevealTimeoutId");d(this,"iframeRevealShieldTimeoutId");this.observer=null,this.isInitialized=!1,this.playerDiv=null,this.initVersion=0,this.iframeObserver=null,this.iframeRevealDelayTimeoutId=null,this.iframeRevealTimeoutId=null,this.iframeRevealShieldTimeoutId=null}reinitializePlayer(){!this.isInitialized||!this.isConnected||(this.clearIframeMasking(),this.playerDiv&&(this.playerDiv.remove(),this.playerDiv=null),this.isInitialized=!1,delete this.dataset.playerInstanceId,this.initializePlayer())}connectedCallback(){if(this.renderPlaceholder(),document.readyState==="complete"){this.observeElement();return}Q().then(()=>this.observeElement())}disconnectedCallback(){this.observer&&this.observer.unobserve(this),this.clearIframeMasking(),this.initVersion+=1,this.isInitialized=!1}clearIframeMasking(){this.iframeObserver&&(this.iframeObserver.disconnect(),this.iframeObserver=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.iframeRevealShieldTimeoutId!==null&&(window.clearTimeout(this.iframeRevealShieldTimeoutId),this.iframeRevealShieldTimeoutId=null),this.querySelectorAll(".podlove-player-container").forEach(e=>{e instanceof HTMLElement&&(e.removeAttribute(y),e.querySelectorAll(`.${g}`).forEach(t=>{t.remove()}))})}applyReservedHeight(e){const t=`${ie()}px`;e.style.minHeight=t,this.style.minHeight=t}getOrCreateRevealShield(e){const t=e.querySelector(`.${g}`);if(t instanceof HTMLDivElement)return t.style.backgroundColor=e.style.backgroundColor||window.getComputedStyle(e).backgroundColor,t.style.opacity="1",t;const r=document.createElement("div");return r.classList.add(g),r.style.backgroundColor=e.style.backgroundColor||window.getComputedStyle(e).backgroundColor,r.style.opacity="1",e.appendChild(r),r}scheduleRevealShieldRelease(e,t){this.iframeRevealShieldTimeoutId!==null&&(window.clearTimeout(this.iframeRevealShieldTimeoutId),this.iframeRevealShieldTimeoutId=null);const r=this.getOrCreateRevealShield(e),a=e.style.colorScheme==="dark"?Y:U;this.iframeRevealShieldTimeoutId=window.setTimeout(()=>{this.initVersion===t&&(r.style.opacity="0",this.iframeRevealShieldTimeoutId=window.setTimeout(()=>{this.initVersion===t&&(r.remove(),this.releaseReservedHeight(e),this.iframeRevealShieldTimeoutId=null)},H))},a)}maskIframeUntilReady(e,t){if(!(e instanceof HTMLElement))return;this.clearIframeMasking(),e.setAttribute(y,"true");const r=e.style.colorScheme==="dark"?N:z,a=new WeakSet;let n=null;const c=()=>{const o=document.querySelector(V);return(o==null?void 0:o.getAttribute(j))==="true"},u=o=>o.getAttribute(p)==="true"?!0:c(),s=o=>{if(this.initVersion===t&&!(!(o instanceof HTMLIFrameElement)||!e.contains(o))){if(u(o)){this.iframeRevealDelayTimeoutId!==null&&window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=window.setTimeout(()=>s(o),J);return}o.style.opacity="1",o.style.pointerEvents="",o.style.removeProperty("transition"),o.style.removeProperty("background-color"),o.style.removeProperty("color-scheme"),o.removeAttribute(v),e.removeAttribute(y),this.scheduleRevealShieldRelease(e,t),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null)}},h=o=>{this.iframeRevealDelayTimeoutId!==null&&window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=window.setTimeout(()=>s(o),r)},T=o=>{if(a.has(o))return;a.add(o),n=o,this.getOrCreateRevealShield(e),o.setAttribute(v,"true"),o.style.opacity="0",o.style.pointerEvents="none",o.style.transition="opacity 160ms ease",o.style.backgroundColor="inherit",o.style.colorScheme="inherit",o.addEventListener("load",()=>{n===o&&h(o)},{once:!0}),this.iframeRevealTimeoutId!==null&&window.clearTimeout(this.iframeRevealTimeoutId);const E=e.style.colorScheme==="dark"?B:K;this.iframeRevealTimeoutId=window.setTimeout(()=>s(n),E)},f=()=>{e.querySelectorAll("iframe").forEach(E=>{E instanceof HTMLIFrameElement&&T(E)})};f(),this.iframeObserver=new MutationObserver(()=>{f()}),this.iframeObserver.observe(e,{childList:!0,subtree:!0})}applyLoadingTheme(e){if(!(e instanceof HTMLElement))return;const t=R()==="dark"?"dark":"light";e.style.backgroundColor=t==="dark"?b:I,e.style.colorScheme=t}renderPlaceholder(){if(this.querySelector(".podlove-player-container"))return;if(!document.getElementById(P)){const t=document.createElement("style");t.id=P,t.textContent=`
        podlove-player .podlove-player-container {
          width: 100%;
          max-width: 936px;
          min-height: ${$}px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
          background-color: ${I};
        }
        @media (max-width: 768px) {
          podlove-player .podlove-player-container {
            max-width: 366px;
            min-height: ${x}px;
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
        podlove-player .podlove-player-container .${g} {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 2;
          opacity: 1;
          transition: opacity ${H}ms ease;
        }
        podlove-player .podlove-player-container[${y}="true"] iframe {
          opacity: 0 !important;
          pointer-events: none !important;
        }
        @media (prefers-color-scheme: dark) {
          podlove-player .podlove-player-container {
            background-color: ${b};
          }
          podlove-player .podlove-player-container iframe {
            background-color: ${b};
            color-scheme: dark;
          }
        }
        html[data-bs-theme="dark"] podlove-player .podlove-player-container,
        html[data-theme="dark"] podlove-player .podlove-player-container,
        body[data-bs-theme="dark"] podlove-player .podlove-player-container,
        body[data-theme="dark"] podlove-player .podlove-player-container {
          background-color: ${b};
        }
        html[data-bs-theme="dark"] podlove-player .podlove-player-container iframe,
        html[data-theme="dark"] podlove-player .podlove-player-container iframe,
        body[data-bs-theme="dark"] podlove-player .podlove-player-container iframe,
        body[data-theme="dark"] podlove-player .podlove-player-container iframe {
          background-color: ${b};
          color-scheme: dark;
        }
        html[data-bs-theme="light"] podlove-player .podlove-player-container,
        html[data-theme="light"] podlove-player .podlove-player-container,
        body[data-bs-theme="light"] podlove-player .podlove-player-container,
        body[data-theme="light"] podlove-player .podlove-player-container {
          background-color: ${I};
        }
        html[data-bs-theme="light"] podlove-player .podlove-player-container iframe,
        html[data-theme="light"] podlove-player .podlove-player-container iframe,
        body[data-bs-theme="light"] podlove-player .podlove-player-container iframe,
        body[data-theme="light"] podlove-player .podlove-player-container iframe {
          background-color: ${I};
          color-scheme: light;
        }
      `,document.head.appendChild(t)}const e=document.createElement("div");e.classList.add("podlove-player-container"),this.applyLoadingTheme(e),this.applyReservedHeight(e),this.appendChild(e)}observeElement(){this.observer=Z(),this.observer.observe(this)}initializePlayer(){if(this.isInitialized||!this.isConnected)return;const e=this.querySelector(".podlove-player-container");if(!e)return;e instanceof HTMLElement&&this.applyReservedHeight(e),this.applyLoadingTheme(e);let t=this.getAttribute("id");t||(t=`podlove-player-${Date.now()}`,this.setAttribute("id",t)),this.dataset.playerInstanceId||(D+=1,this.dataset.playerInstanceId=String(D));const r=`${t}-player-${this.dataset.playerInstanceId}`,a=this.getAttribute("data-url");if(!a)return;this.isInitialized=!0,this.initVersion+=1;const n=this.initVersion;let c=this.getAttribute("data-config")||"/api/audios/player_config/";c=te(c);const u=this.getAttribute("data-template");let s=this.getAttribute("data-embed")||"https://cdn.podlove.org/web-player/5.x/embed.js";const{hostname:h,port:T}=window.location,f=this.getOrCreatePlayerDiv(e,r,u);typeof podlovePlayer=="function"?(this.maskIframeUntilReady(e,n),podlovePlayer(f,a,c),this.maskIframeUntilReady(e,n)):(h==="localhost"&&s.startsWith("/")&&(s=`http://localhost:${T}${s}`),ee(s).then(()=>{if(!(n!==this.initVersion||!this.isConnected)){if(typeof podlovePlayer=="function"){this.maskIframeUntilReady(e,n),podlovePlayer(f,a,c),this.maskIframeUntilReady(e,n);return}throw new Error("Podlove embed script did not register.")}}).catch(()=>{n===this.initVersion&&(this.isInitialized=!1,this.clearReservedHeight(e))}))}getOrCreatePlayerDiv(e,t,r){return this.playerDiv||(this.playerDiv=document.createElement("div"),this.playerDiv.classList.add("podlove-player-host")),e.contains(this.playerDiv)||e.appendChild(this.playerDiv),this.playerDiv.id=t,r!==null?this.playerDiv.setAttribute("data-template",r):this.playerDiv.removeAttribute("data-template"),this.playerDiv}releaseReservedHeight(e){e instanceof HTMLElement&&(e.style.minHeight="auto"),this.style.minHeight="auto"}clearReservedHeight(e){e instanceof HTMLElement&&e.style.removeProperty("min-height"),this.style.removeProperty("min-height")}}customElements.define("podlove-player",L);w=R();const G=new MutationObserver(()=>{const l=R();l!==w&&(w=l,document.querySelectorAll("podlove-player").forEach(i=>{i instanceof L&&i.reinitializePlayer()}))});G.observe(document.documentElement,{attributes:!0,attributeFilter:["data-bs-theme","data-theme"]});const O=()=>{document.body&&G.observe(document.body,{attributes:!0,attributeFilter:["data-bs-theme","data-theme"]})};document.body?O():window.addEventListener("DOMContentLoaded",O,{once:!0});typeof document!="undefined"&&document.addEventListener("htmx:beforeRequest",oe,!0);
