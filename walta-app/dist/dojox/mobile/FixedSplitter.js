//>>built
define("dojox/mobile/FixedSplitter","dojo/_base/array,dojo/_base/declare,dojo/_base/window,dojo/dom-class,dojo/dom-geometry,dijit/_Contained,dijit/_Container,dijit/_WidgetBase".split(","),function(h,o,i,f,d,p,q,r){return o("dojox.mobile.FixedSplitter",[r,q,p],{orientation:"H",variablePane:-1,screenSizeAware:!1,screenSizeAwareClass:"dojox/mobile/ScreenSizeAware",baseClass:"mblFixedSplitter",startup:function(){if(!this._started){f.add(this.domNode,this.baseClass+this.orientation);var a=this.getParent(),
c;if(!a||!a.resize){var d=this;c=function(){setTimeout(function(){d.resize()},0)}}this.screenSizeAware?require([this.screenSizeAwareClass],function(a){a.getInstance();c&&c()}):c&&c();this.inherited(arguments)}},resize:function(){var a="H"===this.orientation?"w":"h",c="H"===this.orientation?"l":"t",f={},m={},b,n,g=[],j=0,k=0,e=h.filter(this.domNode.childNodes,function(a){return 1==a.nodeType}),l=-1==this.variablePane?e.length-1:this.variablePane;for(b=0;b<e.length;b++)b!=l&&(g[b]=d.getMarginBox(e[b])[a],
k+=g[b]);"V"==this.orientation&&"BODY"==this.domNode.parentNode.tagName&&1==h.filter(i.body().childNodes,function(a){return 1==a.nodeType}).length&&(n=i.global.innerHeight||i.doc.documentElement.clientHeight);b=(n||d.getMarginBox(this.domNode)[a])-k;m[a]=g[l]=b;a=e[l];d.setMarginBox(a,m);a.style["H"===this.orientation?"height":"width"]="";for(b=0;b<e.length;b++)a=e[b],f[c]=j,d.setMarginBox(a,f),a.style["H"===this.orientation?"top":"left"]="",j+=g[b];h.forEach(this.getChildren(),function(a){a.resize&&
a.resize()})},_setOrientationAttr:function(a){var c=this.baseClass;f.replace(this.domNode,c+a,c+this.orientation);this.orientation=a;this._started&&this.resize()}})});