//>>built
define("dojox/drawing/plugins/drawing/Silverlight",["dijit","dojo","dojox"],function(h,d,f){d.provide("dojox.drawing.plugins.drawing.Silverlight");f.drawing.plugins.drawing.Silverlight=f.drawing.util.oo.declare(function(e){if("silverlight"==f.gfx.renderer)this.mouse=e.mouse,this.stencils=e.stencils,this.anchors=e.anchors,this.canvas=e.canvas,this.util=e.util,d.connect(this.stencils,"register",this,function(a){var b,c,g,e,f,i=this;(function(){b=a.container.connect("onmousedown",function(b){b.superTarget=
a;i.mouse.down(b)})})();c=d.connect(a,"setTransform",this,function(){});g=d.connect(a,"onBeforeRender",function(){});e=d.connect(a,"onRender",this,function(){});f=d.connect(a,"destroy",this,function(){d.forEach([b,c,g,e,f],d.disconnect,d)})}),d.connect(this.anchors,"onAddAnchor",this,function(a){var b=a.shape.connect("onmousedown",this.mouse,function(b){b.superTarget=a;this.down(b)}),c=d.connect(a,"disconnectMouse",this,function(){d.disconnect(b);d.disconnect(c)})}),this.mouse._down=function(a){var b=
this._getXY(a),c=b.x-this.origin.x,b=b.y-this.origin.y,c=c*this.zoom,b=b*this.zoom;this.origin.startx=c;this.origin.starty=b;this._lastx=c;this._lasty=b;this.drawingType=this.util.attr(a,"drawingType")||"";a=this._getId(a);c={x:c,y:b,id:a};this.onDown(c);this._clickTime=(new Date).getTime();this._lastClickTime&&this._clickTime-this._lastClickTime<this.doublClickSpeed&&this._broadcastEvent(this.eventName("doubleClick"),c);this._lastClickTime=this._clickTime},this.mouse.down=function(a){clearTimeout(this.__downInv);
"surface"==this.util.attr(a,"drawingType")?this.__downInv=setTimeout(d.hitch(this,function(){this._down(a)}),500):this._down(a)},this.mouse._getXY=function(a){if(a.pageX)return{x:a.pageX,y:a.pageY,cancelBubble:!0};for(var b in a);return void 0!==a.x?{x:a.x+this.origin.x,y:a.y+this.origin.y}:{x:a.pageX,y:a.pageY}},this.mouse._getId=function(a){return this.util.attr(a,"id")},this.util.attr=function(a,b,c){if(!a)return!1;try{var e;e=a.superTarget?a.superTarget:a.superClass?a.superClass:a.target?a.target:
a;if(void 0!==c)return a[b]=c;if(e.tagName){if("drawingType"==b&&"object"==e.tagName.toLowerCase())return"surface";var f=d.attr(e,b)}return f=e[b]}catch(h){return!1}}},{})});