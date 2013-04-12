//>>built
define("dojox/layout/GridContainer","dojo/_base/kernel,dojo/_base/declare,dojo/_base/array,dojo/_base/connect,dojo/_base/sniff,dojo/dom-class,dojo/dom-style,dojo/dom-geometry,dojo/dom-construct,dojo/_base/lang,dojo/_base/window,dojo/ready,dojox/layout/GridContainerLite".split(","),function(s,o,l,f,t,i,n,j,k,p,g,q,r){return o("dojox.layout.GridContainer",r,{hasResizableColumns:!0,liveResizeColumns:!1,minColWidth:20,minChildWidth:150,mode:"right",isRightFixed:!1,isLeftFixed:!1,startup:function(){this.inherited(arguments);
if(this.hasResizableColumns){for(var b=0;b<this._grid.length-1;b++)this._createGrip(b);this.getParent()||q(p.hitch(this,"_placeGrips"))}},resizeChildAfterDrop:function(b,a,c){this.inherited(arguments)&&this._placeGrips()},onShow:function(){this.inherited(arguments);this._placeGrips()},resize:function(){this.inherited(arguments);this._isShown()&&this.hasResizableColumns&&this._placeGrips()},_createGrip:function(b){var b=this._grid[b],a=k.create("div",{"class":"gridContainerGrip"},this.domNode);b.grip=
a;b.gripHandler=[this.connect(a,"onmouseover",function(a){for(var b=!1,d=0;d<this._grid.length-1;d++)if(i.contains(this._grid[d].grip,"gridContainerGripShow")){b=!0;break}b||i.replace(a.target,"gridContainerGripShow","gridContainerGrip")})[0],this.connect(a,"onmouseout",function(a){this._isResized||i.replace(a.target,"gridContainerGrip","gridContainerGripShow")})[0],this.connect(a,"onmousedown","_resizeColumnOn")[0],this.connect(a,"ondblclick","_onGripDbClick")[0]]},_placeGrips:function(){var b,a,
c=0,e;l.forEach(this._grid,function(d){if(d.grip){e=d.grip;b||(b=e.offsetWidth/2);c+=j.getMarginBox(d.node).w;n.set(e,"left",c-b+"px");if(!a)a=j.getContentBox(this.gridNode).h;0<a&&n.set(e,"height",a+"px")}},this)},_onGripDbClick:function(){this._updateColumnsWidth(this._dragManager);this.resize()},_resizeColumnOn:function(b){this._activeGrip=b.target;this._initX=b.pageX;b.preventDefault();g.body().style.cursor="ew-resize";this._isResized=!0;var b=[],a,c;for(c=0;c<this._grid.length;c++)b[c]=j.getContentBox(this._grid[c].node).w;
this._oldTabSize=b;for(c=0;c<this._grid.length;c++){a=this._grid[c];if(this._activeGrip==a.grip)this._currentColumn=a.node,this._currentColumnWidth=b[c],this._nextColumn=this._grid[c+1].node,this._nextColumnWidth=b[c+1];a.node.style.width=b[c]+"px"}a=function(a){var b=0,c=0;l.forEach(a,function(a){1==a.nodeType&&(a=n.getComputedStyle(a),c=parseInt(a.minWidth)+parseInt(a.marginLeft)+parseInt(a.marginRight),b<c&&(b=c))});return b};b=a(this._currentColumn.childNodes,this.minChildWidth);a=a(this._nextColumn.childNodes,
this.minChildWidth);c=Math.round(j.getMarginBox(this.gridContainerTable).w*this.minColWidth/100);this._currentMinCol=b;this._nextMinCol=a;if(c>this._currentMinCol)this._currentMinCol=c;if(c>this._nextMinCol)this._nextMinCol=c;this._connectResizeColumnMove=f.connect(g.doc,"onmousemove",this,"_resizeColumnMove");this._connectOnGripMouseUp=f.connect(g.doc,"onmouseup",this,"_onGripMouseUp")},_onGripMouseUp:function(){g.body().style.cursor="default";f.disconnect(this._connectResizeColumnMove);f.disconnect(this._connectOnGripMouseUp);
this._connectOnGripMouseUp=this._connectResizeColumnMove=null;this._activeGrip&&i.replace(this._activeGrip,"gridContainerGrip","gridContainerGripShow");this._isResized=!1},_resizeColumnMove:function(b){b.preventDefault();if(!this._connectResizeColumnOff)f.disconnect(this._connectOnGripMouseUp),this._connectOnGripMouseUp=null,this._connectResizeColumnOff=f.connect(g.doc,"onmouseup",this,"_resizeColumnOff");var a=b.pageX-this._initX;if(0!=a&&!(this._currentColumnWidth+a<this._currentMinCol||this._nextColumnWidth-
a<this._nextMinCol))if(this._currentColumnWidth+=a,this._nextColumnWidth-=a,this._initX=b.pageX,this._activeGrip.style.left=parseInt(this._activeGrip.style.left)+a+"px",this.liveResizeColumns)this._currentColumn.style.width=this._currentColumnWidth+"px",this._nextColumn.style.width=this._nextColumnWidth+"px",this.resize()},_resizeColumnOff:function(){g.body().style.cursor="default";f.disconnect(this._connectResizeColumnMove);f.disconnect(this._connectResizeColumnOff);this._connectResizeColumnOff=
this._connectResizeColumnMove=null;if(!this.liveResizeColumns)this._currentColumn.style.width=this._currentColumnWidth+"px",this._nextColumn.style.width=this._nextColumnWidth+"px";var b=[],a=[],c=this.gridContainerTable.clientWidth,e=!1,d;for(d=0;d<this._grid.length;d++)a=this._grid[d].node,b[d]=j.getContentBox(a).w,a=b;for(d=0;d<a.length;d++)if(a[d]!=this._oldTabSize[d]){e=!0;break}if(e){for(d=0;d<this._grid.length;d++)this._grid[d].node.style.width=Math.round(1E6*b[d]/c)/1E4+"%";this.resize()}this._activeGrip&&
i.replace(this._activeGrip,"gridContainerGrip","gridContainerGripShow");this._isResized=!1},setColumns:function(b){var a,c;if(0<b){a=this._grid.length;b=a-b;if(0<b){var e=[],d,m,h;if("right"==this.mode){m=this.isLeftFixed&&0<a?1:0;for(a=c=this.isRightFixed?a-2:a-1;a>=m;a--){h=0;d=this._grid[a].node;for(c=0;c<d.childNodes.length;c++)if(1==d.childNodes[c].nodeType&&""!=d.childNodes[c].id){h++;break}0==h&&(e[e.length]=a);if(e.length>=b){this._deleteColumn(e);break}}}else{c=this.isLeftFixed&&0<a?1:0;
m=this.isRightFixed?a-1:a;for(a=c;a<m;a++){h=0;d=this._grid[a].node;for(c=0;c<d.childNodes.length;c++)if(1==d.childNodes[c].nodeType&&""!=d.childNodes[c].id){h++;break}0==h&&(e[e.length]=a);if(e.length>=b){this._deleteColumn(e);break}}}e.length<b&&f.publish("/dojox/layout/gridContainer/noEmptyColumn",[this])}else 0>b&&this._addColumn(Math.abs(b));this.hasResizableColumns&&this._placeGrips()}},_addColumn:function(b){var a=this._grid,c,e,d="right"==this.mode,f=this.acceptTypes.join(","),h=this._dragManager;
this.hasResizableColumns&&(!this.isRightFixed&&d||this.isLeftFixed&&!d&&1==this.nbZones)&&this._createGrip(a.length-1);for(var g=0;g<b;g++)c=k.create("td",{"class":"gridContainerZone dojoxDndArea",accept:f,id:this.id+"_dz"+this.nbZones}),e=a.length,d?this.isRightFixed?(e-=1,a.splice(e,0,{node:a[e].node.parentNode.insertBefore(c,a[e].node)})):a.push({node:this.gridNode.appendChild(c)}):this.isLeftFixed?(e=1==e?0:1,this._grid.splice(1,0,{node:this._grid[e].node.parentNode.appendChild(c,this._grid[e].node)}),
e=1):(e-=this.nbZones,this._grid.splice(e,0,{node:a[e].node.parentNode.insertBefore(c,a[e].node)})),this.hasResizableColumns&&(!d&&1!=this.nbZones||!d&&1==this.nbZones&&!this.isLeftFixed||d&&g<b-1||d&&g==b-1&&this.isRightFixed)&&this._createGrip(e),h.registerByNode(a[e].node),this.nbZones++;this._updateColumnsWidth(h)},_deleteColumn:function(b){for(var a,c,e=0,d=b.length,g=this._dragManager,h=0;h<d;h++){c="right"==this.mode?b[h]:b[h]-e;a=this._grid[c];if(this.hasResizableColumns&&a.grip)l.forEach(a.gripHandler,
function(a){f.disconnect(a)}),k.destroy(this.domNode.removeChild(a.grip)),a.grip=null;g.unregister(a.node);k.destroy(this.gridNode.removeChild(a.node));this._grid.splice(c,1);this.nbZones--;e++}b=this._grid[this.nbZones-1];if(b.grip)l.forEach(b.gripHandler,f.disconnect),k.destroy(this.domNode.removeChild(b.grip)),b.grip=null;this._updateColumnsWidth(g)},_updateColumnsWidth:function(b){this.inherited(arguments);b._dropMode.updateAreas(b._areaList)},destroy:function(){f.unsubscribe(this._dropHandler);
this.inherited(arguments)}})});