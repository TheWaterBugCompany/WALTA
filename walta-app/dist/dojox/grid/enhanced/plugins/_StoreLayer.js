//>>built
define("dojox/grid/enhanced/plugins/_StoreLayer",["dojo/_base/declare","dojo/_base/array","dojo/_base/lang","dojo/_base/xhr"],function(g,h,f,k){var i=f.getObject("grid.enhanced.plugins",!0,dojox),l=function(a){for(var b=["reorder","sizeChange","normal","presentation"],c=b.length,d=a.length-1;0<=d;--d){var e=h.indexOf(b,a[d]);0<=e&&e<=c&&(c=e)}return c<b.length-1?b.slice(0,c+1):b},m=function(a){var b,c=this._layers;b=c.length;if(a){for(b-=1;0<=b;--b)if(c[b].name()==a){c[b]._unwrap(c[b+1]);break}c.splice(b,
1)}else for(b-=1;0<=b;--b)c[b]._unwrap();c.length||(delete this._layers,delete this.layer,delete this.unwrap,delete this.forEachLayer);return this},n=function(a){var b,c=this._layers;if("undefined"==typeof a)return c.length;if("number"==typeof a)return c[a];for(b=c.length-1;0<=b;--b)if(c[b].name()==a)return c[b];return null},o=function(a,b){var c=this._layers.length,d,e;b?(d=0,e=1):(d=c-1,e=c=-1);for(;d!=c;d+=e)if(!1===a(this._layers[d],d))return d;return c};i.wrap=function(a,b,c,d){if(!a._layers)a._layers=
[],a.layer=f.hitch(a,n),a.unwrap=f.hitch(a,m),a.forEachLayer=f.hitch(a,o);var e=l(c.tags);h.some(a._layers,function(f,g){if(h.some(f.tags,function(a){return 0<=h.indexOf(e,a)}))return!1;a._layers.splice(g,0,c);c._wrap(a,b,d,f);return!0})||(a._layers.push(c),c._wrap(a,b,d));return a};var j=g("dojox.grid.enhanced.plugins._StoreLayer",null,{tags:["normal"],layerFuncName:"_fetch",constructor:function(){this._originFetch=this._store=null;this.__enabled=!0},initialize:function(){},uninitialize:function(){},
invalidate:function(){},_wrap:function(a,b,c,d){this._store=a;this._funcName=b;var e=f.hitch(this,function(){return(this.enabled()?this[c||this.layerFuncName]:this.originFetch).apply(this,arguments)});d?(this._originFetch=d._originFetch,d._originFetch=e):(this._originFetch=a[b]||function(){},a[b]=e);this.initialize(a)},_unwrap:function(a){this.uninitialize(this._store);a?a._originFetch=this._originFetch:this._store[this._funcName]=this._originFetch;this._store=this._originFetch=null},enabled:function(a){if("undefined"!=
typeof a)this.__enabled=!!a;return this.__enabled},name:function(){if(!this.__name){var a=this.declaredClass.match(/(?:\.(?:_*)([^\.]+)Layer$)|(?:\.([^\.]+)$)/i);this.__name=a?(a[1]||a[2]).toLowerCase():this.declaredClass}return this.__name},originFetch:function(){return f.hitch(this._store,this._originFetch).apply(this,arguments)}}),g=g("dojox.grid.enhanced.plugins._ServerSideLayer",j,{constructor:function(a){a=a||{};this._url=a.url||"";this._isStateful=!!a.isStateful;this._onUserCommandLoad=a.onCommandLoad||
function(){};this.__cmds={cmdlayer:this.name(),enable:!0};this.useCommands(this._isStateful)},enabled:function(a){var b=this.inherited(arguments);this.__cmds.enable=this.__enabled;return b},useCommands:function(a){if("undefined"!=typeof a)this.__cmds.cmdlayer=a&&this._isStateful?this.name():null;return!!this.__cmds.cmdlayer},_fetch:function(a){this.__cmds.cmdlayer?k.post({url:this._url||this._store.url,content:this.__cmds,load:f.hitch(this,function(b){this.onCommandLoad(b,a);this.originFetch(a)}),
error:f.hitch(this,this.onCommandError)}):(this.onCommandLoad("",a),this.originFetch(a));return a},command:function(a,b){var c=this.__cmds;null===b?delete c[a]:"undefined"!==typeof b&&(c[a]=b);return c[a]},onCommandLoad:function(a,b){this._onUserCommandLoad(this.__cmds,b,a)},onCommandError:function(a){throw a;}});return{_StoreLayer:j,_ServerSideLayer:g,wrap:i.wrap}});