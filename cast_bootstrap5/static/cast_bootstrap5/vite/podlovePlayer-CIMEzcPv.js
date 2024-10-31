class c extends HTMLElement{constructor(){super(),this.observer=null,this.shadow=this.attachShadow({mode:"open"})}connectedCallback(){this.renderPlaceholder(),this.observeElement()}disconnectedCallback(){this.observer&&this.observer.disconnect()}renderPlaceholder(){const e=document.createElement("div");e.classList.add("podlove-player-container");const t=document.createElement("style");t.textContent=`
      .podlove-player-container {
        width: 100%;
        max-width: 936px;
        height: 300px;
        margin: 0 auto;
      }
      @media (max-width: 768px) {
        .podlove-player-container {
          max-width: 366px;
          height: 500px;
        }
      }
      .podlove-player-container iframe {
        width: 100%;
        height: 100%;
        border: none;
      }
    `,this.shadow.appendChild(t),this.shadow.appendChild(e)}observeElement(){this.observer=new IntersectionObserver((e,t)=>{e.forEach(o=>{o.isIntersecting&&(this.initializePlayer(),t.unobserve(this))})}),this.observer.observe(this)}initializePlayer(){const e=this.shadow.querySelector(".podlove-player-container"),t=this.getAttribute("id")||`podlove-player-${Date.now()}`,o=this.getAttribute("data-url"),n=this.getAttribute("data-config")||"/api/audios/player_config/";let i=this.getAttribute("data-embed")||"https://cdn.podlove.org/web-player/5.x/embed.js";const{protocol:d,hostname:a,port:s}=window.location;console.log("protocol, hostname, port: ",d,a,s);const l=document.createElement("div");l.id=t,e.appendChild(l),typeof podlovePlayer=="function"?(console.log("embed url: ",i),console.log("starting podlove player with: ",l,o,n),podlovePlayer(l,o,n)):(a==="localhost"&&i.startsWith("/")&&(i=`http://localhost:${s}${i}`),import(i).then(()=>{const r=document.createElement("div");r.id=t,e.appendChild(r),podlovePlayer(r,o,n)}))}}console.log("Registering podlove-player!");customElements.define("podlove-player",c);
