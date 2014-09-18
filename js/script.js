(function () {

    'use strict';

    window.vent = _.extend({}, Backbone.Events);

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
        parse: function (resp) {
            return resp.posts;
        }
    });

    App.Views.App = Backbone.View.extend({

        template: Handlebars.compile($('#storiesTpl').html()),

        initialize: function () {
            window.vent.on('collection:loaded', this.render, this);
        },

        render: function (theCollection) {
            this.$el.html(this.template);

            this.stories = new App.Views.Stories({collection: theCollection});
            this.featured = new App.Views.Featured({collection: theCollection});

            this.$el.append(this.featured.$el);
            this.$el.append(this.dividerBar());
            this.$el.append(this.stories.$el);

            return this;
        },

        dividerBar: function () {
            return '<h3 id="featured-tb">Featured Stories</h3>';

        }
    });

    App.Views.HeaderView = Backbone.View.extend({
        tagName: 'header',

        className: 'main-header',

        template: Handlebars.compile($('#headerTpl').html()),

        events: {
            'click .mobile-trigger': 'openPanel',
        },

        initialize: function () {
            this.render();
        },

        render: function () {
            this.$el.html(this.template);
        },

        openPanel: function (e) {
            e.preventDefault();
            $('#right-panel').toggleClass('show-panel');
        }
    });

    App.Views.Story = Backbone.View.extend({
        tagName: 'li',

        template: Handlebars.compile($('#storyTpl').html()),

        initialize: function () {
            this.render();
        },

        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });

    App.Views.Stories = Backbone.View.extend({
        el: '#list-content',

        initialize: function () {
            this.render();
            this.prettyDate();
        },

        render: function () {
            this.collection.each(this.populate, this);
            return this;
        },

        populate: function (stories) {
            var story = new App.Views.Story({model: stories});
            this.$el.append(story.render().el);
        },

        prettyDate: function () {
            // Takes an ISO time and returns a string representing how
            // long ago the date represents.
            function prettyDate(time) {
                var date = new Date((time || "").replace(/-/g, "/")),
                    diff = (((new Date()).getTime() - date.getTime()) / 1000),
                    day_diff = Math.floor(diff / 86400);

                if (isNaN(day_diff) || day_diff < 0 || day_diff >= 365) {
                    return;
                }

                return ((day_diff === 0 && diff < 60 && "just now") ||
                        (diff < 120 && "1 minute ago") ||
                        (diff < 3600 && (Math.floor(diff / 60) + " minutes ago")) ||
                        (diff < 7200 && "1 hour ago") ||
                        (diff < 86400 && Math.floor(diff / 3600) + " hours ago")) ||
                    (day_diff === 1 && "Yesterday") ||
                    (day_diff < 7 && day_diff + " days ago") ||
                    (day_diff < 31 && Math.ceil(day_diff / 7) + " weeks ago") ||
                    (day_diff < 365 && Math.ceil(day_diff / 12) + " months ago");
            }

            function prettyLinks() {
                var i, pdate, links = document.getElementsByClassName('date');
                for (i = 0; i < links.length; i += 1) {
                    if (links[i].title) {
                        pdate = prettyDate(links[i].title);

                        if (pdate) {
                            links[i].innerHTML = pdate;
                        }
                    }
                }
            }
            prettyLinks();
            setInterval(prettyLinks, 5000);

        }
    });

    App.Views.NavPanel = Backbone.View.extend({
        el: '#right-panel',

        template: $('#navTpl').html(),

        initialize: function () {
            this.render();
        },

        render: function () {
            this.$el.html(this.template);
            return this;
        }
    });

    App.Views.Featured = Backbone.View.extend({
        el: '#featured',

        template: Handlebars.compile($('#featuredTpl').html()),

        initialize: function () {
            this.render();
        },

        render: function () {
            this.$el.html(this.template(this.collection.at(0).toJSON()));
            return this;
        }
    });

    App.Routes.Kickstart = Backbone.Router.extend({
        routes: {
            '': 'start',
            '/:id': 'singlePage'
        },

        initialize: function () {
            this.headerView = new App.Views.HeaderView();
            this.navPanel = new App.Views.NavPanel();
            $('.header').html(this.headerView.el);
        },

        start: function () {
            this.app = new App.Views.App();
            $('#appMain').html(this.app.el);
            this.news = new App.Collections.Stories();
            this.news.fetch({
                success: function (theCollection) {
                    window.vent.trigger('collection:loaded', theCollection);
                }
            });
        },

        singlePage: function (id) {
            console.log(id);
        }
    });

    App.kickstart = new App.Routes.Kickstart();
    Backbone.history.start();

}());