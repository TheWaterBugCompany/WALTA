//>>built
define("dojox/mobile/CheckBox",["dojo/_base/declare","dojo/dom-construct","dijit/form/_CheckBoxMixin","./ToggleButton"],function(a,b,c,d){return a("dojox.mobile.CheckBox",[d,c],{baseClass:"mblCheckBox",_setTypeAttr:function(){},buildRendering:function(){if(!this.srcNodeRef)this.srcNodeRef=b.create("input",{type:this.type});this.inherited(arguments);this.focusNode=this.domNode},_getValueAttr:function(){return this.checked?this.value:!1}})});