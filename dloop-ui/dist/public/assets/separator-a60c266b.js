import{e as d,r as s,j as l,$ as u,o as f}from"./index-971aa118.js";/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=d("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const E=d("CircleX",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]]);var y=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","select","span","svg","ul"],N=y.reduce((a,r)=>{const o=u(`Primitive.${r}`),t=s.forwardRef((i,e)=>{const{asChild:c,...n}=i,h=c?o:r;return typeof window<"u"&&(window[Symbol.for("radix-ui")]=!0),l.jsx(h,{...n,ref:e})});return t.displayName=`Primitive.${r}`,{...a,[r]:t}},{}),x="Separator",p="horizontal",w=["horizontal","vertical"],m=s.forwardRef((a,r)=>{const{decorative:o,orientation:t=p,...i}=a,e=R(t)?t:p,n=o?{role:"none"}:{"aria-orientation":e==="vertical"?e:void 0,role:"separator"};return l.jsx(N.div,{"data-orientation":e,...n,...i,ref:r})});m.displayName=x;function R(a){return w.includes(a)}var v=m;const S=s.forwardRef(({className:a,orientation:r="horizontal",decorative:o=!0,...t},i)=>l.jsx(v,{ref:i,decorative:o,orientation:r,className:f("shrink-0 bg-border",r==="horizontal"?"h-[1px] w-full":"h-full w-[1px]",a),...t}));S.displayName=v.displayName;export{E as C,S,C as a};
