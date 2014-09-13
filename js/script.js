( function () {

     'use strict';



     var App = {    
        Models: {},
        Views: {},
        Collections: {},
        Routes: {},
        Helpers: {}
     };

     App.Models.Story = Backbone.Model.extend({
     });

     App.Collections.Stories = Backbone.Collection.extend({
        model: App.Models.Story,
        url: './data/news.json',
        parse: function(resp){
            return resp.posts;
        }
     });
     App.Views.Story = Backbone.View.extend({
        tagName: 'li',

        template: Handlebars.compile($('#storyTpl').html()),

        initialize: function(){
            this.render();
        },

        render: function(){
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
     });

     App.Views.Stories = Backbone.View.extend({
         el: '#list-content',

         initialize: function(){
            this.render();
            this.prettyDate();
         },

         render:function(){
            this.collection.each(this.populate, this);
            return this;
         },

         populate: function(stories){
            var story = new App.Views.Story({model: stories});
            this.$el.append(story.render().el);
         },

         prettyDate: function(){
            // Takes an ISO time and returns a string representing how
            // long ago the date represents.
            function prettyDate(time){
                var date = new Date((time || "").replace(/-/g,"/")),
                    diff = (((new Date()).getTime() - date.getTime()) / 1000),
                    day_diff = Math.floor(diff / 86400);

                if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 365 )
                    return;

               return day_diff == 0 && ( diff < 60 && "just now" ||
                        diff < 120 && "1 minute ago" ||
                        diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
                        diff < 7200 && "1 hour ago" ||
                        diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
                    day_diff == 1 && "Yesterday" ||
                    day_diff < 7 && day_diff + " days ago" ||
                    day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago" ||
                    day_diff < 365 && Math.ceil( day_diff / 12 ) + " months ago";
            }

            function prettyLinks(){
                var links = document.getElementsByClassName('date');
                for ( var i = 0; i < links.length; i++ )
                    if ( links[i].title ) {
                        var pdate = prettyDate(links[i].title);

                        if ( pdate )
                            links[i].innerHTML = pdate;
                    }
            }
            prettyLinks();
            setInterval(prettyLinks, 5000);

         }
     });
     
     App.Routes.Kickstart = Backbone.Router.extend({
        routes: {
            '': 'start'
        },
        start: function(){
            var news = new App.Collections.Stories();
                 news.fetch({
                    success: function(theCollection){
                        console.log(theCollection);
                        var s = new App.Views.Stories({collection: theCollection});
                 }
             });
        }
     })
     
     

var x = new App.Routes.Kickstart();
Backbone.history.start();

}());