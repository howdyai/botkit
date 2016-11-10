var _ = require('underscore'),
	fast_bindall = require('fast_bindall'),
	id_utilities = require('./id_utilities'),
	type_ids = require('./type_ids'),
	async = require('async'),
	socket_client = require('socket.io-client'),
	event_emitter = require('events').EventEmitter,
	https = require('https');

var Glip = function(options) {
	_.extend(this, options);
	fast_bindall(this);
	this.handlers = [];
	this.type_ids = type_ids;
	this.scoreboard_url = 'https://' + this.host + ':' + this.port;
	this.request_callbacks = {};
	this.request_count = 1;
	this.has_processed = {};
};

_.extend(Glip.prototype, event_emitter.prototype, id_utilities.prototype, {
	start: function() {
		async.series([
			this.get_scoreboard,
			this.init_socket,
			this.signin,
			this.get_initial_data,
			this.init_socket,
			this.connect
		], this.finish);
	},
	finish: function(error) {
		if (error) {
			return this.handle_error(error);
		}
		console.warn("UP AND RUNNING");
    this.emit('started');
	},
	connect: function(callback) {
		this.emit('connect');
		return process.nextTick(callback);
	},
	get_scoreboard: function(callback) {
		var self = this;
		https.get(this.scoreboard_url, function(response) {
			var data = '';
			response.on('data', function(chunk) {
				data += chunk;
			});
			response.on('end', function() {
				var match = data.match(/\"scoreboard\":.*?\"(.*?):/);
				self.sexio_host = hostname = match[1];
				return process.nextTick(callback);
			});
		});
	},
	init_socket: function(callback) {
		var opts = { };
		if (this.cookie) {
			opts.extraHeaders = {
				Cookie: this.cookie
			};
		}
		console.warn("cookie:", this.cookie);
		this.socket = socket_client.connect('https://' + this.sexio_host + ':' +  this.port, opts);
		this.socket.once('connect', callback);
		this.socket.on('event', this.handle_event);
		this.socket.on('message', this.handle_message);
		this.socket.on('response', this.handle_response);
		this.socket.on('disconnect', this.handle_disconnect);
		this.socket.on('error', this.handle_error);
		this.socket.on('connect_error', this.handle_error);
		this.socket.on('connect_timeout', this.handle_error);
		this.socket.on('reconnect_error', this.handle_error);
		this.socket.on('reconnect_failed', this.handle_error);
	},
	handle_error: function(error) {
		if (error) {
			console.warn("ERROR:", error);
		}
	},
	signin: function(callback) {
		var self = this;
		this.request(
			'/api/login',
			'PUT',
			{
				email: this.user,
				password: this.password,
				rememberme: true,
				_csrf: null
			},
			function(error, data) {
				if (error) { return callback(data); }
				self.auth = data['X-Authorization'];
				self.cookie = data.set_cookie.map(function(cookie) {
					var parts = cookie.split(/\;/);
					return parts[0];
				}).join("; ");
				if (!self.cookie) { return callback("Unable to authenticate"); }
				return process.nextTick(callback);
			}
		);
	},
	request: function(uri, method, params, callback) {
		params.request_id = this.request_count;
		this.request_callbacks[this.request_count] = callback;
		this.request_count++;
		this.socket.emit(
			'request',
			{
				uri: uri,
				parameters: params,
				method: method
			}
		);
	},
	handle_response: function(data) {
		if (
			data &&
			data.request &&
			data.request.parameters &&
			data.request.parameters.request_id
		) {
			var request_id = data.request.parameters.request_id;
			if (this.request_callbacks[request_id]) {
				return this.request_callbacks[request_id](null, data);
			}
		}
	},
	handle_event: function(event) {
		//console.warn("SOCKET EVENT:", event);
	},
	handle_message: function(message_raw) {
		var message;
		try {
			message = JSON.parse(message_raw);
		} catch(error) {
			console.warn(error);
		}
		if (!message.body || !message.body.objects) { return; }
		async.forEach(message.body.objects, this.process_object_group, this.handle_error);
	},
	process_object_group: function(object_group, callback) {
		async.forEach(object_group, this.process_object, callback);
	},
	process_object: function(object, callback) {
		var id = object._id;
		if (this.has_processed[id]) { return process.nextTick(callback); }
		this.has_processed[id] = true;
		var type = id_utilities.prototype.extract_type(id);
		this.emit('message', type, object);
		return process.nextTick(callback);
	},
	post: function(group_id, text, item_ids, item_data) {
		items_ids = item_ids || [];
		var self = this;
		var post = {
			created_at: +new Date(),
			creator_id: this.user_id,
			is_new: true,
			item_ids: item_ids,
			group_id: group_id,
			text: text,
			item_data: item_data,
			at_mention_item_ids: [],
			at_mention_non_item_ids: [],
			from_group_id: group_id,
			post_ids: []
		};
		this.request(
			'/api/post',
			'POST',
			post,
			function(error, data) {
//				console.warn(error, data, post);
			}
		);
	},
	post_file_from_url: function(group_id, url, text) {
		var self = this;
		this.file_from_url(url, function(error, data) {
			if (error) { return console.warn("ERROR POSTING FILE:", error); }
			self.file_from_stored_file(data.body, group_id, function(error, file_response) {
				if (error) { return console.warn(error); }
				var file = file_response.body;
				var item_data = { version_map: {}};
				item_data.version_map[file._id] = 1;
				self.post(group_id, text, [file._id], item_data);
			});
		});
	},
	file_from_stored_file: function(stored_file, group_id, callback) {
		var matches = stored_file.download_url.match(/.*\/(.*)$/);
		if (!matches) { return console.warn("NO MATCHES"); }
		var name = matches[1].replace(/\?.*$/,'');
		var ext_matches = name.match(/.*\.(.*)$/);
		var ext = ext_matches ? ext_matches[1] : 'unknown';
		this.request(
			'/api/file',
			'POST',
			{
				creator_id: this.user.id,
				group_ids: [group_id],
				is_new: true,
				name: name,
				no_post: true,
				source: 'web',
				type: ext,
				versions: [
					{
						download_url: stored_file.download_url,
						size: stored_file.size,
						stored_file_id: stored_file._id,
						url: stored_file.storage_url
					}
				]
			},
			callback
		);
	},
	file_from_url: function(url, callback) {
		this.request(
			'/api/file-from-url',
			'POST',
			{
				url: url,
				for_file_type: true
			},
			callback
		);
	},
    get_group_data: function(member_id, creator_id, callback){
        var self = this;
        var group_param = {
            members: [member_id, creator_id],
            creator_id: creator_id
        }
        this.request(
            '/api/group',
            'POST',
            group_param,
            callback);

    },
	handle_disconnect: function(reason) {
		if (!reason.match(/io client disconnect/)) {
			console.warn("DISCONNECTED:", reason);
		}
	},
	get_initial_data: function(callback) {
		var self = this;
		this.request(
			'/api/index',
			'GET',
			{},
			function(error, pack) {
				var data = pack.body;
				self.user_id = data.user_id;
				var parts = data.scoreboard.split(/\:/);
				self.sexio_host = parts[0];
				self.port = parts[1];
				self.initial_data = data;
				self.socket.close();
				self.emit('initial_data', self.initial_data);
				return process.nextTick(callback);
			}
		);
	},
	use: function(handler_def, opts) {
		opts = opts || {};
		opts.glip = this;
		this.handlers.push(new handler_def(opts));
	}
});

module.exports = Glip;
