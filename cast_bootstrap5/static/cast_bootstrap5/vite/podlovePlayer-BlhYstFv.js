var L=Object.defineProperty;var $=(r,i,e)=>i in r?L(r,i,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[i]=e;var h=(r,i,e)=>$(r,typeof i!="symbol"?i+"":i,e);let s=null,I=0,v=null,y=null,b=null;const A="data-podlove-embed",D="data-podlove-embed-loaded",f="data-podlove-embed-failed",S="podlove-player-styles",w="color_scheme",u="#1e293b",m="#ffffff";function _(){return document.readyState==="complete"?Promise.resolve():(v||(v=new Promise(r=>{window.addEventListener("load",()=>r(),{once:!0})})),v)}function x(){return y||(y=new IntersectionObserver((r,i)=>{r.forEach(e=>{if(!e.isIntersecting)return;const t=e.target;t instanceof E&&t.initializePlayer(),i.unobserve(t)})})),y}function k(r){return typeof podlovePlayer=="function"?Promise.resolve():s||(s=new Promise((i,e)=>{const t=document.querySelector(`script[${A}]`);if(t){if(t.getAttribute(D)==="true"&&typeof podlovePlayer=="function"){i();return}if(t.getAttribute(f)==="true")t.remove();else{t.addEventListener("load",()=>i(),{once:!0}),t.addEventListener("error",()=>{t.setAttribute(f,"true"),t.remove(),s=null,e(new Error("Failed to load Podlove embed script"))},{once:!0});return}}const o=document.createElement("script");o.src=r,o.async=!0,o.setAttribute(A,"true"),o.addEventListener("load",()=>{o.setAttribute(D,"true"),i()},{once:!0}),o.addEventListener("error",()=>{o.setAttribute(f,"true"),o.remove(),s=null,e(new Error("Failed to load Podlove embed script"))},{once:!0}),document.head.appendChild(o)}),s)}function g(){const r=document.documentElement.getAttribute("data-bs-theme");return r==="light"||r==="dark"?r:null}function O(r){const i=g();if(!i)return r;const e=r.indexOf("#"),t=e===-1?r:r.slice(0,e),o=e===-1?"":r.slice(e+1),n=t.indexOf("?"),d=n===-1?t:t.slice(0,n),l=n===-1?"":t.slice(n+1),c=new URLSearchParams(l);c.has(w)||c.set(w,i);const a=c.toString(),p=o?`#${o}`:"";return a?`${d}?${a}${p}`:`${d}${p}`}class E extends HTMLElement{constructor(){super();h(this,"observer");h(this,"isInitialized");h(this,"playerDiv");h(this,"initVersion");this.observer=null,this.isInitialized=!1,this.playerDiv=null,this.initVersion=0}reinitializePlayer(){!this.isInitialized||!this.isConnected||(this.playerDiv&&(this.playerDiv.remove(),this.playerDiv=null),this.isInitialized=!1,delete this.dataset.playerInstanceId,this.initializePlayer())}connectedCallback(){if(this.renderPlaceholder(),document.readyState==="complete"){this.observeElement();return}_().then(()=>this.observeElement())}disconnectedCallback(){this.observer&&this.observer.unobserve(this),this.initVersion+=1,this.isInitialized=!1}renderPlaceholder(){if(this.querySelector(".podlove-player-container"))return;if(!document.getElementById(S)){const t=document.createElement("style");t.id=S,t.textContent=`
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
          background-color: ${m};
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
        html[data-bs-theme="dark"] podlove-player .podlove-player-container {
          background-color: ${u};
        }
        html[data-bs-theme="dark"] podlove-player .podlove-player-container iframe {
          background-color: ${u};
          color-scheme: dark;
        }
        html[data-bs-theme="light"] podlove-player .podlove-player-container {
          background-color: ${m};
        }
        html[data-bs-theme="light"] podlove-player .podlove-player-container iframe {
          background-color: ${m};
          color-scheme: light;
        }
      `,document.head.appendChild(t)}const e=document.createElement("div");e.classList.add("podlove-player-container"),this.appendChild(e)}observeElement(){this.observer=x(),this.observer.observe(this)}initializePlayer(){if(this.isInitialized||!this.isConnected)return;const e=this.querySelector(".podlove-player-container");if(!e)return;let t=this.getAttribute("id");t||(t=`podlove-player-${Date.now()}`,this.setAttribute("id",t)),this.dataset.playerInstanceId||(I+=1,this.dataset.playerInstanceId=String(I));const o=`${t}-player-${this.dataset.playerInstanceId}`,n=this.getAttribute("data-url");if(!n)return;this.isInitialized=!0,this.initVersion+=1;const d=this.initVersion;let l=this.getAttribute("data-config")||"/api/audios/player_config/";l=O(l);const c=this.getAttribute("data-template");let a=this.getAttribute("data-embed")||"https://cdn.podlove.org/web-player/5.x/embed.js";const{hostname:p,port:C}=window.location,P=this.getOrCreatePlayerDiv(e,o,c);typeof podlovePlayer=="function"?(podlovePlayer(P,n,l),this.releaseReservedHeight(e)):(p==="localhost"&&a.startsWith("/")&&(a=`http://localhost:${C}${a}`),k(a).then(()=>{if(!(d!==this.initVersion||!this.isConnected)){if(typeof podlovePlayer=="function"){podlovePlayer(P,n,l),this.releaseReservedHeight(e);return}throw new Error("Podlove embed script did not register.")}}).catch(()=>{d===this.initVersion&&(this.isInitialized=!1)}))}getOrCreatePlayerDiv(e,t,o){return this.playerDiv||(this.playerDiv=document.createElement("div"),this.playerDiv.classList.add("podlove-player-host")),e.contains(this.playerDiv)||e.appendChild(this.playerDiv),this.playerDiv.id=t,o!==null?this.playerDiv.setAttribute("data-template",o):this.playerDiv.removeAttribute("data-template"),this.playerDiv}releaseReservedHeight(e){e instanceof HTMLElement&&(e.style.minHeight="auto"),this.style.minHeight="auto"}}customElements.define("podlove-player",E);b=g();const R=new MutationObserver(()=>{const r=g();r!==b&&(b=r,document.querySelectorAll("podlove-player").forEach(i=>{i instanceof E&&i.reinitializePlayer()}))});R.observe(document.documentElement,{attributes:!0,attributeFilter:["data-bs-theme"]});
