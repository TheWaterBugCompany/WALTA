//>>built
define("dijit/form/_FormValueMixin",["dojo/_base/declare","dojo/dom-attr","dojo/keys","dojo/sniff","./_FormWidgetMixin"],function(f,g,e,c,h){return f("dijit.form._FormValueMixin",h,{readOnly:!1,_setReadOnlyAttr:function(a){g.set(this.focusNode,"readOnly",a);this._set("readOnly",a)},postCreate:function(){this.inherited(arguments);c("ie")&&this.connect(this.focusNode||this.domNode,"onkeydown",this._onKeyDown);if(void 0===this._resetValue)this._lastValueReported=this._resetValue=this.value},_setValueAttr:function(a,
b){this._handleOnChange(a,b)},_handleOnChange:function(a,b){this._set("value",a);this.inherited(arguments)},undo:function(){this._setValueAttr(this._lastValueReported,!1)},reset:function(){this._hasBeenBlurred=!1;this._setValueAttr(this._resetValue,!0)},_onKeyDown:function(a){if(a.keyCode==e.ESCAPE&&!a.ctrlKey&&!a.altKey&&!a.metaKey&&(9>c("ie")||c("ie")&&c("quirks"))){a.preventDefault();var b=a.srcElement,d=b.ownerDocument.createEventObject();d.keyCode=e.ESCAPE;d.shiftKey=a.shiftKey;b.fireEvent("onkeypress",
d)}}})});