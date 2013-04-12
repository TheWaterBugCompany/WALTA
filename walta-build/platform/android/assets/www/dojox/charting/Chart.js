//>>built
define("dojox/charting/Chart","../main,dojo/_base/lang,dojo/_base/array,dojo/_base/declare,dojo/dom-style,dojo/dom,dojo/dom-geometry,dojo/dom-construct,dojo/_base/Color,dojo/_base/sniff,./Element,./SimpleTheme,./Series,./axis2d/common,dojox/gfx/shape,dojox/gfx,dojox/lang/functional,dojox/lang/functional/fold,dojox/lang/functional/reversed".split(","),function(y,m,f,z,n,A,l,u,v,B,j,C,D,E,F,k,d){function w(a,b){if(a&&b)a.min=Math.min(a.min,b.min),a.max=Math.max(a.max,b.max);return a||b}function o(a,
b){var c={},e={};f.forEach(a,function(a){var b=c[a.name]=a.getSeriesStats();a.hAxis&&(e[a.hAxis]=w(e[a.hAxis],{min:b.hmin,max:b.hmax}));a.vAxis&&(e[a.vAxis]=w(e[a.vAxis],{min:b.vmin,max:b.vmax}))});f.forEach(a,function(a){var h=c[a.name];if(a.hAxis){var d=e[a.hAxis];h.hmin=d.min;h.hmax=d.max}if(a.vAxis)d=e[a.vAxis],h.vmin=d.min,h.vmax=d.max;a.initializeScalers(b,h)})}var i=m.getObject("charting",!0,y),p=d.lambda("item.clear()"),q=d.lambda("item.purgeGroup()"),r=d.lambda("item.destroy()"),s=d.lambda("item.dirty = false"),
t=d.lambda("item.dirty = true"),x=d.lambda("item.name");return z("dojox.charting.Chart",null,{constructor:function(a,b){b||(b={});this.margins=b.margins?b.margins:{l:10,t:10,r:10,b:10};this.stroke=b.stroke;this.fill=b.fill;this.delayInMs=b.delayInMs||200;this.title=b.title;this.titleGap=b.titleGap;this.titlePos=b.titlePos;this.titleFont=b.titleFont;this.titleFontColor=b.titleFontColor;this.theme=this.chartTitle=null;this.axes={};this.stack=[];this.plots={};this.series=[];this.runs={};this.dirty=!0;
this.node=A.byId(a);var c=l.getMarginBox(a);this.surface=k.createSurface(this.node,c.w||400,c.h||300);if(-1==this.surface.declaredClass.indexOf("vml"))this.plotGroup=this.surface.createGroup()},destroy:function(){f.forEach(this.series,r);f.forEach(this.stack,r);d.forIn(this.axes,r);this.surface.destroy();this.chartTitle&&this.chartTitle.tagName&&u.destroy(this.chartTitle)},getCoords:function(){var a=this.node,b=n.getComputedStyle(a),b=l.getMarginBox(a,b),a=l.position(a,!0);b.x=a.x;b.y=a.y;return b},
setTheme:function(a){this.theme=a.clone();this.dirty=!0;return this},addAxis:function(a,b){var c;c=b&&b.type||"Default";if("string"==typeof c){if(!i.axis2d||!i.axis2d[c])throw Error("Can't find axis: "+c+" - Check require() dependencies.");c=new i.axis2d[c](this,b)}else c=new c(this,b);c.name=a;c.dirty=!0;a in this.axes&&this.axes[a].destroy();this.axes[a]=c;this.dirty=!0;return this},getAxis:function(a){return this.axes[a]},removeAxis:function(a){if(a in this.axes)this.axes[a].destroy(),delete this.axes[a],
this.dirty=!0;return this},addPlot:function(a,b){var c;c=b&&b.type||"Default";if("string"==typeof c){if(!i.plot2d||!i.plot2d[c])throw Error("Can't find plot: "+c+" - didn't you forget to dojo.require() it?");c=new i.plot2d[c](this,b)}else c=new c(this,b);c.name=a;c.dirty=!0;a in this.plots?(this.stack[this.plots[a]].destroy(),this.stack[this.plots[a]]=c):(this.plots[a]=this.stack.length,this.stack.push(c));this.dirty=!0;return this},getPlot:function(a){return this.stack[this.plots[a]]},removePlot:function(a){if(a in
this.plots){var b=this.plots[a];delete this.plots[a];this.stack[b].destroy();this.stack.splice(b,1);d.forIn(this.plots,function(a,c,h){a>b&&(h[c]=a-1)});var c=f.filter(this.series,function(b){return b.plot!=a});if(c.length<this.series.length)f.forEach(this.series,function(b){b.plot==a&&b.destroy()}),this.runs={},f.forEach(c,function(a,b){this.runs[a.plot]=b},this),this.series=c;this.dirty=!0}return this},getPlotOrder:function(){return d.map(this.stack,x)},setPlotOrder:function(a){var b={},c=d.filter(a,
function(a){if(!(a in this.plots)||a in b)return!1;b[a]=1;return!0},this);c.length<this.stack.length&&d.forEach(this.stack,function(a){a=a.name;a in b||c.push(a)});a=d.map(c,function(a){return this.stack[this.plots[a]]},this);d.forEach(a,function(a,b){this.plots[a.name]=b},this);this.stack=a;this.dirty=!0;return this},movePlotToFront:function(a){if(a in this.plots){var b=this.plots[a];if(b){var c=this.getPlotOrder();c.splice(b,1);c.unshift(a);return this.setPlotOrder(c)}}return this},movePlotToBack:function(a){if(a in
this.plots){var b=this.plots[a];if(b<this.stack.length-1){var c=this.getPlotOrder();c.splice(b,1);c.push(a);return this.setPlotOrder(c)}}return this},addSeries:function(a,b,c){b=new D(this,b,c);b.name=a;a in this.runs?(this.series[this.runs[a]].destroy(),this.series[this.runs[a]]=b):(this.runs[a]=this.series.length,this.series.push(b));this.dirty=!0;if(!("ymin"in b)&&"min"in b)b.ymin=b.min;if(!("ymax"in b)&&"max"in b)b.ymax=b.max;return this},getSeries:function(a){return this.series[this.runs[a]]},
removeSeries:function(a){if(a in this.runs){var b=this.runs[a];delete this.runs[a];this.series[b].destroy();this.series.splice(b,1);d.forIn(this.runs,function(a,e,g){a>b&&(g[e]=a-1)});this.dirty=!0}return this},updateSeries:function(a,b,c){if(a in this.runs)a=this.series[this.runs[a]],a.update(b),c?this.dirty=!0:(this._invalidateDependentPlots(a.plot,!1),this._invalidateDependentPlots(a.plot,!0));return this},getSeriesOrder:function(a){return d.map(d.filter(this.series,function(b){return b.plot==
a}),x)},setSeriesOrder:function(a){var b,c={},e=d.filter(a,function(a){if(!(a in this.runs)||a in c)return!1;var e=this.series[this.runs[a]];if(b){if(e.plot!=b)return!1}else b=e.plot;c[a]=1;return!0},this);d.forEach(this.series,function(a){var h=a.name;!(h in c)&&a.plot==b&&e.push(h)});this.series=d.map(e,function(a){return this.series[this.runs[a]]},this).concat(d.filter(this.series,function(a){return a.plot!=b}));d.forEach(this.series,function(a,b){this.runs[a.name]=b},this);this.dirty=!0;return this},
moveSeriesToFront:function(a){if(a in this.runs){var b=this.runs[a],c=this.getSeriesOrder(this.series[b].plot);if(a!=c[0])return c.splice(b,1),c.unshift(a),this.setSeriesOrder(c)}return this},moveSeriesToBack:function(a){if(a in this.runs){var b=this.runs[a],c=this.getSeriesOrder(this.series[b].plot);if(a!=c[c.length-1])return c.splice(b,1),c.push(a),this.setSeriesOrder(c)}return this},resize:function(a,b){var c;switch(arguments.length){case 1:c=m.mixin({},a);l.setMarginBox(this.node,c);break;case 2:c=
{w:a,h:b},l.setMarginBox(this.node,c)}c=l.getMarginBox(this.node);var e=this.surface.getDimensions();return e.width!=c.w||e.height!=c.h?(this.surface.setDimensions(c.w,c.h),this.dirty=!0,this.render()):this},getGeometry:function(){var a={};d.forIn(this.axes,function(b){b.initialized()&&(a[b.name]={name:b.name,vertical:b.vertical,scaler:b.scaler,ticks:b.ticks})});return a},setAxisWindow:function(a,b,c,e){var g=this.axes[a];g&&(g.setWindow(b,c),f.forEach(this.stack,function(b){if(b.hAxis==a||b.vAxis==
a)b.zoom=e}));return this},setWindow:function(a,b,c,e,g){"plotArea"in this||this.calculateGeometry();d.forIn(this.axes,function(g){var d,f;d=g.getScaler().bounds;f=d.span/(d.upper-d.lower);g.vertical?(d=b,f=e/f/d):(d=a,f=c/f/d);g.setWindow(d,f)});f.forEach(this.stack,function(a){a.zoom=g});return this},zoomIn:function(a,b,c){var e=this.axes[a];if(e){var e=e.getScaler().bounds,g=Math.min(b[0],b[1]),d=Math.max(b[0],b[1]),g=b[0]<e.lower?e.lower:g,d=b[1]>e.upper?e.upper:d;this.setAxisWindow(a,(e.upper-
e.lower)/(d-g),g-e.lower);c?this.delayedRender():this.render()}},calculateGeometry:function(){if(this.dirty)return this.fullGeometry();var a=f.filter(this.stack,function(a){return a.dirty||a.hAxis&&this.axes[a.hAxis].dirty||a.vAxis&&this.axes[a.vAxis].dirty},this);o(a,this.plotArea);return this},fullGeometry:function(){this._makeDirty();f.forEach(this.stack,p);this.theme||this.setTheme(new C);f.forEach(this.series,function(a){if(!(a.plot in this.plots)){if(!i.plot2d||!i.plot2d.Default)throw Error("Can't find plot: Default - didn't you forget to dojo.require() it?");
var b=new i.plot2d.Default(this,{});b.name=a.plot;this.plots[a.plot]=this.stack.length;this.stack.push(b)}this.stack[this.plots[a.plot]].addSeries(a)},this);f.forEach(this.stack,function(a){a.assignAxes&&a.assignAxes(this.axes)},this);var a=this.dim=this.surface.getDimensions();a.width=k.normalizedLength(a.width);a.height=k.normalizedLength(a.height);d.forIn(this.axes,p);o(this.stack,a);var b=this.offsets={l:0,r:0,t:0,b:0};d.forIn(this.axes,function(a){d.forIn(a.getOffsets(),function(a,c){b[c]=Math.max(a,
b[c])})});if(this.title){this.titleGap=0==this.titleGap?0:this.titleGap||this.theme.chart.titleGap||20;this.titlePos=this.titlePos||this.theme.chart.titlePos||"top";this.titleFont=this.titleFont||this.theme.chart.titleFont;this.titleFontColor=this.titleFontColor||this.theme.chart.titleFontColor||"black";var c=k.normalizedLength(k.splitFontString(this.titleFont).size);b["top"==this.titlePos?"t":"b"]+=c+this.titleGap}d.forIn(this.margins,function(a,c){b[c]+=a});this.plotArea={width:a.width-b.l-b.r,
height:a.height-b.t-b.b};d.forIn(this.axes,p);o(this.stack,this.plotArea);return this},render:function(){if(this._delayedRenderHandle)clearTimeout(this._delayedRenderHandle),this._delayedRenderHandle=null;this.theme&&this.theme.clear();if(this.dirty)return this.fullRender();this.calculateGeometry();d.forEachRev(this.stack,function(a){a.render(this.dim,this.offsets)},this);d.forIn(this.axes,function(a){a.render(this.dim,this.offsets)},this);this._makeClean();return this},fullRender:function(){this.fullGeometry();
var a=this.offsets,b=this.dim,c=Math.max(0,b.width-a.l-a.r),e=Math.max(0,b.height-a.t-a.b);f.forEach(this.series,q);d.forIn(this.axes,q);f.forEach(this.stack,q);for(var g=this.surface.children,h=0;h<g.length;++h)F.dispose(g[h]);this.chartTitle&&this.chartTitle.tagName&&u.destroy(this.chartTitle);this.plotGroup&&this.plotGroup.clear();this.surface.clear();this.chartTitle=null;this.plotGroup?(this._renderChartBackground(b,a),this._renderPlotBackground(b,a,c,e),this.surface.add(this.plotGroup),this.plotGroup.setClip({x:a.l,
y:a.t,width:c,height:e})):this._renderPlotBackground(b,a,c,e);d.foldr(this.stack,function(c,e){return e.render(b,a),0},0);this.plotGroup||this._renderChartBackground(b,a);if(this.title)c="canvas"==k.renderer||!B("opera")?"html":"gfx",e=k.normalizedLength(k.splitFontString(this.titleFont).size),this.chartTitle=E.createText[c](this,this.surface,b.width/2,"top"==this.titlePos?e+this.margins.t:b.height-this.margins.b,"middle",this.title,this.titleFont,this.titleFontColor);d.forIn(this.axes,function(c){c.render(b,
a)});this._makeClean();return this},_renderChartBackground:function(a,b){var c=this.theme,e,d=void 0!==this.fill?this.fill:c.chart&&c.chart.fill,c=void 0!==this.stroke?this.stroke:c.chart&&c.chart.stroke;if("inherit"==d){e=this.node;for(d=new v(n.get(e,"backgroundColor"));0==d.a&&e!=document.documentElement;)d=new v(n.get(e,"backgroundColor")),e=e.parentNode}d&&(this.plotGroup?(d=j.prototype._shapeFill(j.prototype._plotFill(d,a),{x:0,y:0,width:a.width+1,height:a.height+1}),this.surface.createRect({width:a.width+
1,height:a.height+1}).setFill(d)):(d=j.prototype._plotFill(d,a,b),b.l&&(e={x:0,y:0,width:b.l,height:a.height+1},this.surface.createRect(e).setFill(j.prototype._shapeFill(d,e))),b.r&&(e={x:a.width-b.r,y:0,width:b.r+1,height:a.height+2},this.surface.createRect(e).setFill(j.prototype._shapeFill(d,e))),b.t&&(e={x:0,y:0,width:a.width+1,height:b.t},this.surface.createRect(e).setFill(j.prototype._shapeFill(d,e))),b.b&&(e={x:0,y:a.height-b.b,width:a.width+1,height:b.b+2},this.surface.createRect(e).setFill(j.prototype._shapeFill(d,
e)))));c&&this.surface.createRect({width:a.width-1,height:a.height-1}).setStroke(c)},_renderPlotBackground:function(a,b,c,e){var d=this.theme,f=d.plotarea&&d.plotarea.fill,d=d.plotarea&&d.plotarea.stroke,i={x:b.l-1,y:b.t-1,width:c+2,height:e+2};f&&(f=j.prototype._shapeFill(j.prototype._plotFill(f,a,b),i),this.surface.createRect(i).setFill(f));d&&this.surface.createRect({x:b.l,y:b.t,width:c+1,height:e+1}).setStroke(d)},delayedRender:function(){if(!this._delayedRenderHandle)this._delayedRenderHandle=
setTimeout(m.hitch(this,function(){this.render()}),this.delayInMs);return this},connectToPlot:function(a,b,c){return a in this.plots?this.stack[this.plots[a]].connect(b,c):null},fireEvent:function(a,b,c){if(a in this.runs){var d=this.series[this.runs[a]].plot;d in this.plots&&(d=this.stack[this.plots[d]])&&d.fireEvent(a,b,c)}return this},_makeClean:function(){f.forEach(this.axes,s);f.forEach(this.stack,s);f.forEach(this.series,s);this.dirty=!1},_makeDirty:function(){f.forEach(this.axes,t);f.forEach(this.stack,
t);f.forEach(this.series,t);this.dirty=!0},_invalidateDependentPlots:function(a,b){if(a in this.plots){var c=this.stack[this.plots[a]],d,g=b?"vAxis":"hAxis";if(c[g]){if((d=this.axes[c[g]])&&d.dependOnData())d.dirty=!0,f.forEach(this.stack,function(a){if(a[g]&&a[g]==c[g])a.dirty=!0})}else c.dirty=!0}}})});