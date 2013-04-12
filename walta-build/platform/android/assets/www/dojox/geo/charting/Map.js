//>>built
define("dojox/geo/charting/Map","dojo/_base/lang,dojo/_base/array,dojo/_base/declare,dojo/_base/html,dojo/dom,dojo/dom-geometry,dojo/dom-class,dojo/_base/xhr,dojo/_base/connect,dojo/_base/window,dojox/gfx,./_base,./Feature,./_Marker,dojo/number,dojo/_base/sniff".split(","),function(j,n,q,k,r,l,s,m,h,o,i,w,t,p,u,v){return q("dojox.geo.charting.Map",null,{defaultColor:"#B7B7B7",highlightColor:"#D5D5D5",series:[],dataBindingAttribute:null,dataBindingValueFunction:null,dataStore:null,showTooltips:!0,
enableFeatureZoom:!0,colorAnimationDuration:0,_idAttributes:null,_onSetListener:null,_onNewListener:null,_onDeleteListener:null,constructor:function(a,b){k.style(a,"display","block");this.container=a;var c=this._getContainerBounds();this.surface=i.createSurface(a,c.w,c.h);this._createZoomingCursor();this.mapBackground=this.surface.createRect({x:0,y:0,width:c.w,height:c.w}).setFill("rgba(0,0,0,0)");this.mapObj=this.surface.createGroup();this.mapObj.features={};"object"==typeof b?this._init(b):"string"==
typeof b&&0<b.length&&m.get({url:b,handleAs:"json",sync:!0,load:j.hitch(this,"_init")})},_getContainerBounds:function(){var a=l.position(this.container,!0);l.getMarginBox(this.container);var b=l.getContentBox(this.container);return this._storedContainerBounds={x:a.x,y:a.y,w:b.w||100,h:b.h||100}},resize:function(a,b,c){var d=this._storedContainerBounds,e=this._getContainerBounds();if(!(d.w==e.w&&d.h==e.h)&&(this.mapBackground.setShape({width:e.w,height:e.h}),this.surface.setDimensions(e.w,e.h),this.mapObj.marker.hide(),
this.mapObj.marker._needTooltipRefresh=!0,a)){var f=this.getMapScale(),a=f;b&&(a=f*Math.sqrt(e.w/d.w*(e.h/d.h)));b=this.screenCoordsToMapCoords(d.w/2,d.h/2);this.setMapCenterAndScale(b.x,b.y,a,c)}},_isMobileDevice:function(){return v("safari")&&(-1<navigator.userAgent.indexOf("iPhone")||-1<navigator.userAgent.indexOf("iPod")||-1<navigator.userAgent.indexOf("iPad"))||-1<navigator.userAgent.toLowerCase().indexOf("android")},setMarkerData:function(a){m.get({url:a,handleAs:"json",handle:j.hitch(this,
"_appendMarker")})},setDataBindingAttribute:function(a){this.dataBindingAttribute=a;this.dataStore&&this._queryDataStore()},setDataBindingValueFunction:function(a){this.dataBindingValueFunction=a;this.dataStore&&this._queryDataStore()},_queryDataStore:function(){if(this.dataBindingAttribute&&0!=this.dataBindingAttribute.length){var a=this;this.dataStore.fetch({scope:this,onComplete:function(b){this._idAttributes=a.dataStore.getIdentityAttributes({});n.forEach(b,function(b){var d=a.dataStore.getValue(b,
this._idAttributes[0]);if(a.mapObj.features[d]){var e=null;(b=a.dataStore.getValue(b,a.dataBindingAttribute))&&(e=this.dataBindingValueFunction?this.dataBindingValueFunction(b):isNaN(e)?u.parse(b):b);e&&a.mapObj.features[d].setValue(e)}},this)}})}},_onSet:function(a,b,c,d){(a=this.mapObj.features[this.dataStore.getValue(a,this._idAttributes[0])])&&b==this.dataBindingAttribute&&(d?a.setValue(d):a.unsetValue())},_onNew:function(){var a=this.mapObj.features[this.dataStore.getValue(item,this._idAttributes[0])];
a&&attribute==this.dataBindingAttribute&&a.setValue(newValue)},_onDelete:function(a){(a=this.mapObj.features[a[this._idAttributes[0]]])&&a.unsetValue()},setDataStore:function(a,b){if(this.dataStore!=a&&(this._onSetListener&&(h.disconnect(this._onSetListener),h.disconnect(this._onNewListener),h.disconnect(this._onDeleteListener)),this.dataStore=a))_onSetListener=h.connect(this.dataStore,"onSet",this,this._onSet),_onNewListener=h.connect(this.dataStore,"onNew",this,this._onNew),_onDeleteListener=h.connect(this.dataStore,
"onDelete",this,this._onDelete);b&&this.setDataBindingAttribute(b)},addSeries:function(a){"object"==typeof a?this._addSeriesImpl(a):"string"==typeof a&&0<a.length&&m.get({url:a,handleAs:"json",sync:!0,load:j.hitch(this,function(a){this._addSeriesImpl(a.series)})})},_addSeriesImpl:function(a){this.series=a;for(var b in this.mapObj.features)a=this.mapObj.features[b],a.setValue(a.value)},fitToMapArea:function(a,b,c,d){b||(b=0);var e=a.w,f=a.h,g=this._getContainerBounds(),b=Math.min((g.w-2*b)/e,(g.h-
2*b)/f);this.setMapCenterAndScale(a.x+a.w/2,a.y+a.h/2,b,c,d)},fitToMapContents:function(a,b,c){this.fitToMapArea(this.mapObj.boundBox,a,b,c)},setMapCenter:function(a,b,c,d){var e=this.getMapScale();this.setMapCenterAndScale(a,b,e,c,d)},_createAnimation:function(a,b,c,d){a=i.fx.animateTransform({duration:1E3,shape:a,transform:[{name:"translate",start:[b.dx?b.dx:0,b.dy?b.dy:0],end:[c.dx?c.dx:0,c.dy?c.dy:0]},{name:"scale",start:[b.xx?b.xx:1],end:[c.xx?c.xx:1]}]});if(d)var e=h.connect(a,"onEnd",this,
function(a){d(a);h.disconnect(e)});return a},setMapCenterAndScale:function(a,b,c,d,e){var f=this.mapObj.boundBox,g=this._getContainerBounds(),a=new i.matrix.Matrix2D({xx:c,yy:c,dx:g.w/2-c*(a-f.x),dy:g.h/2-c*(b-f.y)}),b=this.mapObj.getTransform();!d||!b?this.mapObj.setTransform(a):this._createAnimation(this.mapObj,b,a,e).play()},getMapCenter:function(){var a=this._getContainerBounds();return this.screenCoordsToMapCoords(a.w/2,a.h/2)},setMapScale:function(a,b,c){var d=this._getContainerBounds(),d=this.screenCoordsToMapCoords(d.w/
2,d.h/2);this.setMapScaleAt(a,d.x,d.y,b,c)},setMapScaleAt:function(a,b,c,d,e){var f=null,g=null,f={x:b,y:c},g=this.mapCoordsToScreenCoords(f.x,f.y),b=this.mapObj.boundBox,a=new i.matrix.Matrix2D({xx:a,yy:a,dx:g.x-a*(f.x-b.x),dy:g.y-a*(f.y-b.y)}),f=this.mapObj.getTransform();!d||!f?this.mapObj.setTransform(a):this._createAnimation(this.mapObj,f,a,e).play()},getMapScale:function(){var a=this.mapObj.getTransform();return a?a.xx:1},mapCoordsToScreenCoords:function(a,b){var c=this.mapObj.getTransform();
return i.matrix.multiplyPoint(c,a,b)},screenCoordsToMapCoords:function(a,b){var c=i.matrix.invert(this.mapObj.getTransform());return i.matrix.multiplyPoint(c,a,b)},deselectAll:function(){for(var a in this.mapObj.features)this.mapObj.features[a].select(!1);this.selectedFeature=null;this.focused=!1},_init:function(a){this.mapObj.boundBox={x:a.layerExtent[0],y:a.layerExtent[1],w:a.layerExtent[2]-a.layerExtent[0],h:a.layerExtent[3]-a.layerExtent[1]};this.fitToMapContents(3);n.forEach(a.featureNames,function(b){var c=
a.features[b];c.bbox.x=c.bbox[0];c.bbox.y=c.bbox[1];c.bbox.w=c.bbox[2];c.bbox.h=c.bbox[3];c=new t(this,b,c);c.init();this.mapObj.features[b]=c},this);this.mapObj.marker=new p({},this)},_appendMarker:function(a){this.mapObj.marker=new p(a,this)},_createZoomingCursor:function(){if(!r.byId("mapZoomCursor")){var a=o.doc.createElement("div");k.attr(a,"id","mapZoomCursor");s.add(a,"mapZoomIn");k.style(a,"display","none");o.body().appendChild(a)}},onFeatureClick:function(){},onFeatureOver:function(){},onZoomEnd:function(){}})});