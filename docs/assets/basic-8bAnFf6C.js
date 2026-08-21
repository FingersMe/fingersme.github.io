import{k as B,o as M,l as A,m as R,n as c,y as L,D as T,O as Y,G as E,E as J,R as O,P as ke,u as D,Q as S,U as ft,I as qi,W as gt,C as jt,v as si,T as kt,B as Qe,M as vi,V as yi,w as Ae,L as li,q as Hi}from"./core-D4xiukJm.js";import{n as u,c as x,o as y,r as v,U as se,e as Ki,f as Gi,a as Yi}from"./index--wnISCJl.js";import{d as Ji}from"./dijkstra-D_NXgYpA.js";import"./index-CF7t4PCP.js";import"./events-EwPnNHR0.js";import"./index.es-BqguWv3g.js";import"./index-BTJb-n1K.js";import"./index-nibyPLVP.js";import"./fallback-BDcBcYZ7.js";const Qi=B`
  :host {
    position: relative;
    background-color: var(--wui-color-gray-glass-002);
    display: flex;
    justify-content: center;
    align-items: center;
    width: var(--local-size);
    height: var(--local-size);
    border-radius: inherit;
    border-radius: var(--local-border-radius);
  }

  :host > wui-flex {
    overflow: hidden;
    border-radius: inherit;
    border-radius: var(--local-border-radius);
  }

  :host::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: inherit;
    border: 1px solid var(--wui-color-gray-glass-010);
    pointer-events: none;
  }

  :host([name='Extension'])::after {
    border: 1px solid var(--wui-color-accent-glass-010);
  }

  :host([data-wallet-icon='allWallets']) {
    background-color: var(--wui-all-wallets-bg-100);
  }

  :host([data-wallet-icon='allWallets'])::after {
    border: 1px solid var(--wui-color-accent-glass-010);
  }

  wui-icon[data-parent-size='inherit'] {
    width: 75%;
    height: 75%;
    align-items: center;
  }

  wui-icon[data-parent-size='sm'] {
    width: 18px;
    height: 18px;
  }

  wui-icon[data-parent-size='md'] {
    width: 24px;
    height: 24px;
  }

  wui-icon[data-parent-size='lg'] {
    width: 42px;
    height: 42px;
  }

  wui-icon[data-parent-size='full'] {
    width: 100%;
    height: 100%;
  }

  :host > wui-icon-box {
    position: absolute;
    overflow: hidden;
    right: -1px;
    bottom: -2px;
    z-index: 1;
    border: 2px solid var(--wui-color-bg-150, #1e1f1f);
    padding: 1px;
  }
`;var xe=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let le=class extends R{constructor(){super(...arguments),this.size="md",this.name="",this.installed=!1,this.badgeSize="xs"}render(){let e="xxs";return this.size==="lg"?e="m":this.size==="md"?e="xs":e="xxs",this.style.cssText=`
       --local-border-radius: var(--wui-border-radius-${e});
       --local-size: var(--wui-wallet-image-size-${this.size});
   `,this.walletIcon&&(this.dataset.walletIcon=this.walletIcon),c`
      <wui-flex justifyContent="center" alignItems="center"> ${this.templateVisual()} </wui-flex>
    `}templateVisual(){return this.imageSrc?c`<wui-image src=${this.imageSrc} alt=${this.name}></wui-image>`:this.walletIcon?c`<wui-icon
        data-parent-size="md"
        size="md"
        color="inherit"
        name=${this.walletIcon}
      ></wui-icon>`:c`<wui-icon
      data-parent-size=${this.size}
      size="inherit"
      color="inherit"
      name="walletPlaceholder"
    ></wui-icon>`}};le.styles=[M,A,Qi];xe([u()],le.prototype,"size",void 0);xe([u()],le.prototype,"name",void 0);xe([u()],le.prototype,"imageSrc",void 0);xe([u()],le.prototype,"walletIcon",void 0);xe([u({type:Boolean})],le.prototype,"installed",void 0);xe([u()],le.prototype,"badgeSize",void 0);le=xe([x("wui-wallet-image")],le);const Xi=B`
  :host {
    position: relative;
    border-radius: var(--wui-border-radius-xxs);
    width: 40px;
    height: 40px;
    overflow: hidden;
    background: var(--wui-color-gray-glass-002);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--wui-spacing-4xs);
    padding: 3.75px !important;
  }

  :host::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: inherit;
    border: 1px solid var(--wui-color-gray-glass-010);
    pointer-events: none;
  }

  :host > wui-wallet-image {
    width: 14px;
    height: 14px;
    border-radius: var(--wui-border-radius-5xs);
  }

  :host > wui-flex {
    padding: 2px;
    position: fixed;
    overflow: hidden;
    left: 34px;
    bottom: 8px;
    background: var(--dark-background-150, #1e1f1f);
    border-radius: 50%;
    z-index: 2;
    display: flex;
  }
`;var xi=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};const _t=4;let Xe=class extends R{constructor(){super(...arguments),this.walletImages=[]}render(){const e=this.walletImages.length<_t;return c`${this.walletImages.slice(0,_t).map(({src:i,walletName:n})=>c`
            <wui-wallet-image
              size="inherit"
              imageSrc=${i}
              name=${y(n)}
            ></wui-wallet-image>
          `)}
      ${e?[...Array(_t-this.walletImages.length)].map(()=>c` <wui-wallet-image size="inherit" name=""></wui-wallet-image>`):null}
      <wui-flex>
        <wui-icon-box
          size="xxs"
          iconSize="xxs"
          iconcolor="success-100"
          backgroundcolor="success-100"
          icon="checkmark"
          background="opaque"
        ></wui-icon-box>
      </wui-flex>`}};Xe.styles=[A,Xi];xi([u({type:Array})],Xe.prototype,"walletImages",void 0);Xe=xi([x("wui-all-wallets-image")],Xe);const Zi=B`
  button {
    column-gap: var(--wui-spacing-s);
    padding: 7px var(--wui-spacing-l) 7px var(--wui-spacing-xs);
    width: 100%;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
    color: var(--wui-color-fg-100);
  }

  button > wui-text:nth-child(2) {
    display: flex;
    flex: 1;
  }

  button:disabled {
    background-color: var(--wui-color-gray-glass-015);
    color: var(--wui-color-gray-glass-015);
  }

  button:disabled > wui-tag {
    background-color: var(--wui-color-gray-glass-010);
    color: var(--wui-color-fg-300);
  }

  wui-icon {
    color: var(--wui-color-fg-200) !important;
  }
`;var U=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let k=class extends R{constructor(){super(...arguments),this.walletImages=[],this.imageSrc="",this.name="",this.tabIdx=void 0,this.installed=!1,this.disabled=!1,this.showAllWallets=!1,this.loading=!1,this.loadingSpinnerColor="accent-100"}render(){return c`
      <button ?disabled=${this.disabled} tabindex=${y(this.tabIdx)}>
        ${this.templateAllWallets()} ${this.templateWalletImage()}
        <wui-text variant="paragraph-500" color="inherit">${this.name}</wui-text>
        ${this.templateStatus()}
      </button>
    `}templateAllWallets(){return this.showAllWallets&&this.imageSrc?c` <wui-all-wallets-image .imageeSrc=${this.imageSrc}> </wui-all-wallets-image> `:this.showAllWallets&&this.walletIcon?c` <wui-wallet-image .walletIcon=${this.walletIcon} size="sm"> </wui-wallet-image> `:null}templateWalletImage(){return!this.showAllWallets&&this.imageSrc?c`<wui-wallet-image
        size="sm"
        imageSrc=${this.imageSrc}
        name=${this.name}
        .installed=${this.installed}
      ></wui-wallet-image>`:!this.showAllWallets&&!this.imageSrc?c`<wui-wallet-image size="sm" name=${this.name}></wui-wallet-image>`:null}templateStatus(){return this.loading?c`<wui-loading-spinner
        size="lg"
        color=${this.loadingSpinnerColor}
      ></wui-loading-spinner>`:this.tagLabel&&this.tagVariant?c`<wui-tag variant=${this.tagVariant}>${this.tagLabel}</wui-tag>`:this.icon?c`<wui-icon color="inherit" size="sm" name=${this.icon}></wui-icon>`:null}};k.styles=[A,M,Zi];U([u({type:Array})],k.prototype,"walletImages",void 0);U([u()],k.prototype,"imageSrc",void 0);U([u()],k.prototype,"name",void 0);U([u()],k.prototype,"tagLabel",void 0);U([u()],k.prototype,"tagVariant",void 0);U([u()],k.prototype,"icon",void 0);U([u()],k.prototype,"walletIcon",void 0);U([u()],k.prototype,"tabIdx",void 0);U([u({type:Boolean})],k.prototype,"installed",void 0);U([u({type:Boolean})],k.prototype,"disabled",void 0);U([u({type:Boolean})],k.prototype,"showAllWallets",void 0);U([u({type:Boolean})],k.prototype,"loading",void 0);U([u({type:String})],k.prototype,"loadingSpinnerColor",void 0);k=U([x("wui-list-wallet")],k);var Be=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let we=class extends R{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=L.state.connectors,this.count=T.state.count,this.filteredCount=T.state.filteredWallets.length,this.isFetchingRecommendedWallets=T.state.isFetchingRecommendedWallets,this.unsubscribe.push(L.subscribeKey("connectors",e=>this.connectors=e),T.subscribeKey("count",e=>this.count=e),T.subscribeKey("filteredWallets",e=>this.filteredCount=e.length),T.subscribeKey("isFetchingRecommendedWallets",e=>this.isFetchingRecommendedWallets=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.connectors.find(l=>l.id==="walletConnect"),{allWallets:i}=Y.state;if(!e||i==="HIDE"||i==="ONLY_MOBILE"&&!E.isMobile())return null;const n=T.state.featured.length,r=this.count+n,t=r<10?r:Math.floor(r/10)*10,a=this.filteredCount>0?this.filteredCount:t;let s=`${a}`;return this.filteredCount>0?s=`${this.filteredCount}`:a<r&&(s=`${a}+`),c`
      <wui-list-wallet
        name="All Wallets"
        walletIcon="allWallets"
        showAllWallets
        @click=${this.onAllWallets.bind(this)}
        tagLabel=${s}
        tagVariant="shade"
        data-testid="all-wallets"
        tabIdx=${y(this.tabIdx)}
        .loading=${this.isFetchingRecommendedWallets}
        loadingSpinnerColor=${this.isFetchingRecommendedWallets?"fg-300":"accent-100"}
      ></wui-list-wallet>
    `}onAllWallets(){J.sendEvent({type:"track",event:"CLICK_ALL_WALLETS"}),O.push("AllWallets")}};Be([u()],we.prototype,"tabIdx",void 0);Be([v()],we.prototype,"connectors",void 0);Be([v()],we.prototype,"count",void 0);Be([v()],we.prototype,"filteredCount",void 0);Be([v()],we.prototype,"isFetchingRecommendedWallets",void 0);we=Be([x("w3m-all-wallets-widget")],we);var Kt=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let Ze=class extends R{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=L.state.connectors,this.unsubscribe.push(L.subscribeKey("connectors",e=>this.connectors=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.connectors.filter(i=>i.type==="ANNOUNCED");return e?.length?c`
      <wui-flex flexDirection="column" gap="xs">
        ${e.filter(ke.showConnector).map(i=>c`
              <wui-list-wallet
                imageSrc=${y(D.getConnectorImage(i))}
                name=${i.name??"Unknown"}
                @click=${()=>this.onConnector(i)}
                tagVariant="success"
                tagLabel="installed"
                data-testid=${`wallet-selector-${i.id}`}
                .installed=${!0}
                tabIdx=${y(this.tabIdx)}
              >
              </wui-list-wallet>
            `)}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnector(e){e.id==="walletConnect"?E.isMobile()?O.push("AllWallets"):O.push("ConnectingWalletConnect"):O.push("ConnectingExternal",{connector:e})}};Kt([u()],Ze.prototype,"tabIdx",void 0);Kt([v()],Ze.prototype,"connectors",void 0);Ze=Kt([x("w3m-connect-announced-widget")],Ze);var wt=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let ze=class extends R{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=L.state.connectors,this.loading=!1,this.unsubscribe.push(L.subscribeKey("connectors",e=>this.connectors=e)),E.isTelegram()&&E.isIos()&&(this.loading=!S.state.wcUri,this.unsubscribe.push(S.subscribeKey("wcUri",e=>this.loading=!e)))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const{customWallets:e}=Y.state;if(!e?.length)return this.style.cssText="display: none",null;const i=this.filterOutDuplicateWallets(e);return c`<wui-flex flexDirection="column" gap="xs">
      ${i.map(n=>c`
          <wui-list-wallet
            imageSrc=${y(D.getWalletImage(n))}
            name=${n.name??"Unknown"}
            @click=${()=>this.onConnectWallet(n)}
            data-testid=${`wallet-selector-${n.id}`}
            tabIdx=${y(this.tabIdx)}
            ?loading=${this.loading}
          >
          </wui-list-wallet>
        `)}
    </wui-flex>`}filterOutDuplicateWallets(e){const i=ft.getRecentWallets(),n=this.connectors.map(s=>s.info?.rdns).filter(Boolean),r=i.map(s=>s.rdns).filter(Boolean),t=n.concat(r);if(t.includes("io.metamask.mobile")&&E.isMobile()){const s=t.indexOf("io.metamask.mobile");t[s]="io.metamask"}return e.filter(s=>!t.includes(String(s?.rdns)))}onConnectWallet(e){this.loading||O.push("ConnectingWalletConnect",{wallet:e})}};wt([u()],ze.prototype,"tabIdx",void 0);wt([v()],ze.prototype,"connectors",void 0);wt([v()],ze.prototype,"loading",void 0);ze=wt([x("w3m-connect-custom-widget")],ze);var Gt=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let et=class extends R{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=L.state.connectors,this.unsubscribe.push(L.subscribeKey("connectors",e=>this.connectors=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const n=this.connectors.filter(r=>r.type==="EXTERNAL").filter(ke.showConnector).filter(r=>r.id!==qi.CONNECTOR_ID.COINBASE_SDK);return n?.length?c`
      <wui-flex flexDirection="column" gap="xs">
        ${n.map(r=>c`
            <wui-list-wallet
              imageSrc=${y(D.getConnectorImage(r))}
              .installed=${!0}
              name=${r.name??"Unknown"}
              data-testid=${`wallet-selector-external-${r.id}`}
              @click=${()=>this.onConnector(r)}
              tabIdx=${y(this.tabIdx)}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnector(e){O.push("ConnectingExternal",{connector:e})}};Gt([u()],et.prototype,"tabIdx",void 0);Gt([v()],et.prototype,"connectors",void 0);et=Gt([x("w3m-connect-external-widget")],et);var Yt=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let tt=class extends R{constructor(){super(...arguments),this.tabIdx=void 0,this.wallets=[]}render(){return this.wallets.length?c`
      <wui-flex flexDirection="column" gap="xs">
        ${this.wallets.map(e=>c`
            <wui-list-wallet
              data-testid=${`wallet-selector-featured-${e.id}`}
              imageSrc=${y(D.getWalletImage(e))}
              name=${e.name??"Unknown"}
              @click=${()=>this.onConnectWallet(e)}
              tabIdx=${y(this.tabIdx)}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnectWallet(e){L.selectWalletConnector(e)}};Yt([u()],tt.prototype,"tabIdx",void 0);Yt([u()],tt.prototype,"wallets",void 0);tt=Yt([x("w3m-connect-featured-widget")],tt);var Jt=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let it=class extends R{constructor(){super(...arguments),this.tabIdx=void 0,this.connectors=[]}render(){const e=this.connectors.filter(ke.showConnector);return e.length===0?(this.style.cssText="display: none",null):c`
      <wui-flex flexDirection="column" gap="xs">
        ${e.map(i=>c`
            <wui-list-wallet
              imageSrc=${y(D.getConnectorImage(i))}
              .installed=${!0}
              name=${i.name??"Unknown"}
              tagVariant="success"
              tagLabel="installed"
              data-testid=${`wallet-selector-${i.id}`}
              @click=${()=>this.onConnector(i)}
              tabIdx=${y(this.tabIdx)}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `}onConnector(e){L.setActiveConnector(e),O.push("ConnectingExternal",{connector:e})}};Jt([u()],it.prototype,"tabIdx",void 0);Jt([u()],it.prototype,"connectors",void 0);it=Jt([x("w3m-connect-injected-widget")],it);var Qt=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let nt=class extends R{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=L.state.connectors,this.unsubscribe.push(L.subscribeKey("connectors",e=>this.connectors=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.connectors.filter(i=>i.type==="MULTI_CHAIN"&&i.name!=="WalletConnect");return e?.length?c`
      <wui-flex flexDirection="column" gap="xs">
        ${e.map(i=>c`
            <wui-list-wallet
              imageSrc=${y(D.getConnectorImage(i))}
              .installed=${!0}
              name=${i.name??"Unknown"}
              tagVariant="shade"
              tagLabel="multichain"
              data-testid=${`wallet-selector-${i.id}`}
              @click=${()=>this.onConnector(i)}
              tabIdx=${y(this.tabIdx)}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnector(e){L.setActiveConnector(e),O.push("ConnectingMultiChain")}};Qt([u()],nt.prototype,"tabIdx",void 0);Qt([v()],nt.prototype,"connectors",void 0);nt=Qt([x("w3m-connect-multi-chain-widget")],nt);var bt=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let De=class extends R{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=L.state.connectors,this.loading=!1,this.unsubscribe.push(L.subscribeKey("connectors",e=>this.connectors=e)),E.isTelegram()&&E.isIos()&&(this.loading=!S.state.wcUri,this.unsubscribe.push(S.subscribeKey("wcUri",e=>this.loading=!e)))}render(){const i=ft.getRecentWallets().filter(n=>!gt.isExcluded(n)).filter(n=>!this.hasWalletConnector(n)).filter(n=>this.isWalletCompatibleWithCurrentChain(n));return i.length?c`
      <wui-flex flexDirection="column" gap="xs">
        ${i.map(n=>c`
            <wui-list-wallet
              imageSrc=${y(D.getWalletImage(n))}
              name=${n.name??"Unknown"}
              @click=${()=>this.onConnectWallet(n)}
              tagLabel="recent"
              tagVariant="shade"
              tabIdx=${y(this.tabIdx)}
              ?loading=${this.loading}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnectWallet(e){this.loading||L.selectWalletConnector(e)}hasWalletConnector(e){return this.connectors.some(i=>i.id===e.id||i.name===e.name)}isWalletCompatibleWithCurrentChain(e){const i=jt.state.activeChain;return i&&e.chains?e.chains.some(n=>{const r=n.split(":")[0];return i===r}):!0}};bt([u()],De.prototype,"tabIdx",void 0);bt([v()],De.prototype,"connectors",void 0);bt([v()],De.prototype,"loading",void 0);De=bt([x("w3m-connect-recent-widget")],De);var mt=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let Ne=class extends R{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.wallets=[],this.loading=!1,E.isTelegram()&&E.isIos()&&(this.loading=!S.state.wcUri,this.unsubscribe.push(S.subscribeKey("wcUri",e=>this.loading=!e)))}render(){const{connectors:e}=L.state,{customWallets:i,featuredWalletIds:n}=Y.state,r=ft.getRecentWallets(),t=e.find(W=>W.id==="walletConnect"),s=e.filter(W=>W.type==="INJECTED"||W.type==="ANNOUNCED"||W.type==="MULTI_CHAIN").filter(W=>W.name!=="Browser Wallet");if(!t)return null;if(n||i||!this.wallets.length)return this.style.cssText="display: none",null;const l=s.length+r.length,h=Math.max(0,2-l),p=gt.filterOutDuplicateWallets(this.wallets).slice(0,h);return p.length?c`
      <wui-flex flexDirection="column" gap="xs">
        ${p.map(W=>c`
            <wui-list-wallet
              imageSrc=${y(D.getWalletImage(W))}
              name=${W?.name??"Unknown"}
              @click=${()=>this.onConnectWallet(W)}
              tabIdx=${y(this.tabIdx)}
              ?loading=${this.loading}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnectWallet(e){if(this.loading)return;const i=L.getConnector(e.id,e.rdns);i?O.push("ConnectingExternal",{connector:i}):O.push("ConnectingWalletConnect",{wallet:e})}};mt([u()],Ne.prototype,"tabIdx",void 0);mt([u()],Ne.prototype,"wallets",void 0);mt([v()],Ne.prototype,"loading",void 0);Ne=mt([x("w3m-connect-recommended-widget")],Ne);var vt=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let Me=class extends R{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=L.state.connectors,this.connectorImages=si.state.connectorImages,this.unsubscribe.push(L.subscribeKey("connectors",e=>this.connectors=e),si.subscribeKey("connectorImages",e=>this.connectorImages=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){if(E.isMobile())return this.style.cssText="display: none",null;const e=this.connectors.find(n=>n.id==="walletConnect");if(!e)return this.style.cssText="display: none",null;const i=e.imageUrl||this.connectorImages[e?.imageId??""];return c`
      <wui-list-wallet
        imageSrc=${y(i)}
        name=${e.name??"Unknown"}
        @click=${()=>this.onConnector(e)}
        tagLabel="qr code"
        tagVariant="main"
        tabIdx=${y(this.tabIdx)}
        data-testid="wallet-selector-walletconnect"
      >
      </wui-list-wallet>
    `}onConnector(e){L.setActiveConnector(e),O.push("ConnectingWalletConnect")}};vt([u()],Me.prototype,"tabIdx",void 0);vt([v()],Me.prototype,"connectors",void 0);vt([v()],Me.prototype,"connectorImages",void 0);Me=vt([x("w3m-connect-walletconnect-widget")],Me);const en=B`
  :host {
    margin-top: var(--wui-spacing-3xs);
  }
  wui-separator {
    margin: var(--wui-spacing-m) calc(var(--wui-spacing-m) * -1) var(--wui-spacing-xs)
      calc(var(--wui-spacing-m) * -1);
    width: calc(100% + var(--wui-spacing-s) * 2);
  }
`;var Fe=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let be=class extends R{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=L.state.connectors,this.recommended=T.state.recommended,this.featured=T.state.featured,this.unsubscribe.push(L.subscribeKey("connectors",e=>this.connectors=e),T.subscribeKey("recommended",e=>this.recommended=e),T.subscribeKey("featured",e=>this.featured=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return c`
      <wui-flex flexDirection="column" gap="xs"> ${this.connectorListTemplate()} </wui-flex>
    `}connectorListTemplate(){const{custom:e,recent:i,announced:n,injected:r,multiChain:t,recommended:a,featured:s,external:l}=ke.getConnectorsByType(this.connectors,this.recommended,this.featured);return ke.getConnectorTypeOrder({custom:e,recent:i,announced:n,injected:r,multiChain:t,recommended:a,featured:s,external:l}).map(p=>{switch(p){case"injected":return c`
            ${t.length?c`<w3m-connect-multi-chain-widget
                  tabIdx=${y(this.tabIdx)}
                ></w3m-connect-multi-chain-widget>`:null}
            ${n.length?c`<w3m-connect-announced-widget
                  tabIdx=${y(this.tabIdx)}
                ></w3m-connect-announced-widget>`:null}
            ${r.length?c`<w3m-connect-injected-widget
                  .connectors=${r}
                  tabIdx=${y(this.tabIdx)}
                ></w3m-connect-injected-widget>`:null}
          `;case"walletConnect":return c`<w3m-connect-walletconnect-widget
            tabIdx=${y(this.tabIdx)}
          ></w3m-connect-walletconnect-widget>`;case"recent":return c`<w3m-connect-recent-widget
            tabIdx=${y(this.tabIdx)}
          ></w3m-connect-recent-widget>`;case"featured":return c`<w3m-connect-featured-widget
            .wallets=${s}
            tabIdx=${y(this.tabIdx)}
          ></w3m-connect-featured-widget>`;case"custom":return c`<w3m-connect-custom-widget
            tabIdx=${y(this.tabIdx)}
          ></w3m-connect-custom-widget>`;case"external":return c`<w3m-connect-external-widget
            tabIdx=${y(this.tabIdx)}
          ></w3m-connect-external-widget>`;case"recommended":return c`<w3m-connect-recommended-widget
            .wallets=${a}
            tabIdx=${y(this.tabIdx)}
          ></w3m-connect-recommended-widget>`;default:return console.warn(`Unknown connector type: ${p}`),null}})}};be.styles=en;Fe([u()],be.prototype,"tabIdx",void 0);Fe([v()],be.prototype,"connectors",void 0);Fe([v()],be.prototype,"recommended",void 0);Fe([v()],be.prototype,"featured",void 0);be=Fe([x("w3m-connector-list")],be);const tn=B`
  :host {
    display: inline-flex;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-3xl);
    padding: var(--wui-spacing-3xs);
    position: relative;
    height: 36px;
    min-height: 36px;
    overflow: hidden;
  }

  :host::before {
    content: '';
    position: absolute;
    pointer-events: none;
    top: 4px;
    left: 4px;
    display: block;
    width: var(--local-tab-width);
    height: 28px;
    border-radius: var(--wui-border-radius-3xl);
    background-color: var(--wui-color-gray-glass-002);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-002);
    transform: translateX(calc(var(--local-tab) * var(--local-tab-width)));
    transition: transform var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: background-color, opacity;
  }

  :host([data-type='flex'])::before {
    left: 3px;
    transform: translateX(calc((var(--local-tab) * 34px) + (var(--local-tab) * 4px)));
  }

  :host([data-type='flex']) {
    display: flex;
    padding: 0px 0px 0px 12px;
    gap: 4px;
  }

  :host([data-type='flex']) > button > wui-text {
    position: absolute;
    left: 18px;
    opacity: 0;
  }

  button[data-active='true'] > wui-icon,
  button[data-active='true'] > wui-text {
    color: var(--wui-color-fg-100);
  }

  button[data-active='false'] > wui-icon,
  button[data-active='false'] > wui-text {
    color: var(--wui-color-fg-200);
  }

  button[data-active='true']:disabled,
  button[data-active='false']:disabled {
    background-color: transparent;
    opacity: 0.5;
    cursor: not-allowed;
  }

  button[data-active='true']:disabled > wui-text {
    color: var(--wui-color-fg-200);
  }

  button[data-active='false']:disabled > wui-text {
    color: var(--wui-color-fg-300);
  }

  button > wui-icon,
  button > wui-text {
    pointer-events: none;
    transition: color var(--wui-e ase-out-power-1) var(--wui-duration-md);
    will-change: color;
  }

  button {
    width: var(--local-tab-width);
    transition: background-color var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: background-color;
  }

  :host([data-type='flex']) > button {
    width: 34px;
    position: relative;
    display: flex;
    justify-content: flex-start;
  }

  button:hover:enabled,
  button:active:enabled {
    background-color: transparent !important;
  }

  button:hover:enabled > wui-icon,
  button:active:enabled > wui-icon {
    transition: all var(--wui-ease-out-power-1) var(--wui-duration-lg);
    color: var(--wui-color-fg-125);
  }

  button:hover:enabled > wui-text,
  button:active:enabled > wui-text {
    transition: all var(--wui-ease-out-power-1) var(--wui-duration-lg);
    color: var(--wui-color-fg-125);
  }

  button {
    border-radius: var(--wui-border-radius-3xl);
  }
`;var fe=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let ee=class extends R{constructor(){super(...arguments),this.tabs=[],this.onTabChange=()=>null,this.buttons=[],this.disabled=!1,this.localTabWidth="100px",this.activeTab=0,this.isDense=!1}render(){return this.isDense=this.tabs.length>3,this.style.cssText=`
      --local-tab: ${this.activeTab};
      --local-tab-width: ${this.localTabWidth};
    `,this.dataset.type=this.isDense?"flex":"block",this.tabs.map((e,i)=>{const n=i===this.activeTab;return c`
        <button
          ?disabled=${this.disabled}
          @click=${()=>this.onTabClick(i)}
          data-active=${n}
          data-testid="tab-${e.label?.toLowerCase()}"
        >
          ${this.iconTemplate(e)}
          <wui-text variant="small-600" color="inherit"> ${e.label} </wui-text>
        </button>
      `})}firstUpdated(){this.shadowRoot&&this.isDense&&(this.buttons=[...this.shadowRoot.querySelectorAll("button")],setTimeout(()=>{this.animateTabs(0,!0)},0))}iconTemplate(e){return e.icon?c`<wui-icon size="xs" color="inherit" name=${e.icon}></wui-icon>`:null}onTabClick(e){this.buttons&&this.animateTabs(e,!1),this.activeTab=e,this.onTabChange(e)}animateTabs(e,i){const n=this.buttons[this.activeTab],r=this.buttons[e],t=n?.querySelector("wui-text"),a=r?.querySelector("wui-text"),s=r?.getBoundingClientRect(),l=a?.getBoundingClientRect();n&&t&&!i&&e!==this.activeTab&&(t.animate([{opacity:0}],{duration:50,easing:"ease",fill:"forwards"}),n.animate([{width:"34px"}],{duration:500,easing:"ease",fill:"forwards"})),r&&s&&l&&a&&(e!==this.activeTab||i)&&(this.localTabWidth=`${Math.round(s.width+l.width)+6}px`,r.animate([{width:`${s.width+l.width}px`}],{duration:i?0:500,fill:"forwards",easing:"ease"}),a.animate([{opacity:1}],{duration:i?0:125,delay:i?0:200,fill:"forwards",easing:"ease"}))}};ee.styles=[A,M,tn];fe([u({type:Array})],ee.prototype,"tabs",void 0);fe([u()],ee.prototype,"onTabChange",void 0);fe([u({type:Array})],ee.prototype,"buttons",void 0);fe([u({type:Boolean})],ee.prototype,"disabled",void 0);fe([u()],ee.prototype,"localTabWidth",void 0);fe([v()],ee.prototype,"activeTab",void 0);fe([v()],ee.prototype,"isDense",void 0);ee=fe([x("wui-tabs")],ee);var Xt=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let ot=class extends R{constructor(){super(...arguments),this.platformTabs=[],this.unsubscribe=[],this.platforms=[],this.onSelectPlatfrom=void 0}disconnectCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.generateTabs();return c`
      <wui-flex justifyContent="center" .padding=${["0","0","l","0"]}>
        <wui-tabs .tabs=${e} .onTabChange=${this.onTabChange.bind(this)}></wui-tabs>
      </wui-flex>
    `}generateTabs(){const e=this.platforms.map(i=>i==="browser"?{label:"Browser",icon:"extension",platform:"browser"}:i==="mobile"?{label:"Mobile",icon:"mobile",platform:"mobile"}:i==="qrcode"?{label:"Mobile",icon:"mobile",platform:"qrcode"}:i==="web"?{label:"Webapp",icon:"browser",platform:"web"}:i==="desktop"?{label:"Desktop",icon:"desktop",platform:"desktop"}:{label:"Browser",icon:"extension",platform:"unsupported"});return this.platformTabs=e.map(({platform:i})=>i),e}onTabChange(e){const i=this.platformTabs[e];i&&this.onSelectPlatfrom?.(i)}};Xt([u({type:Array})],ot.prototype,"platforms",void 0);Xt([u()],ot.prototype,"onSelectPlatfrom",void 0);ot=Xt([x("w3m-connecting-header")],ot);const nn=B`
  :host {
    width: var(--local-width);
    position: relative;
  }

  button {
    border: none;
    border-radius: var(--local-border-radius);
    width: var(--local-width);
    white-space: nowrap;
  }

  /* -- Sizes --------------------------------------------------- */
  button[data-size='md'] {
    padding: 8.2px var(--wui-spacing-l) 9px var(--wui-spacing-l);
    height: 36px;
  }

  button[data-size='md'][data-icon-left='true'][data-icon-right='false'] {
    padding: 8.2px var(--wui-spacing-l) 9px var(--wui-spacing-s);
  }

  button[data-size='md'][data-icon-right='true'][data-icon-left='false'] {
    padding: 8.2px var(--wui-spacing-s) 9px var(--wui-spacing-l);
  }

  button[data-size='lg'] {
    padding: var(--wui-spacing-m) var(--wui-spacing-2l);
    height: 48px;
  }

  /* -- Variants --------------------------------------------------------- */
  button[data-variant='main'] {
    background-color: var(--wui-color-accent-100);
    color: var(--wui-color-inverse-100);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }

  button[data-variant='inverse'] {
    background-color: var(--wui-color-inverse-100);
    color: var(--wui-color-inverse-000);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }

  button[data-variant='accent'] {
    background-color: var(--wui-color-accent-glass-010);
    color: var(--wui-color-accent-100);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  button[data-variant='accent-error'] {
    background: var(--wui-color-error-glass-015);
    color: var(--wui-color-error-100);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-error-glass-010);
  }

  button[data-variant='accent-success'] {
    background: var(--wui-color-success-glass-015);
    color: var(--wui-color-success-100);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-success-glass-010);
  }

  button[data-variant='neutral'] {
    background: transparent;
    color: var(--wui-color-fg-100);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  /* -- Focus states --------------------------------------------------- */
  button[data-variant='main']:focus-visible:enabled {
    background-color: var(--wui-color-accent-090);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-accent-100),
      0 0 0 4px var(--wui-color-accent-glass-020);
  }
  button[data-variant='inverse']:focus-visible:enabled {
    background-color: var(--wui-color-inverse-100);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-gray-glass-010),
      0 0 0 4px var(--wui-color-accent-glass-020);
  }
  button[data-variant='accent']:focus-visible:enabled {
    background-color: var(--wui-color-accent-glass-010);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-accent-100),
      0 0 0 4px var(--wui-color-accent-glass-020);
  }
  button[data-variant='accent-error']:focus-visible:enabled {
    background: var(--wui-color-error-glass-015);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-error-100),
      0 0 0 4px var(--wui-color-error-glass-020);
  }
  button[data-variant='accent-success']:focus-visible:enabled {
    background: var(--wui-color-success-glass-015);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-success-100),
      0 0 0 4px var(--wui-color-success-glass-020);
  }
  button[data-variant='neutral']:focus-visible:enabled {
    background: var(--wui-color-gray-glass-005);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-gray-glass-010),
      0 0 0 4px var(--wui-color-gray-glass-002);
  }

  /* -- Hover & Active states ----------------------------------------------------------- */
  @media (hover: hover) and (pointer: fine) {
    button[data-variant='main']:hover:enabled {
      background-color: var(--wui-color-accent-090);
    }

    button[data-variant='main']:active:enabled {
      background-color: var(--wui-color-accent-080);
    }

    button[data-variant='accent']:hover:enabled {
      background-color: var(--wui-color-accent-glass-015);
    }

    button[data-variant='accent']:active:enabled {
      background-color: var(--wui-color-accent-glass-020);
    }

    button[data-variant='accent-error']:hover:enabled {
      background: var(--wui-color-error-glass-020);
      color: var(--wui-color-error-100);
    }

    button[data-variant='accent-error']:active:enabled {
      background: var(--wui-color-error-glass-030);
      color: var(--wui-color-error-100);
    }

    button[data-variant='accent-success']:hover:enabled {
      background: var(--wui-color-success-glass-020);
      color: var(--wui-color-success-100);
    }

    button[data-variant='accent-success']:active:enabled {
      background: var(--wui-color-success-glass-030);
      color: var(--wui-color-success-100);
    }

    button[data-variant='neutral']:hover:enabled {
      background: var(--wui-color-gray-glass-002);
    }

    button[data-variant='neutral']:active:enabled {
      background: var(--wui-color-gray-glass-005);
    }

    button[data-size='lg'][data-icon-left='true'][data-icon-right='false'] {
      padding-left: var(--wui-spacing-m);
    }

    button[data-size='lg'][data-icon-right='true'][data-icon-left='false'] {
      padding-right: var(--wui-spacing-m);
    }
  }

  /* -- Disabled state --------------------------------------------------- */
  button:disabled {
    background-color: var(--wui-color-gray-glass-002);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-002);
    color: var(--wui-color-gray-glass-020);
    cursor: not-allowed;
  }

  button > wui-text {
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: opacity;
    opacity: var(--local-opacity-100);
  }

  ::slotted(*) {
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: opacity;
    opacity: var(--local-opacity-100);
  }

  wui-loading-spinner {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    opacity: var(--local-opacity-000);
  }
`;var te=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};const ci={main:"inverse-100",inverse:"inverse-000",accent:"accent-100","accent-error":"error-100","accent-success":"success-100",neutral:"fg-100",disabled:"gray-glass-020"},on={lg:"paragraph-600",md:"small-600"},rn={lg:"md",md:"md"};let q=class extends R{constructor(){super(...arguments),this.size="lg",this.disabled=!1,this.fullWidth=!1,this.loading=!1,this.variant="main",this.hasIconLeft=!1,this.hasIconRight=!1,this.borderRadius="m"}render(){this.style.cssText=`
    --local-width: ${this.fullWidth?"100%":"auto"};
    --local-opacity-100: ${this.loading?0:1};
    --local-opacity-000: ${this.loading?1:0};
    --local-border-radius: var(--wui-border-radius-${this.borderRadius});
    `;const e=this.textVariant??on[this.size];return c`
      <button
        data-variant=${this.variant}
        data-icon-left=${this.hasIconLeft}
        data-icon-right=${this.hasIconRight}
        data-size=${this.size}
        ?disabled=${this.disabled}
      >
        ${this.loadingTemplate()}
        <slot name="iconLeft" @slotchange=${()=>this.handleSlotLeftChange()}></slot>
        <wui-text variant=${e} color="inherit">
          <slot></slot>
        </wui-text>
        <slot name="iconRight" @slotchange=${()=>this.handleSlotRightChange()}></slot>
      </button>
    `}handleSlotLeftChange(){this.hasIconLeft=!0}handleSlotRightChange(){this.hasIconRight=!0}loadingTemplate(){if(this.loading){const e=rn[this.size],i=this.disabled?ci.disabled:ci[this.variant];return c`<wui-loading-spinner color=${i} size=${e}></wui-loading-spinner>`}return c``}};q.styles=[A,M,nn];te([u()],q.prototype,"size",void 0);te([u({type:Boolean})],q.prototype,"disabled",void 0);te([u({type:Boolean})],q.prototype,"fullWidth",void 0);te([u({type:Boolean})],q.prototype,"loading",void 0);te([u()],q.prototype,"variant",void 0);te([u({type:Boolean})],q.prototype,"hasIconLeft",void 0);te([u({type:Boolean})],q.prototype,"hasIconRight",void 0);te([u()],q.prototype,"borderRadius",void 0);te([u()],q.prototype,"textVariant",void 0);q=te([x("wui-button")],q);const an=B`
  button {
    padding: var(--wui-spacing-4xs) var(--wui-spacing-xxs);
    border-radius: var(--wui-border-radius-3xs);
    background-color: transparent;
    color: var(--wui-color-accent-100);
  }

  button:disabled {
    background-color: transparent;
    color: var(--wui-color-gray-glass-015);
  }

  button:hover {
    background-color: var(--wui-color-gray-glass-005);
  }
`;var yt=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let $e=class extends R{constructor(){super(...arguments),this.tabIdx=void 0,this.disabled=!1,this.color="inherit"}render(){return c`
      <button ?disabled=${this.disabled} tabindex=${y(this.tabIdx)}>
        <slot name="iconLeft"></slot>
        <wui-text variant="small-600" color=${this.color}>
          <slot></slot>
        </wui-text>
        <slot name="iconRight"></slot>
      </button>
    `}};$e.styles=[A,M,an];yt([u()],$e.prototype,"tabIdx",void 0);yt([u({type:Boolean})],$e.prototype,"disabled",void 0);yt([u()],$e.prototype,"color",void 0);$e=yt([x("wui-link")],$e);const sn=B`
  :host {
    display: block;
    width: var(--wui-box-size-md);
    height: var(--wui-box-size-md);
  }

  svg {
    width: var(--wui-box-size-md);
    height: var(--wui-box-size-md);
  }

  rect {
    fill: none;
    stroke: var(--wui-color-accent-100);
    stroke-width: 4px;
    stroke-linecap: round;
    animation: dash 1s linear infinite;
  }

  @keyframes dash {
    to {
      stroke-dashoffset: 0px;
    }
  }
`;var Ci=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let rt=class extends R{constructor(){super(...arguments),this.radius=36}render(){return this.svgLoaderTemplate()}svgLoaderTemplate(){const e=this.radius>50?50:this.radius,n=36-e,r=116+n,t=245+n,a=360+n*1.75;return c`
      <svg viewBox="0 0 110 110" width="110" height="110">
        <rect
          x="2"
          y="2"
          width="106"
          height="106"
          rx=${e}
          stroke-dasharray="${r} ${t}"
          stroke-dashoffset=${a}
        />
      </svg>
    `}};rt.styles=[A,sn];Ci([u({type:Number})],rt.prototype,"radius",void 0);rt=Ci([x("wui-loading-thumbnail")],rt);const ln=B`
  button {
    border: none;
    border-radius: var(--wui-border-radius-3xl);
  }

  button[data-variant='main'] {
    background-color: var(--wui-color-accent-100);
    color: var(--wui-color-inverse-100);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }

  button[data-variant='accent'] {
    background-color: var(--wui-color-accent-glass-010);
    color: var(--wui-color-accent-100);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  button[data-variant='gray'] {
    background-color: transparent;
    color: var(--wui-color-fg-200);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }

  button[data-variant='shade'] {
    background-color: transparent;
    color: var(--wui-color-accent-100);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }

  button[data-size='sm'] {
    height: 32px;
    padding: 0 var(--wui-spacing-s);
  }

  button[data-size='md'] {
    height: 40px;
    padding: 0 var(--wui-spacing-l);
  }

  button[data-size='sm'] > wui-image {
    width: 16px;
    height: 16px;
  }

  button[data-size='md'] > wui-image {
    width: 24px;
    height: 24px;
  }

  button[data-size='sm'] > wui-icon {
    width: 12px;
    height: 12px;
  }

  button[data-size='md'] > wui-icon {
    width: 14px;
    height: 14px;
  }

  wui-image {
    border-radius: var(--wui-border-radius-3xl);
    overflow: hidden;
  }

  button.disabled > wui-icon,
  button.disabled > wui-image {
    filter: grayscale(1);
  }

  button[data-variant='main'] > wui-image {
    box-shadow: inset 0 0 0 1px var(--wui-color-accent-090);
  }

  button[data-variant='shade'] > wui-image,
  button[data-variant='gray'] > wui-image {
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }

  @media (hover: hover) and (pointer: fine) {
    button[data-variant='main']:focus-visible {
      background-color: var(--wui-color-accent-090);
    }

    button[data-variant='main']:hover:enabled {
      background-color: var(--wui-color-accent-090);
    }

    button[data-variant='main']:active:enabled {
      background-color: var(--wui-color-accent-080);
    }

    button[data-variant='accent']:hover:enabled {
      background-color: var(--wui-color-accent-glass-015);
    }

    button[data-variant='accent']:active:enabled {
      background-color: var(--wui-color-accent-glass-020);
    }

    button[data-variant='shade']:focus-visible,
    button[data-variant='gray']:focus-visible,
    button[data-variant='shade']:hover,
    button[data-variant='gray']:hover {
      background-color: var(--wui-color-gray-glass-002);
    }

    button[data-variant='gray']:active,
    button[data-variant='shade']:active {
      background-color: var(--wui-color-gray-glass-005);
    }
  }

  button.disabled {
    color: var(--wui-color-gray-glass-020);
    background-color: var(--wui-color-gray-glass-002);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-002);
    pointer-events: none;
  }
`;var Ce=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let ce=class extends R{constructor(){super(...arguments),this.variant="accent",this.imageSrc="",this.disabled=!1,this.icon="externalLink",this.size="md",this.text=""}render(){const e=this.size==="sm"?"small-600":"paragraph-600";return c`
      <button
        class=${this.disabled?"disabled":""}
        data-variant=${this.variant}
        data-size=${this.size}
      >
        ${this.imageSrc?c`<wui-image src=${this.imageSrc}></wui-image>`:null}
        <wui-text variant=${e} color="inherit"> ${this.text} </wui-text>
        <wui-icon name=${this.icon} color="inherit" size="inherit"></wui-icon>
      </button>
    `}};ce.styles=[A,M,ln];Ce([u()],ce.prototype,"variant",void 0);Ce([u()],ce.prototype,"imageSrc",void 0);Ce([u({type:Boolean})],ce.prototype,"disabled",void 0);Ce([u()],ce.prototype,"icon",void 0);Ce([u()],ce.prototype,"size",void 0);Ce([u()],ce.prototype,"text",void 0);ce=Ce([x("wui-chip-button")],ce);const cn=B`
  wui-flex {
    width: 100%;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
  }
`;var xt=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let Re=class extends R{constructor(){super(...arguments),this.disabled=!1,this.label="",this.buttonLabel=""}render(){return c`
      <wui-flex
        justifyContent="space-between"
        alignItems="center"
        .padding=${["1xs","2l","1xs","2l"]}
      >
        <wui-text variant="paragraph-500" color="fg-200">${this.label}</wui-text>
        <wui-chip-button size="sm" variant="shade" text=${this.buttonLabel} icon="chevronRight">
        </wui-chip-button>
      </wui-flex>
    `}};Re.styles=[A,M,cn];xt([u({type:Boolean})],Re.prototype,"disabled",void 0);xt([u()],Re.prototype,"label",void 0);xt([u()],Re.prototype,"buttonLabel",void 0);Re=xt([x("wui-cta-button")],Re);const un=B`
  :host {
    display: block;
    padding: 0 var(--wui-spacing-xl) var(--wui-spacing-xl);
  }
`;var $i=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let at=class extends R{constructor(){super(...arguments),this.wallet=void 0}render(){if(!this.wallet)return this.style.display="none",null;const{name:e,app_store:i,play_store:n,chrome_store:r,homepage:t}=this.wallet,a=E.isMobile(),s=E.isIos(),l=E.isAndroid(),h=[i,n,t,r].filter(Boolean).length>1,p=se.getTruncateString({string:e,charsStart:12,charsEnd:0,truncate:"end"});return h&&!a?c`
        <wui-cta-button
          label=${`Don't have ${p}?`}
          buttonLabel="Get"
          @click=${()=>O.push("Downloads",{wallet:this.wallet})}
        ></wui-cta-button>
      `:!h&&t?c`
        <wui-cta-button
          label=${`Don't have ${p}?`}
          buttonLabel="Get"
          @click=${this.onHomePage.bind(this)}
        ></wui-cta-button>
      `:i&&s?c`
        <wui-cta-button
          label=${`Don't have ${p}?`}
          buttonLabel="Get"
          @click=${this.onAppStore.bind(this)}
        ></wui-cta-button>
      `:n&&l?c`
        <wui-cta-button
          label=${`Don't have ${p}?`}
          buttonLabel="Get"
          @click=${this.onPlayStore.bind(this)}
        ></wui-cta-button>
      `:(this.style.display="none",null)}onAppStore(){this.wallet?.app_store&&E.openHref(this.wallet.app_store,"_blank")}onPlayStore(){this.wallet?.play_store&&E.openHref(this.wallet.play_store,"_blank")}onHomePage(){this.wallet?.homepage&&E.openHref(this.wallet.homepage,"_blank")}};at.styles=[un];$i([u({type:Object})],at.prototype,"wallet",void 0);at=$i([x("w3m-mobile-download-links")],at);const dn=B`
  @keyframes shake {
    0% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(3px);
    }
    50% {
      transform: translateX(-3px);
    }
    75% {
      transform: translateX(3px);
    }
    100% {
      transform: translateX(0);
    }
  }

  wui-flex:first-child:not(:only-child) {
    position: relative;
  }

  wui-loading-thumbnail {
    position: absolute;
  }

  wui-icon-box {
    position: absolute;
    right: calc(var(--wui-spacing-3xs) * -1);
    bottom: calc(var(--wui-spacing-3xs) * -1);
    opacity: 0;
    transform: scale(0.5);
    transition-property: opacity, transform;
    transition-duration: var(--wui-duration-lg);
    transition-timing-function: var(--wui-ease-out-power-2);
    will-change: opacity, transform;
  }

  wui-text[align='center'] {
    width: 100%;
    padding: 0px var(--wui-spacing-l);
  }

  [data-error='true'] wui-icon-box {
    opacity: 1;
    transform: scale(1);
  }

  [data-error='true'] > wui-flex:first-child {
    animation: shake 250ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }

  [data-retry='false'] wui-link {
    display: none;
  }

  [data-retry='true'] wui-link {
    display: block;
    opacity: 1;
  }
`;var ie=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};class z extends R{constructor(){super(),this.wallet=O.state.data?.wallet,this.connector=O.state.data?.connector,this.timeout=void 0,this.secondaryBtnIcon="refresh",this.onConnect=void 0,this.onRender=void 0,this.onAutoConnect=void 0,this.isWalletConnect=!0,this.unsubscribe=[],this.imageSrc=D.getWalletImage(this.wallet)??D.getConnectorImage(this.connector),this.name=this.wallet?.name??this.connector?.name??"Wallet",this.isRetrying=!1,this.uri=S.state.wcUri,this.error=S.state.wcError,this.ready=!1,this.showRetry=!1,this.secondaryBtnLabel="Try again",this.secondaryLabel="Accept connection request in the wallet",this.isLoading=!1,this.isMobile=!1,this.onRetry=void 0,this.unsubscribe.push(S.subscribeKey("wcUri",e=>{this.uri=e,this.isRetrying&&this.onRetry&&(this.isRetrying=!1,this.onConnect?.())}),S.subscribeKey("wcError",e=>this.error=e)),(E.isTelegram()||E.isSafari())&&E.isIos()&&S.state.wcUri&&this.onConnect?.()}firstUpdated(){this.onAutoConnect?.(),this.showRetry=!this.onAutoConnect}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),S.setWcError(!1),clearTimeout(this.timeout)}render(){this.onRender?.(),this.onShowRetry();const e=this.error?"Connection can be declined if a previous request is still active":this.secondaryLabel;let i=`Continue in ${this.name}`;return this.error&&(i="Connection declined"),c`
      <wui-flex
        data-error=${y(this.error)}
        data-retry=${this.showRetry}
        flexDirection="column"
        alignItems="center"
        .padding=${["3xl","xl","xl","xl"]}
        gap="xl"
      >
        <wui-flex justifyContent="center" alignItems="center">
          <wui-wallet-image size="lg" imageSrc=${y(this.imageSrc)}></wui-wallet-image>

          ${this.error?null:this.loaderTemplate()}

          <wui-icon-box
            backgroundColor="error-100"
            background="opaque"
            iconColor="error-100"
            icon="close"
            size="sm"
            border
            borderColor="wui-color-bg-125"
          ></wui-icon-box>
        </wui-flex>

        <wui-flex flexDirection="column" alignItems="center" gap="xs">
          <wui-text variant="paragraph-500" color=${this.error?"error-100":"fg-100"}>
            ${i}
          </wui-text>
          <wui-text align="center" variant="small-500" color="fg-200">${e}</wui-text>
        </wui-flex>

        ${this.secondaryBtnLabel?c`
              <wui-button
                variant="accent"
                size="md"
                ?disabled=${this.isRetrying||this.isLoading}
                @click=${this.onTryAgain.bind(this)}
                data-testid="w3m-connecting-widget-secondary-button"
              >
                <wui-icon color="inherit" slot="iconLeft" name=${this.secondaryBtnIcon}></wui-icon>
                ${this.secondaryBtnLabel}
              </wui-button>
            `:null}
      </wui-flex>

      ${this.isWalletConnect?c`
            <wui-flex .padding=${["0","xl","xl","xl"]} justifyContent="center">
              <wui-link @click=${this.onCopyUri} color="fg-200" data-testid="wui-link-copy">
                <wui-icon size="xs" color="fg-200" slot="iconLeft" name="copy"></wui-icon>
                Copy link
              </wui-link>
            </wui-flex>
          `:null}

      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}onShowRetry(){this.error&&!this.showRetry&&(this.showRetry=!0,this.shadowRoot?.querySelector("wui-button")?.animate([{opacity:0},{opacity:1}],{fill:"forwards",easing:"ease"}))}onTryAgain(){S.setWcError(!1),this.onRetry?(this.isRetrying=!0,this.onRetry?.()):this.onConnect?.()}loaderTemplate(){const e=kt.state.themeVariables["--w3m-border-radius-master"],i=e?parseInt(e.replace("px",""),10):4;return c`<wui-loading-thumbnail radius=${i*9}></wui-loading-thumbnail>`}onCopyUri(){try{this.uri&&(E.copyToClopboard(this.uri),Qe.showSuccess("Link copied"))}catch{Qe.showError("Failed to copy")}}}z.styles=dn;ie([v()],z.prototype,"isRetrying",void 0);ie([v()],z.prototype,"uri",void 0);ie([v()],z.prototype,"error",void 0);ie([v()],z.prototype,"ready",void 0);ie([v()],z.prototype,"showRetry",void 0);ie([v()],z.prototype,"secondaryBtnLabel",void 0);ie([v()],z.prototype,"secondaryLabel",void 0);ie([v()],z.prototype,"isLoading",void 0);ie([u({type:Boolean})],z.prototype,"isMobile",void 0);ie([u()],z.prototype,"onRetry",void 0);var hn=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let ui=class extends z{constructor(){if(super(),!this.wallet)throw new Error("w3m-connecting-wc-browser: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.onAutoConnect=this.onConnectProxy.bind(this),J.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"browser"}})}async onConnectProxy(){try{this.error=!1;const{connectors:e}=L.state,i=e.find(n=>n.type==="ANNOUNCED"&&n.info?.rdns===this.wallet?.rdns||n.type==="INJECTED"||n.name===this.wallet?.name);if(i)await S.connectExternal(i,i.chain);else throw new Error("w3m-connecting-wc-browser: No connector found");vi.close(),J.sendEvent({type:"track",event:"CONNECT_SUCCESS",properties:{method:"browser",name:this.wallet?.name||"Unknown"}})}catch(e){J.sendEvent({type:"track",event:"CONNECT_ERROR",properties:{message:e?.message??"Unknown"}}),this.error=!0}}};ui=hn([x("w3m-connecting-wc-browser")],ui);var pn=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let di=class extends z{constructor(){if(super(),!this.wallet)throw new Error("w3m-connecting-wc-desktop: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.onRender=this.onRenderProxy.bind(this),J.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"desktop"}})}onRenderProxy(){!this.ready&&this.uri&&(this.ready=!0,this.onConnect?.())}onConnectProxy(){if(this.wallet?.desktop_link&&this.uri)try{this.error=!1;const{desktop_link:e,name:i}=this.wallet,{redirect:n,href:r}=E.formatNativeUrl(e,this.uri);S.setWcLinking({name:i,href:r}),S.setRecentWallet(this.wallet),E.openHref(n,"_blank")}catch{this.error=!0}}};di=pn([x("w3m-connecting-wc-desktop")],di);var Le=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let me=class extends z{constructor(){if(super(),this.btnLabelTimeout=void 0,this.redirectDeeplink=void 0,this.redirectUniversalLink=void 0,this.target=void 0,this.preferUniversalLinks=Y.state.experimental_preferUniversalLinks,this.isLoading=!0,this.onConnect=()=>{if(this.wallet?.mobile_link&&this.uri)try{this.error=!1;const{mobile_link:e,link_mode:i,name:n}=this.wallet,{redirect:r,redirectUniversalLink:t,href:a}=E.formatNativeUrl(e,this.uri,i);this.redirectDeeplink=r,this.redirectUniversalLink=t,this.target=E.isIframe()?"_top":"_self",S.setWcLinking({name:n,href:a}),S.setRecentWallet(this.wallet),this.preferUniversalLinks&&this.redirectUniversalLink?E.openHref(this.redirectUniversalLink,this.target):E.openHref(this.redirectDeeplink,this.target)}catch(e){J.sendEvent({type:"track",event:"CONNECT_PROXY_ERROR",properties:{message:e instanceof Error?e.message:"Error parsing the deeplink",uri:this.uri,mobile_link:this.wallet.mobile_link,name:this.wallet.name}}),this.error=!0}},!this.wallet)throw new Error("w3m-connecting-wc-mobile: No wallet provided");this.secondaryBtnLabel="Open",this.secondaryLabel=yi.CONNECT_LABELS.MOBILE,this.secondaryBtnIcon="externalLink",this.onHandleURI(),this.unsubscribe.push(S.subscribeKey("wcUri",()=>{this.onHandleURI()})),J.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"mobile"}})}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this.btnLabelTimeout)}onHandleURI(){this.isLoading=!this.uri,!this.ready&&this.uri&&(this.ready=!0,this.onConnect?.())}onTryAgain(){S.setWcError(!1),this.onConnect?.()}};Le([v()],me.prototype,"redirectDeeplink",void 0);Le([v()],me.prototype,"redirectUniversalLink",void 0);Le([v()],me.prototype,"target",void 0);Le([v()],me.prototype,"preferUniversalLinks",void 0);Le([v()],me.prototype,"isLoading",void 0);me=Le([x("w3m-connecting-wc-mobile")],me);var Ve={},fn=function(){return typeof Promise=="function"&&Promise.prototype&&Promise.prototype.then},Ri={},V={};let Zt;const gn=[0,26,44,70,100,134,172,196,242,292,346,404,466,532,581,655,733,815,901,991,1085,1156,1258,1364,1474,1588,1706,1828,1921,2051,2185,2323,2465,2611,2761,2876,3034,3196,3362,3532,3706];V.getSymbolSize=function(e){if(!e)throw new Error('"version" cannot be null or undefined');if(e<1||e>40)throw new Error('"version" should be in range from 1 to 40');return e*4+17};V.getSymbolTotalCodewords=function(e){return gn[e]};V.getBCHDigit=function(o){let e=0;for(;o!==0;)e++,o>>>=1;return e};V.setToSJISFunction=function(e){if(typeof e!="function")throw new Error('"toSJISFunc" is not a valid function.');Zt=e};V.isKanjiModeEnabled=function(){return typeof Zt<"u"};V.toSJIS=function(e){return Zt(e)};var Ct={};(function(o){o.L={bit:1},o.M={bit:0},o.Q={bit:3},o.H={bit:2};function e(i){if(typeof i!="string")throw new Error("Param is not a string");switch(i.toLowerCase()){case"l":case"low":return o.L;case"m":case"medium":return o.M;case"q":case"quartile":return o.Q;case"h":case"high":return o.H;default:throw new Error("Unknown EC Level: "+i)}}o.isValid=function(n){return n&&typeof n.bit<"u"&&n.bit>=0&&n.bit<4},o.from=function(n,r){if(o.isValid(n))return n;try{return e(n)}catch{return r}}})(Ct);function Ii(){this.buffer=[],this.length=0}Ii.prototype={get:function(o){const e=Math.floor(o/8);return(this.buffer[e]>>>7-o%8&1)===1},put:function(o,e){for(let i=0;i<e;i++)this.putBit((o>>>e-i-1&1)===1)},getLengthInBits:function(){return this.length},putBit:function(o){const e=Math.floor(this.length/8);this.buffer.length<=e&&this.buffer.push(0),o&&(this.buffer[e]|=128>>>this.length%8),this.length++}};var wn=Ii;function qe(o){if(!o||o<1)throw new Error("BitMatrix size must be defined and greater than 0");this.size=o,this.data=new Uint8Array(o*o),this.reservedBit=new Uint8Array(o*o)}qe.prototype.set=function(o,e,i,n){const r=o*this.size+e;this.data[r]=i,n&&(this.reservedBit[r]=!0)};qe.prototype.get=function(o,e){return this.data[o*this.size+e]};qe.prototype.xor=function(o,e,i){this.data[o*this.size+e]^=i};qe.prototype.isReserved=function(o,e){return this.reservedBit[o*this.size+e]};var bn=qe,Ei={};(function(o){const e=V.getSymbolSize;o.getRowColCoords=function(n){if(n===1)return[];const r=Math.floor(n/7)+2,t=e(n),a=t===145?26:Math.ceil((t-13)/(2*r-2))*2,s=[t-7];for(let l=1;l<r-1;l++)s[l]=s[l-1]-a;return s.push(6),s.reverse()},o.getPositions=function(n){const r=[],t=o.getRowColCoords(n),a=t.length;for(let s=0;s<a;s++)for(let l=0;l<a;l++)s===0&&l===0||s===0&&l===a-1||s===a-1&&l===0||r.push([t[s],t[l]]);return r}})(Ei);var Wi={};const mn=V.getSymbolSize,hi=7;Wi.getPositions=function(e){const i=mn(e);return[[0,0],[i-hi,0],[0,i-hi]]};var _i={};(function(o){o.Patterns={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};const e={N1:3,N2:3,N3:40,N4:10};o.isValid=function(r){return r!=null&&r!==""&&!isNaN(r)&&r>=0&&r<=7},o.from=function(r){return o.isValid(r)?parseInt(r,10):void 0},o.getPenaltyN1=function(r){const t=r.size;let a=0,s=0,l=0,h=null,p=null;for(let W=0;W<t;W++){s=l=0,h=p=null;for(let C=0;C<t;C++){let m=r.get(W,C);m===h?s++:(s>=5&&(a+=e.N1+(s-5)),h=m,s=1),m=r.get(C,W),m===p?l++:(l>=5&&(a+=e.N1+(l-5)),p=m,l=1)}s>=5&&(a+=e.N1+(s-5)),l>=5&&(a+=e.N1+(l-5))}return a},o.getPenaltyN2=function(r){const t=r.size;let a=0;for(let s=0;s<t-1;s++)for(let l=0;l<t-1;l++){const h=r.get(s,l)+r.get(s,l+1)+r.get(s+1,l)+r.get(s+1,l+1);(h===4||h===0)&&a++}return a*e.N2},o.getPenaltyN3=function(r){const t=r.size;let a=0,s=0,l=0;for(let h=0;h<t;h++){s=l=0;for(let p=0;p<t;p++)s=s<<1&2047|r.get(h,p),p>=10&&(s===1488||s===93)&&a++,l=l<<1&2047|r.get(p,h),p>=10&&(l===1488||l===93)&&a++}return a*e.N3},o.getPenaltyN4=function(r){let t=0;const a=r.data.length;for(let l=0;l<a;l++)t+=r.data[l];return Math.abs(Math.ceil(t*100/a/5)-10)*e.N4};function i(n,r,t){switch(n){case o.Patterns.PATTERN000:return(r+t)%2===0;case o.Patterns.PATTERN001:return r%2===0;case o.Patterns.PATTERN010:return t%3===0;case o.Patterns.PATTERN011:return(r+t)%3===0;case o.Patterns.PATTERN100:return(Math.floor(r/2)+Math.floor(t/3))%2===0;case o.Patterns.PATTERN101:return r*t%2+r*t%3===0;case o.Patterns.PATTERN110:return(r*t%2+r*t%3)%2===0;case o.Patterns.PATTERN111:return(r*t%3+(r+t)%2)%2===0;default:throw new Error("bad maskPattern:"+n)}}o.applyMask=function(r,t){const a=t.size;for(let s=0;s<a;s++)for(let l=0;l<a;l++)t.isReserved(l,s)||t.xor(l,s,i(r,l,s))},o.getBestMask=function(r,t){const a=Object.keys(o.Patterns).length;let s=0,l=1/0;for(let h=0;h<a;h++){t(h),o.applyMask(h,r);const p=o.getPenaltyN1(r)+o.getPenaltyN2(r)+o.getPenaltyN3(r)+o.getPenaltyN4(r);o.applyMask(h,r),p<l&&(l=p,s=h)}return s}})(_i);var $t={};const he=Ct,Ye=[1,1,1,1,1,1,1,1,1,1,2,2,1,2,2,4,1,2,4,4,2,4,4,4,2,4,6,5,2,4,6,6,2,5,8,8,4,5,8,8,4,5,8,11,4,8,10,11,4,9,12,16,4,9,16,16,6,10,12,18,6,10,17,16,6,11,16,19,6,13,18,21,7,14,21,25,8,16,20,25,8,17,23,25,9,17,23,34,9,18,25,30,10,20,27,32,12,21,29,35,12,23,34,37,12,25,34,40,13,26,35,42,14,28,38,45,15,29,40,48,16,31,43,51,17,33,45,54,18,35,48,57,19,37,51,60,19,38,53,63,20,40,56,66,21,43,59,70,22,45,62,74,24,47,65,77,25,49,68,81],Je=[7,10,13,17,10,16,22,28,15,26,36,44,20,36,52,64,26,48,72,88,36,64,96,112,40,72,108,130,48,88,132,156,60,110,160,192,72,130,192,224,80,150,224,264,96,176,260,308,104,198,288,352,120,216,320,384,132,240,360,432,144,280,408,480,168,308,448,532,180,338,504,588,196,364,546,650,224,416,600,700,224,442,644,750,252,476,690,816,270,504,750,900,300,560,810,960,312,588,870,1050,336,644,952,1110,360,700,1020,1200,390,728,1050,1260,420,784,1140,1350,450,812,1200,1440,480,868,1290,1530,510,924,1350,1620,540,980,1440,1710,570,1036,1530,1800,570,1064,1590,1890,600,1120,1680,1980,630,1204,1770,2100,660,1260,1860,2220,720,1316,1950,2310,750,1372,2040,2430];$t.getBlocksCount=function(e,i){switch(i){case he.L:return Ye[(e-1)*4+0];case he.M:return Ye[(e-1)*4+1];case he.Q:return Ye[(e-1)*4+2];case he.H:return Ye[(e-1)*4+3];default:return}};$t.getTotalCodewordsCount=function(e,i){switch(i){case he.L:return Je[(e-1)*4+0];case he.M:return Je[(e-1)*4+1];case he.Q:return Je[(e-1)*4+2];case he.H:return Je[(e-1)*4+3];default:return}};var Si={},Rt={};const je=new Uint8Array(512),st=new Uint8Array(256);(function(){let e=1;for(let i=0;i<255;i++)je[i]=e,st[e]=i,e<<=1,e&256&&(e^=285);for(let i=255;i<512;i++)je[i]=je[i-255]})();Rt.log=function(e){if(e<1)throw new Error("log("+e+")");return st[e]};Rt.exp=function(e){return je[e]};Rt.mul=function(e,i){return e===0||i===0?0:je[st[e]+st[i]]};(function(o){const e=Rt;o.mul=function(n,r){const t=new Uint8Array(n.length+r.length-1);for(let a=0;a<n.length;a++)for(let s=0;s<r.length;s++)t[a+s]^=e.mul(n[a],r[s]);return t},o.mod=function(n,r){let t=new Uint8Array(n);for(;t.length-r.length>=0;){const a=t[0];for(let l=0;l<r.length;l++)t[l]^=e.mul(r[l],a);let s=0;for(;s<t.length&&t[s]===0;)s++;t=t.slice(s)}return t},o.generateECPolynomial=function(n){let r=new Uint8Array([1]);for(let t=0;t<n;t++)r=o.mul(r,new Uint8Array([1,e.exp(t)]));return r}})(Si);const Ti=Si;function ei(o){this.genPoly=void 0,this.degree=o,this.degree&&this.initialize(this.degree)}ei.prototype.initialize=function(e){this.degree=e,this.genPoly=Ti.generateECPolynomial(this.degree)};ei.prototype.encode=function(e){if(!this.genPoly)throw new Error("Encoder not initialized");const i=new Uint8Array(e.length+this.degree);i.set(e);const n=Ti.mod(i,this.genPoly),r=this.degree-n.length;if(r>0){const t=new Uint8Array(this.degree);return t.set(n,r),t}return n};var vn=ei,Bi={},ge={},ti={};ti.isValid=function(e){return!isNaN(e)&&e>=1&&e<=40};var ne={};const Li="[0-9]+",yn="[A-Z $%*+\\-./:]+";let Ue="(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";Ue=Ue.replace(/u/g,"\\u");const xn="(?:(?![A-Z0-9 $%*+\\-./:]|"+Ue+`)(?:.|[\r
]))+`;ne.KANJI=new RegExp(Ue,"g");ne.BYTE_KANJI=new RegExp("[^A-Z0-9 $%*+\\-./:]+","g");ne.BYTE=new RegExp(xn,"g");ne.NUMERIC=new RegExp(Li,"g");ne.ALPHANUMERIC=new RegExp(yn,"g");const Cn=new RegExp("^"+Ue+"$"),$n=new RegExp("^"+Li+"$"),Rn=new RegExp("^[A-Z0-9 $%*+\\-./:]+$");ne.testKanji=function(e){return Cn.test(e)};ne.testNumeric=function(e){return $n.test(e)};ne.testAlphanumeric=function(e){return Rn.test(e)};(function(o){const e=ti,i=ne;o.NUMERIC={id:"Numeric",bit:1,ccBits:[10,12,14]},o.ALPHANUMERIC={id:"Alphanumeric",bit:2,ccBits:[9,11,13]},o.BYTE={id:"Byte",bit:4,ccBits:[8,16,16]},o.KANJI={id:"Kanji",bit:8,ccBits:[8,10,12]},o.MIXED={bit:-1},o.getCharCountIndicator=function(t,a){if(!t.ccBits)throw new Error("Invalid mode: "+t);if(!e.isValid(a))throw new Error("Invalid version: "+a);return a>=1&&a<10?t.ccBits[0]:a<27?t.ccBits[1]:t.ccBits[2]},o.getBestModeForData=function(t){return i.testNumeric(t)?o.NUMERIC:i.testAlphanumeric(t)?o.ALPHANUMERIC:i.testKanji(t)?o.KANJI:o.BYTE},o.toString=function(t){if(t&&t.id)return t.id;throw new Error("Invalid mode")},o.isValid=function(t){return t&&t.bit&&t.ccBits};function n(r){if(typeof r!="string")throw new Error("Param is not a string");switch(r.toLowerCase()){case"numeric":return o.NUMERIC;case"alphanumeric":return o.ALPHANUMERIC;case"kanji":return o.KANJI;case"byte":return o.BYTE;default:throw new Error("Unknown mode: "+r)}}o.from=function(t,a){if(o.isValid(t))return t;try{return n(t)}catch{return a}}})(ge);(function(o){const e=V,i=$t,n=Ct,r=ge,t=ti,a=7973,s=e.getBCHDigit(a);function l(C,m,I){for(let b=1;b<=40;b++)if(m<=o.getCapacity(b,I,C))return b}function h(C,m){return r.getCharCountIndicator(C,m)+4}function p(C,m){let I=0;return C.forEach(function(b){const $=h(b.mode,m);I+=$+b.getBitsLength()}),I}function W(C,m){for(let I=1;I<=40;I++)if(p(C,I)<=o.getCapacity(I,m,r.MIXED))return I}o.from=function(m,I){return t.isValid(m)?parseInt(m,10):I},o.getCapacity=function(m,I,b){if(!t.isValid(m))throw new Error("Invalid QR Code version");typeof b>"u"&&(b=r.BYTE);const $=e.getSymbolTotalCodewords(m),w=i.getTotalCodewordsCount(m,I),f=($-w)*8;if(b===r.MIXED)return f;const g=f-h(b,m);switch(b){case r.NUMERIC:return Math.floor(g/10*3);case r.ALPHANUMERIC:return Math.floor(g/11*2);case r.KANJI:return Math.floor(g/13);case r.BYTE:default:return Math.floor(g/8)}},o.getBestVersionForData=function(m,I){let b;const $=n.from(I,n.M);if(Array.isArray(m)){if(m.length>1)return W(m,$);if(m.length===0)return 1;b=m[0]}else b=m;return l(b.mode,b.getLength(),$)},o.getEncodedBits=function(m){if(!t.isValid(m)||m<7)throw new Error("Invalid QR Code version");let I=m<<12;for(;e.getBCHDigit(I)-s>=0;)I^=a<<e.getBCHDigit(I)-s;return m<<12|I}})(Bi);var Pi={};const zt=V,Oi=1335,In=21522,pi=zt.getBCHDigit(Oi);Pi.getEncodedBits=function(e,i){const n=e.bit<<3|i;let r=n<<10;for(;zt.getBCHDigit(r)-pi>=0;)r^=Oi<<zt.getBCHDigit(r)-pi;return(n<<10|r)^In};var Ai={};const En=ge;function Ie(o){this.mode=En.NUMERIC,this.data=o.toString()}Ie.getBitsLength=function(e){return 10*Math.floor(e/3)+(e%3?e%3*3+1:0)};Ie.prototype.getLength=function(){return this.data.length};Ie.prototype.getBitsLength=function(){return Ie.getBitsLength(this.data.length)};Ie.prototype.write=function(e){let i,n,r;for(i=0;i+3<=this.data.length;i+=3)n=this.data.substr(i,3),r=parseInt(n,10),e.put(r,10);const t=this.data.length-i;t>0&&(n=this.data.substr(i),r=parseInt(n,10),e.put(r,t*3+1))};var Wn=Ie;const _n=ge,St=["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"," ","$","%","*","+","-",".","/",":"];function Ee(o){this.mode=_n.ALPHANUMERIC,this.data=o}Ee.getBitsLength=function(e){return 11*Math.floor(e/2)+6*(e%2)};Ee.prototype.getLength=function(){return this.data.length};Ee.prototype.getBitsLength=function(){return Ee.getBitsLength(this.data.length)};Ee.prototype.write=function(e){let i;for(i=0;i+2<=this.data.length;i+=2){let n=St.indexOf(this.data[i])*45;n+=St.indexOf(this.data[i+1]),e.put(n,11)}this.data.length%2&&e.put(St.indexOf(this.data[i]),6)};var Sn=Ee,Tn=function(e){for(var i=[],n=e.length,r=0;r<n;r++){var t=e.charCodeAt(r);if(t>=55296&&t<=56319&&n>r+1){var a=e.charCodeAt(r+1);a>=56320&&a<=57343&&(t=(t-55296)*1024+a-56320+65536,r+=1)}if(t<128){i.push(t);continue}if(t<2048){i.push(t>>6|192),i.push(t&63|128);continue}if(t<55296||t>=57344&&t<65536){i.push(t>>12|224),i.push(t>>6&63|128),i.push(t&63|128);continue}if(t>=65536&&t<=1114111){i.push(t>>18|240),i.push(t>>12&63|128),i.push(t>>6&63|128),i.push(t&63|128);continue}i.push(239,191,189)}return new Uint8Array(i).buffer};const Bn=Tn,Ln=ge;function We(o){this.mode=Ln.BYTE,typeof o=="string"&&(o=Bn(o)),this.data=new Uint8Array(o)}We.getBitsLength=function(e){return e*8};We.prototype.getLength=function(){return this.data.length};We.prototype.getBitsLength=function(){return We.getBitsLength(this.data.length)};We.prototype.write=function(o){for(let e=0,i=this.data.length;e<i;e++)o.put(this.data[e],8)};var Pn=We;const On=ge,An=V;function _e(o){this.mode=On.KANJI,this.data=o}_e.getBitsLength=function(e){return e*13};_e.prototype.getLength=function(){return this.data.length};_e.prototype.getBitsLength=function(){return _e.getBitsLength(this.data.length)};_e.prototype.write=function(o){let e;for(e=0;e<this.data.length;e++){let i=An.toSJIS(this.data[e]);if(i>=33088&&i<=40956)i-=33088;else if(i>=57408&&i<=60351)i-=49472;else throw new Error("Invalid SJIS character: "+this.data[e]+`
Make sure your charset is UTF-8`);i=(i>>>8&255)*192+(i&255),o.put(i,13)}};var jn=_e;(function(o){const e=ge,i=Wn,n=Sn,r=Pn,t=jn,a=ne,s=V,l=Ji;function h(w){return unescape(encodeURIComponent(w)).length}function p(w,f,g){const d=[];let _;for(;(_=w.exec(g))!==null;)d.push({data:_[0],index:_.index,mode:f,length:_[0].length});return d}function W(w){const f=p(a.NUMERIC,e.NUMERIC,w),g=p(a.ALPHANUMERIC,e.ALPHANUMERIC,w);let d,_;return s.isKanjiModeEnabled()?(d=p(a.BYTE,e.BYTE,w),_=p(a.KANJI,e.KANJI,w)):(d=p(a.BYTE_KANJI,e.BYTE,w),_=[]),f.concat(g,d,_).sort(function(j,G){return j.index-G.index}).map(function(j){return{data:j.data,mode:j.mode,length:j.length}})}function C(w,f){switch(f){case e.NUMERIC:return i.getBitsLength(w);case e.ALPHANUMERIC:return n.getBitsLength(w);case e.KANJI:return t.getBitsLength(w);case e.BYTE:return r.getBitsLength(w)}}function m(w){return w.reduce(function(f,g){const d=f.length-1>=0?f[f.length-1]:null;return d&&d.mode===g.mode?(f[f.length-1].data+=g.data,f):(f.push(g),f)},[])}function I(w){const f=[];for(let g=0;g<w.length;g++){const d=w[g];switch(d.mode){case e.NUMERIC:f.push([d,{data:d.data,mode:e.ALPHANUMERIC,length:d.length},{data:d.data,mode:e.BYTE,length:d.length}]);break;case e.ALPHANUMERIC:f.push([d,{data:d.data,mode:e.BYTE,length:d.length}]);break;case e.KANJI:f.push([d,{data:d.data,mode:e.BYTE,length:h(d.data)}]);break;case e.BYTE:f.push([{data:d.data,mode:e.BYTE,length:h(d.data)}])}}return f}function b(w,f){const g={},d={start:{}};let _=["start"];for(let P=0;P<w.length;P++){const j=w[P],G=[];for(let de=0;de<j.length;de++){const Z=j[de],Oe=""+P+de;G.push(Oe),g[Oe]={node:Z,lastCount:0},d[Oe]={};for(let Wt=0;Wt<_.length;Wt++){const re=_[Wt];g[re]&&g[re].node.mode===Z.mode?(d[re][Oe]=C(g[re].lastCount+Z.length,Z.mode)-C(g[re].lastCount,Z.mode),g[re].lastCount+=Z.length):(g[re]&&(g[re].lastCount=Z.length),d[re][Oe]=C(Z.length,Z.mode)+4+e.getCharCountIndicator(Z.mode,f))}}_=G}for(let P=0;P<_.length;P++)d[_[P]].end=0;return{map:d,table:g}}function $(w,f){let g;const d=e.getBestModeForData(w);if(g=e.from(f,d),g!==e.BYTE&&g.bit<d.bit)throw new Error('"'+w+'" cannot be encoded with mode '+e.toString(g)+`.
 Suggested mode is: `+e.toString(d));switch(g===e.KANJI&&!s.isKanjiModeEnabled()&&(g=e.BYTE),g){case e.NUMERIC:return new i(w);case e.ALPHANUMERIC:return new n(w);case e.KANJI:return new t(w);case e.BYTE:return new r(w)}}o.fromArray=function(f){return f.reduce(function(g,d){return typeof d=="string"?g.push($(d,null)):d.data&&g.push($(d.data,d.mode)),g},[])},o.fromString=function(f,g){const d=W(f,s.isKanjiModeEnabled()),_=I(d),P=b(_,g),j=l.find_path(P.map,"start","end"),G=[];for(let de=1;de<j.length-1;de++)G.push(P.table[j[de]].node);return o.fromArray(m(G))},o.rawSplit=function(f){return o.fromArray(W(f,s.isKanjiModeEnabled()))}})(Ai);const It=V,Tt=Ct,kn=wn,zn=bn,Dn=Ei,Nn=Wi,Dt=_i,Nt=$t,Mn=vn,lt=Bi,Un=Pi,Fn=ge,Bt=Ai;function Vn(o,e){const i=o.size,n=Nn.getPositions(e);for(let r=0;r<n.length;r++){const t=n[r][0],a=n[r][1];for(let s=-1;s<=7;s++)if(!(t+s<=-1||i<=t+s))for(let l=-1;l<=7;l++)a+l<=-1||i<=a+l||(s>=0&&s<=6&&(l===0||l===6)||l>=0&&l<=6&&(s===0||s===6)||s>=2&&s<=4&&l>=2&&l<=4?o.set(t+s,a+l,!0,!0):o.set(t+s,a+l,!1,!0))}}function qn(o){const e=o.size;for(let i=8;i<e-8;i++){const n=i%2===0;o.set(i,6,n,!0),o.set(6,i,n,!0)}}function Hn(o,e){const i=Dn.getPositions(e);for(let n=0;n<i.length;n++){const r=i[n][0],t=i[n][1];for(let a=-2;a<=2;a++)for(let s=-2;s<=2;s++)a===-2||a===2||s===-2||s===2||a===0&&s===0?o.set(r+a,t+s,!0,!0):o.set(r+a,t+s,!1,!0)}}function Kn(o,e){const i=o.size,n=lt.getEncodedBits(e);let r,t,a;for(let s=0;s<18;s++)r=Math.floor(s/3),t=s%3+i-8-3,a=(n>>s&1)===1,o.set(r,t,a,!0),o.set(t,r,a,!0)}function Lt(o,e,i){const n=o.size,r=Un.getEncodedBits(e,i);let t,a;for(t=0;t<15;t++)a=(r>>t&1)===1,t<6?o.set(t,8,a,!0):t<8?o.set(t+1,8,a,!0):o.set(n-15+t,8,a,!0),t<8?o.set(8,n-t-1,a,!0):t<9?o.set(8,15-t-1+1,a,!0):o.set(8,15-t-1,a,!0);o.set(n-8,8,1,!0)}function Gn(o,e){const i=o.size;let n=-1,r=i-1,t=7,a=0;for(let s=i-1;s>0;s-=2)for(s===6&&s--;;){for(let l=0;l<2;l++)if(!o.isReserved(r,s-l)){let h=!1;a<e.length&&(h=(e[a]>>>t&1)===1),o.set(r,s-l,h),t--,t===-1&&(a++,t=7)}if(r+=n,r<0||i<=r){r-=n,n=-n;break}}}function Yn(o,e,i){const n=new kn;i.forEach(function(l){n.put(l.mode.bit,4),n.put(l.getLength(),Fn.getCharCountIndicator(l.mode,o)),l.write(n)});const r=It.getSymbolTotalCodewords(o),t=Nt.getTotalCodewordsCount(o,e),a=(r-t)*8;for(n.getLengthInBits()+4<=a&&n.put(0,4);n.getLengthInBits()%8!==0;)n.putBit(0);const s=(a-n.getLengthInBits())/8;for(let l=0;l<s;l++)n.put(l%2?17:236,8);return Jn(n,o,e)}function Jn(o,e,i){const n=It.getSymbolTotalCodewords(e),r=Nt.getTotalCodewordsCount(e,i),t=n-r,a=Nt.getBlocksCount(e,i),s=n%a,l=a-s,h=Math.floor(n/a),p=Math.floor(t/a),W=p+1,C=h-p,m=new Mn(C);let I=0;const b=new Array(a),$=new Array(a);let w=0;const f=new Uint8Array(o.buffer);for(let j=0;j<a;j++){const G=j<l?p:W;b[j]=f.slice(I,I+G),$[j]=m.encode(b[j]),I+=G,w=Math.max(w,G)}const g=new Uint8Array(n);let d=0,_,P;for(_=0;_<w;_++)for(P=0;P<a;P++)_<b[P].length&&(g[d++]=b[P][_]);for(_=0;_<C;_++)for(P=0;P<a;P++)g[d++]=$[P][_];return g}function Qn(o,e,i,n){let r;if(Array.isArray(o))r=Bt.fromArray(o);else if(typeof o=="string"){let h=e;if(!h){const p=Bt.rawSplit(o);h=lt.getBestVersionForData(p,i)}r=Bt.fromString(o,h||40)}else throw new Error("Invalid data");const t=lt.getBestVersionForData(r,i);if(!t)throw new Error("The amount of data is too big to be stored in a QR Code");if(!e)e=t;else if(e<t)throw new Error(`
The chosen QR Code version cannot contain this amount of data.
Minimum version required to store current data is: `+t+`.
`);const a=Yn(e,i,r),s=It.getSymbolSize(e),l=new zn(s);return Vn(l,e),qn(l),Hn(l,e),Lt(l,i,0),e>=7&&Kn(l,e),Gn(l,a),isNaN(n)&&(n=Dt.getBestMask(l,Lt.bind(null,l,i))),Dt.applyMask(n,l),Lt(l,i,n),{modules:l,version:e,errorCorrectionLevel:i,maskPattern:n,segments:r}}Ri.create=function(e,i){if(typeof e>"u"||e==="")throw new Error("No input text");let n=Tt.M,r,t;return typeof i<"u"&&(n=Tt.from(i.errorCorrectionLevel,Tt.M),r=lt.from(i.version),t=Dt.from(i.maskPattern),i.toSJISFunc&&It.setToSJISFunction(i.toSJISFunc)),Qn(e,r,n,t)};var ji={},ii={};(function(o){function e(i){if(typeof i=="number"&&(i=i.toString()),typeof i!="string")throw new Error("Color should be defined as hex string");let n=i.slice().replace("#","").split("");if(n.length<3||n.length===5||n.length>8)throw new Error("Invalid hex color: "+i);(n.length===3||n.length===4)&&(n=Array.prototype.concat.apply([],n.map(function(t){return[t,t]}))),n.length===6&&n.push("F","F");const r=parseInt(n.join(""),16);return{r:r>>24&255,g:r>>16&255,b:r>>8&255,a:r&255,hex:"#"+n.slice(0,6).join("")}}o.getOptions=function(n){n||(n={}),n.color||(n.color={});const r=typeof n.margin>"u"||n.margin===null||n.margin<0?4:n.margin,t=n.width&&n.width>=21?n.width:void 0,a=n.scale||4;return{width:t,scale:t?4:a,margin:r,color:{dark:e(n.color.dark||"#000000ff"),light:e(n.color.light||"#ffffffff")},type:n.type,rendererOpts:n.rendererOpts||{}}},o.getScale=function(n,r){return r.width&&r.width>=n+r.margin*2?r.width/(n+r.margin*2):r.scale},o.getImageWidth=function(n,r){const t=o.getScale(n,r);return Math.floor((n+r.margin*2)*t)},o.qrToImageData=function(n,r,t){const a=r.modules.size,s=r.modules.data,l=o.getScale(a,t),h=Math.floor((a+t.margin*2)*l),p=t.margin*l,W=[t.color.light,t.color.dark];for(let C=0;C<h;C++)for(let m=0;m<h;m++){let I=(C*h+m)*4,b=t.color.light;if(C>=p&&m>=p&&C<h-p&&m<h-p){const $=Math.floor((C-p)/l),w=Math.floor((m-p)/l);b=W[s[$*a+w]?1:0]}n[I++]=b.r,n[I++]=b.g,n[I++]=b.b,n[I]=b.a}}})(ii);(function(o){const e=ii;function i(r,t,a){r.clearRect(0,0,t.width,t.height),t.style||(t.style={}),t.height=a,t.width=a,t.style.height=a+"px",t.style.width=a+"px"}function n(){try{return document.createElement("canvas")}catch{throw new Error("You need to specify a canvas element")}}o.render=function(t,a,s){let l=s,h=a;typeof l>"u"&&(!a||!a.getContext)&&(l=a,a=void 0),a||(h=n()),l=e.getOptions(l);const p=e.getImageWidth(t.modules.size,l),W=h.getContext("2d"),C=W.createImageData(p,p);return e.qrToImageData(C.data,t,l),i(W,h,p),W.putImageData(C,0,0),h},o.renderToDataURL=function(t,a,s){let l=s;typeof l>"u"&&(!a||!a.getContext)&&(l=a,a=void 0),l||(l={});const h=o.render(t,a,l),p=l.type||"image/png",W=l.rendererOpts||{};return h.toDataURL(p,W.quality)}})(ji);var ki={};const Xn=ii;function fi(o,e){const i=o.a/255,n=e+'="'+o.hex+'"';return i<1?n+" "+e+'-opacity="'+i.toFixed(2).slice(1)+'"':n}function Pt(o,e,i){let n=o+e;return typeof i<"u"&&(n+=" "+i),n}function Zn(o,e,i){let n="",r=0,t=!1,a=0;for(let s=0;s<o.length;s++){const l=Math.floor(s%e),h=Math.floor(s/e);!l&&!t&&(t=!0),o[s]?(a++,s>0&&l>0&&o[s-1]||(n+=t?Pt("M",l+i,.5+h+i):Pt("m",r,0),r=0,t=!1),l+1<e&&o[s+1]||(n+=Pt("h",a),a=0)):r++}return n}ki.render=function(e,i,n){const r=Xn.getOptions(i),t=e.modules.size,a=e.modules.data,s=t+r.margin*2,l=r.color.light.a?"<path "+fi(r.color.light,"fill")+' d="M0 0h'+s+"v"+s+'H0z"/>':"",h="<path "+fi(r.color.dark,"stroke")+' d="'+Zn(a,t,r.margin)+'"/>',p='viewBox="0 0 '+s+" "+s+'"',C='<svg xmlns="http://www.w3.org/2000/svg" '+(r.width?'width="'+r.width+'" height="'+r.width+'" ':"")+p+' shape-rendering="crispEdges">'+l+h+`</svg>
`;return typeof n=="function"&&n(null,C),C};const eo=fn,Mt=Ri,zi=ji,to=ki;function ni(o,e,i,n,r){const t=[].slice.call(arguments,1),a=t.length,s=typeof t[a-1]=="function";if(!s&&!eo())throw new Error("Callback required as last argument");if(s){if(a<2)throw new Error("Too few arguments provided");a===2?(r=i,i=e,e=n=void 0):a===3&&(e.getContext&&typeof r>"u"?(r=n,n=void 0):(r=n,n=i,i=e,e=void 0))}else{if(a<1)throw new Error("Too few arguments provided");return a===1?(i=e,e=n=void 0):a===2&&!e.getContext&&(n=i,i=e,e=void 0),new Promise(function(l,h){try{const p=Mt.create(i,n);l(o(p,e,n))}catch(p){h(p)}})}try{const l=Mt.create(i,n);r(null,o(l,e,n))}catch(l){r(l)}}Ve.create=Mt.create;Ve.toCanvas=ni.bind(null,zi.render);Ve.toDataURL=ni.bind(null,zi.renderToDataURL);Ve.toString=ni.bind(null,function(o,e,i){return to.render(o,i)});const io=.1,gi=2.5,ae=7;function Ot(o,e,i){return o===e?!1:(o-e<0?e-o:o-e)<=i+io}function no(o,e){const i=Array.prototype.slice.call(Ve.create(o,{errorCorrectionLevel:e}).modules.data,0),n=Math.sqrt(i.length);return i.reduce((r,t,a)=>(a%n===0?r.push([t]):r[r.length-1].push(t))&&r,[])}const oo={generate({uri:o,size:e,logoSize:i,dotColor:n="#141414"}){const r="transparent",a=[],s=no(o,"Q"),l=e/s.length,h=[{x:0,y:0},{x:1,y:0},{x:0,y:1}];h.forEach(({x:b,y:$})=>{const w=(s.length-ae)*l*b,f=(s.length-ae)*l*$,g=.45;for(let d=0;d<h.length;d+=1){const _=l*(ae-d*2);a.push(Ae`
            <rect
              fill=${d===2?n:r}
              width=${d===0?_-5:_}
              rx= ${d===0?(_-5)*g:_*g}
              ry= ${d===0?(_-5)*g:_*g}
              stroke=${n}
              stroke-width=${d===0?5:0}
              height=${d===0?_-5:_}
              x= ${d===0?f+l*d+5/2:f+l*d}
              y= ${d===0?w+l*d+5/2:w+l*d}
            />
          `)}});const p=Math.floor((i+25)/l),W=s.length/2-p/2,C=s.length/2+p/2-1,m=[];s.forEach((b,$)=>{b.forEach((w,f)=>{if(s[$][f]&&!($<ae&&f<ae||$>s.length-(ae+1)&&f<ae||$<ae&&f>s.length-(ae+1))&&!($>W&&$<C&&f>W&&f<C)){const g=$*l+l/2,d=f*l+l/2;m.push([g,d])}})});const I={};return m.forEach(([b,$])=>{I[b]?I[b]?.push($):I[b]=[$]}),Object.entries(I).map(([b,$])=>{const w=$.filter(f=>$.every(g=>!Ot(f,g,l)));return[Number(b),w]}).forEach(([b,$])=>{$.forEach(w=>{a.push(Ae`<circle cx=${b} cy=${w} fill=${n} r=${l/gi} />`)})}),Object.entries(I).filter(([b,$])=>$.length>1).map(([b,$])=>{const w=$.filter(f=>$.some(g=>Ot(f,g,l)));return[Number(b),w]}).map(([b,$])=>{$.sort((f,g)=>f<g?-1:1);const w=[];for(const f of $){const g=w.find(d=>d.some(_=>Ot(f,_,l)));g?g.push(f):w.push([f])}return[b,w.map(f=>[f[0],f[f.length-1]])]}).forEach(([b,$])=>{$.forEach(([w,f])=>{a.push(Ae`
              <line
                x1=${b}
                x2=${b}
                y1=${w}
                y2=${f}
                stroke=${n}
                stroke-width=${l/(gi/2)}
                stroke-linecap="round"
              />
            `)})}),a}},ro=B`
  :host {
    position: relative;
    user-select: none;
    display: block;
    overflow: hidden;
    aspect-ratio: 1 / 1;
    width: var(--local-size);
  }

  :host([data-theme='dark']) {
    border-radius: clamp(0px, var(--wui-border-radius-l), 40px);
    background-color: var(--wui-color-inverse-100);
    padding: var(--wui-spacing-l);
  }

  :host([data-theme='light']) {
    box-shadow: 0 0 0 1px var(--wui-color-bg-125);
    background-color: var(--wui-color-bg-125);
  }

  :host([data-clear='true']) > wui-icon {
    display: none;
  }

  svg:first-child,
  wui-image,
  wui-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translateY(-50%) translateX(-50%);
  }

  wui-image {
    width: 25%;
    height: 25%;
    border-radius: var(--wui-border-radius-xs);
  }

  wui-icon {
    width: 100%;
    height: 100%;
    color: var(--local-icon-color) !important;
    transform: translateY(-50%) translateX(-50%) scale(0.25);
  }
`;var ue=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};const ao="#3396ff";let Q=class extends R{constructor(){super(...arguments),this.uri="",this.size=0,this.theme="dark",this.imageSrc=void 0,this.alt=void 0,this.arenaClear=void 0,this.farcaster=void 0}render(){return this.dataset.theme=this.theme,this.dataset.clear=String(this.arenaClear),this.style.cssText=`
     --local-size: ${this.size}px;
     --local-icon-color: ${this.color??ao}
    `,c`${this.templateVisual()} ${this.templateSvg()}`}templateSvg(){const e=this.theme==="light"?this.size:this.size-32;return Ae`
      <svg height=${e} width=${e}>
        ${oo.generate({uri:this.uri,size:e,logoSize:this.arenaClear?0:e/4,dotColor:this.color})}
      </svg>
    `}templateVisual(){return this.imageSrc?c`<wui-image src=${this.imageSrc} alt=${this.alt??"logo"}></wui-image>`:this.farcaster?c`<wui-icon
        class="farcaster"
        size="inherit"
        color="inherit"
        name="farcaster"
      ></wui-icon>`:c`<wui-icon size="inherit" color="inherit" name="walletConnect"></wui-icon>`}};Q.styles=[A,ro];ue([u()],Q.prototype,"uri",void 0);ue([u({type:Number})],Q.prototype,"size",void 0);ue([u()],Q.prototype,"theme",void 0);ue([u()],Q.prototype,"imageSrc",void 0);ue([u()],Q.prototype,"alt",void 0);ue([u()],Q.prototype,"color",void 0);ue([u({type:Boolean})],Q.prototype,"arenaClear",void 0);ue([u({type:Boolean})],Q.prototype,"farcaster",void 0);Q=ue([x("wui-qr-code")],Q);const so=B`
  :host {
    display: block;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
    background: linear-gradient(
      120deg,
      var(--wui-color-bg-200) 5%,
      var(--wui-color-bg-200) 48%,
      var(--wui-color-bg-300) 55%,
      var(--wui-color-bg-300) 60%,
      var(--wui-color-bg-300) calc(60% + 10px),
      var(--wui-color-bg-200) calc(60% + 12px),
      var(--wui-color-bg-200) 100%
    );
    background-size: 250%;
    animation: shimmer 3s linear infinite reverse;
  }

  :host([variant='light']) {
    background: linear-gradient(
      120deg,
      var(--wui-color-bg-150) 5%,
      var(--wui-color-bg-150) 48%,
      var(--wui-color-bg-200) 55%,
      var(--wui-color-bg-200) 60%,
      var(--wui-color-bg-200) calc(60% + 10px),
      var(--wui-color-bg-150) calc(60% + 12px),
      var(--wui-color-bg-150) 100%
    );
    background-size: 250%;
  }

  @keyframes shimmer {
    from {
      background-position: -250% 0;
    }
    to {
      background-position: 250% 0;
    }
  }
`;var He=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let ve=class extends R{constructor(){super(...arguments),this.width="",this.height="",this.borderRadius="m",this.variant="default"}render(){return this.style.cssText=`
      width: ${this.width};
      height: ${this.height};
      border-radius: ${`clamp(0px,var(--wui-border-radius-${this.borderRadius}), 40px)`};
    `,c`<slot></slot>`}};ve.styles=[so];He([u()],ve.prototype,"width",void 0);He([u()],ve.prototype,"height",void 0);He([u()],ve.prototype,"borderRadius",void 0);He([u()],ve.prototype,"variant",void 0);ve=He([x("wui-shimmer")],ve);const lo="https://reown.com",co=B`
  .reown-logo {
    height: var(--wui-spacing-xxl);
  }

  a {
    text-decoration: none;
    cursor: pointer;
  }

  a:hover {
    opacity: 0.9;
  }
`;var uo=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let Ut=class extends R{render(){return c`
      <a
        data-testid="ux-branding-reown"
        href=${lo}
        rel="noreferrer"
        target="_blank"
        style="text-decoration: none;"
      >
        <wui-flex
          justifyContent="center"
          alignItems="center"
          gap="xs"
          .padding=${["0","0","l","0"]}
        >
          <wui-text variant="small-500" color="fg-100"> UX by </wui-text>
          <wui-icon name="reown" size="xxxl" class="reown-logo"></wui-icon>
        </wui-flex>
      </a>
    `}};Ut.styles=[A,M,co];Ut=uo([x("wui-ux-by-reown")],Ut);const ho=B`
  @keyframes fadein {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  wui-shimmer {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: clamp(0px, var(--wui-border-radius-l), 40px) !important;
  }

  wui-qr-code {
    opacity: 0;
    animation-duration: 200ms;
    animation-timing-function: ease;
    animation-name: fadein;
    animation-fill-mode: forwards;
  }
`;var po=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let Ft=class extends z{constructor(){super(),this.forceUpdate=()=>{this.requestUpdate()},window.addEventListener("resize",this.forceUpdate),J.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet?.name??"WalletConnect",platform:"qrcode"}})}disconnectedCallback(){super.disconnectedCallback(),this.unsubscribe?.forEach(e=>e()),window.removeEventListener("resize",this.forceUpdate)}render(){return this.onRenderProxy(),c`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["0","xl","xl","xl"]}
        gap="xl"
      >
        <wui-shimmer borderRadius="l" width="100%"> ${this.qrCodeTemplate()} </wui-shimmer>

        <wui-text variant="paragraph-500" color="fg-100">
          Scan this QR Code with your phone
        </wui-text>
        ${this.copyTemplate()}
      </wui-flex>
      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}onRenderProxy(){!this.ready&&this.uri&&(this.timeout=setTimeout(()=>{this.ready=!0},200))}qrCodeTemplate(){if(!this.uri||!this.ready)return null;const e=this.getBoundingClientRect().width-40,i=this.wallet?this.wallet.name:void 0;return S.setWcLinking(void 0),S.setRecentWallet(this.wallet),c` <wui-qr-code
      size=${e}
      theme=${kt.state.themeMode}
      uri=${this.uri}
      imageSrc=${y(D.getWalletImage(this.wallet))}
      color=${y(kt.state.themeVariables["--w3m-qr-color"])}
      alt=${y(i)}
      data-testid="wui-qr-code"
    ></wui-qr-code>`}copyTemplate(){const e=!this.uri||!this.ready;return c`<wui-link
      .disabled=${e}
      @click=${this.onCopyUri}
      color="fg-200"
      data-testid="copy-wc2-uri"
    >
      <wui-icon size="xs" color="fg-200" slot="iconLeft" name="copy"></wui-icon>
      Copy link
    </wui-link>`}};Ft.styles=ho;Ft=po([x("w3m-connecting-wc-qrcode")],Ft);var fo=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let wi=class extends R{constructor(){if(super(),this.wallet=O.state.data?.wallet,!this.wallet)throw new Error("w3m-connecting-wc-unsupported: No wallet provided");J.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"browser"}})}render(){return c`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["3xl","xl","xl","xl"]}
        gap="xl"
      >
        <wui-wallet-image
          size="lg"
          imageSrc=${y(D.getWalletImage(this.wallet))}
        ></wui-wallet-image>

        <wui-text variant="paragraph-500" color="fg-100">Not Detected</wui-text>
      </wui-flex>

      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}};wi=fo([x("w3m-connecting-wc-unsupported")],wi);var Di=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let Vt=class extends z{constructor(){if(super(),this.isLoading=!0,!this.wallet)throw new Error("w3m-connecting-wc-web: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.secondaryBtnLabel="Open",this.secondaryLabel=yi.CONNECT_LABELS.MOBILE,this.secondaryBtnIcon="externalLink",this.updateLoadingState(),this.unsubscribe.push(S.subscribeKey("wcUri",()=>{this.updateLoadingState()})),J.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"web"}})}updateLoadingState(){this.isLoading=!this.uri}onConnectProxy(){if(this.wallet?.webapp_link&&this.uri)try{this.error=!1;const{webapp_link:e,name:i}=this.wallet,{redirect:n,href:r}=E.formatUniversalUrl(e,this.uri);S.setWcLinking({name:i,href:r}),S.setRecentWallet(this.wallet),E.openHref(n,"_blank")}catch{this.error=!0}}};Di([v()],Vt.prototype,"isLoading",void 0);Vt=Di([x("w3m-connecting-wc-web")],Vt);var Ke=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let Se=class extends R{constructor(){super(),this.wallet=O.state.data?.wallet,this.unsubscribe=[],this.platform=void 0,this.platforms=[],this.isSiwxEnabled=!!Y.state.siwx,this.remoteFeatures=Y.state.remoteFeatures,this.determinePlatforms(),this.initializeConnection(),this.unsubscribe.push(Y.subscribeKey("remoteFeatures",e=>this.remoteFeatures=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return c`
      ${this.headerTemplate()}
      <div>${this.platformTemplate()}</div>
      ${this.reownBrandingTemplate()}
    `}reownBrandingTemplate(){return this.remoteFeatures?.reownBranding?c`<wui-ux-by-reown></wui-ux-by-reown>`:null}async initializeConnection(e=!1){if(!(this.platform==="browser"||Y.state.manualWCControl&&!e))try{const{wcPairingExpiry:i,status:n}=S.state;(e||Y.state.enableEmbedded||E.isPairingExpired(i)||n==="connecting")&&(await S.connectWalletConnect(),this.isSiwxEnabled||vi.close())}catch(i){J.sendEvent({type:"track",event:"CONNECT_ERROR",properties:{message:i?.message??"Unknown"}}),S.setWcError(!0),Qe.showError(i.message??"Connection error"),S.resetWcConnection(),O.goBack()}}determinePlatforms(){if(!this.wallet){this.platforms.push("qrcode"),this.platform="qrcode";return}if(this.platform)return;const{mobile_link:e,desktop_link:i,webapp_link:n,injected:r,rdns:t}=this.wallet,a=r?.map(({injected_id:I})=>I).filter(Boolean),s=[...t?[t]:a??[]],l=Y.state.isUniversalProvider?!1:s.length,h=e,p=n,W=S.checkInstalled(s),C=l&&W,m=i&&!E.isMobile();C&&!jt.state.noAdapters&&this.platforms.push("browser"),h&&this.platforms.push(E.isMobile()?"mobile":"qrcode"),p&&this.platforms.push("web"),m&&this.platforms.push("desktop"),!C&&l&&!jt.state.noAdapters&&this.platforms.push("unsupported"),this.platform=this.platforms[0]}platformTemplate(){switch(this.platform){case"browser":return c`<w3m-connecting-wc-browser></w3m-connecting-wc-browser>`;case"web":return c`<w3m-connecting-wc-web></w3m-connecting-wc-web>`;case"desktop":return c`
          <w3m-connecting-wc-desktop .onRetry=${()=>this.initializeConnection(!0)}>
          </w3m-connecting-wc-desktop>
        `;case"mobile":return c`
          <w3m-connecting-wc-mobile isMobile .onRetry=${()=>this.initializeConnection(!0)}>
          </w3m-connecting-wc-mobile>
        `;case"qrcode":return c`<w3m-connecting-wc-qrcode></w3m-connecting-wc-qrcode>`;default:return c`<w3m-connecting-wc-unsupported></w3m-connecting-wc-unsupported>`}}headerTemplate(){return this.platforms.length>1?c`
      <w3m-connecting-header
        .platforms=${this.platforms}
        .onSelectPlatfrom=${this.onSelectPlatform.bind(this)}
      >
      </w3m-connecting-header>
    `:null}async onSelectPlatform(e){const i=this.shadowRoot?.querySelector("div");i&&(await i.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.platform=e,i.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}};Ke([v()],Se.prototype,"platform",void 0);Ke([v()],Se.prototype,"platforms",void 0);Ke([v()],Se.prototype,"isSiwxEnabled",void 0);Ke([v()],Se.prototype,"remoteFeatures",void 0);Se=Ke([x("w3m-connecting-wc-view")],Se);var Ni=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let qt=class extends R{constructor(){super(...arguments),this.isMobile=E.isMobile()}render(){if(this.isMobile){const{featured:e,recommended:i}=T.state,{customWallets:n}=Y.state,r=ft.getRecentWallets(),t=e.length||i.length||n?.length||r.length;return c`<wui-flex
        flexDirection="column"
        gap="xs"
        .margin=${["3xs","s","s","s"]}
      >
        ${t?c`<w3m-connector-list></w3m-connector-list>`:null}
        <w3m-all-wallets-widget></w3m-all-wallets-widget>
      </wui-flex>`}return c`<wui-flex flexDirection="column" .padding=${["0","0","l","0"]}>
      <w3m-connecting-wc-view></w3m-connecting-wc-view>
      <wui-flex flexDirection="column" .padding=${["0","m","0","m"]}>
        <w3m-all-wallets-widget></w3m-all-wallets-widget> </wui-flex
    ></wui-flex>`}};Ni([v()],qt.prototype,"isMobile",void 0);qt=Ni([x("w3m-connecting-wc-basic-view")],qt);/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const oi=()=>new go;class go{}const At=new WeakMap,ri=Ki(class extends Gi{render(o){return li}update(o,[e]){const i=e!==this.G;return i&&this.rt(void 0),(i||this.lt!==this.ct)&&(this.G=e,this.ht=o.options?.host,this.rt(this.ct=o.element)),li}rt(o){if(this.G!==void 0)if(this.isConnected||(o=void 0),typeof this.G=="function"){const e=this.ht??globalThis;let i=At.get(e);i===void 0&&(i=new WeakMap,At.set(e,i)),i.get(this.G)!==void 0&&this.G.call(this.ht,void 0),i.set(this.G,o),o!==void 0&&this.G.call(this.ht,o)}else this.G.value=o}get lt(){return typeof this.G=="function"?At.get(this.ht??globalThis)?.get(this.G):this.G?.value}disconnected(){this.lt===this.ct&&this.rt(void 0)}reconnected(){this.rt(this.ct)}}),wo=B`
  :host {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  label {
    position: relative;
    display: inline-block;
    width: 32px;
    height: 22px;
  }

  input {
    width: 0;
    height: 0;
    opacity: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--wui-color-blue-100);
    border-width: 1px;
    border-style: solid;
    border-color: var(--wui-color-gray-glass-002);
    border-radius: 999px;
    transition:
      background-color var(--wui-ease-inout-power-1) var(--wui-duration-md),
      border-color var(--wui-ease-inout-power-1) var(--wui-duration-md);
    will-change: background-color, border-color;
  }

  span:before {
    position: absolute;
    content: '';
    height: 16px;
    width: 16px;
    left: 3px;
    top: 2px;
    background-color: var(--wui-color-inverse-100);
    transition: transform var(--wui-ease-inout-power-1) var(--wui-duration-lg);
    will-change: transform;
    border-radius: 50%;
  }

  input:checked + span {
    border-color: var(--wui-color-gray-glass-005);
    background-color: var(--wui-color-blue-100);
  }

  input:not(:checked) + span {
    background-color: var(--wui-color-gray-glass-010);
  }

  input:checked + span:before {
    transform: translateX(calc(100% - 7px));
  }
`;var Mi=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let ct=class extends R{constructor(){super(...arguments),this.inputElementRef=oi(),this.checked=void 0}render(){return c`
      <label>
        <input
          ${ri(this.inputElementRef)}
          type="checkbox"
          ?checked=${y(this.checked)}
          @change=${this.dispatchChangeEvent.bind(this)}
        />
        <span></span>
      </label>
    `}dispatchChangeEvent(){this.dispatchEvent(new CustomEvent("switchChange",{detail:this.inputElementRef.value?.checked,bubbles:!0,composed:!0}))}};ct.styles=[A,M,Hi,wo];Mi([u({type:Boolean})],ct.prototype,"checked",void 0);ct=Mi([x("wui-switch")],ct);const bo=B`
  :host {
    height: 100%;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    column-gap: var(--wui-spacing-1xs);
    padding: var(--wui-spacing-xs) var(--wui-spacing-s);
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-002);
    transition: background-color var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: background-color;
    cursor: pointer;
  }

  wui-switch {
    pointer-events: none;
  }
`;var Ui=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let ut=class extends R{constructor(){super(...arguments),this.checked=void 0}render(){return c`
      <button>
        <wui-icon size="xl" name="walletConnectBrown"></wui-icon>
        <wui-switch ?checked=${y(this.checked)}></wui-switch>
      </button>
    `}};ut.styles=[A,M,bo];Ui([u({type:Boolean})],ut.prototype,"checked",void 0);ut=Ui([x("wui-certified-switch")],ut);const mo=B`
  button {
    background-color: var(--wui-color-fg-300);
    border-radius: var(--wui-border-radius-4xs);
    width: 16px;
    height: 16px;
  }

  button:disabled {
    background-color: var(--wui-color-bg-300);
  }

  wui-icon {
    color: var(--wui-color-bg-200) !important;
  }

  button:focus-visible {
    background-color: var(--wui-color-fg-250);
    border: 1px solid var(--wui-color-accent-100);
  }

  @media (hover: hover) and (pointer: fine) {
    button:hover:enabled {
      background-color: var(--wui-color-fg-250);
    }

    button:active:enabled {
      background-color: var(--wui-color-fg-225);
    }
  }
`;var Fi=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let dt=class extends R{constructor(){super(...arguments),this.icon="copy"}render(){return c`
      <button>
        <wui-icon color="inherit" size="xxs" name=${this.icon}></wui-icon>
      </button>
    `}};dt.styles=[A,M,mo];Fi([u()],dt.prototype,"icon",void 0);dt=Fi([x("wui-input-element")],dt);const vo=B`
  :host {
    position: relative;
    width: 100%;
    display: inline-block;
    color: var(--wui-color-fg-275);
  }

  input {
    width: 100%;
    border-radius: var(--wui-border-radius-xs);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-002);
    background: var(--wui-color-gray-glass-002);
    font-size: var(--wui-font-size-paragraph);
    letter-spacing: var(--wui-letter-spacing-paragraph);
    color: var(--wui-color-fg-100);
    transition:
      background-color var(--wui-ease-inout-power-1) var(--wui-duration-md),
      border-color var(--wui-ease-inout-power-1) var(--wui-duration-md),
      box-shadow var(--wui-ease-inout-power-1) var(--wui-duration-md);
    will-change: background-color, border-color, box-shadow;
    caret-color: var(--wui-color-accent-100);
  }

  input:disabled {
    cursor: not-allowed;
    border: 1px solid var(--wui-color-gray-glass-010);
  }

  input:disabled::placeholder,
  input:disabled + wui-icon {
    color: var(--wui-color-fg-300);
  }

  input::placeholder {
    color: var(--wui-color-fg-275);
  }

  input:focus:enabled {
    background-color: var(--wui-color-gray-glass-005);
    -webkit-box-shadow:
      inset 0 0 0 1px var(--wui-color-accent-100),
      0px 0px 0px 4px var(--wui-box-shadow-blue);
    -moz-box-shadow:
      inset 0 0 0 1px var(--wui-color-accent-100),
      0px 0px 0px 4px var(--wui-box-shadow-blue);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-accent-100),
      0px 0px 0px 4px var(--wui-box-shadow-blue);
  }

  input:hover:enabled {
    background-color: var(--wui-color-gray-glass-005);
  }

  wui-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .wui-size-sm {
    padding: 9px var(--wui-spacing-m) 10px var(--wui-spacing-s);
  }

  wui-icon + .wui-size-sm {
    padding: 9px var(--wui-spacing-m) 10px 36px;
  }

  wui-icon[data-input='sm'] {
    left: var(--wui-spacing-s);
  }

  .wui-size-md {
    padding: 15px var(--wui-spacing-m) var(--wui-spacing-l) var(--wui-spacing-m);
  }

  wui-icon + .wui-size-md,
  wui-loading-spinner + .wui-size-md {
    padding: 10.5px var(--wui-spacing-3xl) 10.5px var(--wui-spacing-3xl);
  }

  wui-icon[data-input='md'] {
    left: var(--wui-spacing-l);
  }

  .wui-size-lg {
    padding: var(--wui-spacing-s) var(--wui-spacing-s) var(--wui-spacing-s) var(--wui-spacing-l);
    letter-spacing: var(--wui-letter-spacing-medium-title);
    font-size: var(--wui-font-size-medium-title);
    font-weight: var(--wui-font-weight-light);
    line-height: 130%;
    color: var(--wui-color-fg-100);
    height: 64px;
  }

  .wui-padding-right-xs {
    padding-right: var(--wui-spacing-xs);
  }

  .wui-padding-right-s {
    padding-right: var(--wui-spacing-s);
  }

  .wui-padding-right-m {
    padding-right: var(--wui-spacing-m);
  }

  .wui-padding-right-l {
    padding-right: var(--wui-spacing-l);
  }

  .wui-padding-right-xl {
    padding-right: var(--wui-spacing-xl);
  }

  .wui-padding-right-2xl {
    padding-right: var(--wui-spacing-2xl);
  }

  .wui-padding-right-3xl {
    padding-right: var(--wui-spacing-3xl);
  }

  .wui-padding-right-4xl {
    padding-right: var(--wui-spacing-4xl);
  }

  .wui-padding-right-5xl {
    padding-right: var(--wui-spacing-5xl);
  }

  wui-icon + .wui-size-lg,
  wui-loading-spinner + .wui-size-lg {
    padding-left: 50px;
  }

  wui-icon[data-input='lg'] {
    left: var(--wui-spacing-l);
  }

  .wui-size-mdl {
    padding: 17.25px var(--wui-spacing-m) 17.25px var(--wui-spacing-m);
  }
  wui-icon + .wui-size-mdl,
  wui-loading-spinner + .wui-size-mdl {
    padding: 17.25px var(--wui-spacing-3xl) 17.25px 40px;
  }
  wui-icon[data-input='mdl'] {
    left: var(--wui-spacing-m);
  }

  input:placeholder-shown ~ ::slotted(wui-input-element),
  input:placeholder-shown ~ ::slotted(wui-icon) {
    opacity: 0;
    pointer-events: none;
  }

  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type='number'] {
    -moz-appearance: textfield;
  }

  ::slotted(wui-input-element),
  ::slotted(wui-icon) {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }

  ::slotted(wui-input-element) {
    right: var(--wui-spacing-m);
  }

  ::slotted(wui-icon) {
    right: 0px;
  }
