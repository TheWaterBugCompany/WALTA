//>>built
define("dijit/_Widget","dojo/aspect,dojo/_base/config,dojo/_base/connect,dojo/_base/declare,dojo/has,dojo/_base/kernel,dojo/_base/lang,dojo/query,dojo/ready,./registry,./_WidgetBase,./_OnDijitClickMixin,./_FocusMixin,dojo/uacss,./hccss".split(","),function(d,i,g,j,q,e,k,l,r,m,n,o,p){function b(){}function h(a){return function(c,f,e,d){return c&&"string"==typeof f&&c[f]==b?c.on(f.substring(2).toLowerCase(),k.hitch(e,d)):a.apply(g,arguments)}}d.around(g,"connect",h);e.connect&&d.around(e,"connect",
h);return j("dijit._Widget",[n,o,p],{onClick:b,onDblClick:b,onKeyDown:b,onKeyPress:b,onKeyUp:b,onMouseDown:b,onMouseMove:b,onMouseOut:b,onMouseOver:b,onMouseLeave:b,onMouseEnter:b,onMouseUp:b,constructor:function(a){this._toConnect={};for(var c in a)this[c]===b&&(this._toConnect[c.replace(/^on/,"").toLowerCase()]=a[c],delete a[c])},postCreate:function(){this.inherited(arguments);for(var a in this._toConnect)this.on(a,this._toConnect[a]);delete this._toConnect},on:function(a,c){return this[this._onMap(a)]===
b?g.connect(this.domNode,a.toLowerCase(),this,c):this.inherited(arguments)},_setFocusedAttr:function(a){this._focused=a;this._set("focused",a)},setAttribute:function(a,b){e.deprecated(this.declaredClass+"::setAttribute(attr, value) is deprecated. Use set() instead.","","2.0");this.set(a,b)},attr:function(a,b){if(i.isDebug){var f=arguments.callee._ach||(arguments.callee._ach={}),d=(arguments.callee.caller||"unknown caller").toString();f[d]||(e.deprecated(this.declaredClass+"::attr() is deprecated. Use get() or set() instead, called from "+
d,"","2.0"),f[d]=!0)}return 2<=arguments.length||"object"===typeof a?this.set.apply(this,arguments):this.get(a)},getDescendants:function(){e.deprecated(this.declaredClass+"::getDescendants() is deprecated. Use getChildren() instead.","","2.0");return this.containerNode?l("[widgetId]",this.containerNode).map(m.byNode):[]},_onShow:function(){this.onShow()},onShow:function(){},onHide:function(){},onClose:function(){return!0}})});