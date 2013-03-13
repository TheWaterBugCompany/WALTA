//>>built
define("dijit/_editor/plugins/FullScreen","dojo/aspect,dojo/_base/declare,dojo/dom-class,dojo/dom-geometry,dojo/dom-style,dojo/_base/event,dojo/i18n,dojo/keys,dojo/_base/lang,dojo/on,dojo/sniff,dojo/_base/window,dojo/window,../../focus,../_Plugin,../../form/ToggleButton,../../registry,dojo/i18n!../nls/commands".split(","),function(q,r,n,g,e,m,s,k,f,t,l,w,j,o,i,u,v){var p=r("dijit._editor.plugins.FullScreen",i,{zIndex:500,_origState:null,_origiFrameState:null,_resizeHandle:null,isFullscreen:!1,toggle:function(){this.button.set("checked",
!this.button.get("checked"))},_initButton:function(){var b=s.getLocalization("dijit._editor","commands"),a=this.editor;this.button=new u({label:b.fullScreen,ownerDocument:a.ownerDocument,dir:a.dir,lang:a.lang,showLabel:!1,iconClass:this.iconClassPrefix+" "+this.iconClassPrefix+"FullScreen",tabIndex:"-1",onChange:f.hitch(this,"_setFullScreen")})},setEditor:function(b){this.editor=b;this._initButton();this.editor.addKeyHandler(k.F11,!0,!0,f.hitch(this,function(a){this.toggle();m.stop(a);setTimeout(f.hitch(this,
function(){this.editor.focus()}),250);return!0}));this.connect(this.editor.domNode,"onkeydown","_containFocus")},_containFocus:function(b){if(this.isFullscreen){var a=this.editor;if(!a.isTabIndent&&a._fullscreen_oldOnKeyDown&&b.keyCode===k.TAB){var d=o.curNode,c=this._getAltViewNode();d==a.iframe||c&&d===c?setTimeout(f.hitch(this,function(){a.toolbar.focus()}),10):c&&"none"===e.get(a.iframe,"display")?setTimeout(f.hitch(this,function(){o.focus(c)}),10):setTimeout(f.hitch(this,function(){a.focus()}),
10);m.stop(b)}else a._fullscreen_oldOnKeyDown&&a._fullscreen_oldOnKeyDown(b)}},_resizeEditor:function(){var b=j.getBox(this.editor.ownerDocument);g.setMarginBox(this.editor.domNode,{w:b.w,h:b.h});var a=this.editor.getHeaderHeight(),d=this.editor.getFooterHeight(),c=g.getPadBorderExtents(this.editor.domNode),e=g.getPadBorderExtents(this.editor.iframe.parentNode),f=g.getMarginExtents(this.editor.iframe.parentNode),a=b.h-(a+c.h+d);g.setMarginBox(this.editor.iframe.parentNode,{h:a,w:b.w});g.setMarginBox(this.editor.iframe,
{h:a-(e.h+f.h)})},_getAltViewNode:function(){},_setFullScreen:function(b){var a=this.editor,d=a.ownerDocumentBody,c=a.domNode.parentNode,i=j.getBox(a.ownerDocument);if(this.isFullscreen=b){for(;c&&c!==d;)n.add(c,"dijitForceStatic"),c=c.parentNode;this._editorResizeHolder=this.editor.resize;a.resize=function(){};a._fullscreen_oldOnKeyDown=a.onKeyDown;a.onKeyDown=f.hitch(this,this._containFocus);this._origState={};this._origiFrameState={};c=(b=a.domNode)&&b.style||{};this._origState={width:c.width||
"",height:c.height||"",top:e.get(b,"top")||"",left:e.get(b,"left")||"",position:e.get(b,"position")||"static",marginBox:g.getMarginBox(a.domNode)};b=(b=a.iframe)&&b.style||{};c=e.get(a.iframe,"backgroundColor");this._origiFrameState={backgroundColor:c||"transparent",width:b.width||"auto",height:b.height||"auto",zIndex:b.zIndex||""};e.set(a.domNode,{position:"absolute",top:"0px",left:"0px",zIndex:this.zIndex,width:i.w+"px",height:i.h+"px"});e.set(a.iframe,{height:"100%",width:"100%",zIndex:this.zIndex,
backgroundColor:"transparent"!==c&&"rgba(0, 0, 0, 0)"!==c?c:"white"});e.set(a.iframe.parentNode,{height:"95%",width:"100%"});this._oldOverflow=d.style&&d.style.overflow?e.get(d,"overflow"):"";if(l("ie")&&!l("quirks")){if(d.parentNode&&d.parentNode.style&&d.parentNode.style.overflow)this._oldBodyParentOverflow=d.parentNode.style.overflow;else try{this._oldBodyParentOverflow=e.get(d.parentNode,"overflow")}catch(m){this._oldBodyParentOverflow="scroll"}e.set(d.parentNode,"overflow","hidden")}e.set(d,
"overflow","hidden");this._resizeHandle=t(window,"resize",f.hitch(this,function(){var b=j.getBox(a.ownerDocument);if("_prevW"in this&&"_prevH"in this){if(b.w===this._prevW&&b.h===this._prevH)return}else this._prevW=b.w,this._prevH=b.h;this._resizer&&(clearTimeout(this._resizer),delete this._resizer);this._resizer=setTimeout(f.hitch(this,function(){delete this._resizer;this._resizeEditor()}),10)}));this._resizeHandle2=q.after(a,"onResize",f.hitch(this,function(){this._resizer&&(clearTimeout(this._resizer),
delete this._resizer);this._resizer=setTimeout(f.hitch(this,function(){delete this._resizer;this._resizeEditor()}),10)}));this._resizeEditor();var k=this.editor.toolbar.domNode;setTimeout(function(){j.scrollIntoView(k)},250)}else{if(this._resizeHandle)this._resizeHandle.remove(),this._resizeHandle=null;if(this._resizeHandle2)this._resizeHandle2.remove(),this._resizeHandle2=null;if(this._rst)clearTimeout(this._rst),this._rst=null;for(;c&&c!==d;)n.remove(c,"dijitForceStatic"),c=c.parentNode;if(this._editorResizeHolder)this.editor.resize=
this._editorResizeHolder;if(this._origState||this._origiFrameState){if(a._fullscreen_oldOnKeyDown)a.onKeyDown=a._fullscreen_oldOnKeyDown,delete a._fullscreen_oldOnKeyDown;var h=this;setTimeout(function(){var b=h._origState.marginBox,c=h._origState.height;if(l("ie")&&!l("quirks"))d.parentNode.style.overflow=h._oldBodyParentOverflow,delete h._oldBodyParentOverflow;e.set(d,"overflow",h._oldOverflow);delete h._oldOverflow;e.set(a.domNode,h._origState);e.set(a.iframe.parentNode,{height:"",width:""});e.set(a.iframe,
h._origiFrameState);delete h._origState;delete h._origiFrameState;var g=v.getEnclosingWidget(a.domNode.parentNode);g&&g.resize?g.resize():(!c||0>c.indexOf("%"))&&setTimeout(f.hitch(this,function(){a.resize({h:b.h})}),0);j.scrollIntoView(h.editor.toolbar.domNode)},100)}}},updateState:function(){this.button.set("disabled",this.get("disabled"))},destroy:function(){if(this._resizeHandle)this._resizeHandle.remove(),this._resizeHandle=null;if(this._resizeHandle2)this._resizeHandle2.remove(),this._resizeHandle2=
null;if(this._resizer)clearTimeout(this._resizer),this._resizer=null;this.inherited(arguments)}});i.registry.fullScreen=i.registry.fullscreen=function(b){return new p({zIndex:"zIndex"in b?b.zIndex:500})};return p});