//>>built
define("dojox/mvc/_DataBindingMixin","dojo/_base/kernel,dojo/_base/lang,dojo/_base/array,dojo/_base/declare,dojo/Stateful,dijit/registry".split(","),function(i,f,h,j,k,g){i.deprecated("dojox.mvc._DataBindingMixin","Use dojox/mvc/at for data binding.");return j("dojox.mvc._DataBindingMixin",null,{ref:null,isValid:function(){var a=this.get("valid");return"undefined"!=typeof a?a:this.get("binding")?this.get("binding").get("valid"):!0},_dbstartup:function(){if(!this._databound)this._unwatchArray(this._viewWatchHandles),
this._viewWatchHandles=[this.watch("ref",function(a,b,c){this._databound&&b!==c&&this._setupBinding()}),this.watch("value",function(a,b,c){this._databound&&(a=this.get("binding"))&&(c&&b&&b.valueOf()===c.valueOf()||a.set("value",c))})],this._beingBound=!0,this._setupBinding(),delete this._beingBound,this._databound=!0},_setupBinding:function(a){if(this.ref){var b=this.ref,c;if(b&&f.isFunction(b.toPlainObject))c=b;else if(/^\s*expr\s*:\s*/.test(b))b=b.replace(/^\s*expr\s*:\s*/,""),c=f.getObject(b);
else if(/^\s*rel\s*:\s*/.test(b))b=b.replace(/^\s*rel\s*:\s*/,""),(a=a||this._getParentBindingFromDOM())&&(c=f.getObject(""+b,!1,a));else if(/^\s*widget\s*:\s*/.test(b))b=b.replace(/^\s*widget\s*:\s*/,""),c=b.split("."),1==c.length?c=g.byId(b).get("binding"):(a=g.byId(c.shift()).get("binding"),c=f.getObject(c.join("."),!1,a));else if(a=a||this._getParentBindingFromDOM())c=f.getObject(""+b,!1,a);else try{var e=f.getObject(""+b)||{};f.isFunction(e.set)&&f.isFunction(e.watch)&&(c=e)}catch(d){-1==b.indexOf("${")&&
console.warn("dojox/mvc/_DataBindingMixin: '"+this.domNode+"' widget with illegal ref not evaluating to a dojo/Stateful node: '"+b+"'")}if(c)if(f.isFunction(c.toPlainObject)){this.binding=c;if(this[this._relTargetProp||"target"]!==c)this.set(this._relTargetProp||"target",c);this._updateBinding("binding",null,c)}else console.warn("dojox/mvc/_DataBindingMixin: '"+this.domNode+"' widget with illegal ref not evaluating to a dojo/Stateful node: '"+b+"'")}},_isEqual:function(a,b){return a===b||isNaN(a)&&
"number"===typeof a&&isNaN(b)&&"number"===typeof b},_updateBinding:function(){this._unwatchArray(this._modelWatchHandles);var a=this.get("binding");if(a&&f.isFunction(a.watch)){var b=this;this._modelWatchHandles=[a.watch("value",function(a,e,d){!b._isEqual(e,d)&&!b._isEqual(b.get("value"),d)&&b.set("value",d)}),a.watch("valid",function(a,e,d){b._updateProperty(a,e,d,!0);d!==b.get(a)&&b.validate&&f.isFunction(b.validate)&&b.validate()}),a.watch("required",function(a,e,d){b._updateProperty(a,e,d,!1,
a,d)}),a.watch("readOnly",function(a,e,d){b._updateProperty(a,e,d,!1,a,d)}),a.watch("relevant",function(a,e,d){b._updateProperty(a,e,d,!1,"disabled",!d)})];a=a.get("value");null!=a&&this.set("value",a)}this._updateChildBindings()},_updateProperty:function(a,b,c,e,d,f){b!==c&&(null===c&&void 0!==e&&(c=e),c!==this.get("binding").get(a)&&this.get("binding").set(a,c),d&&this.set(d,f))},_updateChildBindings:function(a){var b=this.get("binding")||a;b&&!this._beingBound&&h.forEach(g.findWidgets(this.domNode),
function(a){a.ref&&a._setupBinding?a._setupBinding(b):a._updateChildBindings(b)})},_getParentBindingFromDOM:function(){for(var a=this.domNode.parentNode,b;a;){if(a=g.getEnclosingWidget(a))if((b=a.get("binding"))&&f.isFunction(b.toPlainObject))break;a=a?a.domNode.parentNode:null}return b},_unwatchArray:function(a){h.forEach(a,function(a){a.unwatch()})}})});