`;var oe=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let H=class extends R{constructor(){super(...arguments),this.inputElementRef=oi(),this.size="md",this.disabled=!1,this.placeholder="",this.type="text",this.value=""}render(){const e=`wui-padding-right-${this.inputRightPadding}`,n={[`wui-size-${this.size}`]:!0,[e]:!!this.inputRightPadding};return c`${this.templateIcon()}
      <input
        data-testid="wui-input-text"
        ${ri(this.inputElementRef)}
        class=${Yi(n)}
        type=${this.type}
        enterkeyhint=${y(this.enterKeyHint)}
        ?disabled=${this.disabled}
        placeholder=${this.placeholder}
        @input=${this.dispatchInputChangeEvent.bind(this)}
        .value=${this.value||""}
        tabindex=${y(this.tabIdx)}
      />
      <slot></slot>`}templateIcon(){return this.icon?c`<wui-icon
        data-input=${this.size}
        size=${this.size}
        color="inherit"
        name=${this.icon}
      ></wui-icon>`:null}dispatchInputChangeEvent(){this.dispatchEvent(new CustomEvent("inputChange",{detail:this.inputElementRef.value?.value,bubbles:!0,composed:!0}))}};H.styles=[A,M,vo];oe([u()],H.prototype,"size",void 0);oe([u()],H.prototype,"icon",void 0);oe([u({type:Boolean})],H.prototype,"disabled",void 0);oe([u()],H.prototype,"placeholder",void 0);oe([u()],H.prototype,"type",void 0);oe([u()],H.prototype,"keyHint",void 0);oe([u()],H.prototype,"value",void 0);oe([u()],H.prototype,"inputRightPadding",void 0);oe([u()],H.prototype,"tabIdx",void 0);H=oe([x("wui-input-text")],H);const yo=B`
  :host {
    position: relative;
    display: inline-block;
    width: 100%;
  }
