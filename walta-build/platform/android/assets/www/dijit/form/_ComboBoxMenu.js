//>>built
define("dijit/form/_ComboBoxMenu","dojo/_base/declare,dojo/dom-class,dojo/dom-style,dojo/keys,../_WidgetBase,../_TemplatedMixin,./_ComboBoxMenuMixin,./_ListMouseMixin".split(","),function(e,b,f,c,g,h,i,j){return e("dijit.form._ComboBoxMenu",[g,h,j,i],{templateString:"<div class='dijitReset dijitMenu' data-dojo-attach-point='containerNode' style='overflow: auto; overflow-x: hidden;' role='listbox'><div class='dijitMenuItem dijitMenuPreviousButton' data-dojo-attach-point='previousButton' role='option'></div><div class='dijitMenuItem dijitMenuNextButton' data-dojo-attach-point='nextButton' role='option'></div></div>",
baseClass:"dijitComboBoxMenu",postCreate:function(){this.inherited(arguments);this.isLeftToRight()||(b.add(this.previousButton,"dijitMenuItemRtl"),b.add(this.nextButton,"dijitMenuItemRtl"))},_createMenuItem:function(){var a=this.ownerDocument.createElement("div");a.className="dijitReset dijitMenuItem"+(this.isLeftToRight()?"":" dijitMenuItemRtl");a.setAttribute("role","option");return a},onHover:function(a){b.add(a,"dijitMenuItemHover")},onUnhover:function(a){b.remove(a,"dijitMenuItemHover")},onSelect:function(a){b.add(a,
"dijitMenuItemSelected")},onDeselect:function(a){b.remove(a,"dijitMenuItemSelected")},_page:function(a){var b=0,c=this.domNode.scrollTop,e=f.get(this.domNode,"height");for(this.getHighlightedOption()||this.selectNextNode();b<e;){var d=this.getHighlightedOption();if(a){if(!d.previousSibling||"none"==d.previousSibling.style.display)break;this.selectPreviousNode()}else{if(!d.nextSibling||"none"==d.nextSibling.style.display)break;this.selectNextNode()}d=this.domNode.scrollTop;b+=(d-c)*(a?-1:1);c=d}},
handleKey:function(a){switch(a.keyCode){case c.DOWN_ARROW:return this.selectNextNode(),!1;case c.PAGE_DOWN:return this._page(!1),!1;case c.UP_ARROW:return this.selectPreviousNode(),!1;case c.PAGE_UP:return this._page(!0),!1;default:return!0}}})});