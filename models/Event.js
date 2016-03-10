var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Product Model
 * ==========
 */

var Event = new keystone.List('Event', {
	map: { name: 'name' },
	autokey: { path: 'slug', from: 'title', unique: true }
});

Event.add({
	name: { type: String, required: true },
	state: { type: Types.Select, options: 'draft, published, archived', default: 'draft', index: true },
	publishedDate: { type: Types.Date, index: true, dependsOn: { state: 'published' } },
        cover: { type: String, required: true, default: '/images/event-tile-cover.jpg' },
	images: { type: Types.TextArray },
	description: { type: Types.Html, wysiwyg: true, height: 400 },
	categories: { type: Types.Relationship, ref: 'EventCategory', many: true }
});

Event.schema.virtual('description.full').get(function() {
	return this.description.extended || this.description.brief;
});

Event.defaultColumns = 'name, state|20%, publishedDate|20%';
Event.register();
