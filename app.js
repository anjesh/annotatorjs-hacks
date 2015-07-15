String.prototype.trunc = function(n, useWordBoundary) {
    var toLong = this.length > n,
        s_ = toLong ? this.substr(0, n - 1) : this;
    s_ = useWordBoundary && toLong ? s_.substr(0, s_.lastIndexOf(' ')) : s_;
    return toLong ? s_ + '&hellip;' : s_;
};
var Annotation = Backbone.Model.extend({});
var AnnotationCollection = Backbone.Collection.extend({
    model: Annotation
});
var AnnotationCategory = Backbone.Model.extend({});
var AnnotationCategories = Backbone.Collection.extend({
    model: AnnotationCategory
});
var AnnotatorjsView = Backbone.View.extend({
    initialize: function(options) {
        this.annotationCategories = options.annotationCategories;
        this.listenTo(this.annotationCategories, 'reset', this.populateCategories);
        this.content = $(this.el).annotator();
        this.content.annotator('addPlugin', 'MyTags');
        this.content.annotator('addPlugin', 'AnnotatorEvents');
        this.content.data('annotator').plugins.MyTags.availableTags = options.availableTags
        this.content.data('annotator').plugins.AnnotatorEvents.collection = options.collection;
        return this;
    },
    populateCategories: function() {
        this.content.annotator('addPlugin', 'Categories', {
            category: this.annotationCategories.pluck('name')
        });
    },
    render: function() {
        return this;
    }
});
var AnnotationItemView = Backbone.View.extend({
    tagName: "li",
    className: 'annotation-item',
    initialize: function() {
        this.template = _.template($('#annotation-item-view-template').html());
    },
    render: function() {
        this.$el.html(this.template(this.model.attributes));
        return this;
    }
});
var AnnotationsListView = Backbone.View.extend({
    initialize: function(options) {
        this.annotationCategories = options.annotationCategories;
        this.listenTo(this.annotationCategories, 'resetAnnotationsList', this.resetAnnotationsList);
        this.listenTo(this.annotationCategories, 'reset', this.render);
        this.listenTo(this.collection, 'annotationCreated', this.render);
        this.listenTo(this.collection, 'annotationUpdated', this.render);
        this.listenTo(this.collection, 'annotationDeleted', this.render);
        return this;
    },
    resetAnnotationsList: function(e) {
        var annotationsByCategories = this.collection.groupBy('category');
        switch(e) {
            case 'done-annotated':
                $(this.el).html('');
                this.renderAnnotationWithCategories(annotationsByCategories);
                if(_.keys(annotationsByCategories).length === 0) {
                    $(this.el).html('Oops! You haven\'t annotated anything');
                }
                break;
            case 'not-annotated':
                $(this.el).html('');
                this.renderBlankCategories(annotationsByCategories);
                break;
            default:
                this.render();                
        }
    },
    render: function() {
        var self = this;
        $(self.el).html('');
        var annotationsByCategories = this.collection.groupBy('category');
        this.renderBlankCategories(annotationsByCategories);
        this.renderAnnotationWithCategories(annotationsByCategories);
        return this;
    },
    renderBlankCategories: function(annotationsByCategories) {
        var t = _.template($('#annotation-category-no-items-template').html());
        var self = this;
        this.annotationCategories.each(function(category) {
            if (_.indexOf(_.keys(annotationsByCategories), category.get('name')) === -1) {
                $(self.el).append(t({
                    'categoryName': category.get('name').trunc(40)
                }));
            }
        });
    },
    renderAnnotationWithCategories: function(annotationsByCategories) {
        var self = this;
        if (annotationsByCategories !== undefined && _.keys(annotationsByCategories).length > 0) {
            var t = _.template($('#annotation-category-with-items-template').html());
            for (var annotationCategoryName in annotationsByCategories) {
                var annotationsGroup = annotationsByCategories[annotationCategoryName];
                annotationCategoryElemId = annotationCategoryName.replace(/\s+|;|,/g, '-');
                $(self.el).append(t({
                    'elemId': annotationCategoryElemId,
                    'categoryName': annotationCategoryName.trunc(40),
                    'categoryItemsCount': annotationsGroup.length
                }));
                _.each(annotationsGroup, function(annotation) {
                    $("#" + annotationCategoryElemId).append(new AnnotationItemView({
                        model: annotation
                    }).render().el);
                })
            }
        }
    }
});
var AnnotationsTitleView = Backbone.View.extend({
    events: {
        "click #done-annotated": 'resetListView',
        "click #not-annotated": 'resetListView',
        "click #all": 'resetListView',
    },
    initialize: function(options) {
        _.bindAll(this, 'resetListView');
        this.template = _.template($('#annotation-list-title-template').html());
        this.annotationCategories = options.annotationCategories;
        this.listenTo(this.annotationCategories, 'reset', this.render);
        this.listenTo(this.collection, 'annotationCreated', this.render);
        this.listenTo(this.collection, 'annotationUpdated', this.render);
        this.listenTo(this.collection, 'annotationDeleted', this.render);
        return this;
    },
    render: function() {
        var totalCategories = this.annotationCategories.length;
        var categoriesWithAnnotationCount = _.keys(this.collection.groupBy('category')).length;
        $(this.el).html(this.template({total: totalCategories, done: categoriesWithAnnotationCount, remaining: totalCategories-categoriesWithAnnotationCount }));
        return this;
    },
    resetListView: function(e) {
        e.preventDefault();
        this.annotationCategories.trigger('resetAnnotationsList', e.target.id);
    }
});