module.exports = function(app) {
	// Set items per page for this module
	var items_per_page = 5;
	// 
	var router = app.get('express').Router();
	var ObjectId = require('mongodb').ObjectID;
	var i18nm = new (require('i18n-2'))({    
	    locales: app.get('config').locales,
	    directory: app.get('path').join(__dirname, 'lang'),
	    extension: '.js'
	});
	router.get_module_name = function(req) {
		i18nm.setLocale(req.i18n.getLocale());	
		return i18nm.__("module_name");
	};	
	router.get('/', function(req, res) {
		i18nm.setLocale(req.i18n.getLocale());		
		// Check authorization
		if (!app.get('auth').check(req)) {
			res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
			return;
		}		
		var body = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'user_control', { lang: i18nm });
		app.get('cp').render(req, res, { body: body, css: '<link rel="stylesheet" href="/modules/user/css/main.css">' + "\n\t\t" }, i18nm, 'users' );			
	});
	router.post('/data/list', function(req, res) {
		var rep = { ipp: items_per_page };
		var skip = req.body.skip;
		i18nm.setLocale(req.i18n.getLocale());
		if (typeof skip != 'undefined') {		
			if (!skip.match(/^[0-9]{1,10}$/)) {
				rep.status = 0;
				rep.error = i18nm.__("invalid_query");
				res.send(JSON.stringify(rep));
				return;
			}
		}		
		// Check authorization
		if (!app.get('auth').check(req)) {
			rep.status = 0;
			rep.error = i18nm.__("unauth");
			res.send(JSON.stringify(rep));
			return;
		}
		// Get users from MongoDB
		rep.users = [];
		var collection = app.get('mongodb').collection('users');
		var data = app.get('mongodb').collection('users').find().count(function (err, items_count) {			
			if (!err && items_count > 0) {
				rep.total = items_count;
				var data = app.get('mongodb').collection('users').find({}, { skip: skip, limit : items_per_page }).toArray(function(err, items) {			
					if (typeof items != 'undefined' && !err) {
						// Generate array
						for (var i=0; i < items.length; i++) {
							var arr = [];
							arr.push(items[i]._id);
							arr.push(items[i].username);
							arr.push(items[i].realname);
							arr.push(items[i].email);
							arr.push(items[i].status);
							rep.users.push(arr);
						}
					}
					// Return results
					rep.status = 1;
					res.send(JSON.stringify(rep));
				}); // data
			} else { // Error or count = 0
				rep.status = 1;
				rep.total = '0';
				res.send(JSON.stringify(rep));
			}
		});	// count
	});
	router.post('/data/load', function(req, res) {
		var rep = {};
		var user_id = req.body.id;
		i18nm.setLocale(req.i18n.getLocale());
		if (typeof user_id == 'undefined' || !user_id.match(/^[a-f0-9]{24}$/)) {
			rep.status = 0;
			rep.error = i18nm.__("invalid_query");
			res.send(JSON.stringify(rep));
			return;
		}		
		// Check authorization
		if (!app.get('auth').check(req)) {
			rep.status = 0;
			rep.error = i18nm.__("unauth");
			res.send(JSON.stringify(rep));
			return;
		}
		// Get users from MongoDB
		rep.user = {};
		var collection = app.get('mongodb').collection('users');
		var data = app.get('mongodb').collection('users').find( { _id: new ObjectId(user_id) }, { limit : 1 }).toArray(function(err, items) {			
			if (typeof items != 'undefined' && !err) {
				if (items.length > 0) {
					rep.user = items[0];
					delete(rep.user.password);
				}
			}
			// Return results
			rep.status = 1;
			res.send(JSON.stringify(rep));
		});
	});
	router.post('/data/save', function(req, res) {
		var rep = {
			err_fields: [],
			status: 1
		};	
		var username = req.body.username,
		    password = req.body.password,
		    email = req.body.email,
		    realname = req.body.realname,
		    status = req.body.status,
		    id = req.body.id;
		if (typeof id != 'undefined') {
			if (!id.match(/^[a-f0-9]{24}$/)) {
				rep.status = 0;
				rep.error = i18nm.__("invalid_query");
				res.send(JSON.stringify(rep));
				return;
			}
		}
		if (!username.match(/^[A-Za-z0-9_\-]{3,20}$/)) {
			rep.status = 0;
			rep.err_fields.push('username');
		}
		if (!email.match(/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/)) {
			rep.status = 0;
			rep.err_fields.push('email');
		}
		if (!realname.match(/^(([\wА-Яа-я])+([\wА-Яа-я\-\']{0,1})([\wА-Яа-я])\s([\wА-Яа-я])+([\wА-Яа-я\-\']{0,1})([\wА-Яа-я])+){0,40}$/)) {
			rep.status = 0;
			rep.err_fields.push('realname');
		}
		if (!status.match(/^[0-2]{1}$/)) {
			rep.status = 0;
			rep.err_fields.push('status');
		}
		if (!id) {
			if (!password.match(/^[.]{5,20}$/)) {
				rep.status = 0;
				rep.err_fields.push('password');
				rep.err_fields.push('password-repeat');
			}
		}
		if (rep.status == 0) {
			res.send(JSON.stringify(rep));
			return;
		}
		if (id) {
			var data = app.get('mongodb').collection('users').find( { _id: new ObjectId(id) }, { limit : 1 }).toArray(function(err, items) {			
				if (typeof items != 'undefined' && !err) {
					if (items.length > 0) {
						var update = { username: username, email: email, realname: realname, status: status };
						if (id) {
							update.password = password;
						}
						app.get('mongodb').collection('users').update( { _id: new ObjectId(id) }, update, function() {
							rep.status = 1;
							res.send(JSON.stringify(rep));
						} );
						return;
					}
				} else {
					rep.status = 0;
					rep.error = i18nm.__("id_not_found");
					res.send(JSON.stringify(rep));
				}				
			});
		} else {

		}
	});
	return router;
}