var Annotation = Backbone.Model.extend({});
var AnnotationCollection = Backbone.Collection.extend({
    model: Annotation
});
var AnnotatorjsView = Backbone.View.extend({
    initialize: function(options) {
        this.options = options;
        this.content = $(this.el).annotator();
        this.content.annotator('addPlugin', 'MyTags');
        this.content.annotator('addPlugin', 'AnnotatorEvents');
        var tags = this.content.data('annotator').plugins.MyTags
        tags.availableTags = this.options.availableTags;
        var annotatorEvents = this.content.data('annotator').plugins.AnnotatorEvents
        annotatorEvents.collection = this.options.collection;
        return this;
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
        this.listenTo(this.collection, 'annotationCreated', this.render);
        this.listenTo(this.collection, 'annotationUpdated', this.render);
        this.listenTo(this.collection, 'annotationDeleted', this.render);
        return this;
    },
    render: function() {
        var self = this;
        $(self.el).html('');
        $(self.el).append('<ul>');
        this.collection.each(function(annotation) {
            $(self.el).find("ul").append(new AnnotationItemView({
                model: annotation
            }).render().el);
        });
        return this;
    }
});
var AnnotationsTitleView = Backbone.View.extend({
    initialize: function(options) {
        this.listenTo(this.collection, 'annotationCreated', this.render);
        this.listenTo(this.collection, 'annotationDeleted', this.render);
        return this;
    },
    render: function() {
        $(this.el).html('<b>Annotations</b>');
        if(this.collection.length)
            $(this.el).append(" [ " + this.collection.length + " ]");
        return this;
    }
});