//>>built
define("dojox/gfx/svg","dojo/_base/lang,dojo/_base/sniff,dojo/_base/window,dojo/dom,dojo/_base/declare,dojo/_base/array,dojo/dom-geometry,dojo/dom-attr,dojo/_base/Color,./_base,./shape,./path".split(","),function(j,l,m,n,i,r,u,q,v,h,g,p){function k(a,b){return m.doc.createElementNS?m.doc.createElementNS(a,b):m.doc.createElement(b)}function s(a){return c.useSvgWeb?m.doc.createTextNode(a,!0):m.doc.createTextNode(a)}var c=h.svg={};c.useSvgWeb="undefined"!=typeof window.svgweb;var w=navigator.userAgent,
x=l("ios"),t=l("android"),y=l("chrome")||t&&4<=t?"auto":"optimizeLegibility";c.xmlns={xlink:"http://www.w3.org/1999/xlink",svg:"http://www.w3.org/2000/svg"};c.getRef=function(a){return!a||"none"==a?null:a.match(/^url\(#.+\)$/)?n.byId(a.slice(5,-1)):a.match(/^#dojoUnique\d+$/)?n.byId(a.slice(1)):null};c.dasharray={solid:"none",shortdash:[4,1],shortdot:[1,1],shortdashdot:[4,1,1,1],shortdashdotdot:[4,1,1,1,1,1],dot:[1,3],dash:[4,3],longdash:[8,3],dashdot:[4,3,1,3],longdashdot:[8,3,1,3],longdashdotdot:[8,
3,1,3,1,3]};var z=0;c.Shape=i("dojox.gfx.svg.Shape",g.Shape,{destroy:function(){if(this.fillStyle&&"type"in this.fillStyle){var a=this.rawNode.getAttribute("fill");(a=c.getRef(a))&&a.parentNode.removeChild(a)}if(this.clip&&(a=this.rawNode.getAttribute("clip-path")))(a=n.byId(a.match(/gfx_clip[\d]+/)[0]))&&a.parentNode.removeChild(a);this.rawNode=null;g.Shape.prototype.destroy.apply(this,arguments)},setFill:function(a){if(!a)return this.fillStyle=null,this.rawNode.setAttribute("fill","none"),this.rawNode.setAttribute("fill-opacity",
0),this;var b,d=function(a){this.setAttribute(a,b[a].toFixed(8))};if("object"==typeof a&&"type"in a){switch(a.type){case "linear":b=h.makeParameters(h.defaultLinearGradient,a);a=this._setFillObject(b,"linearGradient");r.forEach(["x1","y1","x2","y2"],d,a);break;case "radial":b=h.makeParameters(h.defaultRadialGradient,a);a=this._setFillObject(b,"radialGradient");r.forEach(["cx","cy","r"],d,a);break;case "pattern":b=h.makeParameters(h.defaultPattern,a),a=this._setFillObject(b,"pattern"),r.forEach(["x",
"y","width","height"],d,a)}this.fillStyle=b;return this}this.fillStyle=b=h.normalizeColor(a);this.rawNode.setAttribute("fill",b.toCss());this.rawNode.setAttribute("fill-opacity",b.a);this.rawNode.setAttribute("fill-rule","evenodd");return this},setStroke:function(a){var b=this.rawNode;if(!a)return this.strokeStyle=null,b.setAttribute("stroke","none"),b.setAttribute("stroke-opacity",0),this;if("string"==typeof a||j.isArray(a)||a instanceof v)a={color:a};a=this.strokeStyle=h.makeParameters(h.defaultStroke,
a);a.color=h.normalizeColor(a.color);if(a){b.setAttribute("stroke",a.color.toCss());b.setAttribute("stroke-opacity",a.color.a);b.setAttribute("stroke-width",a.width);b.setAttribute("stroke-linecap",a.cap);"number"==typeof a.join?(b.setAttribute("stroke-linejoin","miter"),b.setAttribute("stroke-miterlimit",a.join)):b.setAttribute("stroke-linejoin",a.join);var d=a.style.toLowerCase();d in c.dasharray&&(d=c.dasharray[d]);if(d instanceof Array){for(var d=j._toArray(d),e=0;e<d.length;++e)d[e]*=a.width;
if("butt"!=a.cap){for(e=0;e<d.length;e+=2)d[e]-=a.width,1>d[e]&&(d[e]=1);for(e=1;e<d.length;e+=2)d[e]+=a.width}d=d.join(",")}b.setAttribute("stroke-dasharray",d);b.setAttribute("dojoGfxStrokeStyle",a.style)}return this},_getParentSurface:function(){for(var a=this.parent;a&&!(a instanceof h.Surface);a=a.parent);return a},_setFillObject:function(a,b){var d=c.xmlns.svg;this.fillStyle=a;var e=this._getParentSurface().defNode,f=this.rawNode.getAttribute("fill");if(f=c.getRef(f))if(f.tagName.toLowerCase()!=
b.toLowerCase()){var g=f.id;f.parentNode.removeChild(f);f=k(d,b);f.setAttribute("id",g);e.appendChild(f)}else for(;f.childNodes.length;)f.removeChild(f.lastChild);else f=k(d,b),f.setAttribute("id",h._base._getUniqueId()),e.appendChild(f);if("pattern"==b)f.setAttribute("patternUnits","userSpaceOnUse"),d=k(d,"image"),d.setAttribute("x",0),d.setAttribute("y",0),d.setAttribute("width",a.width.toFixed(8)),d.setAttribute("height",a.height.toFixed(8)),d.setAttributeNS?d.setAttributeNS(c.xmlns.xlink,"xlink:href",
a.src):d.setAttribute("xlink:href",a.src),f.appendChild(d);else{f.setAttribute("gradientUnits","userSpaceOnUse");for(e=0;e<a.colors.length;++e){var g=a.colors[e],i=k(d,"stop"),j=g.color=h.normalizeColor(g.color);i.setAttribute("offset",g.offset.toFixed(8));i.setAttribute("stop-color",j.toCss());i.setAttribute("stop-opacity",j.a);f.appendChild(i)}}this.rawNode.setAttribute("fill","url(#"+f.getAttribute("id")+")");this.rawNode.removeAttribute("fill-opacity");this.rawNode.setAttribute("fill-rule","evenodd");
return f},_applyTransform:function(){if(this.matrix){var a=this.matrix;this.rawNode.setAttribute("transform","matrix("+a.xx.toFixed(8)+","+a.yx.toFixed(8)+","+a.xy.toFixed(8)+","+a.yy.toFixed(8)+","+a.dx.toFixed(8)+","+a.dy.toFixed(8)+")")}else this.rawNode.removeAttribute("transform");return this},setRawNode:function(a){a=this.rawNode=a;"image"!=this.shape.type&&a.setAttribute("fill","none");a.setAttribute("fill-opacity",0);a.setAttribute("stroke","none");a.setAttribute("stroke-opacity",0);a.setAttribute("stroke-width",
1);a.setAttribute("stroke-linecap","butt");a.setAttribute("stroke-linejoin","miter");a.setAttribute("stroke-miterlimit",4);a.__gfxObject__=this.getUID()},setShape:function(a){this.shape=h.makeParameters(this.shape,a);for(var b in this.shape)"type"!=b&&this.rawNode.setAttribute(b,this.shape[b]);this.bbox=null;return this},_moveToFront:function(){this.rawNode.parentNode.appendChild(this.rawNode);return this},_moveToBack:function(){this.rawNode.parentNode.insertBefore(this.rawNode,this.rawNode.parentNode.firstChild);
return this},setClip:function(a){this.inherited(arguments);var b=a?"width"in a?"rect":"cx"in a?"ellipse":"points"in a?"polyline":"d"in a?"path":null:null;if(a&&!b)return this;if("polyline"===b)a=j.clone(a),a.points=a.points.join(",");var d,e=q.get(this.rawNode,"clip-path");e&&(d=n.byId(e.match(/gfx_clip[\d]+/)[0]))&&d.removeChild(d.childNodes[0]);a?(d?(b=k(c.xmlns.svg,b),d.appendChild(b)):(e="gfx_clip"+ ++z,this.rawNode.setAttribute("clip-path","url(#"+e+")"),d=k(c.xmlns.svg,"clipPath"),b=k(c.xmlns.svg,
b),d.appendChild(b),this.rawNode.parentNode.appendChild(d),q.set(d,"id",e)),q.set(b,a)):(this.rawNode.removeAttribute("clip-path"),d&&d.parentNode.removeChild(d));return this},_removeClipNode:function(){var a,b=q.get(this.rawNode,"clip-path");b&&(a=n.byId(b.match(/gfx_clip[\d]+/)[0]))&&a.parentNode.removeChild(a);return a}});c.Group=i("dojox.gfx.svg.Group",c.Shape,{constructor:function(){g.Container._init.call(this)},setRawNode:function(a){this.rawNode=a;this.rawNode.__gfxObject__=this.getUID()},
destroy:function(){this.clear(!0);c.Shape.prototype.destroy.apply(this,arguments)}});c.Group.nodeType="g";c.Rect=i("dojox.gfx.svg.Rect",[c.Shape,g.Rect],{setShape:function(a){this.shape=h.makeParameters(this.shape,a);this.bbox=null;for(var b in this.shape)"type"!=b&&"r"!=b&&this.rawNode.setAttribute(b,this.shape[b]);null!=this.shape.r&&(this.rawNode.setAttribute("ry",this.shape.r),this.rawNode.setAttribute("rx",this.shape.r));return this}});c.Rect.nodeType="rect";c.Ellipse=i("dojox.gfx.svg.Ellipse",
[c.Shape,g.Ellipse],{});c.Ellipse.nodeType="ellipse";c.Circle=i("dojox.gfx.svg.Circle",[c.Shape,g.Circle],{});c.Circle.nodeType="circle";c.Line=i("dojox.gfx.svg.Line",[c.Shape,g.Line],{});c.Line.nodeType="line";c.Polyline=i("dojox.gfx.svg.Polyline",[c.Shape,g.Polyline],{setShape:function(a,b){a&&a instanceof Array?(this.shape=h.makeParameters(this.shape,{points:a}),b&&this.shape.points.length&&this.shape.points.push(this.shape.points[0])):this.shape=h.makeParameters(this.shape,a);this.bbox=null;this._normalizePoints();
for(var d=[],c=this.shape.points,f=0;f<c.length;++f)d.push(c[f].x.toFixed(8),c[f].y.toFixed(8));this.rawNode.setAttribute("points",d.join(" "));return this}});c.Polyline.nodeType="polyline";c.Image=i("dojox.gfx.svg.Image",[c.Shape,g.Image],{setShape:function(a){this.shape=h.makeParameters(this.shape,a);this.bbox=null;var a=this.rawNode,b;for(b in this.shape)"type"!=b&&"src"!=b&&a.setAttribute(b,this.shape[b]);a.setAttribute("preserveAspectRatio","none");a.setAttributeNS?a.setAttributeNS(c.xmlns.xlink,
"xlink:href",this.shape.src):a.setAttribute("xlink:href",this.shape.src);a.__gfxObject__=this.getUID();return this}});c.Image.nodeType="image";c.Text=i("dojox.gfx.svg.Text",[c.Shape,g.Text],{setShape:function(a){this.shape=h.makeParameters(this.shape,a);this.bbox=null;var a=this.rawNode,b=this.shape;a.setAttribute("x",b.x);a.setAttribute("y",b.y);a.setAttribute("text-anchor",b.align);a.setAttribute("text-decoration",b.decoration);a.setAttribute("rotate",b.rotated?90:0);a.setAttribute("kerning",b.kerning?
"auto":0);a.setAttribute("text-rendering",y);a.firstChild?a.firstChild.nodeValue=b.text:a.appendChild(s(b.text));return this},getTextWidth:function(){var a=this.rawNode,b=a.parentNode,a=a.cloneNode(!0);a.style.visibility="hidden";var d=0,c=a.firstChild.nodeValue;b.appendChild(a);if(""!=c)for(;!d;)d=a.getBBox?parseInt(a.getBBox().width):68;b.removeChild(a);return d}});c.Text.nodeType="text";c.Path=i("dojox.gfx.svg.Path",[c.Shape,p.Path],{_updateWithSegment:function(a){this.inherited(arguments);"string"==
typeof this.shape.path&&this.rawNode.setAttribute("d",this.shape.path)},setShape:function(a){this.inherited(arguments);this.shape.path?this.rawNode.setAttribute("d",this.shape.path):this.rawNode.removeAttribute("d");return this}});c.Path.nodeType="path";c.TextPath=i("dojox.gfx.svg.TextPath",[c.Shape,p.TextPath],{_updateWithSegment:function(a){this.inherited(arguments);this._setTextPath()},setShape:function(a){this.inherited(arguments);this._setTextPath();return this},_setTextPath:function(){if("string"==
typeof this.shape.path){var a=this.rawNode;if(!a.firstChild){var b=k(c.xmlns.svg,"textPath"),d=s("");b.appendChild(d);a.appendChild(b)}b=(b=a.firstChild.getAttributeNS(c.xmlns.xlink,"href"))&&c.getRef(b);if(!b&&(d=this._getParentSurface())){var d=d.defNode,b=k(c.xmlns.svg,"path"),e=h._base._getUniqueId();b.setAttribute("id",e);d.appendChild(b);a.firstChild.setAttributeNS?a.firstChild.setAttributeNS(c.xmlns.xlink,"xlink:href","#"+e):a.firstChild.setAttribute("xlink:href","#"+e)}b&&b.setAttribute("d",
this.shape.path)}},_setText:function(){var a=this.rawNode;if(!a.firstChild){var b=k(c.xmlns.svg,"textPath"),d=s("");b.appendChild(d);a.appendChild(b)}a=a.firstChild;b=this.text;a.setAttribute("alignment-baseline","middle");switch(b.align){case "middle":a.setAttribute("text-anchor","middle");a.setAttribute("startOffset","50%");break;case "end":a.setAttribute("text-anchor","end");a.setAttribute("startOffset","100%");break;default:a.setAttribute("text-anchor","start"),a.setAttribute("startOffset","0%")}a.setAttribute("baseline-shift",
"0.5ex");a.setAttribute("text-decoration",b.decoration);a.setAttribute("rotate",b.rotated?90:0);a.setAttribute("kerning",b.kerning?"auto":0);a.firstChild.data=b.text}});c.TextPath.nodeType="text";var A=534<function(){var a=/WebKit\/(\d*)/.exec(w);return a?a[1]:0}();c.Surface=i("dojox.gfx.svg.Surface",g.Surface,{constructor:function(){g.Container._init.call(this)},destroy:function(){g.Container.clear.call(this,!0);this.defNode=null;this.inherited(arguments)},setDimensions:function(a,b){if(!this.rawNode)return this;
this.rawNode.setAttribute("width",a);this.rawNode.setAttribute("height",b);if(A)this.rawNode.style.width=a,this.rawNode.style.height=b;return this},getDimensions:function(){return this.rawNode?{width:h.normalizedLength(this.rawNode.getAttribute("width")),height:h.normalizedLength(this.rawNode.getAttribute("height"))}:null}});c.createSurface=function(a,b,d){var e=new c.Surface;e.rawNode=k(c.xmlns.svg,"svg");e.rawNode.setAttribute("overflow","hidden");b&&e.rawNode.setAttribute("width",b);d&&e.rawNode.setAttribute("height",
d);b=k(c.xmlns.svg,"defs");e.rawNode.appendChild(b);e.defNode=b;e._parent=n.byId(a);e._parent.appendChild(e.rawNode);return e};var l={_setFont:function(){var a=this.fontStyle;this.rawNode.setAttribute("font-style",a.style);this.rawNode.setAttribute("font-variant",a.variant);this.rawNode.setAttribute("font-weight",a.weight);this.rawNode.setAttribute("font-size",a.size);this.rawNode.setAttribute("font-family",a.family)}},o=g.Container,i={openBatch:function(){this.fragment=c.useSvgWeb?m.doc.createDocumentFragment(!0):
m.doc.createDocumentFragment()},closeBatch:function(){this.fragment&&(this.rawNode.appendChild(this.fragment),delete this.fragment)},add:function(a){this!=a.getParent()&&(this.fragment?this.fragment.appendChild(a.rawNode):this.rawNode.appendChild(a.rawNode),o.add.apply(this,arguments),a.setClip(a.clip));return this},remove:function(a,b){this==a.getParent()&&(this.rawNode==a.rawNode.parentNode&&this.rawNode.removeChild(a.rawNode),this.fragment&&this.fragment==a.rawNode.parentNode&&this.fragment.removeChild(a.rawNode),
a._removeClipNode(),o.remove.apply(this,arguments));return this},clear:function(){for(var a=this.rawNode;a.lastChild;)a.removeChild(a.lastChild);var b=this.defNode;if(b){for(;b.lastChild;)b.removeChild(b.lastChild);a.appendChild(b)}return o.clear.apply(this,arguments)},getBoundingBox:o.getBoundingBox,_moveChildToFront:o._moveChildToFront,_moveChildToBack:o._moveChildToBack},p={createObject:function(a,b){if(!this.rawNode)return null;var d=new a,e=k(c.xmlns.svg,a.nodeType);d.setRawNode(e);d.setShape(b);
this.add(d);return d}};j.extend(c.Text,l);j.extend(c.TextPath,l);j.extend(c.Group,i);j.extend(c.Group,g.Creator);j.extend(c.Group,p);j.extend(c.Surface,i);j.extend(c.Surface,g.Creator);j.extend(c.Surface,p);c.fixTarget=function(a){if(!a.gfxTarget)a.gfxTarget=x&&a.target.wholeText?g.byId(a.target.parentElement.__gfxObject__):g.byId(a.target.__gfxObject__);return!0};if(c.useSvgWeb)c.createSurface=function(a,b,d){var e=new c.Surface;if(!b||!d)var f=u.position(a),b=b||f.w,d=d||f.h;var a=n.byId(a),f=a.id?
a.id+"_svgweb":h._base._getUniqueId(),g=k(c.xmlns.svg,"svg");g.id=f;g.setAttribute("width",b);g.setAttribute("height",d);svgweb.appendChild(g,a);g.addEventListener("SVGLoad",function(){e.rawNode=this;e.isLoaded=!0;var a=k(c.xmlns.svg,"defs");e.rawNode.appendChild(a);e.defNode=a;if(e.onLoad)e.onLoad(e)},!1);e.isLoaded=!1;return e},c.Surface.extend({destroy:function(){var a=this.rawNode;svgweb.removeChild(a,a.parentNode)}}),l={connect:function(a,b,c){"on"===a.substring(0,2)&&(a=a.substring(2));c=2==
arguments.length?b:j.hitch(b,c);this.getEventSource().addEventListener(a,c,!1);return[this,a,c]},disconnect:function(a){this.getEventSource().removeEventListener(a[1],a[2],!1);delete a[0]}},j.extend(c.Shape,l),j.extend(c.Surface,l);return c});