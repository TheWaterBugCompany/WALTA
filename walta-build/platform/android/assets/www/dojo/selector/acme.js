//>>built
define("dojo/selector/acme",["../dom","../sniff","../_base/array","../_base/lang","../_base/window"],function(H,ia,I,W,t){var J=W.trim,D=I.forEach,K="BackCompat"==t.doc.compatMode,z=!1,u=function(){return!0},E=function(b){for(var b=0<=">~+".indexOf(b.slice(-1))?b+" * ":b+" ",a=function(a,c){return J(b.slice(a,c))},c=[],d=-1,f=-1,e=-1,j=-1,o=-1,l=-1,p=-1,A,v="",i="",m,h=0,q=b.length,g=null,k=null,n=function(){if(0<=l)g.id=a(l,h).replace(/\\/g,""),l=-1;if(0<=p){var b=p==h?null:a(p,h);g[0>">~+".indexOf(b)?
"tag":"oper"]=b;p=-1}0<=o&&(g.classes.push(a(o+1,h).replace(/\\/g,"")),o=-1)};v=i,i=b.charAt(h),h<q;h++)if("\\"!=v)if(g||(m=h,g={query:null,pseudos:[],attrs:[],classes:[],tag:null,oper:null,id:null,getTag:function(){return z?this.otag:this.tag}},p=h),A)i==A&&(A=null);else if("'"==i||'"'==i)A=i;else if(0<=d)if("]"==i){k.attr?k.matchFor=a(e||d+1,h):k.attr=a(d+1,h);if((d=k.matchFor)&&('"'==d.charAt(0)||"'"==d.charAt(0)))k.matchFor=d.slice(1,-1);if(k.matchFor)k.matchFor=k.matchFor.replace(/\\/g,"");g.attrs.push(k);
k=null;d=e=-1}else{if("="==i)e=0<="|~^$*".indexOf(v)?v:"",k.type=e+i,k.attr=a(d+1,h-e.length),e=h+1}else if(0<=f){if(")"==i){if(0<=j)k.value=a(f+1,h);j=f=-1}}else if("#"==i)n(),l=h+1;else if("."==i)n(),o=h;else if(":"==i)n(),j=h;else if("["==i)n(),d=h,k={};else if("("==i)0<=j&&(k={name:a(j+1,h),value:null},g.pseudos.push(k)),f=h;else if(" "==i&&v!=i){n();0<=j&&g.pseudos.push({name:a(j+1,h)});g.loops=g.pseudos.length||g.attrs.length||g.classes.length;g.oquery=g.query=a(m,h);g.otag=g.tag=g.oper?null:
g.tag||"*";if(g.tag)g.tag=g.tag.toUpperCase();if(c.length&&c[c.length-1].oper)g.infixOper=c.pop(),g.query=g.infixOper.query+" "+g.query;c.push(g);g=null}return c},q=function(b,a){return!b?a:!a?b:function(){return b.apply(window,arguments)&&a.apply(window,arguments)}},n=function(b,a){var c=a||[];b&&c.push(b);return c},F=function(b){return 1==b.nodeType},r=function(b,a){return!b?"":"class"==a?b.className||"":"for"==a?b.htmlFor||"":"style"==a?b.style.cssText||"":(z?b.getAttribute(a):b.getAttribute(a,
2))||""},L={"*=":function(b,a){return function(c){return 0<=r(c,b).indexOf(a)}},"^=":function(b,a){return function(c){return 0==r(c,b).indexOf(a)}},"$=":function(b,a){return function(c){var c=" "+r(c,b),d=c.lastIndexOf(a);return-1<d&&d==c.length-a.length}},"~=":function(b,a){var c=" "+a+" ";return function(a){return 0<=(" "+r(a,b)+" ").indexOf(c)}},"|=":function(b,a){var c=a+"-";return function(d){d=r(d,b);return d==a||0==d.indexOf(c)}},"=":function(b,a){return function(c){return r(c,b)==a}}},B="undefined"==
typeof t.doc.firstChild.nextElementSibling,w=!B?"nextElementSibling":"nextSibling",X=!B?"previousElementSibling":"previousSibling",x=B?F:u,M=function(b){for(;b=b[X];)if(x(b))return!1;return!0},N=function(b){for(;b=b[w];)if(x(b))return!1;return!0},C=function(b){var a=b.parentNode,a=7!=a.nodeType?a:a.nextSibling,c=0,d=a.children||a.childNodes,f=b._i||b.getAttribute("_i")||-1,e=a._l||("undefined"!==typeof a.getAttribute?a.getAttribute("_l"):-1);if(!d)return-1;d=d.length;if(e==d&&0<=f&&0<=e)return f;
a._l=d;f=-1;for(a=a.firstElementChild||a.firstChild;a;a=a[w])if(x(a))a._i=++c,b===a&&(f=c);return f},Y=function(b){return!(C(b)%2)},Z=function(b){return C(b)%2},O={checked:function(){return function(b){return!!("checked"in b?b.checked:b.selected)}},disabled:function(){return function(b){return b.disabled}},enabled:function(){return function(b){return!b.disabled}},"first-child":function(){return M},"last-child":function(){return N},"only-child":function(){return function(b){return M(b)&&N(b)}},empty:function(){return function(b){for(var a=
b.childNodes,b=b.childNodes.length-1;0<=b;b--){var c=a[b].nodeType;if(1===c||3==c)return!1}return!0}},contains:function(b,a){var c=a.charAt(0);if('"'==c||"'"==c)a=a.slice(1,-1);return function(b){return 0<=b.innerHTML.indexOf(a)}},not:function(b,a){var c=E(a)[0],d={el:1};if("*"!=c.tag)d.tag=1;if(!c.classes.length)d.classes=1;var f=m(c,d);return function(b){return!f(b)}},"nth-child":function(b,a){var c=parseInt;if("odd"==a)return Z;if("even"==a)return Y;if(-1!=a.indexOf("n")){var d=a.split("n",2),
f=d[0]?"-"==d[0]?-1:c(d[0]):1,e=d[1]?c(d[1]):0,j=0,o=-1;0<f?0>e?e=e%f&&f+e%f:0<e&&(e>=f&&(j=e-e%f),e%=f):0>f&&(f*=-1,0<e&&(o=e,e%=f));if(0<f)return function(b){b=C(b);return b>=j&&(0>o||b<=o)&&b%f==e};a=e}var l=c(a);return function(b){return C(b)==l}}},$=function(b){return function(a){return a&&a.getAttribute&&a.hasAttribute(b)}},m=function(b,a){if(!b)return u;var a=a||{},c=null;"el"in a||(c=q(c,F));"tag"in a||"*"!=b.tag&&(c=q(c,function(a){return a&&(z?a.tagName:a.tagName.toUpperCase())==b.getTag()}));
"classes"in a||D(b.classes,function(b,a){var e=RegExp("(?:^|\\s)"+b+"(?:\\s|$)");c=q(c,function(b){return e.test(b.className)});c.count=a});"pseudos"in a||D(b.pseudos,function(b){var a=b.name;O[a]&&(c=q(c,O[a](a,b.value)))});"attrs"in a||D(b.attrs,function(b){var a,e=b.attr;b.type&&L[b.type]?a=L[b.type](e,b.matchFor):e.length&&(a=$(e));a&&(c=q(c,a))});"id"in a||b.id&&(c=q(c,function(a){return!!a&&a.id==b.id}));c||"default"in a||(c=u);return c},aa=function(b){return function(a,c,d){for(;a=a[w];)if(!B||
F(a)){(!d||s(a,d))&&b(a)&&c.push(a);break}return c}},ba=function(b){return function(a,c,d){for(a=a[w];a;){if(x(a)){if(d&&!s(a,d))break;b(a)&&c.push(a)}a=a[w]}return c}},ca=function(b){b=b||u;return function(a,c,d){for(var f=0,e=a.children||a.childNodes;a=e[f++];)x(a)&&(!d||s(a,d))&&b(a,f)&&c.push(a);return c}},P={},Q=function(b){var a=P[b.query];if(a)return a;var c=b.infixOper,c=c?c.oper:"",d=m(b,{el:1}),f="*"==b.tag,e=t.doc.getElementsByClassName;if(c){e={el:1};if(f)e.tag=1;d=m(b,e);"+"==c?a=aa(d):
"~"==c?a=ba(d):">"==c&&(a=ca(d))}else if(b.id)d=!b.loops&&f?u:m(b,{el:1,id:1}),a=function(a,c){var e=H.byId(b.id,a.ownerDocument||a);if(e&&d(e)){if(9==a.nodeType)return n(e,c);for(var f=e.parentNode;f&&!(f==a);)f=f.parentNode;if(f)return n(e,c)}};else if(e&&/\{\s*\[native code\]\s*\}/.test(""+e)&&b.classes.length&&!K)var d=m(b,{el:1,classes:1,id:1}),j=b.classes.join(" "),a=function(b,a,c){for(var a=n(0,a),e,f=0,i=b.getElementsByClassName(j);e=i[f++];)d(e,b)&&s(e,c)&&a.push(e);return a};else!f&&!b.loops?
a=function(a,c,d){for(var c=n(0,c),e=0,f=b.getTag(),f=f?a.getElementsByTagName(f):[];a=f[e++];)s(a,d)&&c.push(a);return c}:(d=m(b,{el:1,tag:1,id:1}),a=function(a,c,e){for(var c=n(0,c),f,j=0,i=(f=b.getTag())?a.getElementsByTagName(f):[];f=i[j++];)d(f,a)&&s(f,e)&&c.push(f);return c});return P[b.query]=a},R={},S={},T=function(b){var a=E(J(b));if(1==a.length){var c=Q(a[0]);return function(a){if(a=c(a,[]))a.nozip=!0;return a}}return function(b){for(var b=n(b),c,e,j=a.length,o,l,p=0;p<j;p++){l=[];c=a[p];
e=b.length-1;if(0<e)o={},l.nozip=!0;e=Q(c);for(var m=0;c=b[m];m++)e(c,l,o);if(!l.length)break;b=l}return l}},U=!!t.doc.querySelectorAll,da=/\\[>~+]|n\+\d|([^ \\])?([>~+])([^ =])?/g,ea=function(b,a,c,d){return c?(a?a+" ":"")+c+(d?" "+d:""):b},fa=/([^[]*)([^\]]*])?/g,ga=function(b,a,c){return a.replace(da,ea)+(c||"")},V=function(b,a){b=b.replace(fa,ga);if(U){var c=S[b];if(c&&!a)return c}if(c=R[b])return c;var c=b.charAt(0),d=-1==b.indexOf(" ");0<=b.indexOf("#")&&d&&(a=!0);if(U&&!a&&-1==">~+".indexOf(c)&&
!(K&&0<=b.indexOf("."))&&-1==b.indexOf(":contains")&&-1==b.indexOf(":checked")&&-1==b.indexOf("|=")){var f=0<=">~+".indexOf(b.charAt(b.length-1))?b+" *":b;return S[b]=function(a){try{if(!(9==a.nodeType||d))throw"";var c=a.querySelectorAll(f);c.nozip=!0;return c}catch(e){return V(b,!0)(a)}}}var e=b.match(/([^\s,](?:"(?:\\.|[^"])+"|'(?:\\.|[^'])+'|[^,])*)/g);return R[b]=2>e.length?T(b):function(a){for(var b=0,c=[],d;d=e[b++];)c=c.concat(T(d)(a));return c}},y=0,s=function(b,a){if(!a)return 1;var c=b._uid||
(b._uid=++y);return!a[c]?a[c]=1:0},ha=function(b){if(b&&b.nozip)return b;var a=[];if(!b||!b.length)return a;b[0]&&a.push(b[0]);if(2>b.length)return a;y++;var c,d;b[0]&&(b[0]._zipIdx=y);for(c=1;d=b[c];c++)b[c]._zipIdx!=y&&a.push(d),d._zipIdx=y;return a},G=function(b,a){a=a||t.doc;z="div"===(a.ownerDocument||a).createElement("div").tagName;var c=V(b)(a);return c&&c.nozip?c:ha(c)};G.filter=function(b,a,c){for(var d=[],f=E(a),f=1==f.length&&!/[^\w#\.]/.test(a)?m(f[0]):function(b){return-1!=I.indexOf(G(a,
H.byId(c)),b)},e=0,j;j=b[e];e++)f(j)&&d.push(j);return d};return G});