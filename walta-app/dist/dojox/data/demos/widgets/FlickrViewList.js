//>>built
define("dojox/data/demos/widgets/FlickrViewList",["dijit","dojo","dojox","dojo/require!dojox/dtl/_Templated,dijit/_Widget"],function(c,a,d){a.provide("dojox.data.demos.widgets.FlickrViewList");a.require("dojox.dtl._Templated");a.require("dijit._Widget");a.declare("dojox.data.demos.widgets.FlickrViewList",[c._Widget,d.dtl._Templated],{store:null,items:null,templateString:a.cache("dojox","data/demos/widgets/templates/FlickrViewList.html",'{% load dojox.dtl.contrib.data %}\n{% bind_data items to store as flickr %}\n<div dojoAttachPoint="list">\n\t{% for item in flickr %}\n\t<div style="display: inline-block; align: top;">\n\t\t<h5>{{ item.title }}</h5>\n\t\t<a href="{{ item.link }}" style="border: none;">\n\t\t\t<img src="{{ item.imageUrlMedium }}">\n\t\t</a>\n\t\t<p>{{ item.author }}</p>\n\n\t\t<\!--\n\t\t<img src="{{ item.imageUrl }}">\n\t\t<p>{{ item.imageUrl }}</p>\n\t\t<img src="{{ item.imageUrlSmall }}">\n\t\t--\>\n\t</div>\n\t{% endfor %}\n</div>\n\n'),
fetch:function(b){b.onComplete=a.hitch(this,"onComplete");b.onError=a.hitch(this,"onError");return this.store.fetch(b)},onError:function(){this.items=[];this.render()},onComplete:function(a){this.items=a||[];this.render()}})});