`;var xo=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let Ht=class extends R{constructor(){super(...arguments),this.inputComponentRef=oi()}render(){return c`
      <wui-input-text
        ${ri(this.inputComponentRef)}
        placeholder="Search wallet"
        icon="search"
        type="search"
        enterKeyHint="search"
        size="sm"
      >
        <wui-input-element @click=${this.clearValue} icon="close"></wui-input-element>
      </wui-input-text>
    `}clearValue(){const i=this.inputComponentRef.value?.inputElementRef.value;i&&(i.value="",i.focus(),i.dispatchEvent(new Event("input")))}};Ht.styles=[A,yo];Ht=xo([x("wui-search-bar")],Ht);const Co=Ae`<svg  viewBox="0 0 48 54" fill="none">
  <path
    d="M43.4605 10.7248L28.0485 1.61089C25.5438 0.129705 22.4562 0.129705 19.9515 1.61088L4.53951 10.7248C2.03626 12.2051 0.5 14.9365 0.5 17.886V36.1139C0.5 39.0635 2.03626 41.7949 4.53951 43.2752L19.9515 52.3891C22.4562 53.8703 25.5438 53.8703 28.0485 52.3891L43.4605 43.2752C45.9637 41.7949 47.5 39.0635 47.5 36.114V17.8861C47.5 14.9365 45.9637 12.2051 43.4605 10.7248Z"
  />
