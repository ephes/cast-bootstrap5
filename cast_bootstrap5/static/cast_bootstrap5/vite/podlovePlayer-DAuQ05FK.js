var H=Object.defineProperty;var $=(r,i,e)=>i in r?H(r,i,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[i]=e;var u=(r,i,e)=>$(r,typeof i!="symbol"?i+"":i,e);let p=null,D=0,b=null,g=null,T=null;const A="data-podlove-embed",k="data-podlove-embed-loaded",I="data-podlove-embed-failed",C="podlove-player-styles",S="color_scheme",y="#1e293b",f="#ffffff",L=300,M=310,x=100,z=700,F=2500,E="data-cast-iframe-masked",v="podlove-player-curtain",_=220,V=120,q=450;function N(){return document.readyState==="complete"?Promise.resolve():(b||(b=new Promise(r=>{window.addEventListener("load",()=>r(),{once:!0})})),b)}function B(){return g||(g=new IntersectionObserver((r,i)=>{r.forEach(e=>{if(!e.isIntersecting)return;const t=e.target;t instanceof R&&t.initializePlayer(),i.unobserve(t)})})),g}function G(r){return typeof podlovePlayer=="function"?Promise.resolve():p||(p=new Promise((i,e)=>{const t=document.querySelector(`script[${A}]`);if(t){if(t.getAttribute(k)==="true"&&typeof podlovePlayer=="function"){i();return}if(t.getAttribute(I)==="true")t.remove();else{t.addEventListener("load",()=>i(),{once:!0}),t.addEventListener("error",()=>{t.setAttribute(I,"true"),t.remove(),p=null,e(new Error("Failed to load Podlove embed script"))},{once:!0});return}}const n=document.createElement("script");n.src=r,n.async=!0,n.setAttribute(A,"true"),n.addEventListener("load",()=>{n.setAttribute(k,"true"),i()},{once:!0}),n.addEventListener("error",()=>{n.setAttribute(I,"true"),n.remove(),p=null,e(new Error("Failed to load Podlove embed script"))},{once:!0}),document.head.appendChild(n)}),p)}function U(r){const i=r.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);if(!i)return null;const[,e,t,n]=i;return[Number(e),Number(t),Number(n)]}function P(r){return r==="transparent"||r==="rgba(0, 0, 0, 0)"}function O(r){const i=U(r);if(!i)return null;const[e,t,n]=i;return(.2126*e+.7152*t+.0722*n)/255<.5}function K(){const r=[document.body,document.documentElement];for(const i of r){if(!i)continue;const e=window.getComputedStyle(i).backgroundColor;if(!e||P(e))continue;const t=O(e);if(t!==null)return t}return null}function w(){var e,t;const r=document.documentElement.getAttribute("data-bs-theme")||document.documentElement.getAttribute("data-theme")||((e=document.body)==null?void 0:e.getAttribute("data-bs-theme"))||((t=document.body)==null?void 0:t.getAttribute("data-theme"));if(r==="light"||r==="dark")return r;if(typeof window.matchMedia=="function"&&window.matchMedia("(prefers-color-scheme: dark)").matches)return"dark";const i=K();return i!==null?i?"dark":"light":null}function Y(r){const i=[r,r.parentElement,document.body,document.documentElement];for(const e of i){if(!e)continue;const t=window.getComputedStyle(e).backgroundColor;if(t&&!P(t))return t}return f}function W(r){const i=w();if(!i)return r;const e=r.indexOf("#"),t=e===-1?r:r.slice(0,e),n=e===-1?"":r.slice(e+1),a=t.indexOf("?"),l=a===-1?t:t.slice(0,a),c=a===-1?"":t.slice(a+1),m=new URLSearchParams(c);m.has(S)||m.set(S,i);const s=m.toString(),h=n?`#${n}`:"";return s?`${l}?${s}${h}`:`${l}${h}`}function X(){return typeof window.matchMedia=="function"&&window.matchMedia("(max-width: 768px)").matches?M:L}class R extends HTMLElement{constructor(){super();u(this,"observer");u(this,"isInitialized");u(this,"playerDiv");u(this,"initVersion");u(this,"iframeObserver");u(this,"iframeRevealDelayTimeoutId");u(this,"iframeRevealTimeoutId");u(this,"iframeCurtainTimeoutId");this.observer=null,this.isInitialized=!1,this.playerDiv=null,this.initVersion=0,this.iframeObserver=null,this.iframeRevealDelayTimeoutId=null,this.iframeRevealTimeoutId=null,this.iframeCurtainTimeoutId=null}reinitializePlayer(){!this.isInitialized||!this.isConnected||(this.clearIframeMasking(),this.playerDiv&&(this.playerDiv.remove(),this.playerDiv=null),this.isInitialized=!1,delete this.dataset.playerInstanceId,this.initializePlayer())}connectedCallback(){if(this.renderPlaceholder(),document.readyState==="complete"){this.observeElement();return}N().then(()=>this.observeElement())}disconnectedCallback(){this.observer&&this.observer.unobserve(this),this.clearIframeMasking(),this.initVersion+=1,this.isInitialized=!1}clearIframeMasking(){this.iframeObserver&&(this.iframeObserver.disconnect(),this.iframeObserver=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.iframeCurtainTimeoutId!==null&&(window.clearTimeout(this.iframeCurtainTimeoutId),this.iframeCurtainTimeoutId=null),this.querySelectorAll(`.${v}`).forEach(e=>e.remove())}applyReservedHeight(e){const t=`${X()}px`;e.style.minHeight=t,this.style.minHeight=t}maskIframeUntilReady(e,t){if(!(e instanceof HTMLElement))return;this.clearIframeMasking();const n=e.style.colorScheme==="dark"?z:x,a=e.style.colorScheme==="dark"?q:V,l=()=>{const o=e.querySelector(`.${v}`);if(o instanceof HTMLDivElement)return o.style.backgroundColor=e.style.backgroundColor||window.getComputedStyle(e).backgroundColor,o.style.opacity="1",o;const d=document.createElement("div");return d.classList.add(v),d.style.backgroundColor=e.style.backgroundColor||window.getComputedStyle(e).backgroundColor,e.appendChild(d),d},c=o=>{if(this.initVersion!==t)return;o.style.opacity="1",o.style.pointerEvents="",o.style.removeProperty("transition"),o.style.removeProperty("background-color"),o.style.removeProperty("color-scheme"),o.removeAttribute(E);const d=l();this.iframeCurtainTimeoutId=window.setTimeout(()=>{this.initVersion===t&&(d.style.opacity="0",this.iframeCurtainTimeoutId=window.setTimeout(()=>{this.initVersion===t&&(d.remove(),this.releaseReservedHeight(e),this.iframeCurtainTimeoutId=null)},_))},a),this.iframeRevealTimeoutId!==null&&(window.clearTimeout(this.iframeRevealTimeoutId),this.iframeRevealTimeoutId=null),this.iframeRevealDelayTimeoutId!==null&&(window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=null)},m=o=>{this.iframeRevealDelayTimeoutId!==null&&window.clearTimeout(this.iframeRevealDelayTimeoutId),this.iframeRevealDelayTimeoutId=window.setTimeout(()=>c(o),n)},s=o=>{o.getAttribute(E)!=="true"&&(l(),o.setAttribute(E,"true"),o.style.opacity="0",o.style.pointerEvents="none",o.style.transition="opacity 160ms ease",o.style.backgroundColor="inherit",o.style.colorScheme="inherit",o.addEventListener("load",()=>m(o),{once:!0}),this.iframeRevealTimeoutId=window.setTimeout(()=>c(o),F))},h=e.querySelector("iframe");if(h instanceof HTMLIFrameElement){s(h);return}this.iframeObserver=new MutationObserver(()=>{const o=e.querySelector("iframe");o instanceof HTMLIFrameElement&&(s(o),this.iframeObserver&&(this.iframeObserver.disconnect(),this.iframeObserver=null))}),this.iframeObserver.observe(e,{childList:!0,subtree:!0})}applyLoadingTheme(e){if(!(e instanceof HTMLElement))return;const t=Y(this),n=O(t);e.style.backgroundColor=t,e.style.colorScheme=n===!0?"dark":"light"}renderPlaceholder(){if(this.querySelector(".podlove-player-container"))return;if(!document.getElementById(C)){const t=document.createElement("style");t.id=C,t.textContent=`
        podlove-player .podlove-player-container {
          width: 100%;
          max-width: 936px;
          min-height: ${L}px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
          background-color: ${f};
        }
        @media (max-width: 768px) {
          podlove-player .podlove-player-container {
            max-width: 366px;
            min-height: ${M}px;
          }
        }
        podlove-player .podlove-player-container .${v} {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 2;
          opacity: 1;
          transition: opacity ${_}ms ease;
        }
        podlove-player .podlove-player-host {
          position: relative;
          z-index: 1;
        }
        podlove-player .podlove-player-container iframe {
          width: 100%;
          height: 100%;
          border: none;
          background-color: inherit;
          color-scheme: inherit;
        }
        @media (prefers-color-scheme: dark) {
          podlove-player .podlove-player-container {
            background-color: ${y};
          }
          podlove-player .podlove-player-container iframe {
            background-color: ${y};
            color-scheme: dark;
          }
        }
        html[data-bs-theme="dark"] podlove-player .podlove-player-container,
        html[data-theme="dark"] podlove-player .podlove-player-container,
        body[data-bs-theme="dark"] podlove-player .podlove-player-container,
        body[data-theme="dark"] podlove-player .podlove-player-container {
          background-color: ${y};
        }
        html[data-bs-theme="dark"] podlove-player .podlove-player-container iframe,
        html[data-theme="dark"] podlove-player .podlove-player-container iframe,
        body[data-bs-theme="dark"] podlove-player .podlove-player-container iframe,
        body[data-theme="dark"] podlove-player .podlove-player-container iframe {
          background-color: ${y};
          color-scheme: dark;
        }
        html[data-bs-theme="light"] podlove-player .podlove-player-container,
        html[data-theme="light"] podlove-player .podlove-player-container,
        body[data-bs-theme="light"] podlove-player .podlove-player-container,
        body[data-theme="light"] podlove-player .podlove-player-container {
          background-color: ${f};
        }
        html[data-bs-theme="light"] podlove-player .podlove-player-container iframe,
        html[data-theme="light"] podlove-player .podlove-player-container iframe,
        body[data-bs-theme="light"] podlove-player .podlove-player-container iframe,
        body[data-theme="light"] podlove-player .podlove-player-container iframe {
          background-color: ${f};
          color-scheme: light;
        }
      `,document.head.appendChild(t)}const e=document.createElement("div");e.classList.add("podlove-player-container"),this.applyLoadingTheme(e),this.applyReservedHeight(e),this.appendChild(e)}observeElement(){this.observer=B(),this.observer.observe(this)}initializePlayer(){if(this.isInitialized||!this.isConnected)return;const e=this.querySelector(".podlove-player-container");if(!e)return;e instanceof HTMLElement&&this.applyReservedHeight(e),this.applyLoadingTheme(e);let t=this.getAttribute("id");t||(t=`podlove-player-${Date.now()}`,this.setAttribute("id",t)),this.dataset.playerInstanceId||(D+=1,this.dataset.playerInstanceId=String(D));const n=`${t}-player-${this.dataset.playerInstanceId}`,a=this.getAttribute("data-url");if(!a)return;this.isInitialized=!0,this.initVersion+=1;const l=this.initVersion;let c=this.getAttribute("data-config")||"/api/audios/player_config/";c=W(c);const m=this.getAttribute("data-template");let s=this.getAttribute("data-embed")||"https://cdn.podlove.org/web-player/5.x/embed.js";const{hostname:h,port:o}=window.location,d=this.getOrCreatePlayerDiv(e,n,m);typeof podlovePlayer=="function"?(podlovePlayer(d,a,c),this.maskIframeUntilReady(e,l)):(h==="localhost"&&s.startsWith("/")&&(s=`http://localhost:${o}${s}`),G(s).then(()=>{if(!(l!==this.initVersion||!this.isConnected)){if(typeof podlovePlayer=="function"){podlovePlayer(d,a,c),this.maskIframeUntilReady(e,l);return}throw new Error("Podlove embed script did not register.")}}).catch(()=>{l===this.initVersion&&(this.isInitialized=!1)}))}getOrCreatePlayerDiv(e,t,n){return this.playerDiv||(this.playerDiv=document.createElement("div"),this.playerDiv.classList.add("podlove-player-host")),e.contains(this.playerDiv)||e.appendChild(this.playerDiv),this.playerDiv.id=t,n!==null?this.playerDiv.setAttribute("data-template",n):this.playerDiv.removeAttribute("data-template"),this.playerDiv}releaseReservedHeight(e){e instanceof HTMLElement&&(e.style.minHeight="auto"),this.style.minHeight="auto"}}customElements.define("podlove-player",R);T=w();const j=new MutationObserver(()=>{const r=w();r!==T&&(T=r,document.querySelectorAll("podlove-player").forEach(i=>{i instanceof R&&i.reinitializePlayer()}))});j.observe(document.documentElement,{attributes:!0,attributeFilter:["data-bs-theme"]});
