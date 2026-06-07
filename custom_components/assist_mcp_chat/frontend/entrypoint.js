var pe=Object.create;var nt=Object.defineProperty;var de=Object.getOwnPropertyDescriptor;var wt=(i,t)=>(t=Symbol[i])?t:Symbol.for("Symbol."+i),D=i=>{throw TypeError(i)};var Pt=(i,t,e)=>t in i?nt(i,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):i[t]=e;var xt=(i,t)=>nt(i,"name",{value:t,configurable:!0});var Y=i=>[,,,pe(i?.[wt("metadata")]??null)],Ct=["class","method","getter","setter","accessor","field","value","get","set"],I=i=>i!==void 0&&typeof i!="function"?D("Function expected"):i,ue=(i,t,e,s,r)=>({kind:Ct[i],name:t,metadata:s,addInitializer:o=>e._?D("Already initialized"):r.push(I(o||null))}),me=(i,t)=>Pt(t,wt("metadata"),i[3]),p=(i,t,e,s)=>{for(var r=0,o=i[t>>1],n=o&&o.length;r<n;r++)t&1?o[r].call(e):s=o[r].call(e,s);return s},y=(i,t,e,s,r,o)=>{var n,h,a,c,u,l=t&7,$=!!(t&8),m=!!(t&16),P=l>3?i.length+1:l?$?1:2:0,At=Ct[l+5],bt=l>3&&(i[P-1]=[]),ce=i[P]||(i[P]=[]),A=l&&(!m&&!$&&(r=r.prototype),l<5&&(l>3||!m)&&de(l<4?r:{get[e](){return Et(this,o)},set[e](v){return St(this,o,v)}},e));l?m&&l<4&&xt(o,(l>2?"set ":l>1?"get ":"")+e):xt(r,e);for(var rt=s.length-1;rt>=0;rt--)c=ue(l,e,a={},i[3],ce),l&&(c.static=$,c.private=m,u=c.access={has:m?v=>_e(r,v):v=>e in v},l^3&&(u.get=m?v=>(l^1?Et:fe)(v,r,l^4?o:A.get):v=>v[e]),l>2&&(u.set=m?(v,ot)=>St(v,r,ot,l^4?o:A.set):(v,ot)=>v[e]=ot)),h=(0,s[rt])(l?l<4?m?o:A[At]:l>4?void 0:{get:A.get,set:A.set}:r,c),a._=1,l^4||h===void 0?I(h)&&(l>4?bt.unshift(h):l?m?o=h:A[At]=h:r=h):typeof h!="object"||h===null?D("Object expected"):(I(n=h.get)&&(A.get=n),I(n=h.set)&&(A.set=n),I(n=h.init)&&bt.unshift(n));return l||me(i,r),A&&nt(r,e,A),m?l^4?o:A:r},g=(i,t,e)=>Pt(i,typeof t!="symbol"?t+"":t,e),at=(i,t,e)=>t.has(i)||D("Cannot "+e),_e=(i,t)=>Object(t)!==t?D('Cannot use the "in" operator on this value'):i.has(t),Et=(i,t,e)=>(at(i,t,"read from private field"),e?e.call(i):t.get(i));var St=(i,t,e,s)=>(at(i,t,"write to private field"),s?s.call(i,e):t.set(i,e),e),fe=(i,t,e)=>(at(i,t,"access private method"),e);var Z=globalThis,Q=Z.ShadowRoot&&(Z.ShadyCSS===void 0||Z.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,lt=Symbol(),Tt=new WeakMap,j=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==lt)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(Q&&t===void 0){let s=e!==void 0&&e.length===1;s&&(t=Tt.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&Tt.set(e,t))}return t}toString(){return this.cssText}},Ut=i=>new j(typeof i=="string"?i:i+"",void 0,lt),z=(i,...t)=>{let e=i.length===1?i[0]:t.reduce((s,r,o)=>s+(n=>{if(n._$cssResult$===!0)return n.cssText;if(typeof n=="number")return n;throw Error("Value passed to 'css' function must be a 'css' function result: "+n+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+i[o+1],i[0]);return new j(e,i,lt)},Rt=(i,t)=>{if(Q)i.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let s=document.createElement("style"),r=Z.litNonce;r!==void 0&&s.setAttribute("nonce",r),s.textContent=e.cssText,i.appendChild(s)}},ht=Q?i=>i:i=>i instanceof CSSStyleSheet?(t=>{let e="";for(let s of t.cssRules)e+=s.cssText;return Ut(e)})(i):i;var{is:ge,defineProperty:$e,getOwnPropertyDescriptor:ve,getOwnPropertyNames:ye,getOwnPropertySymbols:Ae,getPrototypeOf:be}=Object,X=globalThis,Mt=X.trustedTypes,xe=Mt?Mt.emptyScript:"",Ee=X.reactiveElementPolyfillSupport,q=(i,t)=>i,B={toAttribute(i,t){switch(t){case Boolean:i=i?xe:null;break;case Object:case Array:i=i==null?i:JSON.stringify(i)}return i},fromAttribute(i,t){let e=i;switch(t){case Boolean:e=i!==null;break;case Number:e=i===null?null:Number(i);break;case Object:case Array:try{e=JSON.parse(i)}catch{e=null}}return e}},tt=(i,t)=>!ge(i,t),Ot={attribute:!0,type:String,converter:B,reflect:!1,useDefault:!1,hasChanged:tt};Symbol.metadata??=Symbol("metadata"),X.litPropertyMetadata??=new WeakMap;var S=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=Ot){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){let s=Symbol(),r=this.getPropertyDescriptor(t,s,e);r!==void 0&&$e(this.prototype,t,r)}}static getPropertyDescriptor(t,e,s){let{get:r,set:o}=ve(this.prototype,t)??{get(){return this[e]},set(n){this[e]=n}};return{get:r,set(n){let h=r?.call(this);o?.call(this,n),this.requestUpdate(t,h,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??Ot}static _$Ei(){if(this.hasOwnProperty(q("elementProperties")))return;let t=be(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(q("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(q("properties"))){let e=this.properties,s=[...ye(e),...Ae(e)];for(let r of s)this.createProperty(r,e[r])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[s,r]of e)this.elementProperties.set(s,r)}this._$Eh=new Map;for(let[e,s]of this.elementProperties){let r=this._$Eu(e,s);r!==void 0&&this._$Eh.set(r,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let s=new Set(t.flat(1/0).reverse());for(let r of s)e.unshift(ht(r))}else t!==void 0&&e.push(ht(t));return e}static _$Eu(t,e){let s=e.attribute;return s===!1?void 0:typeof s=="string"?s:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,e=this.constructor.elementProperties;for(let s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Rt(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){let s=this.constructor.elementProperties.get(t),r=this.constructor._$Eu(t,s);if(r!==void 0&&s.reflect===!0){let o=(s.converter?.toAttribute!==void 0?s.converter:B).toAttribute(e,s.type);this._$Em=t,o==null?this.removeAttribute(r):this.setAttribute(r,o),this._$Em=null}}_$AK(t,e){let s=this.constructor,r=s._$Eh.get(t);if(r!==void 0&&this._$Em!==r){let o=s.getPropertyOptions(r),n=typeof o.converter=="function"?{fromAttribute:o.converter}:o.converter?.fromAttribute!==void 0?o.converter:B;this._$Em=r;let h=n.fromAttribute(e,o.type);this[r]=h??this._$Ej?.get(r)??h,this._$Em=null}}requestUpdate(t,e,s,r=!1,o){if(t!==void 0){let n=this.constructor;if(r===!1&&(o=this[t]),s??=n.getPropertyOptions(t),!((s.hasChanged??tt)(o,e)||s.useDefault&&s.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(n._$Eu(t,s))))return;this.C(t,e,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:r,wrapped:o},n){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,n??e??this[t]),o!==!0||n!==void 0)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),r===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[r,o]of this._$Ep)this[r]=o;this._$Ep=void 0}let s=this.constructor.elementProperties;if(s.size>0)for(let[r,o]of s){let{wrapped:n}=o,h=this[r];n!==!0||this._$AL.has(r)||h===void 0||this.C(r,void 0,o,h)}}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(e)):this._$EM()}catch(s){throw t=!1,this._$EM(),s}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(t){}firstUpdated(t){}};S.elementStyles=[],S.shadowRootOptions={mode:"open"},S[q("elementProperties")]=new Map,S[q("finalized")]=new Map,Ee?.({ReactiveElement:S}),(X.reactiveElementVersions??=[]).push("2.1.2");var ft=globalThis,Lt=i=>i,et=ft.trustedTypes,Ht=et?et.createPolicy("lit-html",{createHTML:i=>i}):void 0,zt="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,qt="?"+C,Se=`<${qt}>`,M=document,W=()=>M.createComment(""),K=i=>i===null||typeof i!="object"&&typeof i!="function",gt=Array.isArray,we=i=>gt(i)||typeof i?.[Symbol.iterator]=="function",ct=`[ 	
\f\r]`,V=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,kt=/-->/g,Nt=/>/g,U=RegExp(`>|${ct}(?:([^\\s"'>=/]+)(${ct}*=${ct}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),It=/'/g,Dt=/"/g,Bt=/^(?:script|style|textarea|title)$/i,$t=i=>(t,...e)=>({_$litType$:i,strings:t,values:e}),T=$t(1),ze=$t(2),qe=$t(3),w=Symbol.for("lit-noChange"),d=Symbol.for("lit-nothing"),jt=new WeakMap,R=M.createTreeWalker(M,129);function Vt(i,t){if(!gt(i)||!i.hasOwnProperty("raw"))throw Error("invalid template strings array");return Ht!==void 0?Ht.createHTML(t):t}var Pe=(i,t)=>{let e=i.length-1,s=[],r,o=t===2?"<svg>":t===3?"<math>":"",n=V;for(let h=0;h<e;h++){let a=i[h],c,u,l=-1,$=0;for(;$<a.length&&(n.lastIndex=$,u=n.exec(a),u!==null);)$=n.lastIndex,n===V?u[1]==="!--"?n=kt:u[1]!==void 0?n=Nt:u[2]!==void 0?(Bt.test(u[2])&&(r=RegExp("</"+u[2],"g")),n=U):u[3]!==void 0&&(n=U):n===U?u[0]===">"?(n=r??V,l=-1):u[1]===void 0?l=-2:(l=n.lastIndex-u[2].length,c=u[1],n=u[3]===void 0?U:u[3]==='"'?Dt:It):n===Dt||n===It?n=U:n===kt||n===Nt?n=V:(n=U,r=void 0);let m=n===U&&i[h+1].startsWith("/>")?" ":"";o+=n===V?a+Se:l>=0?(s.push(c),a.slice(0,l)+zt+a.slice(l)+C+m):a+C+(l===-2?h:m)}return[Vt(i,o+(i[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),s]},G=class i{constructor({strings:t,_$litType$:e},s){let r;this.parts=[];let o=0,n=0,h=t.length-1,a=this.parts,[c,u]=Pe(t,e);if(this.el=i.createElement(c,s),R.currentNode=this.el.content,e===2||e===3){let l=this.el.content.firstChild;l.replaceWith(...l.childNodes)}for(;(r=R.nextNode())!==null&&a.length<h;){if(r.nodeType===1){if(r.hasAttributes())for(let l of r.getAttributeNames())if(l.endsWith(zt)){let $=u[n++],m=r.getAttribute(l).split(C),P=/([.?@])?(.*)/.exec($);a.push({type:1,index:o,name:P[2],strings:m,ctor:P[1]==="."?dt:P[1]==="?"?ut:P[1]==="@"?mt:N}),r.removeAttribute(l)}else l.startsWith(C)&&(a.push({type:6,index:o}),r.removeAttribute(l));if(Bt.test(r.tagName)){let l=r.textContent.split(C),$=l.length-1;if($>0){r.textContent=et?et.emptyScript:"";for(let m=0;m<$;m++)r.append(l[m],W()),R.nextNode(),a.push({type:2,index:++o});r.append(l[$],W())}}}else if(r.nodeType===8)if(r.data===qt)a.push({type:2,index:o});else{let l=-1;for(;(l=r.data.indexOf(C,l+1))!==-1;)a.push({type:7,index:o}),l+=C.length-1}o++}}static createElement(t,e){let s=M.createElement("template");return s.innerHTML=t,s}};function k(i,t,e=i,s){if(t===w)return t;let r=s!==void 0?e._$Co?.[s]:e._$Cl,o=K(t)?void 0:t._$litDirective$;return r?.constructor!==o&&(r?._$AO?.(!1),o===void 0?r=void 0:(r=new o(i),r._$AT(i,e,s)),s!==void 0?(e._$Co??=[])[s]=r:e._$Cl=r),r!==void 0&&(t=k(i,r._$AS(i,t.values),r,s)),t}var pt=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:e},parts:s}=this._$AD,r=(t?.creationScope??M).importNode(e,!0);R.currentNode=r;let o=R.nextNode(),n=0,h=0,a=s[0];for(;a!==void 0;){if(n===a.index){let c;a.type===2?c=new F(o,o.nextSibling,this,t):a.type===1?c=new a.ctor(o,a.name,a.strings,this,t):a.type===6&&(c=new _t(o,this,t)),this._$AV.push(c),a=s[++h]}n!==a?.index&&(o=R.nextNode(),n++)}return R.currentNode=M,r}p(t){let e=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}},F=class i{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,r){this.type=2,this._$AH=d,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=k(this,t,e),K(t)?t===d||t==null||t===""?(this._$AH!==d&&this._$AR(),this._$AH=d):t!==this._$AH&&t!==w&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):we(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==d&&K(this._$AH)?this._$AA.nextSibling.data=t:this.T(M.createTextNode(t)),this._$AH=t}$(t){let{values:e,_$litType$:s}=t,r=typeof s=="number"?this._$AC(t):(s.el===void 0&&(s.el=G.createElement(Vt(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===r)this._$AH.p(e);else{let o=new pt(r,this),n=o.u(this.options);o.p(e),this.T(n),this._$AH=o}}_$AC(t){let e=jt.get(t.strings);return e===void 0&&jt.set(t.strings,e=new G(t)),e}k(t){gt(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,s,r=0;for(let o of t)r===e.length?e.push(s=new i(this.O(W()),this.O(W()),this,this.options)):s=e[r],s._$AI(o),r++;r<e.length&&(this._$AR(s&&s._$AB.nextSibling,r),e.length=r)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){let s=Lt(t).nextSibling;Lt(t).remove(),t=s}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},N=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,r,o){this.type=1,this._$AH=d,this._$AN=void 0,this.element=t,this.name=e,this._$AM=r,this.options=o,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=d}_$AI(t,e=this,s,r){let o=this.strings,n=!1;if(o===void 0)t=k(this,t,e,0),n=!K(t)||t!==this._$AH&&t!==w,n&&(this._$AH=t);else{let h=t,a,c;for(t=o[0],a=0;a<o.length-1;a++)c=k(this,h[s+a],e,a),c===w&&(c=this._$AH[a]),n||=!K(c)||c!==this._$AH[a],c===d?t=d:t!==d&&(t+=(c??"")+o[a+1]),this._$AH[a]=c}n&&!r&&this.j(t)}j(t){t===d?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},dt=class extends N{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===d?void 0:t}},ut=class extends N{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==d)}},mt=class extends N{constructor(t,e,s,r,o){super(t,e,s,r,o),this.type=5}_$AI(t,e=this){if((t=k(this,t,e,0)??d)===w)return;let s=this._$AH,r=t===d&&s!==d||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,o=t!==d&&(s===d||r);r&&this.element.removeEventListener(this.name,this,s),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},_t=class{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){k(this,t)}};var Ce=ft.litHtmlPolyfillSupport;Ce?.(G,F),(ft.litHtmlVersions??=[]).push("3.3.3");var Wt=(i,t,e)=>{let s=e?.renderBefore??t,r=s._$litPart$;if(r===void 0){let o=e?.renderBefore??null;s._$litPart$=r=new F(t.insertBefore(W(),o),o,void 0,e??{})}return r._$AI(i),r};var vt=globalThis,x=class extends S{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=Wt(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return w}};x._$litElement$=!0,x.finalized=!0,vt.litElementHydrateSupport?.({LitElement:x});var Te=vt.litElementPolyfillSupport;Te?.({LitElement:x});(vt.litElementVersions??=[]).push("4.2.2");var st=i=>(t,e)=>{e!==void 0?e.addInitializer(()=>{customElements.define(i,t)}):customElements.define(i,t)};var Ue={attribute:!0,type:String,converter:B,reflect:!1,hasChanged:tt},Re=(i=Ue,t,e)=>{let{kind:s,metadata:r}=e,o=globalThis.litPropertyMetadata.get(r);if(o===void 0&&globalThis.litPropertyMetadata.set(r,o=new Map),s==="setter"&&((i=Object.create(i)).wrapped=!0),o.set(e.name,i),s==="accessor"){let{name:n}=e;return{set(h){let a=t.get.call(this);t.set.call(this,h),this.requestUpdate(n,a,i,!0,h)},init(h){return h!==void 0&&this.C(n,void 0,i,h),h}}}if(s==="setter"){let{name:n}=e;return function(h){let a=this[n];t.call(this,h),this.requestUpdate(n,a,i,!0,h)}}throw Error("Unsupported decorator location: "+s)};function O(i){return(t,e)=>typeof e=="object"?Re(i,t,e):((s,r,o)=>{let n=r.hasOwnProperty(o);return r.constructor.createProperty(o,s),n?Object.getOwnPropertyDescriptor(r,o):void 0})(i,t,e)}function L(i){return O({...i,state:!0,attribute:!1})}var H=(i,t,e)=>(e.configurable=!0,e.enumerable=!0,Reflect.decorate&&typeof t!="object"&&Object.defineProperty(i,t,e),e);function Kt(i,t){return(e,s,r)=>{let o=n=>n.renderRoot?.querySelector(i)??null;if(t){let{get:n,set:h}=typeof s=="object"?e:r??(()=>{let a=Symbol();return{get(){return this[a]},set(c){this[a]=c}}})();return H(e,s,{get(){let a=n.call(this);return a===void 0&&(a=o(this),(a!==null||this.hasUpdated)&&h.call(this,a)),a}})}return H(e,s,{get(){return o(this)}})}}var Gt={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},Ft=i=>(...t)=>({_$litDirective$:i,values:t}),it=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,s){this._$Ct=t,this._$AM=e,this._$Ci=s}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}};var Jt=Ft(class extends it{constructor(i){if(super(i),i.type!==Gt.ATTRIBUTE||i.name!=="class"||i.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(i){return" "+Object.keys(i).filter(t=>i[t]).join(" ")+" "}update(i,[t]){if(this.st===void 0){this.st=new Set,i.strings!==void 0&&(this.nt=new Set(i.strings.join(" ").split(/\s/).filter(s=>s!=="")));for(let s in t)t[s]&&!this.nt?.has(s)&&this.st.add(s);return this.render(t)}let e=i.element.classList;for(let s of this.st)s in t||(e.remove(s),this.st.delete(s));for(let s in t){let r=!!t[s];r===this.st.has(s)||this.nt?.has(s)||(r?(e.add(s),this.st.add(s)):(e.remove(s),this.st.delete(s)))}return w}});var yt="\u2026",Yt,Zt,Qt,Xt,te,ee,se,_;se=[st("assist-mcp-chat")];var b=class extends(ee=x,te=[O({attribute:!1})],Xt=[O({attribute:!1})],Qt=[Kt("#scroll-container")],Zt=[L()],Yt=[L()],ee){constructor(){super(...arguments);g(this,"hass",p(_,8,this)),p(_,11,this);g(this,"pipelineId",p(_,12,this)),p(_,15,this);g(this,"_scrollContainer",p(_,16,this)),p(_,19,this);g(this,"_conversation",p(_,20,this,[])),p(_,23,this);g(this,"_processing",p(_,24,this,!1)),p(_,27,this);g(this,"_conversationId",null)}willUpdate(e){(!this.hasUpdated||e.has("pipelineId"))&&(this._conversation=[{who:"hass",text:this.hass.localize("ui.dialogs.voice_command.how_can_i_help")}],this._conversationId=null)}updated(e){e.has("_conversation")&&this._scrollContainer?.scrollTo(0,this._scrollContainer.scrollHeight)}render(){return T`
      <div class="messages" id="scroll-container">
        <div class="spacer"></div>
        ${this._conversation.map(e=>T`
            <div
              class="message ${Jt({error:!!e.error,[e.who]:!0})}"
            >
              ${e.who==="hass"&&!e.error?T`<ha-markdown .content=${e.text}></ha-markdown>`:e.text}
            </div>
          `)}
      </div>
      <div class="input">
        <input
          id="message-input"
          type="text"
          autocomplete="off"
          .placeholder=${this.hass.localize("ui.dialogs.voice_command.input_label")}
          ?disabled=${this._processing}
          @keydown=${this._handleKeyDown}
        />
      </div>
    `}_handleKeyDown(e){let s=e.target;if(e.key==="Enter"&&s.value&&!this._processing){let r=s.value.trim();s.value="",this._processText(r)}}_addMessage(e){this._conversation=[...this._conversation,e]}async _processText(e){this._processing=!0,this._addMessage({who:"user",text:e});let s={who:"hass",text:yt};this._addMessage(s);let r="",o=()=>this.requestUpdate("_conversation"),n=h=>{s.text=h,s.error=!0,o()};try{let h=await this.hass.connection.subscribeMessage(a=>{if(a.type==="intent-progress"&&a.data.chat_log_delta){let c=a.data.chat_log_delta;c.role&&(r=c.role),r==="assistant"&&c.content&&(s.text=(s.text===yt?"":s.text)+c.content,o())}else if(a.type==="intent-end"){this._conversationId=a.data.intent_output.conversation_id;let c=a.data.intent_output.response.speech?.plain?.speech;a.data.intent_output.response.response_type==="error"&&c?n(c):c&&s.text===yt&&(s.text=c,o()),h()}else a.type==="error"&&(n(a.data.message),h())},{type:"assist_pipeline/run",start_stage:"intent",end_stage:"intent",input:{text:e},pipeline:this.pipelineId,conversation_id:this._conversationId})}catch(h){n(this.hass.localize("ui.dialogs.voice_command.error")||String(h)||"Error")}finally{this._processing=!1}}};_=Y(ee),y(_,5,"hass",te,b),y(_,5,"pipelineId",Xt,b),y(_,5,"_scrollContainer",Qt,b),y(_,5,"_conversation",Zt,b),y(_,5,"_processing",Yt,b),b=y(_,0,"AssistMcpChat",se,b),g(b,"styles",z`
    :host {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .messages {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      padding: 0 12px 16px;
    }
    .spacer {
      flex: 1;
    }
    .message {
      font-size: var(--ha-font-size-l, 1rem);
      margin: 8px 0;
      padding: 8px 12px;
      border-radius: var(--ha-border-radius-xl, 18px);
      max-width: 85%;
      white-space: pre-line;
      overflow-wrap: anywhere;
    }
    .message.user {
      align-self: flex-end;
      text-align: right;
      border-bottom-right-radius: 0;
      background-color: var(--chat-background-color-user, var(--primary-color));
      color: var(--text-primary-color);
    }
    .message.hass {
      align-self: flex-start;
      border-bottom-left-radius: 0;
      background-color: var(
        --chat-background-color-hass,
        var(--secondary-background-color)
      );
      color: var(--primary-text-color);
      white-space: normal;
    }
    .message.error {
      background-color: var(--error-color);
      color: var(--text-primary-color);
    }
    .message ha-markdown {
      display: block;
    }
    .input {
      padding: 8px 12px;
      border-top: 1px solid var(--divider-color);
    }
    input {
      width: 100%;
      box-sizing: border-box;
      padding: 12px;
      border-radius: var(--ha-border-radius-xl, 18px);
      border: 1px solid var(--divider-color);
      background-color: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: var(--ha-font-size-l, 1rem);
    }
    input:focus {
      outline: none;
      border-color: var(--primary-color);
    }
  `),p(_,1,b);var ie="assist-mcp-chat-pipeline",re,oe,ne,ae,le,he,f;he=[st("assist-mcp-chat-drawer")];var E=class extends(le=x,ae=[O({attribute:!1})],ne=[L()],oe=[L()],re=[L()],le){constructor(){super(...arguments);g(this,"hass",p(f,8,this)),p(f,11,this);g(this,"_open",p(f,12,this,!1)),p(f,15,this);g(this,"_pipelines",p(f,16,this,[])),p(f,19,this);g(this,"_pipelineId",p(f,20,this)),p(f,23,this)}async openDialog(e){this._open=!0,await this._loadPipelines(e?.pipeline_id)}closeDialog(){this._open=!1}async _loadPipelines(e){try{let s=await this.hass.callWS({type:"assist_pipeline/pipeline/list"});this._pipelines=s.pipelines;let r=window.localStorage.getItem(ie)??void 0;this._pipelineId=e&&e!=="last_used"?e:r??s.preferred_pipeline??s.pipelines[0]?.id}catch{this._pipelines=[]}}_pipelineChanged(e){this._pipelineId=e.target.value,window.localStorage.setItem(ie,this._pipelineId)}render(){return this._open?T`
      <ha-drawer
        type="modal"
        open
        direction="rtl"
        @MDCDrawer:closed=${this.closeDialog}
      >
        <div class="content" dir="ltr">
          <ha-header-bar>
            <ha-icon-button
              slot="navigationIcon"
              .path=${"M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"}
              .label=${this.hass.localize("ui.common.close")}
              @click=${this.closeDialog}
            ></ha-icon-button>
            <div slot="title">
              ${this.hass.localize("ui.dialogs.voice_command.title")||"Assist"}
            </div>
            ${this._pipelines.length>1?T`
                  <select
                    slot="actionItems"
                    class="pipeline-picker"
                    @change=${this._pipelineChanged}
                  >
                    ${this._pipelines.map(e=>T`
                        <option
                          value=${e.id}
                          ?selected=${e.id===this._pipelineId}
                        >
                          ${e.name}
                        </option>
                      `)}
                  </select>
                `:d}
          </ha-header-bar>
          <assist-mcp-chat
            .hass=${this.hass}
            .pipelineId=${this._pipelineId}
          ></assist-mcp-chat>
        </div>
      </ha-drawer>
    `:d}};f=Y(le),y(f,5,"hass",ae,E),y(f,5,"_open",ne,E),y(f,5,"_pipelines",oe,E),y(f,5,"_pipelineId",re,E),E=y(f,0,"AssistMcpChatDrawer",he,E),g(E,"styles",z`
    :host {
      --mdc-drawer-width: min(100vw, 500px);
    }
    .content {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    ha-header-bar {
      --mdc-theme-on-primary: var(--primary-text-color);
      --mdc-theme-primary: var(--primary-background-color);
      border-bottom: 1px solid var(--divider-color);
      flex: 0 0 auto;
    }
    assist-mcp-chat {
      flex: 1;
      min-height: 0;
    }
    .pipeline-picker {
      max-width: 180px;
      margin: 0 8px;
      background-color: var(--card-background-color);
      color: var(--primary-text-color);
      border: 1px solid var(--divider-color);
      border-radius: var(--ha-border-radius-md, 8px);
      padding: 6px;
    }
  `),p(f,1,E);var Me="ha-voice-command-dialog",Oe="assist-mcp-chat-drawer",J,Le=()=>document.querySelector("home-assistant"),He=i=>{let t=Le(),e=t?.hass;if(!t||!e)return;let s=t.shadowRoot??document.body;J||(J=document.createElement(Oe),s.appendChild(J)),J.hass=e,J.openDialog(i)};window.addEventListener("show-dialog",i=>{let t=i.detail;!t||t.dialogTag!==Me||(i.stopImmediatePropagation(),i.preventDefault(),He(t.dialogParams))},!0);
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/lit-html.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-element/lit-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/is-server.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/custom-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/property.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/state.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/event-options.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/base.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-all.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-async.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-assigned-elements.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-assigned-nodes.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directive.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directives/class-map.js:
  (**
   * @license
   * Copyright 2018 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
//# sourceMappingURL=entrypoint.js.map