</svg>`,$o=B`
  :host {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 104px;
    row-gap: var(--wui-spacing-xs);
    padding: var(--wui-spacing-xs) 10px;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: clamp(0px, var(--wui-border-radius-xs), 20px);
    position: relative;
  }

  wui-shimmer[data-type='network'] {
    border: none;
    -webkit-clip-path: var(--wui-path-network);
    clip-path: var(--wui-path-network);
  }

  svg {
    position: absolute;
    width: 48px;
    height: 54px;
    z-index: 1;
  }

  svg > path {
    stroke: var(--wui-color-gray-glass-010);
    stroke-width: 1px;
  }

  @media (max-width: 350px) {
    :host {
      width: 100%;
    }
  }
`;var Vi=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let ht=class extends R{constructor(){super(...arguments),this.type="wallet"}render(){return c`
      ${this.shimmerTemplate()}
      <wui-shimmer width="56px" height="20px" borderRadius="xs"></wui-shimmer>
    `}shimmerTemplate(){return this.type==="network"?c` <wui-shimmer
          data-type=${this.type}
          width="48px"
          height="54px"
          borderRadius="xs"
        ></wui-shimmer>
        ${Co}`:c`<wui-shimmer width="56px" height="56px" borderRadius="xs"></wui-shimmer>`}};ht.styles=[A,M,$o];Vi([u()],ht.prototype,"type",void 0);ht=Vi([x("wui-card-select-loader")],ht);const Ro=B`
  :host {
    display: grid;
    width: inherit;
    height: inherit;
  }
