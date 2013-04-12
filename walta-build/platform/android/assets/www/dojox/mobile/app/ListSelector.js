//>>built
define("dojox/mobile/app/ListSelector",["dijit","dojo","dojox","dojo/require!dojox/mobile/app/_Widget,dojo/fx"],function(i,a,g){a.provide("dojox.mobile.app.ListSelector");a.experimental("dojox.mobile.app.ListSelector");a.require("dojox.mobile.app._Widget");a.require("dojo.fx");a.declare("dojox.mobile.app.ListSelector",g.mobile.app._Widget,{data:null,controller:null,onChoose:null,destroyOnHide:!1,_setDataAttr:function(a){(this.data=a)&&this.render()},postCreate:function(){a.addClass(this.domNode,"listSelector");
var c=this;this.connect(this.domNode,"onclick",function(b){if(a.hasClass(b.target,"listSelectorRow")){if(c.onChoose)c.onChoose(c.data[b.target._idx].value);c.hide()}});this.connect(this.domNode,"onmousedown",function(b){a.hasClass(b.target,"listSelectorRow")&&a.addClass(b.target,"listSelectorRow-selected")});this.connect(this.domNode,"onmouseup",function(b){a.hasClass(b.target,"listSelectorRow")&&a.removeClass(b.target,"listSelectorRow-selected")});this.connect(this.domNode,"onmouseout",function(b){a.hasClass(b.target,
"listSelectorRow")&&a.removeClass(b.target,"listSelectorRow-selected")});this.controller.getWindowSize();this.mask=a.create("div",{"class":"dialogUnderlayWrapper",innerHTML:'<div class="dialogUnderlay"></div>'},this.controller.assistant.domNode);this.connect(this.mask,"onclick",function(){c.onChoose&&c.onChoose();c.hide()})},show:function(c){var b,d=this.controller.getWindowSize(),f;c?b=f=a._abs(c):(b.x=d.w/2,b.y=200);console.log("startPos = ",b);a.style(this.domNode,{opacity:0,display:"",width:Math.floor(0.8*
d.w)+"px"});var e=0;a.query(">",this.domNode).forEach(function(b){a.style(b,{"float":"left"});e=Math.max(e,a.marginBox(b).w);a.style(b,{"float":"none"})});e=Math.min(e,Math.round(0.8*d.w))+a.style(this.domNode,"paddingLeft")+a.style(this.domNode,"paddingRight")+1;a.style(this.domNode,"width",e+"px");var c=a.marginBox(this.domNode).h,g=this,h=f?Math.max(30,f.y-c-10):this.getScroll().y+30;console.log("fromNodePos = ",f," targetHeight = ",c," targetY = "+h," startPos ",b);b=a.animateProperty({node:this.domNode,
duration:400,properties:{width:{start:1,end:e},height:{start:1,end:c},top:{start:b.y,end:h},left:{start:b.x,end:d.w/2-e/2},opacity:{start:0,end:1},fontSize:{start:1}},onEnd:function(){a.style(g.domNode,"width","inherit")}});d=a.fadeIn({node:this.mask,duration:400});a.fx.combine([b,d]).play()},hide:function(){var c=this,b=a.animateProperty({node:this.domNode,duration:500,properties:{width:{end:1},height:{end:1},opacity:{end:0},fontSize:{end:1}},onEnd:function(){c.get("destroyOnHide")&&c.destroy()}}),
d=a.fadeOut({node:this.mask,duration:400});a.fx.combine([b,d]).play()},render:function(){a.empty(this.domNode);a.style(this.domNode,"opacity",0);for(var c,b=0;b<this.data.length;b++)c=a.create("div",{"class":"listSelectorRow "+(this.data[b].className||""),innerHTML:this.data[b].label},this.domNode),c._idx=b,0==b&&a.addClass(c,"first"),b==this.data.length-1&&a.addClass(c,"last")},destroy:function(){this.inherited(arguments);a.destroy(this.mask)}})});