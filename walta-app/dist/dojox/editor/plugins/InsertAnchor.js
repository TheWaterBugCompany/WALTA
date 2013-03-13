//>>built
define("dojox/editor/plugins/InsertAnchor","dojo,dijit,dojox,dijit/_editor/_Plugin,dijit/_base/manager,dijit/_editor/range,dijit/_Templated,dijit/TooltipDialog,dijit/form/ValidationTextBox,dijit/form/Select,dijit/form/Button,dijit/form/DropDownButton,dijit/_editor/range,dijit/_editor/selection,dojo/_base/connect,dojo/_base/declare,dojo/i18n,dojo/string,dojo/NodeList-dom,dojox/editor/plugins/ToolbarLineBreak,dojo/i18n!dojox/editor/plugins/nls/InsertAnchor,dojo/i18n!dijit/nls/common".split(","),function(c,
d,e,g){c.declare("dojox.editor.plugins.InsertAnchor",g,{htmlTemplate:'<a name="${anchorInput}" class="dijitEditorPluginInsertAnchorStyle">${textInput}</a>',iconClassPrefix:"dijitAdditionalEditorIcon",_template:"<table role='presentation'><tr><td><label for='${id}_anchorInput'>${anchor}</label></td><td><input dojoType='dijit.form.ValidationTextBox' required='true' id='${id}_anchorInput' name='anchorInput' intermediateChanges='true'></td></tr><tr><td><label for='${id}_textInput'>${text}</label></td><td><input dojoType='dijit.form.ValidationTextBox' required='true' id='${id}_textInput' name='textInput' intermediateChanges='true'></td></tr><tr><td colspan='2'><button dojoType='dijit.form.Button' type='submit' id='${id}_setButton'>${set}</button><button dojoType='dijit.form.Button' type='button' id='${id}_cancelButton'>${cancel}</button></td></tr></table>",
_initButton:function(){var a=this,b=c.i18n.getLocalization("dojox.editor.plugins","InsertAnchor",this.lang),f=this.dropDown=new d.TooltipDialog({title:b.title,execute:c.hitch(this,"setValue"),onOpen:function(){a._onOpenDialog();d.TooltipDialog.prototype.onOpen.apply(this,arguments)},onCancel:function(){setTimeout(c.hitch(a,"_onCloseDialog"),0)}});this.button=new d.form.DropDownButton({label:b.insertAnchor,showLabel:!1,iconClass:this.iconClassPrefix+" "+this.iconClassPrefix+"InsertAnchor",tabIndex:"-1",
dropDown:this.dropDown});b.id=d.getUniqueId(this.editor.id);this._uniqueId=b.id;this.dropDown.set("content",f.title+"<div style='border-bottom: 1px black solid;padding-bottom:2pt;margin-bottom:4pt'></div>"+c.string.substitute(this._template,b));f.startup();this._anchorInput=d.byId(this._uniqueId+"_anchorInput");this._textInput=d.byId(this._uniqueId+"_textInput");this._setButton=d.byId(this._uniqueId+"_setButton");this.connect(d.byId(this._uniqueId+"_cancelButton"),"onClick",function(){this.dropDown.onCancel()});
this._anchorInput&&this.connect(this._anchorInput,"onChange","_checkInput");this._textInput&&this.connect(this._anchorInput,"onChange","_checkInput");this.editor.contentDomPreFilters.push(c.hitch(this,this._preDomFilter));this.editor.contentDomPostFilters.push(c.hitch(this,this._postDomFilter));this._setup()},updateState:function(){this.button.set("disabled",this.get("disabled"))},setEditor:function(a){this.editor=a;this._initButton()},_checkInput:function(){var a=!0;this._anchorInput.isValid()&&
(a=!1);this._setButton.set("disabled",a)},_setup:function(){this.editor.onLoadDeferred.addCallback(c.hitch(this,function(){this.connect(this.editor.editNode,"ondblclick",this._onDblClick);setTimeout(c.hitch(this,function(){this._applyStyles()}),100)}))},getAnchorStyle:function(){var a=c.moduleUrl(e._scopeName,"editor/plugins/resources").toString();if(!a.match(/^https?:\/\//i)&&!a.match(/^file:\/\//i)){var b;b="/"===a.charAt(0)?c.doc.location.protocol+"//"+c.doc.location.host:this._calcBaseUrl(c.global.location.href);
"/"!==b[b.length-1]&&"/"!==a.charAt(0)&&(b+="/");a=b+a}return"@media screen {\n\t.dijitEditorPluginInsertAnchorStyle {\n\t\tbackground-image: url({MODURL}/images/anchor.gif);\n\t\tbackground-repeat: no-repeat;\n\t\tbackground-position: top left;\n\t\tborder-width: 1px;\n\t\tborder-style: dashed;\n\t\tborder-color: #D0D0D0;\n\t\tpadding-left: 20px;\n\t}\n}\n".replace(/\{MODURL\}/gi,a)},_applyStyles:function(){if(!this._styled)try{this._styled=!0;var a=this.editor.document,b=this.getAnchorStyle();if(c.isIE)a.createStyleSheet("").cssText=
b;else{var d=a.createElement("style");d.appendChild(a.createTextNode(b));a.getElementsByTagName("head")[0].appendChild(d)}}catch(e){}},_calcBaseUrl:function(a){var b=null;null!==a&&(b=a.indexOf("?"),-1!=b&&(a=a.substring(0,b)),b=a.lastIndexOf("/"),b=0<b&&b<a.length?a.substring(0,b):a);return b},_checkValues:function(a){if(a){if(a.anchorInput)a.anchorInput=a.anchorInput.replace(/"/g,"&quot;");if(!a.textInput)a.textInput="&nbsp;"}return a},setValue:function(a){this._onCloseDialog();if(!this.editor.window.getSelection){var b=
d.range.getSelection(this.editor.window).getRangeAt(0).endContainer;if(3===b.nodeType)b=b.parentNode;b&&b.nodeName&&"a"!==b.nodeName.toLowerCase()&&(b=this.editor._sCall("getSelectedElement",["a"]));b&&b.nodeName&&"a"===b.nodeName.toLowerCase()&&this.editor.queryCommandEnabled("unlink")&&(this.editor._sCall("selectElementChildren",[b]),this.editor.execCommand("unlink"))}a=this._checkValues(a);this.editor.execCommand("inserthtml",c.string.substitute(this.htmlTemplate,a))},_onCloseDialog:function(){this.editor.focus()},
_getCurrentValues:function(a){var b,d;a&&"a"===a.tagName.toLowerCase()&&c.attr(a,"name")?(b=c.attr(a,"name"),d=a.textContent||a.innerText,this.editor._sCall("selectElement",[a,!0])):d=this.editor._sCall("getSelectedText");return{anchorInput:b||"",textInput:d||""}},_onOpenDialog:function(){var a;if(this.editor.window.getSelection)a=this.editor._sCall("getAncestorElement",["a"]);else{a=d.range.getSelection(this.editor.window).getRangeAt(0).endContainer;if(3===a.nodeType)a=a.parentNode;a&&a.nodeName&&
"a"!==a.nodeName.toLowerCase()&&(a=this.editor._sCall("getSelectedElement",["a"]))}this.dropDown.reset();this._setButton.set("disabled",!0);this.dropDown.set("value",this._getCurrentValues(a))},_onDblClick:function(a){if(a&&a.target&&(a=a.target,"a"===(a.tagName?a.tagName.toLowerCase():"")&&c.attr(a,"name")))this.editor.onDisplayChanged(),this.editor._sCall("selectElement",[a]),setTimeout(c.hitch(this,function(){this.button.set("disabled",!1);this.button.openDropDown();this.button.dropDown.focus&&
this.button.dropDown.focus()}),10)},_preDomFilter:function(){c.query("a[name]:not([href])",this.editor.editNode).addClass("dijitEditorPluginInsertAnchorStyle")},_postDomFilter:function(a){a&&c.query("a[name]:not([href])",a).removeClass("dijitEditorPluginInsertAnchorStyle");return a}});c.subscribe(d._scopeName+".Editor.getPlugin",null,function(a){if(!a.plugin){var b=a.args.name;b&&(b=b.toLowerCase());if("insertanchor"===b)a.plugin=new e.editor.plugins.InsertAnchor}});return e.editor.plugins.InsertAnchor});