`;var K=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let N=class extends R{render(){return this.style.cssText=`
      grid-template-rows: ${this.gridTemplateRows};
      grid-template-columns: ${this.gridTemplateColumns};
      justify-items: ${this.justifyItems};
      align-items: ${this.alignItems};
      justify-content: ${this.justifyContent};
      align-content: ${this.alignContent};
      column-gap: ${this.columnGap&&`var(--wui-spacing-${this.columnGap})`};
      row-gap: ${this.rowGap&&`var(--wui-spacing-${this.rowGap})`};
      gap: ${this.gap&&`var(--wui-spacing-${this.gap})`};
      padding-top: ${this.padding&&se.getSpacingStyles(this.padding,0)};
      padding-right: ${this.padding&&se.getSpacingStyles(this.padding,1)};
      padding-bottom: ${this.padding&&se.getSpacingStyles(this.padding,2)};
      padding-left: ${this.padding&&se.getSpacingStyles(this.padding,3)};
      margin-top: ${this.margin&&se.getSpacingStyles(this.margin,0)};
      margin-right: ${this.margin&&se.getSpacingStyles(this.margin,1)};
      margin-bottom: ${this.margin&&se.getSpacingStyles(this.margin,2)};
      margin-left: ${this.margin&&se.getSpacingStyles(this.margin,3)};
    `,c`<slot></slot>`}};N.styles=[A,Ro];K([u()],N.prototype,"gridTemplateRows",void 0);K([u()],N.prototype,"gridTemplateColumns",void 0);K([u()],N.prototype,"justifyItems",void 0);K([u()],N.prototype,"alignItems",void 0);K([u()],N.prototype,"justifyContent",void 0);K([u()],N.prototype,"alignContent",void 0);K([u()],N.prototype,"columnGap",void 0);K([u()],N.prototype,"rowGap",void 0);K([u()],N.prototype,"gap",void 0);K([u()],N.prototype,"padding",void 0);K([u()],N.prototype,"margin",void 0);N=K([x("wui-grid")],N);const Io=B`
  button {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    width: 104px;
    row-gap: var(--wui-spacing-xs);
    padding: var(--wui-spacing-s) var(--wui-spacing-0);
    background-color: var(--wui-color-gray-glass-002);
    border-radius: clamp(0px, var(--wui-border-radius-xs), 20px);
    transition:
      color var(--wui-duration-lg) var(--wui-ease-out-power-1),
      background-color var(--wui-duration-lg) var(--wui-ease-out-power-1),
      border-radius var(--wui-duration-lg) var(--wui-ease-out-power-1);
    will-change: background-color, color, border-radius;
    outline: none;
    border: none;
  }

  button > wui-flex > wui-text {
    color: var(--wui-color-fg-100);
    max-width: 86px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    justify-content: center;
  }

  button > wui-flex > wui-text.certified {
    max-width: 66px;
  }

  button:hover:enabled {
    background-color: var(--wui-color-gray-glass-005);
  }

  button:disabled > wui-flex > wui-text {
    color: var(--wui-color-gray-glass-015);
  }

  [data-selected='true'] {
    background-color: var(--wui-color-accent-glass-020);
  }

  @media (hover: hover) and (pointer: fine) {
    [data-selected='true']:hover:enabled {
      background-color: var(--wui-color-accent-glass-015);
    }
  }

  [data-selected='true']:active:enabled {
    background-color: var(--wui-color-accent-glass-010);
  }

  @media (max-width: 350px) {
    button {
      width: 100%;
    }
  }
