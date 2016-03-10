var keystone = require('keystone');

/**
 * ProductCategory Model
 * ==================
 */

var EventCategory = new keystone.List('EventCategory', {
	autokey: { from: 'name', path: 'key', unique: true }
});

EventCategory.add({
	name: { type: String, required: true }
});

EventCategory.relationship({ ref: 'Event', path: 'categories' });

EventCategory.register();
