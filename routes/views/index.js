var keystone = require('keystone');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res);
	var locals = res.locals;
	
  // Init locals
	locals.section = 'home';
	locals.filters = {
		category: req.params.category
	};
	locals.data = {
		events: []
	};
	
	// Load the events
	view.on('init', function(next) {
		var q = keystone.list('Event').paginate({
				page: req.query.page || 1,
				perPage: 50,
				maxPages: 10
			})
			.where('state', 'published')
			.sort('-publishedDate');
		
		//if (locals.data.category) {
			//q.where('categories').in([locals.data.category]);
		//}
		q.exec(function(err, results) {
			locals.data.events = results;
			next(err);
		});
	});
	
	// Render the view
	view.render('index');
	
};
