(function () {

    'use strict';

    var App = {
        Models: {},
        Views: {},
        Collections: {},
        Routes: {},
        helpers: {}
    };

    // Models
    App.Models.Story = Backbone.Model.extend({
    });

    App.Models.Videos = Backbone.Model.extend({

    });

    //Collections
    App.Collections.Stories = Backbone.Collection.extend({
        model: App.Models.Story,
        url: './data/news.json',
        parse: function (resp) {
            return resp.posts;
        }
    });

    App.Collections.Videos = Backbone.Collection.extend({
        model: App.Models.Video,
        url: '',
        parse: function (resp) {
            return resp.items;
        }
    });

    //Views
    App.Views.App = Backbone.View.extend({

        template: Handlebars.compile($('#storiesTpl').html()),

        initialize: function () {
            App.helpers.jsonfetch();
            App.helpers.mediator.on('collection:loaded', this.render, this);
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

    //Header
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

    //Sigle story (list view)
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

    // Story Collection List View
    App.Views.Stories = Backbone.View.extend({
        el: '#list-content',

        initialize: function () {
            this.render();
            App.helpers.upDate();
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

    //Nav Panel
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

    //Featured Story
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

    // Full Story
    App.Views.FullStory = Backbone.View.extend({
        template: Handlebars.compile($('#fullStoryTpl').html()),

        events: {
            'click #next-page': 'getNextPage',
            'click #prev-page': 'getPrevPage',
            'panleft': 'handleSwipe',
            'panright': 'handleSwipe'
        },

        initialize: function () {
            this.render();
        },

        handleSwipe: function (e) {
            var panel = $('#right-panel');
            if (panel.hasClass('show-panel')) {
                if (e.type === 'panleft') {
                    panel.removeClass('show-panel');

                }
            } else {
                if (e.type === 'panleft') {
                    console.log(e);
                    this.getNextPage();
                } else {
                    this.getPrevPage();
                }
            }
        },

        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            this.pagination();
            this.$el.hammer();
        },

        getCurrentIndex: function () {
            return this.model.collection.indexOf(this.model);
        },

        getNextPage: function () {
            var currentIndex = this.getCurrentIndex(), nextPageId;
            if (currentIndex <= 18) {
                nextPageId = this.model.collection.at(currentIndex + 1).get('id');
                App.helpers.mediator.trigger('nextpage', nextPageId);
            } else {
                //do something relevant or nothing? hmmm...
            }

        },

        getPrevPage: function () {
            var currentIndex  = this.getCurrentIndex(), prevPageId;

            if (currentIndex >= 1) {
                prevPageId = this.model.collection.at(currentIndex - 1).get('id');
                App.helpers.mediator.trigger('prevpage', prevPageId);
            } else {
                $($('#right-panel').addClass('show-panel'));
            }
        },

        pagination: function () {
            var index = this.getCurrentIndex() + 1,
                length = this.model.collection.length;
            this.$el.find('.pagenav').html('<span class="current-index">' + index + '</span> of <span class="total-pages">' + length + '</span>');
        }
    });

    //Router
    App.Routes.Kickstart = Backbone.Router.extend({
        routes: {
            '': 'start',
            'story/:id': 'singlePage',
            'news': 'homeButton',
            'radio': 'radio',
            'videos': 'videos',
            'photos': 'photos'
        },

        initialize: function () {
            this.headerView = new App.Views.HeaderView();
            this.navPanel = new App.Views.NavPanel();
            $('.header').html(this.headerView.el);

            App.helpers.mediator.on('nextpage', this.gotoPage, this);
            App.helpers.mediator.on('prevpage', this.gotoPage, this);
        },

        gotoPage: function (id) {
            this.navigate('story/' + id, {trigger: true});
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
                    App.helpers.mediator.trigger('collection:loaded', theCollection);
                }
            });
        },

        singlePage: function (id) {
            var model;

            if (!this.news) {
                var collection = new App.Collections.Stories();
                collection.fetch({
                    success: function () {
                        var fullStory = new App.Views.FullStory({model: collection.get(id)});
                        $('#appMain').html(fullStory.el);
                        $('html,body').animate({ scrollTop: 0 }, 'slow');
                    },

                });

            } else {
                model = this.news.get(id);
                this.fullStory = new App.Views.FullStory({model: model});
                $('#appMain').html(this.fullStory.el);
                $('html,body').animate({ scrollTop: 0 }, 'slow');
            }

            App.helpers.upDate();

        }
    });

    //Helper functions
    App.helpers = {
        mediator: _.extend({}, Backbone.Events),

        before: function (decoration) {
            return function (method) {
                return function () {
                    decoration.apply(this, arguments);
                    return method.apply(this, arguments);
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