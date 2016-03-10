var keystone = require('keystone');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res);
	var locals = res.locals;
	
  // Init locals
	locals.section = 'about';
	locals.filters = {
		category: req.params.category
	};
	locals.data = {	};
	
	// Load the products
	view.on('init', function(next) {
		var q = keystone.list('Page').model.find()
                        .where('slug', '56b7993dcf8474fc015385c9');

		q.exec(function(err, results) {
			locals.data.pageInfo=results[0];
			next(err);
		});
	});
	
	// Render the view
	view.render('about');
	
};
