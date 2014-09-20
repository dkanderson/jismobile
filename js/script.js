(function () {

    'use strict';

    var App = {
        Models: {},
        Views: {},
        Collections: {},
        Routes: {},
        Helpers: {}
    };

    App.Models.Story = Backbone.Model.extend({
        urlRoot: '/story'
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
            App.Helpers.jsonfetch();
            App.Helpers.mediator.on('collection:loaded', this.render, this);
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
            App.Helpers.upDate();
        },

        render: function () {
            var newCollection = _(this.collection.rest(1));
            newCollection.each(this.populate, this);
            return this;
        },

        populate: function (stories) {
            var story = new App.Views.Story({model: stories});
            this.$el.append(story.render().el);
        },

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

    App.Views.FullStory = Backbone.View.extend({
        template: Handlebars.compile($('#fullStoryTpl').html()),

        initialize: function () {
            this.render();

        },

        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            this.updateIndex();
        },

        updateIndex: function () {
            var index = this.model.collection.indexOf(this.model) + 1,
                length = this.model.collection.length;
            this.$el.find('.pagenav').html('<span class="current-index">' + index + '</span> of <span class="total-pages">' + length + '</span>');
        }
    });

    App.Routes.Kickstart = Backbone.Router.extend({
        routes: {
            '': 'start',
            'story/:id': 'singlePage',
            'news': 'homeButton'
        },

        initialize: function () {
            this.headerView = new App.Views.HeaderView();
            this.navPanel = new App.Views.NavPanel();
            $('.header').html(this.headerView.el);



        },

        homeButton: function () {
            this.start();
        },

        start: function () {
            this.app = new App.Views.App();
            $('#appMain').html(this.app.el);
            this.news = new App.Collections.Stories();
            this.news.fetch({
                success: function (theCollection) {
                    App.Helpers.mediator.trigger('collection:loaded', theCollection);
                }
            });
        },

        singlePage: function (id) {
            var model;

            if (!this.news) {
                var collection = new App.Collections.Stories();
                collection.fetch({
                    success: function (collection) {
                        var fullStory = new App.Views.FullStory({model: collection.get(id)});
                        $('#appMain').html(fullStory.el);
                    }
                });

            } else {
                model = this.news.get(id);
                this.fullStory = new App.Views.FullStory({model: model});
                $('#appMain').html(this.fullStory.el);
            }

            App.Helpers.upDate();

        }
    });

    App.Helpers = {
        mediator: _.extend({}, Backbone.Events),

        before: function () {
            return function before(decoration) {
                return function (method) {
                    return function () {
                        decoration.apply(this, arguments);
                        return method.apply(this, arguments);
                    };
                };
            };
        },

        cleanBefore: function () {
            return this.before(function () {
                if (this.currentView) {
                    this.currentView.remove();

                    if (this.currentView.children) {
                        _(this.currentView.children).invoke('remove');
                    }

                    delete this.currentView;
                }
            });
        },

        upDate: function () {
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

        },

        jsonfetch: function () {
            console.log('fetching...');
        }
    };

    App.kickstart = new App.Routes.Kickstart();
    Backbone.history.start();

}());