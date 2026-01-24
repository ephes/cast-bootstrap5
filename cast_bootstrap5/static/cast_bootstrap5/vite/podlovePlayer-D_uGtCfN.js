var b=Object.defineProperty;var f=(i,o,t)=>o in i?b(i,o,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[o]=t;var d=(i,o,t)=>f(i,typeof o!="symbol"?o+"":o,t);let l=null;const p="data-podlove-embed",u="data-podlove-embed-loaded",s="data-podlove-embed-failed",v="podlove-player-styles";function E(i){return typeof podlovePlayer=="function"?Promise.resolve():l||(l=new Promise((o,t)=>{const e=document.querySelector(`script[${p}]`);if(e){if(e.getAttribute(u)==="true"&&typeof podlovePlayer=="function"){o();return}if(e.getAttribute(s)==="true")e.remove();else{e.addEventListener("load",()=>o(),{once:!0}),e.addEventListener("error",()=>{e.setAttribute(s,"true"),e.remove(),l=null,t(new Error("Failed to load Podlove embed script"))},{once:!0});return}}const r=document.createElement("script");r.src=i,r.async=!0,r.setAttribute(p,"true"),r.addEventListener("load",()=>{r.setAttribute(u,"true"),o()},{once:!0}),r.addEventListener("error",()=>{r.setAttribute(s,"true"),r.remove(),l=null,t(new Error("Failed to load Podlove embed script"))},{once:!0}),document.head.appendChild(r)}),l)}class g extends HTMLElement{constructor(){super();d(this,"observer");d(this,"playerDiv");this.observer=null,this.playerDiv=null}connectedCallback(){this.renderPlaceholder(),document.readyState==="complete"?this.observeElement():window.addEventListener("load",()=>{this.observeElement()},{once:!0})}disconnectedCallback(){this.observer&&this.observer.disconnect()}renderPlaceholder(){if(this.querySelector(".podlove-player-container"))return;if(!document.getElementById(v)){const e=document.createElement("style");e.id=v,e.textContent=`
        podlove-player .podlove-player-container {
          width: 100%;
          max-width: 936px;
          min-height: 300px;
          margin: 0 auto;
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
        }
      `,document.head.appendChild(e)}const t=document.createElement("div");t.classList.add("podlove-player-container"),this.appendChild(t)}observeElement(){this.observer=new IntersectionObserver((t,e)=>{t.forEach(r=>{r.isIntersecting&&(this.initializePlayer(),e.unobserve(this))})}),this.observer.observe(this)}initializePlayer(){const t=this.querySelector(".podlove-player-container");if(!t)return;let e=this.getAttribute("id");e||(e=`podlove-player-${Date.now()}`,this.setAttribute("id",e));const r=`${e}-player`,a=this.getAttribute("data-url");if(!a)return;const c=this.getAttribute("data-config")||"/api/audios/player_config/",h=this.getAttribute("data-template");let n=this.getAttribute("data-embed")||"https://cdn.podlove.org/web-player/5.x/embed.js";const{hostname:y,port:m}=window.location;this.getOrCreatePlayerDiv(t,r,h),typeof podlovePlayer=="function"?podlovePlayer(`#${r}`,a,c):(y==="localhost"&&n.startsWith("/")&&(n=`http://localhost:${m}${n}`),E(n).then(()=>{if(typeof podlovePlayer=="function"){podlovePlayer(`#${r}`,a,c);return}throw new Error("Podlove embed script did not register.")}).catch(()=>{}))}getOrCreatePlayerDiv(t,e,r){return this.playerDiv||(this.playerDiv=document.createElement("div"),this.playerDiv.classList.add("podlove-player-host")),t.contains(this.playerDiv)||t.appendChild(this.playerDiv),this.playerDiv.id=e,r!==null?this.playerDiv.setAttribute("data-template",r):this.playerDiv.removeAttribute("data-template"),this.playerDiv}}console.log("Registering podlove-player!");customElements.define("podlove-player",g);
