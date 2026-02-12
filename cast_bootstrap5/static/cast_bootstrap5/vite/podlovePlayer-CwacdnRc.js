var T=Object.defineProperty;var $=(r,o,e)=>o in r?T(r,o,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[o]=e;var p=(r,o,e)=>$(r,typeof o!="symbol"?o+"":o,e);let d=null,P=0,y=null,v=null,b=null;const I="data-podlove-embed",w="data-podlove-embed-loaded",f="data-podlove-embed-failed",A="podlove-player-styles",D="color_scheme",u="#1e293b",m="#ffffff";function _(){return document.readyState==="complete"?Promise.resolve():(y||(y=new Promise(r=>{window.addEventListener("load",()=>r(),{once:!0})})),y)}function x(){return v||(v=new IntersectionObserver((r,o)=>{r.forEach(e=>{if(!e.isIntersecting)return;const t=e.target;t instanceof E&&t.initializePlayer(),o.unobserve(t)})})),v}function R(r){return typeof podlovePlayer=="function"?Promise.resolve():d||(d=new Promise((o,e)=>{const t=document.querySelector(`script[${I}]`);if(t){if(t.getAttribute(w)==="true"&&typeof podlovePlayer=="function"){o();return}if(t.getAttribute(f)==="true")t.remove();else{t.addEventListener("load",()=>o(),{once:!0}),t.addEventListener("error",()=>{t.setAttribute(f,"true"),t.remove(),d=null,e(new Error("Failed to load Podlove embed script"))},{once:!0});return}}const n=document.createElement("script");n.src=r,n.async=!0,n.setAttribute(I,"true"),n.addEventListener("load",()=>{n.setAttribute(w,"true"),o()},{once:!0}),n.addEventListener("error",()=>{n.setAttribute(f,"true"),n.remove(),d=null,e(new Error("Failed to load Podlove embed script"))},{once:!0}),document.head.appendChild(n)}),d)}function O(r){const o=r.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);if(!o)return null;const[,e,t,n]=o;return[Number(e),Number(t),Number(n)]}function C(r){return r==="transparent"||r==="rgba(0, 0, 0, 0)"}function S(r){const o=O(r);if(!o)return null;const[e,t,n]=o;return(.2126*e+.7152*t+.0722*n)/255<.5}function z(){const r=[document.body,document.documentElement];for(const o of r){if(!o)continue;const e=window.getComputedStyle(o).backgroundColor;if(!e||C(e))continue;const t=S(e);if(t!==null)return t}return null}function g(){var e,t;const r=document.documentElement.getAttribute("data-bs-theme")||document.documentElement.getAttribute("data-theme")||((e=document.body)==null?void 0:e.getAttribute("data-bs-theme"))||((t=document.body)==null?void 0:t.getAttribute("data-theme"));if(r==="light"||r==="dark")return r;if(typeof window.matchMedia=="function"&&window.matchMedia("(prefers-color-scheme: dark)").matches)return"dark";const o=z();return o!==null?o?"dark":"light":null}function H(r){const o=[r,r.parentElement,document.body,document.documentElement];for(const e of o){if(!e)continue;const t=window.getComputedStyle(e).backgroundColor;if(t&&!C(t))return t}return m}function M(r){const o=g();if(!o)return r;const e=r.indexOf("#"),t=e===-1?r:r.slice(0,e),n=e===-1?"":r.slice(e+1),i=t.indexOf("?"),s=i===-1?t:t.slice(0,i),l=i===-1?"":t.slice(i+1),c=new URLSearchParams(l);c.has(D)||c.set(D,o);const a=c.toString(),h=n?`#${n}`:"";return a?`${s}?${a}${h}`:`${s}${h}`}class E extends HTMLElement{constructor(){super();p(this,"observer");p(this,"isInitialized");p(this,"playerDiv");p(this,"initVersion");this.observer=null,this.isInitialized=!1,this.playerDiv=null,this.initVersion=0}reinitializePlayer(){!this.isInitialized||!this.isConnected||(this.playerDiv&&(this.playerDiv.remove(),this.playerDiv=null),this.isInitialized=!1,delete this.dataset.playerInstanceId,this.initializePlayer())}connectedCallback(){if(this.renderPlaceholder(),document.readyState==="complete"){this.observeElement();return}_().then(()=>this.observeElement())}disconnectedCallback(){this.observer&&this.observer.unobserve(this),this.initVersion+=1,this.isInitialized=!1}applyLoadingTheme(e){if(!(e instanceof HTMLElement))return;const t=H(this),n=S(t);e.style.backgroundColor=t,e.style.colorScheme=n===!0?"dark":"light"}renderPlaceholder(){if(this.querySelector(".podlove-player-container"))return;if(!document.getElementById(A)){const t=document.createElement("style");t.id=A,t.textContent=`
        podlove-player .podlove-player-container {
          width: 100%;
          max-width: 936px;
          min-height: 300px;
          margin: 0 auto;
          background-color: ${m};
        }
        @media (max-width: 768px) {
          podlove-player .podlove-player-container {
            max-width: 366px;
            min-height: 500px;
          }
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
            background-color: ${u};
          }
          podlove-player .podlove-player-container iframe {
            background-color: ${u};
            color-scheme: dark;
          }
        }
        html[data-bs-theme="dark"] podlove-player .podlove-player-container,
        html[data-theme="dark"] podlove-player .podlove-player-container,
        body[data-bs-theme="dark"] podlove-player .podlove-player-container,
        body[data-theme="dark"] podlove-player .podlove-player-container {
          background-color: ${u};
        }
        html[data-bs-theme="dark"] podlove-player .podlove-player-container iframe,
        html[data-theme="dark"] podlove-player .podlove-player-container iframe,
        body[data-bs-theme="dark"] podlove-player .podlove-player-container iframe,
        body[data-theme="dark"] podlove-player .podlove-player-container iframe {
          background-color: ${u};
          color-scheme: dark;
        }
        html[data-bs-theme="light"] podlove-player .podlove-player-container,
        html[data-theme="light"] podlove-player .podlove-player-container,
        body[data-bs-theme="light"] podlove-player .podlove-player-container,
        body[data-theme="light"] podlove-player .podlove-player-container {
          background-color: ${m};
        }
        html[data-bs-theme="light"] podlove-player .podlove-player-container iframe,
        html[data-theme="light"] podlove-player .podlove-player-container iframe,
        body[data-bs-theme="light"] podlove-player .podlove-player-container iframe,
        body[data-theme="light"] podlove-player .podlove-player-container iframe {
          background-color: ${m};
          color-scheme: light;
        }
      `,document.head.appendChild(t)}const e=document.createElement("div");e.classList.add("podlove-player-container"),this.applyLoadingTheme(e),this.appendChild(e)}observeElement(){this.observer=x(),this.observer.observe(this)}initializePlayer(){if(this.isInitialized||!this.isConnected)return;const e=this.querySelector(".podlove-player-container");if(!e)return;this.applyLoadingTheme(e);let t=this.getAttribute("id");t||(t=`podlove-player-${Date.now()}`,this.setAttribute("id",t)),this.dataset.playerInstanceId||(P+=1,this.dataset.playerInstanceId=String(P));const n=`${t}-player-${this.dataset.playerInstanceId}`,i=this.getAttribute("data-url");if(!i)return;this.isInitialized=!0,this.initVersion+=1;const s=this.initVersion;let l=this.getAttribute("data-config")||"/api/audios/player_config/";l=M(l);const c=this.getAttribute("data-template");let a=this.getAttribute("data-embed")||"https://cdn.podlove.org/web-player/5.x/embed.js";const{hostname:h,port:L}=window.location,k=this.getOrCreatePlayerDiv(e,n,c);typeof podlovePlayer=="function"?(podlovePlayer(k,i,l),this.releaseReservedHeight(e)):(h==="localhost"&&a.startsWith("/")&&(a=`http://localhost:${L}${a}`),R(a).then(()=>{if(!(s!==this.initVersion||!this.isConnected)){if(typeof podlovePlayer=="function"){podlovePlayer(k,i,l),this.releaseReservedHeight(e);return}throw new Error("Podlove embed script did not register.")}}).catch(()=>{s===this.initVersion&&(this.isInitialized=!1)}))}getOrCreatePlayerDiv(e,t,n){return this.playerDiv||(this.playerDiv=document.createElement("div"),this.playerDiv.classList.add("podlove-player-host")),e.contains(this.playerDiv)||e.appendChild(this.playerDiv),this.playerDiv.id=t,n!==null?this.playerDiv.setAttribute("data-template",n):this.playerDiv.removeAttribute("data-template"),this.playerDiv}releaseReservedHeight(e){e instanceof HTMLElement&&(e.style.minHeight="auto"),this.style.minHeight="auto"}}customElements.define("podlove-player",E);b=g();const B=new MutationObserver(()=>{const r=g();r!==b&&(b=r,document.querySelectorAll("podlove-player").forEach(o=>{o instanceof E&&o.reinitializePlayer()}))});B.observe(document.documentElement,{attributes:!0,attributeFilter:["data-bs-theme"]});