`;var Ge=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let ye=class extends R{constructor(){super(),this.observer=new IntersectionObserver(()=>{}),this.visible=!1,this.imageSrc=void 0,this.imageLoading=!1,this.wallet=void 0,this.observer=new IntersectionObserver(e=>{e.forEach(i=>{i.isIntersecting?(this.visible=!0,this.fetchImageSrc()):this.visible=!1})},{threshold:.01})}firstUpdated(){this.observer.observe(this)}disconnectedCallback(){this.observer.disconnect()}render(){const e=this.wallet?.badge_type==="certified";return c`
      <button>
        ${this.imageTemplate()}
        <wui-flex flexDirection="row" alignItems="center" justifyContent="center" gap="3xs">
          <wui-text
            variant="tiny-500"
            color="inherit"
            class=${y(e?"certified":void 0)}
            >${this.wallet?.name}</wui-text
          >
          ${e?c`<wui-icon size="sm" name="walletConnectBrown"></wui-icon>`:null}
        </wui-flex>
      </button>
    `}imageTemplate(){return!this.visible&&!this.imageSrc||this.imageLoading?this.shimmerTemplate():c`
      <wui-wallet-image
        size="md"
        imageSrc=${y(this.imageSrc)}
        name=${this.wallet?.name}
        .installed=${this.wallet?.installed}
        badgeSize="sm"
      >
      </wui-wallet-image>
    `}shimmerTemplate(){return c`<wui-shimmer width="56px" height="56px" borderRadius="xs"></wui-shimmer>`}async fetchImageSrc(){this.wallet&&(this.imageSrc=D.getWalletImage(this.wallet),!this.imageSrc&&(this.imageLoading=!0,this.imageSrc=await D.fetchWalletImage(this.wallet.image_id),this.imageLoading=!1))}};ye.styles=Io;Ge([v()],ye.prototype,"visible",void 0);Ge([v()],ye.prototype,"imageSrc",void 0);Ge([v()],ye.prototype,"imageLoading",void 0);Ge([u()],ye.prototype,"wallet",void 0);ye=Ge([x("w3m-all-wallets-list-item")],ye);const Eo=B`
  wui-grid {
    max-height: clamp(360px, 400px, 80vh);
    overflow: scroll;
    scrollbar-width: none;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, 104px);
  }

  @media (max-width: 350px) {
    wui-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  wui-grid[data-scroll='false'] {
    overflow: hidden;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  wui-loading-spinner {
    padding-top: var(--wui-spacing-l);
    padding-bottom: var(--wui-spacing-l);
    justify-content: center;
    grid-column: 1 / span 4;
  }
`;var Pe=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};const bi="local-paginator";let pe=class extends R{constructor(){super(),this.unsubscribe=[],this.paginationObserver=void 0,this.loading=!T.state.wallets.length,this.wallets=T.state.wallets,this.recommended=T.state.recommended,this.featured=T.state.featured,this.filteredWallets=T.state.filteredWallets,this.unsubscribe.push(T.subscribeKey("wallets",e=>this.wallets=e),T.subscribeKey("recommended",e=>this.recommended=e),T.subscribeKey("featured",e=>this.featured=e),T.subscribeKey("filteredWallets",e=>this.filteredWallets=e))}firstUpdated(){this.initialFetch(),this.createPaginationObserver()}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),this.paginationObserver?.disconnect()}render(){return c`
      <wui-grid
        data-scroll=${!this.loading}
        .padding=${["0","s","s","s"]}
        columnGap="xxs"
        rowGap="l"
        justifyContent="space-between"
      >
        ${this.loading?this.shimmerTemplate(16):this.walletsTemplate()}
        ${this.paginationLoaderTemplate()}
      </wui-grid>
    `}async initialFetch(){this.loading=!0;const e=this.shadowRoot?.querySelector("wui-grid");e&&(await T.fetchWalletsByPage({page:1}),await e.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.loading=!1,e.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}shimmerTemplate(e,i){return[...Array(e)].map(()=>c`
        <wui-card-select-loader type="wallet" id=${y(i)}></wui-card-select-loader>
      `)}walletsTemplate(){const e=this.filteredWallets?.length>0?E.uniqueBy([...this.featured,...this.recommended,...this.filteredWallets],"id"):E.uniqueBy([...this.featured,...this.recommended,...this.wallets],"id");return gt.markWalletsAsInstalled(e).map(n=>c`
        <w3m-all-wallets-list-item
          @click=${()=>this.onConnectWallet(n)}
          .wallet=${n}
        ></w3m-all-wallets-list-item>
      `)}paginationLoaderTemplate(){const{wallets:e,recommended:i,featured:n,count:r}=T.state,t=window.innerWidth<352?3:4,a=e.length+i.length;let l=Math.ceil(a/t)*t-a+t;return l-=e.length?n.length%t:0,r===0&&n.length>0?null:r===0||[...n,...e,...i].length<r?this.shimmerTemplate(l,bi):null}createPaginationObserver(){const e=this.shadowRoot?.querySelector(`#${bi}`);e&&(this.paginationObserver=new IntersectionObserver(([i])=>{if(i?.isIntersecting&&!this.loading){const{page:n,count:r,wallets:t}=T.state;t.length<r&&T.fetchWalletsByPage({page:n+1})}}),this.paginationObserver.observe(e))}onConnectWallet(e){L.selectWalletConnector(e)}};pe.styles=Eo;Pe([v()],pe.prototype,"loading",void 0);Pe([v()],pe.prototype,"wallets",void 0);Pe([v()],pe.prototype,"recommended",void 0);Pe([v()],pe.prototype,"featured",void 0);Pe([v()],pe.prototype,"filteredWallets",void 0);pe=Pe([x("w3m-all-wallets-list")],pe);const Wo=B`
  wui-grid,
  wui-loading-spinner,
  wui-flex {
    height: 360px;
  }

  wui-grid {
    overflow: scroll;
    scrollbar-width: none;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, 104px);
  }

  wui-grid[data-scroll='false'] {
    overflow: hidden;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  wui-loading-spinner {
    justify-content: center;
    align-items: center;
  }

  @media (max-width: 350px) {
    wui-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;var Et=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let Te=class extends R{constructor(){super(...arguments),this.prevQuery="",this.prevBadge=void 0,this.loading=!0,this.query=""}render(){return this.onSearch(),this.loading?c`<wui-loading-spinner color="accent-100"></wui-loading-spinner>`:this.walletsTemplate()}async onSearch(){(this.query.trim()!==this.prevQuery.trim()||this.badge!==this.prevBadge)&&(this.prevQuery=this.query,this.prevBadge=this.badge,this.loading=!0,await T.searchWallet({search:this.query,badge:this.badge}),this.loading=!1)}walletsTemplate(){const{search:e}=T.state,i=gt.markWalletsAsInstalled(e);return e.length?c`
      <wui-grid
        data-testid="wallet-list"
        .padding=${["0","s","s","s"]}
        rowGap="l"
        columnGap="xs"
        justifyContent="space-between"
      >
        ${i.map(n=>c`
            <w3m-all-wallets-list-item
              @click=${()=>this.onConnectWallet(n)}
              .wallet=${n}
              data-testid="wallet-search-item-${n.id}"
            ></w3m-all-wallets-list-item>
          `)}
      </wui-grid>
    `:c`
        <wui-flex
          data-testid="no-wallet-found"
          justifyContent="center"
          alignItems="center"
          gap="s"
          flexDirection="column"
        >
          <wui-icon-box
            size="lg"
            iconColor="fg-200"
            backgroundColor="fg-300"
            icon="wallet"
            background="transparent"
          ></wui-icon-box>
          <wui-text data-testid="no-wallet-found-text" color="fg-200" variant="paragraph-500">
            No Wallet found
          </wui-text>
        </wui-flex>
      `}onConnectWallet(e){L.selectWalletConnector(e)}};Te.styles=Wo;Et([v()],Te.prototype,"loading",void 0);Et([u()],Te.prototype,"query",void 0);Et([u()],Te.prototype,"badge",void 0);Te=Et([x("w3m-all-wallets-search")],Te);var ai=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let pt=class extends R{constructor(){super(...arguments),this.search="",this.onDebouncedSearch=E.debounce(e=>{this.search=e})}render(){const e=this.search.length>=2;return c`
      <wui-flex .padding=${["0","s","s","s"]} gap="xs">
        <wui-search-bar @inputChange=${this.onInputChange.bind(this)}></wui-search-bar>
        <wui-certified-switch
          ?checked=${this.badge}
          @click=${this.onClick.bind(this)}
          data-testid="wui-certified-switch"
        ></wui-certified-switch>
        ${this.qrButtonTemplate()}
      </wui-flex>
      ${e||this.badge?c`<w3m-all-wallets-search
            query=${this.search}
            badge=${y(this.badge)}
          ></w3m-all-wallets-search>`:c`<w3m-all-wallets-list badge=${y(this.badge)}></w3m-all-wallets-list>`}
    `}onInputChange(e){this.onDebouncedSearch(e.detail)}onClick(){if(this.badge==="certified"){this.badge=void 0;return}this.badge="certified",Qe.showSvg("Only WalletConnect certified",{icon:"walletConnectBrown",iconColor:"accent-100"})}qrButtonTemplate(){return E.isMobile()?c`
        <wui-icon-box
          size="lg"
          iconSize="xl"
          iconColor="accent-100"
          backgroundColor="accent-100"
          icon="qrCode"
          background="transparent"
          border
          borderColor="wui-accent-glass-010"
          @click=${this.onWalletConnectQr.bind(this)}
        ></wui-icon-box>
      `:null}onWalletConnectQr(){O.push("ConnectingWalletConnect")}};ai([v()],pt.prototype,"search",void 0);ai([v()],pt.prototype,"badge",void 0);pt=ai([x("w3m-all-wallets-view")],pt);const _o=B`
  button {
    column-gap: var(--wui-spacing-s);
    padding: 11px 18px 11px var(--wui-spacing-s);
    width: 100%;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
    color: var(--wui-color-fg-250);
    transition:
      color var(--wui-ease-out-power-1) var(--wui-duration-md),
      background-color var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: color, background-color;
  }

  button[data-iconvariant='square'],
  button[data-iconvariant='square-blue'] {
    padding: 6px 18px 6px 9px;
  }

  button > wui-flex {
    flex: 1;
  }

  button > wui-image {
    width: 32px;
    height: 32px;
    box-shadow: 0 0 0 2px var(--wui-color-gray-glass-005);
    border-radius: var(--wui-border-radius-3xl);
  }

  button > wui-icon {
    width: 36px;
    height: 36px;
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: opacity;
  }

  button > wui-icon-box[data-variant='blue'] {
    box-shadow: 0 0 0 2px var(--wui-color-accent-glass-005);
  }

  button > wui-icon-box[data-variant='overlay'] {
    box-shadow: 0 0 0 2px var(--wui-color-gray-glass-005);
  }

  button > wui-icon-box[data-variant='square-blue'] {
    border-radius: var(--wui-border-radius-3xs);
    position: relative;
    border: none;
    width: 36px;
    height: 36px;
  }

  button > wui-icon-box[data-variant='square-blue']::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: inherit;
    border: 1px solid var(--wui-color-accent-glass-010);
    pointer-events: none;
  }

  button > wui-icon:last-child {
    width: 14px;
    height: 14px;
  }

  button:disabled {
    color: var(--wui-color-gray-glass-020);
  }

  button[data-loading='true'] > wui-icon {
    opacity: 0;
  }

  wui-loading-spinner {
    position: absolute;
    right: 18px;
    top: 50%;
    transform: translateY(-50%);
  }
`;var X=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let F=class extends R{constructor(){super(...arguments),this.tabIdx=void 0,this.variant="icon",this.disabled=!1,this.imageSrc=void 0,this.alt=void 0,this.chevron=!1,this.loading=!1}render(){return c`
      <button
        ?disabled=${this.loading?!0:!!this.disabled}
        data-loading=${this.loading}
        data-iconvariant=${y(this.iconVariant)}
        tabindex=${y(this.tabIdx)}
      >
        ${this.loadingTemplate()} ${this.visualTemplate()}
        <wui-flex gap="3xs">
          <slot></slot>
        </wui-flex>
        ${this.chevronTemplate()}
      </button>
    `}visualTemplate(){if(this.variant==="image"&&this.imageSrc)return c`<wui-image src=${this.imageSrc} alt=${this.alt??"list item"}></wui-image>`;if(this.iconVariant==="square"&&this.icon&&this.variant==="icon")return c`<wui-icon name=${this.icon}></wui-icon>`;if(this.variant==="icon"&&this.icon&&this.iconVariant){const e=["blue","square-blue"].includes(this.iconVariant)?"accent-100":"fg-200",i=this.iconVariant==="square-blue"?"mdl":"md",n=this.iconSize?this.iconSize:i;return c`
        <wui-icon-box
          data-variant=${this.iconVariant}
          icon=${this.icon}
          iconSize=${n}
          background="transparent"
          iconColor=${e}
          backgroundColor=${e}
          size=${i}
        ></wui-icon-box>
      `}return null}loadingTemplate(){return this.loading?c`<wui-loading-spinner
        data-testid="wui-list-item-loading-spinner"
        color="fg-300"
      ></wui-loading-spinner>`:c``}chevronTemplate(){return this.chevron?c`<wui-icon size="inherit" color="fg-200" name="chevronRight"></wui-icon>`:null}};F.styles=[A,M,_o];X([u()],F.prototype,"icon",void 0);X([u()],F.prototype,"iconSize",void 0);X([u()],F.prototype,"tabIdx",void 0);X([u()],F.prototype,"variant",void 0);X([u()],F.prototype,"iconVariant",void 0);X([u({type:Boolean})],F.prototype,"disabled",void 0);X([u()],F.prototype,"imageSrc",void 0);X([u()],F.prototype,"alt",void 0);X([u({type:Boolean})],F.prototype,"chevron",void 0);X([u({type:Boolean})],F.prototype,"loading",void 0);F=X([x("wui-list-item")],F);var So=function(o,e,i,n){var r=arguments.length,t=r<3?e:n===null?n=Object.getOwnPropertyDescriptor(e,i):n,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(o,e,i,n);else for(var s=o.length-1;s>=0;s--)(a=o[s])&&(t=(r<3?a(t):r>3?a(e,i,t):a(e,i))||t);return r>3&&t&&Object.defineProperty(e,i,t),t};let mi=class extends R{constructor(){super(...arguments),this.wallet=O.state.data?.wallet}render(){if(!this.wallet)throw new Error("w3m-downloads-view");return c`
      <wui-flex gap="xs" flexDirection="column" .padding=${["s","s","l","s"]}>
        ${this.chromeTemplate()} ${this.iosTemplate()} ${this.androidTemplate()}
        ${this.homepageTemplate()}
      </wui-flex>
    `}chromeTemplate(){return this.wallet?.chrome_store?c`<wui-list-item
      variant="icon"
      icon="chromeStore"
      iconVariant="square"
      @click=${this.onChromeStore.bind(this)}
      chevron
    >
      <wui-text variant="paragraph-500" color="fg-100">Chrome Extension</wui-text>
    </wui-list-item>`:null}iosTemplate(){return this.wallet?.app_store?c`<wui-list-item
      variant="icon"
      icon="appStore"
      iconVariant="square"
      @click=${this.onAppStore.bind(this)}
      chevron
    >
      <wui-text variant="paragraph-500" color="fg-100">iOS App</wui-text>
    </wui-list-item>`:null}androidTemplate(){return this.wallet?.play_store?c`<wui-list-item
      variant="icon"
      icon="playStore"
      iconVariant="square"
      @click=${this.onPlayStore.bind(this)}
      chevron
    >
      <wui-text variant="paragraph-500" color="fg-100">Android App</wui-text>
    </wui-list-item>`:null}homepageTemplate(){return this.wallet?.homepage?c`
      <wui-list-item
        variant="icon"
        icon="browser"
        iconVariant="square-blue"
        @click=${this.onHomePage.bind(this)}
        chevron
      >
        <wui-text variant="paragraph-500" color="fg-100">Website</wui-text>
      </wui-list-item>
    `:null}onChromeStore(){this.wallet?.chrome_store&&E.openHref(this.wallet.chrome_store,"_blank")}onAppStore(){this.wallet?.app_store&&E.openHref(this.wallet.app_store,"_blank")}onPlayStore(){this.wallet?.play_store&&E.openHref(this.wallet.play_store,"_blank")}onHomePage(){this.wallet?.homepage&&E.openHref(this.wallet.homepage,"_blank")}};mi=So([x("w3m-downloads-view")],mi);export{pt as W3mAllWalletsView,qt as W3mConnectingWcBasicView,mi as W3mDownloadsView};
