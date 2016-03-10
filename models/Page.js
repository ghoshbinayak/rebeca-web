var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Page Model
 * ==========
 */

var Page = new keystone.List('Page', {
	map: { name: 'name' },
	autokey: { path: 'slug', from: '_id', unique: true }
});

Page.add({
	name: { type: String, required: true },
	state: { type: Types.Select, options: 'draft, published, archived', default: 'draft', index: true },
	publishedDate: { type: Types.Date, index: true, dependsOn: { state: 'published' } },
        cover: { type: String, required: false },
	description: { type: Types.Html, wysiwyg: true, height: 400 },
});

Page.defaultColumns = 'name, state|20%, publishedDate|20%';
Page.register();
