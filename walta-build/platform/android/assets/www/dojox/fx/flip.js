//>>built
define("dojox/fx/flip","dojo/_base/kernel,dojo/_base/html,dojo/dom,dojo/dom-construct,dojo/dom-geometry,dojo/_base/connect,dojo/_base/Color,dojo/_base/sniff,dojo/_base/lang,dojo/_base/window,dojo/_base/fx,dojo/fx,./_base".split(","),function(C,m,D,w,E,x,F,G,y,A,B,z,o){C.experimental("dojox.fx.flip");o.flip=function(c){var l=w.create("div"),d=c.node=D.byId(c.node),f=d.style,b=null,k=null,a=null,v=c.lightColor||"#dddddd",t=c.darkColor||"#555555",r=m.style(d,"backgroundColor"),s=c.endColor||r,n={},j=
[],g=c.duration?c.duration/2:250,a=c.dir||"left",h=0.9,q=c.whichAnim,p=c.axis||"center",h=c.depth;(function(a){return function(){var c=m.coords(a,!0);b={top:c.y,left:c.x,width:c.w,height:c.h}}})(d)();k={position:"absolute",top:b.top+"px",left:b.left+"px",height:"0",width:"0",zIndex:c.zIndex||f.zIndex||0,border:"0 solid transparent",fontSize:"0",visibility:"hidden"};d=[{},{top:b.top,left:b.left}];a={left:"Left,Right,Top,Bottom,Width,Height,endHeightMin,Left,endHeightMax".split(","),right:"Right,Left,Top,Bottom,Width,Height,endHeightMin,Left,endHeightMax".split(","),
top:"Top,Bottom,Left,Right,Height,Width,endWidthMin,Top,endWidthMax".split(","),bottom:"Bottom,Top,Left,Right,Height,Width,endWidthMin,Top,endWidthMax".split(",")}[a];"undefined"!=typeof h?(h=Math.max(0,Math.min(1,h))/2,h=0.4+(0.5-h)):h=Math.min(0.9,Math.max(0.4,b[a[5].toLowerCase()]/b[a[4].toLowerCase()]));for(var i=d[0],e=4;6>e;e++)"center"==p||"cube"==p?(b["end"+a[e]+"Min"]=b[a[e].toLowerCase()]*h,b["end"+a[e]+"Max"]=b[a[e].toLowerCase()]/h):"shortside"==p?(b["end"+a[e]+"Min"]=b[a[e].toLowerCase()],
b["end"+a[e]+"Max"]=b[a[e].toLowerCase()]/h):"longside"==p&&(b["end"+a[e]+"Min"]=b[a[e].toLowerCase()]*h,b["end"+a[e]+"Max"]=b[a[e].toLowerCase()]);"center"==p?i[a[2].toLowerCase()]=b[a[2].toLowerCase()]-(b[a[8]]-b[a[6]])/4:"shortside"==p&&(i[a[2].toLowerCase()]=b[a[2].toLowerCase()]-(b[a[8]]-b[a[6]])/2);n[a[5].toLowerCase()]=b[a[5].toLowerCase()]+"px";n[a[4].toLowerCase()]="0";n["border"+a[1]+"Width"]=b[a[4].toLowerCase()]+"px";n["border"+a[1]+"Color"]=r;i["border"+a[1]+"Width"]=0;i["border"+a[1]+
"Color"]=t;i["border"+a[2]+"Width"]=i["border"+a[3]+"Width"]="cube"!=p?(b["end"+a[5]+"Max"]-b["end"+a[5]+"Min"])/2:b[a[6]]/2;i[a[7].toLowerCase()]=b[a[7].toLowerCase()]+b[a[4].toLowerCase()]/2+(c.shift||0);i[a[5].toLowerCase()]=b[a[6]];c=d[1];c["border"+a[0]+"Color"]={start:v,end:s};c["border"+a[0]+"Width"]=b[a[4].toLowerCase()];c["border"+a[2]+"Width"]=0;c["border"+a[3]+"Width"]=0;c[a[5].toLowerCase()]={start:b[a[6]],end:b[a[5].toLowerCase()]};y.mixin(k,n);m.style(l,k);A.body().appendChild(l);k=
function(){w.destroy(l);f.backgroundColor=s;f.visibility="visible"};if("last"==q){for(e in i)i[e]={start:i[e]};i["border"+a[1]+"Color"]={start:t,end:s};c=i}(!q||"first"==q)&&j.push(B.animateProperty({node:l,duration:g,properties:i}));(!q||"last"==q)&&j.push(B.animateProperty({node:l,duration:g,properties:c,onEnd:k}));x.connect(j[0],"play",function(){l.style.visibility="visible";f.visibility="hidden"});return z.chain(j)};o.flipCube=function(c){var l=[],d=E.getMarginBox(c.node),f=d.w/2,d=d.h/2,f={top:{pName:"height",
args:[{whichAnim:"first",dir:"top",shift:-d},{whichAnim:"last",dir:"bottom",shift:d}]},right:{pName:"width",args:[{whichAnim:"first",dir:"right",shift:f},{whichAnim:"last",dir:"left",shift:-f}]},bottom:{pName:"height",args:[{whichAnim:"first",dir:"bottom",shift:d},{whichAnim:"last",dir:"top",shift:-d}]},left:{pName:"width",args:[{whichAnim:"first",dir:"left",shift:-f},{whichAnim:"last",dir:"right",shift:f}]}}[c.dir||"left"].args;c.duration=c.duration?2*c.duration:500;c.depth=0.8;c.axis="cube";for(d=
f.length-1;0<=d;d--)y.mixin(c,f[d]),l.push(o.flip(c));return z.combine(l)};o.flipPage=function(c){var l=c.node,d=m.coords(l,!0),f=d.x,b=d.y,k=d.w,a=d.h,v=m.style(l,"backgroundColor"),t=c.lightColor||"#dddddd",r=c.darkColor,s=w.create("div"),n=[],j=[],g=c.dir||"right",h={left:["left","right","x","w"],top:["top","bottom","y","h"],right:["left","left","x","w"],bottom:["top","top","y","h"]},q={right:[1,-1],left:[-1,1],top:[-1,1],bottom:[1,-1]};m.style(s,{position:"absolute",width:k+"px",height:a+"px",
top:b+"px",left:f+"px",visibility:"hidden"});f=[];for(b=0;2>b;b++){var a=(k=b%2)?h[g][1]:g,p=k?"last":"first",i=k?v:t,e=k?i:c.startColor||l.style.backgroundColor;j[b]=y.clone(s);var u=function(a){return function(){w.destroy(j[a])}}(b);A.body().appendChild(j[b]);f[b]={backgroundColor:k?e:v};f[b][h[g][0]]=d[h[g][2]]+q[g][0]*b*d[h[g][3]]+"px";m.style(j[b],f[b]);n.push(dojox.fx.flip({node:j[b],dir:a,axis:"shortside",depth:c.depth,duration:c.duration/2,shift:q[g][b]*d[h[g][3]]/2,darkColor:r,lightColor:t,
whichAnim:p,endColor:i}));x.connect(n[b],"onEnd",u)}return z.chain(n)};o.flipGrid=function(c){var l=c.rows||4,d=c.cols||4,f=[],b=w.create("div"),k=c.node,a=m.coords(k,!0),v=a.x,t=a.y,r=a.w,s=a.h,n=a.w/d,j=a.h/l,a=[];m.style(b,{position:"absolute",width:n+"px",height:j+"px",backgroundColor:m.style(k,"backgroundColor")});for(var g=0;g<l;g++){var h=g%2,q=h?"right":"left",p=h?1:-1,i=y.clone(k);m.style(i,{position:"absolute",width:r+"px",height:s+"px",top:t+"px",left:v+"px",clip:"rect("+g*j+"px,"+r+"px,"+
s+"px,0)"});A.body().appendChild(i);f[g]=[];for(var e=0;e<d;e++){var u=y.clone(b),o=h?e:d-(e+1),B=function(a,b,c){return function(){b%2?m.style(a,{clip:"rect("+b*j+"px,"+r+"px,"+(b+1)*j+"px,"+(c+1)*n+"px)"}):m.style(a,{clip:"rect("+b*j+"px,"+(r-(c+1)*n)+"px,"+(b+1)*j+"px,0px)"})}}(i,g,e);A.body().appendChild(u);m.style(u,{left:v+o*n+"px",top:t+g*j+"px",visibility:"hidden"});o=dojox.fx.flipPage({node:u,dir:q,duration:c.duration||900,shift:p*n/2,depth:0.2,darkColor:c.darkColor,lightColor:c.lightColor,
startColor:c.startColor||c.node.style.backgroundColor});u=function(a){return function(){w.destroy(a)}}(u);x.connect(o,"play",this,B);x.connect(o,"play",this,u);f[g].push(o)}a.push(z.chain(f[g]))}x.connect(a[0],"play",function(){m.style(k,{visibility:"hidden"})});return z.combine(a)};return o});