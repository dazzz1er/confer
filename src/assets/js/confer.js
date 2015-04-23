;( function( window ) {

	function Confer(overlay, conversation_list, current_user_id, options)
	{
	    
	    this.overlay = overlay;
	    this.overlay_content = overlay.find('div.confer-overlay-content');
	    this.loader = overlay.find('img.confer-overlay-loader');
	    this.bar_loader = overlay.find('img.confer-bar-loader');
	    this.context_menu = $('div.confer-conversation-context-menu');
	    this.open_conversation_list = conversation_list;
	    this.current_user = current_user_id;

	    $.extend(this.options, options);
	    this._init();

	}

	Confer.prototype.options = {

		pusher_key : false,
		base_url : '',
		token : false,
		messages_trigger : $('a#messages_open_icon'),
		messages_container : $('a#messages_open_icon').siblings('ul.dropdown-menu').children('li').first(),
		connection_retries : 3,
		verbose : false,
		use_sounds : true,
		grammar_enforcer : true

	};

	Confer.prototype.numberReplacer = [' zero ', ' one ', ' two ', ' three ', ' four ', ' five ', ' six ', 'seven ', ' eight ', ' nine '];

	/**
	 * Initialise confer
	 *
	 * Checks if Pusher has been loaded, and cancels load if not
	 * 
	 * @return boolean
	 */
	Confer.prototype._init = function()
	{

		var self = this;

		this._initVariables();
		if ( ! this._initPusher())
		{
			return false;
		}
		this._initEvents();

		// Timeout is needed to wait for Pusher auth
		setTimeout(function() {
			self._restorePusherForOpenChats();
			self._restoreRequestedConversationCheckingForMessages();
		}, 200);
		
		if (self.options.verbose) console.log('Confer: started');
	    return true;

	};

	Confer.prototype._restorePusherForOpenChats = function()
	{

		var self = this;

		self.open_conversation_list.find('li').not('[data-conversationId=1]').each(function(index, value) {
			self.beginCheckingForMessages({ id : $(this).attr('data-conversationId') });
		});

	}

	/**
	 * Initialise the variables required for confer to function
	 * 
	 * @return {[type]} [description]
	 */
	Confer.prototype._initVariables = function()
	{

		var self = this;

		self.open_conversation = false;
		self.last_loaded_conversation = 0;
		self.most_previous_message_id = false;

	}

	/**
	 * Initialise Pusher and subscribe to the relevant events
	 * 
	 * @return boolean
	 */
	Confer.prototype._initPusher = function()
	{
	
		var self = this;

		if (typeof Pusher === "undefined")
		{
			console.log('Confer: Pusher is not loaded, failed to load chat');
			return false;
		} else if ( ! self.options.pusher_key)
		{
			console.log('Confer: Pusher key was not set or is invalid');
			return false;
		}

		this.pusher = new Pusher(self.options.pusher_key, { authEndpoint: self.options.base_url + '/confer/auth', authTransport: 'ajax', auth: { params: { _token : self.options.token } } });

		this._initPusherEvents();

		return true;

	}

	/**
	 * Initialise the events that pusher must subscribe to
	 * 
	 * @return {[type]} [description]
	 */
	Confer.prototype._initPusherEvents = function()
	{

		var self = this;

		// Subscribe to the presence channel
		self.globalchannel = self.pusher.subscribe('presence-global');
		self.globalchannel.bind('pusher:subscription_error', function(status) {
			//console.log('pusher error status: ' + status);
			self.disableConfer();
			self._initConnectionRetries('presence-global');
		});

		// Subscribe to private notification channel (for incoming chat requests)
		self.notifications = self.pusher.subscribe('private-notifications-' + self.current_user);
		self.notifications.bind('pusher:subscription_error', function(status) {
			//console.log('pusher error status: ' + status);
			self.disableConfer();
			self._initConnectionRetries('private-notifications-' + self.current_user);
			if (status == 408 || status == 503 || status == 500) {
				//self.notifications = self.pusher.subscribe('private-notifications-' + self.current_user);
			}
		});

		self.notifications.bind('ConversationWasRequested', function(info) {
			if (self.options.verbose) console.log('Confer: new conversation requested');
			if ( ! self.userIsStartingConversation(info.requester.id)) {
				self.beginCheckingForMessages(info.conversation);
				self.saveRequestedConversationToSession(info.conversation.id);
			}
		});

		self.globalchannel.bind('NewMessageWasPosted', function(info) {
			if (self.options.verbose) console.log('Confer: message received in global');
			if (parseInt(info.message.sender.id) === parseInt(self.current_user)) return;
			if (self.userIsLookingAtGlobalConversation())
			{
				self.addMessageToConversation(info.message);
			} else if (self.conversationIsInList(info.conversation.id))
			{
				self.showNewMessageForConversation(info.conversation.id);
			}
		});

		self.notifications.bind('NewMessageWasPosted', function(info) {
			if (self.options.verbose) console.log('Confer: new conversation message received');
			if (parseInt(info.message.sender.id) === parseInt(self.current_user)) return;
			if (self.userIsLookingAtConversation(info.conversation.id))
			{
				self.addMessageToConversation(info.message);
			} else if (self.conversationIsInList(info.conversation.id))
			{
				self.showNewMessageForConversation(info.conversation.id);
			} else
			{
				self.beginPrivateConversationWithUser(info.sender, info.conversation);
			}
		});

	}

	Confer.prototype._initConnectionRetries = function (channel)
	{

		var self = this;

		if (typeof self.reattemptSchedule === 'undefined')
		{
			if (self.options.verbose) console.log('Confer: initialising Pusher connection retry schedule');
			self.reattemptSchedule = setInterval(function() {
				self.reattemptConnection(channel);
			}, 60000);

			self.retryConnectionAttempts = 0;
		}

	}

	Confer.prototype.disableConfer = function ()
	{

		var self = this;

		if (self.options.verbose) console.log('Confer: disabling Confer as unable to establish connection to Pusher');
		self.open_conversation_list.closest('div.confer-open-conversations').addClass('confer-disabled');

	}

	Confer.prototype.reattemptConnection = function (channel)
	{

		var self = this;

		if (self.pusher.channel(channel)) self.reenableConfer();
		if (self.options.verbose) console.log('Confer: re-attempting connection to Pusher')
		var subscription = self.pusher.subscribe(channel);
		self.retryConnectionAttempts++;
		if (self.retryConnectionAttempts === self.options.connection_retries)
		{
			if (self.options.verbose) console.log('Confer: All connection retries done, won\'t try again till page load');
			clearInterval(self.reattemptSchedule);
		}

	}

	Confer.prototype.reenableConfer = function ()
	{

		var self = this;

		if (self.options.verbose) console.log('Confer: re-enabling Confer as connection to Pusher has been established');
		clearInterval(self.reattemptSchedule);
		self.open_conversation_list.closest('div.confer-open-conversations').removeClass('confer-disabled');

	} 

	Confer.prototype.barIsLoading = function()
	{

		var self = this;

		self.options.messages_container.append(self.bar_loader);
		self.bar_loader.show();

	}

	Confer.prototype.barFinishedLoading = function()
	{

		var self = this;

		self.bar_loader.hide();
		self.overlay.append(self.bar_loader);

	}

	Confer.prototype.addMessageToConversation = function (message)
	{
		var self = this;

		var message = self.constructConversationMessage(message);
		message.hide();
		var list = self.overlay_content.find('ul.confer-conversation-message-list');
		list.append(message);
		message.slideDown(100);
		setTimeout(function() {
			list.scrollTop(list.prop("scrollHeight"));
		}, 150);

	}

	Confer.prototype.beginCheckingForMessages = function(conversation)
	{

		var self = this;

		if (self.options.verbose) console.log('Confer: beginning to check for messages for conversation: ' + conversation.id);
		if (self.pusher.channel('private-conversation-' + conversation.id)) return;
		var channel = self.pusher.subscribe('private-conversation-' + conversation.id);
		if (self.options.verbose) console.log('Confer: subscribed to channel for conversation: ' + conversation.id);
		channel.bind('NewMessageWasPosted', function(info) {
			if (self.options.verbose) console.log('Confer: new conversation message received for conversation:' + info.conversation.id);
			if (parseInt(info.message.sender.id) === parseInt(self.current_user)) return;
			if (self.userIsLookingAtConversation(info.conversation.id))
			{
				if (self.options.verbose) console.log('Confer: user was looking at conversation: ' + info.conversation.id);
				self.addMessageToConversation(info.message);
			} else if (self.conversationIsInList(info.conversation.id))
			{
				if (self.options.verbose) console.log('Confer: the conversation (' + info.conversation.id + ') was in the open conversation list');
				self.showNewMessageForConversation(info.conversation.id);
			} else
			{
				if (self.options.verbose) console.log('Confer: needed to create the conversation in the open conversation list');
				(info.conversation.is_private ? self.beginPrivateConversationWithUser(info.sender, info.conversation) : self.beginGroupConversation(info.conversation));
			}
		});

	}

	Confer.prototype._restoreRequestedConversationCheckingForMessages = function()
	{

		var self = this;

		$.each(self.options.requested_conversations, function(index, value) {
			self.beginCheckingForMessages({ id : value });
		});

	}

	Confer.prototype.saveRequestedConversationToSession = function(conversation_id)
	{

		var self = this;

		$.ajax({
			url: self.options.base_url + '/confer/requests/session',
			type: 'POST',
			data: { conversation_id : conversation_id, _token : self.options.token, _method : 'PATCH' },
			success: function(data) {
				if (self.options.verbose) console.log('Confer: saved requested conversation to session');
			}
		});

	}


	Confer.prototype.conversationIsInList = function (conversation_id)
	{

		return this.open_conversation_list.find('li[data-conversationId=' + conversation_id + ']').length > 0;

	}

	Confer.prototype.userIsLookingAtConversation = function (conversation_id)
	{
		return parseInt(conversation_id) === parseInt(this.open_conversation);
	}

	Confer.prototype._initEvents = function ()
	{

		var self = this;

		self.open_conversation_list.delegate('li', 'click', function() {
			self.loadConversation($(this).attr('data-conversationId'));
		});

		self.overlay.delegate('button.confer-overlay-close', 'click', function(e) {
			e.preventDefault();
			self.closeOverlay();
			if (typeof self.updateTimestampSchedule !== 'undefined') clearInterval(self.updateTimestampSchedule);
			self.open_conversation = false;
		});

		self.overlay_content.delegate('form.confer-new-message-form', 'submit', function(e) {
			e.preventDefault();

			var $form = $(this);
			self.sendNewMessage($form);
		});

		self.overlay_content.keyup(function(e) {
			if (e.keyCode == 13) {
				if (self.overlay_content.find('form').length === 1)
				{
					self.overlay_content.find('form').submit();
				} else {
					e.preventDefault();
				}
			}
		});

		self.overlay_content.delegate('.confer-new-message-input', 'keyup', function(e) {
			var $input = $(this);
			var key = String.fromCharCode(e.keyCode);
			if ($input.val().length === 1 && self.options.grammar_enforcer)
			{
				$input.val($input.val().capitalize());
		    } else if ((key === ' ' || key === '!' || key === ',' || key === '?' || key === '.') && self.options.grammar_enforcer) {
		    	// we need to check for space being used and if previous two chars is ' x' where x is a number, so we can replace with english #grammarnazi
		    	var position = $(this).getCursorPosition();
		    	var sub_string = $input.val().substring(position - 3, position);
		    	if (sub_string.match(/\d+/g) && sub_string.charAt(0) === ' ')
		    	{
		    		$input.val($input.val().replace(sub_string, self.numberReplacer[parseInt(sub_string.replace( /^\D+/g, ''))]));
		    	}
			}
			$input.height($input[0].scrollHeight - 10);
		});

		$('i.confer-user-list-icon').click(function() {
			self.loadUserList();
		});

		$('i.confer-settings-icon').click(function() {
			self.loadSettings();
		});

		$('i.confer-all-conversations-icon').click(function() {
			self.loadAllConversationsList();
		});

		self.overlay_content.delegate('i.confer-invite-users', 'click', function() {
			self.showInviteList();
		});

		self.overlay_content.delegate('button.confer-invite-back-button', 'click', function(e) {
			e.preventDefault();

			self.goBackToOpenConversation();
		});

		self.overlay_content.delegate('ul.confer-invite-user-list li', 'click', function() {
			var $li = $(this);
			var user_id = $li.attr('data-userId');

			$li.toggleClass('confer-invited-user');
		});

		self.overlay_content.delegate('form.confer-invite-form', 'submit', function(e) {
			e.preventDefault();

			var $form = $(this);
			self.submitInvitesAndUpdateConversation($form);
		});

		self.overlay_content.delegate('i.confer-leave-conversation', 'click', function() {
			self.leaveCurrentConversation(false);
		});

		self.overlay_content.delegate('ul.confer-user-list li', 'click', function() {
			self.initiateConversationWithUser($(this).attr('data-userId'));
		});

		self.overlay_content.delegate('div.confer-load-more-messages', 'click', function() {
			if (self.options.verbose) console.log('Confer: getting previous messages');
			self.loadMoreMessages();
		});

		self.open_conversation_list.on('contextmenu', 'li', function(event) {
			// Get position of the list item
            var position = $(this).offset();
            var $this = $(this);
            var is_private = $this.attr('data-isPrivate'),
            conversation_id = $this.attr('data-conversationId');
            if (parseInt(conversation_id) > 1)
            {
            	// Make the menu visible, and position it relative to the list item
            	self.context_menu.css({'top':position.top + 10, 'left': position.left - 40}).attr('data-conversationContextId', $this.attr('data-conversationId')).show();
            	
            	if (is_private == 1)
            	{
            		self.context_menu.find('li#confer-context-leave-conversation').hide();
            	}

	            $(document).on("click", function(event) {
		    		// Hide the menu if it is open and the user has clicked
			    	self.context_menu.fadeOut(50);
			    	setTimeout(function() {
			    		self.context_menu.find('li#confer-context-leave-conversation').show();
			    	}, 100);
			    	$(document).off('click');
			    });
			}

            // Make sure the original context menu doesn't appear
            window.event.returnValue = false;
        });

        self.context_menu.delegate('li#confer-context-leave-conversation', 'click', function() {
        	self.leaveConversation(self.context_menu.attr('data-conversationContextId'), true);
        });

        self.context_menu.delegate('li#confer-context-close-conversation', 'click', function() {
        	self.closeConversation(self.context_menu.attr('data-conversationContextId'));
        });

        self.options.messages_trigger.click(function() {
        	//self.barIsLoading();
        	self.options.messages_container.load(self.options.base_url + '/confer/conversations/bar', function() {
        		//self.barFinishedLoading();
        		self.messagesLoaded();
        	});
        });

        self.options.messages_container.delegate('ul.confer-conversation-list li', 'click', function() {
        	if (self.options.verbose) console.log('Confer: opening conversation from bar');
        	var $li = $(this);
        	var conversation_id = $li.attr('data-conversationId'),
        	user_id = $li.is('[data-userid]') ? $li.attr('data-userid') : false;

        	self.loadConversation(conversation_id);
        	if ( ! self.conversationIsInList(conversation_id)) self.createConversationIconInBar(user_id ? user_id : null, conversation_id, ! user_id);
        });

        self.overlay_content.delegate('ul.confer-conversation-list li', 'click', function() {
        	if (self.options.verbose) console.log('Confer: opening conversation from all conversation list');
        	var $li = $(this);
        	var conversation_id = $li.attr('data-conversationId'),
        	user_id = $li.is('[data-userid]') ? $li.attr('data-userid') : false;

        	self.loadConversation(conversation_id);
        	if ( ! self.conversationIsInList(conversation_id)) self.createConversationIconInBar(user_id ? user_id : null, conversation_id, ! user_id);
        });

        self.options.messages_container.delegate('button.confer-show-all-conversations', 'click', function(e) {
        	e.preventDefault();

        	self.loadAllConversationsList();
        });

        /*$(document).ready(function() {
        	self.options.messages_container.load(self.options.base_url + '/confer/conversations/bar', function() {
        		self.messagesLoaded();
        	});
        });*/

	}

	Confer.prototype.makeError = function (error_msg, $input, highlight_input)
	{
		var highlight_input = (typeof highlight_input === 'undefined' ? true : highlight_input);
		var $error = $('<span></span>').addClass('confer-form-error').text(error_msg);

		$error.css('width', $input.width());
		if (highlight_input) $input.addClass('confer-input-has-error');
		$input.after($error);

		$input.click(function() {
			$error.remove();
			if (highlight_input) $input.removeClass('confer-input-has-error');
			$input.off('click');
		});

		return false;
	}

	Confer.prototype.loadAllConversationsList = function ()
	{

		var self = this;

		self.showOverlay();
		self.isLoading();
		self.overlay_content.load(self.options.base_url + '/confer/conversations', function() {
			self.finishedLoading();
		});

	}

	Confer.prototype.messagesLoaded = function()
	{

		if (this.options.verbose) console.log('Confer: viewing conversations in bar');

	}

	Confer.prototype.loadSettings = function ()
	{

		var self = this;

		self.showOverlay();
		self.isLoading();
		self.overlay_content.load(self.options.base_url + '/confer/settings', function() {
			self.finishedLoading();
		});

	}

	Confer.prototype.leaveConversation = function(conversation_id, from_context)
	{

		var self = this;

		// Do leaving
		$.ajax({
			url: self.options.base_url + '/confer/conversation/' + conversation_id + '/leave',
			type: 'POST',
			data: { _token : self.options.token, _method : 'DELETE' },
			success: function(data)
			{
				if ( ! from_context)
				{
					self.overlay.find('button.confer-overlay-close').click();
				}
				self.closeConversation(conversation_id);
			}
		});

	}

	Confer.prototype.leaveCurrentConversation = function ()
	{

		var self = this;

		self.leaveConversation(self.open_conversation, false);

	}

	Confer.prototype.closeConversation = function (conversation_id)
	{

		var self = this;

		var conversation = self.open_conversation_list.find('li[data-conversationId=' + conversation_id + ']');
		conversation.fadeOut(100);
		setTimeout(function() {
			conversation.remove();
			setTimeout(function() {
				self.saveConversationsToSession();
			}, 200);
		}, 150);

	}

	Confer.prototype.submitInvitesAndUpdateConversation = function ($form)
	{

		var self = this;

		var invited_users = [];
		self.overlay_content.find('li.confer-invited-user').each(function(index, value) {
			invited_users.push($(this).attr('data-userId'));
		});

		var data = { invited_users : invited_users, _token : self.options.token, _method : 'PATCH' };
		if (self.overlay_content.find('input[name=conversation_name]').length > 0) {
			data.conversation_name = self.overlay_content.find('input[name=conversation_name]').val();
			data.name_is_required = true;
		}

		$.ajax({
			url: self.options.base_url + '/confer/conversation/' + self.open_conversation,
			type: 'POST',
			data: data,
			success: function(conversation) {
				self.loadConversation(conversation.id);
				if ( ! self.conversationIsInList(conversation.id))
				{
					self.generateConversationInBar({ conversation : conversation });
				}
			},
			error: function(data) {
				if (data.status === 422)
				{
					var errors = data.responseJSON;
					if (typeof errors.conversation_name === 'undefined')
					{
						self.makeError(errors[Object.keys(errors)[0]], $form.find('input[name=conversation_name]'), false);
					} else {
						self.makeError(errors[Object.keys(errors)[0]], $form.find('input[name=conversation_name]'));
					}
				}
			}
		});

	}

	Confer.prototype.goBackToOpenConversation = function ()
	{

		var self = this;

		self.overlay_content.fadeOut(50);
		//var cur_margin = self.overlay_content.css('margin-left');
		//self.overlay_content.animate({ marginLeft: "100%"} , 100);
		self.isLoading();
		self.overlay_content.load(self.options.base_url + '/confer/conversation/' + self.open_conversation, function() {
			self.finishedLoading();
			//self.overlay_content.animate({ marginLeft: cur_margin} , 100);
			self.overlay_content.find('textarea[name=body]').focus();
		});

	}

	Confer.prototype.showInviteList = function ()
	{

		var self = this;

		self.overlay_content.fadeOut(50);
		self.isLoading();
		self.overlay_content.load(self.options.base_url + '/confer/conversation/' + self.open_conversation + '/invite', function() {
			self.finishedLoading();
		});

	}

	Confer.prototype.saveConversationsToSession = function ()
	{

		var self = this;

		var html = self.open_conversation_list.html();
		$.ajax({
			url: self.options.base_url + '/confer/session',
			type: 'POST',
			data: { html : html, _token : self.options.token },
			success: function (data) {
				if (self.options.verbose) console.log('Confer: stored the open conversations list in session');
			}
		});

	}

	Confer.prototype.removeLoadMoreMessagesOption = function ()
	{

		return this.overlay_content.find('div.confer-load-more-messages').remove();

	}

	Confer.prototype.loadMoreMessages = function ()
	{

		var self = this;
		var list = self.overlay_content.find('ul.confer-conversation-message-list');
		var current_message_id = self.most_previous_message_id ? self.most_previous_message_id : list.children('li').first().attr('data-messageId');
		var DOM_messages = $();
		$.ajax({
			url: self.options.base_url + '/confer/conversation/' + self.open_conversation + '/messages',
			type: 'GET',
			data: { from_message : current_message_id },
			success: function(messages) {
				if ($.isEmptyObject(messages)) return self.removeLoadMoreMessagesOption();

				var num_messages = 0;
				for (e in messages) { num_messages++; }
				$.each(messages, function(index, message) {
					var DOM_message = self.constructConversationMessage(message, true);
					DOM_message.hide();
					list.prepend(DOM_message);
					DOM_messages.push(DOM_message);
					if (parseInt(index) === num_messages - 1)
					{
						self.most_previous_message_id = message.id;
					}
				});
				DOM_messages.each(function(message) {
					$(this).slideDown(100);
				});
				if (num_messages < 5) self.removeLoadMoreMessagesOption();
				/*setTimeout(function() {
					list.scrollTop(list.prop("scrollHeight"));
				}, 150);*/
			}
		});

	}

	Confer.prototype.initiateConversationWithUser = function (user_id)
	{

		var self = this;

		self.isLoading();
		self.overlay_content.load(self.options.base_url + '/confer/conversation/find/user/' + user_id, function() {
			self.finishedLoading();
			self.conversationLoaded(self.overlay_content.find('ul.confer-conversation-message-list').attr('data-conversationId'), false);
			if ( ! self.conversationIsInList(self.open_conversation))
			{
				self.createConversationIconInBar(user_id, self.open_conversation);
			}
		});

	}

	Confer.prototype.createConversationIconInBar = function(user_id, conversation_id, is_group)
	{

		var self = this;

		var is_group = (typeof is_group === 'undefined' ? false : is_group);

		$.ajax({
			url: is_group ? self.options.base_url + '/confer/conversation/' + conversation_id + '/info' :  self.options.base_url + '/confer/user/' + user_id + '/conversation/' + conversation_id + '/info',
			type: 'POST',
			data: { _token : self.options.token },
			success: function(data) {
				self.generateConversationInBar(data);
			}
		});

	}

	Confer.prototype.generateConversationInBar = function (info)
	{
		// info format: { user : user, conversation : conversation }
		var self = this;

		var is_group_convo = (typeof info.user === 'undefined' ? true : false);

		var $li = $('<li></li>').attr('data-conversationId', info.conversation.id).attr('data-isPrivate', info.conversation.is_private), // conversationId should always be set to info.conversation.id ?
			$message = $('<div></div>').addClass('confer-message').addClass('confer-message-east'),
			$message_item = $('<span></span>').addClass('confer-message-item'),
			$avatar = $('<img>').addClass('confer-open-conversation-avatar').attr('src', is_group_convo ? self.options.avatar_dir + 'avatar-group.png' : self.options.avatar_dir + info.user.avatar),
			$name = $('<span></span>').addClass('confer-open-conversation-name').text(is_group_convo ? makeInitialsFrom(info.conversation.name) : makeInitialsFrom(info.user.name)),
			$new_message = $('<span></span>').addClass('confer-message-content').text('New message!');

		$message_item.append($avatar).append($name);
		$message.append($message_item).append($new_message);
		$li.append($message);

		self.open_conversation_list.prepend($li);

		self.beginCheckingForMessages(info.conversation);
		setTimeout(function() {
			self.saveConversationsToSession();
		}, 200);
		

	}

	function makeInitialsFrom(string) {
		return string.replace(/[a-z]/g, '');
	}

	Confer.prototype.getUserInfo = function (user_id)
	{

		var self = this;

		$.ajax({
			url: self.options.base_url + '/confer/user/' + user_id + '/info',
			type: 'POST',
			data: { _token : self.options.token },
			success: function(user) {
				return user;
			}
		});

	}

	Confer.prototype.loadUserList = function ()
	{

		var self = this;

		self.showOverlay();
		self.isLoading();
		self.overlay_content.load(self.options.base_url + '/confer/users', function() {
			self.finishedLoading();
		});

	}

	Confer.prototype.sendNewMessage = function ($form)
	{

		var self = this;

		var body = $form.find('.confer-new-message-input').val();
		$form[0].reset();
		$.ajax({
			url: $form.attr('action'),
			type: 'POST',
			data: { body : body, _token : self.options.token }, //$form.serialize() + '&_token=' + self.options.token,
			success: function (message)
			{
				self.addMessageToConversation(message);
				/*var message = self.constructConversationMessage(message);
				var list = self.overlay_content.find('ul.confer-conversation-message-list');
				message.hide();
				list.append(message);
				message.slideDown(100);
				setTimeout(function() {
					list.scrollTop(list.prop("scrollHeight"));
				}, 150);*/
			}
		});

	}

	Confer.prototype.closeOverlay = function ()
	{

		var self = this;

		self.overlay.fadeOut(100);
		setTimeout(function() {
			self.overlay_content.empty();
		}, 150);
		self.most_previous_message_id = false;

	}

	/**
	 * Load a conversation 
	 * @param  {[type]} conversation_id [description]
	 * @return {[type]}                 [description]
	 */
	Confer.prototype.loadConversation = function (conversation_id)
	{

		var self = this;

		self.showOverlay();
		//if (parseInt(self.last_loaded_conversation) !== parseInt(conversation_id))
		//{
			self.isLoading();
			self.overlay_content.load(self.options.base_url + '/confer/conversation/' + conversation_id, function() {
				self.finishedLoading();
				self.conversationLoaded(conversation_id, false);
			});
		//}
		//self.conversationLoaded(conversation_id, true);

	}

	Confer.prototype.isLoading = function ()
	{

		this.loader.fadeIn(100);

	}

	Confer.prototype.finishedLoading = function ()
	{

		this.loader.fadeOut(100);
		if ( ! this.overlay_content.is(':visible')) this.overlay_content.fadeIn(100);

	}

	/**
	 * Fired when a new conversation is loaded
	 * 
	 * @return {[type]} [description]
	 */
	Confer.prototype.conversationLoaded = function (conversation_id, without_server)
	{

		var self = this;
		/*if ( ! without_server)
		{
			self.overlay_content.fadeIn(100);
		}*/
		self.overlay_content.find('.confer-new-message-input').focus();
		self.open_conversation = parseInt(conversation_id);
		self.last_loaded_conversation = parseInt(conversation_id);
		self.hideNewMessageIfPresentForConversation(conversation_id);
		self.updateTimestampSchedule = setInterval(function() {
			self.updateTimestamps();
		}, 60000);

	}

	Confer.prototype.showOverlay = function ()
	{

		if ( ! this.overlay.is(':visible')) this.overlay.fadeIn(100);
		//this.overlay.fadeIn(100);

	}

	Confer.prototype.beginPrivateConversationWithUser = function (user, conversation)
	{

		var self = this;

		self.generateConversationInBar({ user : user, conversation : conversation });
		self.showNewMessageForConversation(conversation.id);

	}

	Confer.prototype.beginGroupConversation = function (conversation)
	{

		var self = this;
		self.generateConversationInBar({ conversation : conversation });
		self.showNewMessageForConversation(conversation.id);

	}

	Confer.prototype.updateTimestamps = function ()
	{

		var self = this;

		self.overlay_content.find('span.confer-message-timestamp').each(function(index, value) {
			var $timestamp = $(this),
			old_stamp = $timestamp.attr('data-timestamp');

			var old_moment = moment(old_stamp);
			$timestamp.text(old_moment.fromNow());
		});

		if (self.options.verbose) console.log('Confer: timestamps updated');

	}

	Confer.prototype.showNewMessageForConversation = function (conversation_id)
	{

		var self = this;

		var $div = self.open_conversation_list.find('li[data-conversationId=' + conversation_id + ']').find('div.confer-message');
		if ( ! $div.hasClass('new-message'))
		{
			setTimeout(function() {
				$div.addClass('new-message');
			}, 250);
		}

	}

	Confer.prototype.hideNewMessageIfPresentForConversation = function (conversation_id)
	{

		var self = this;

		var $div = self.open_conversation_list.find('li[data-conversationId=' + conversation_id + ']').find('div.confer-message');
		if ($div.hasClass('new-message'))
		{
			$div.removeClass('new-message');
		}

	}

	/**
	 * Create a message item from a message object
	 * 
	 * @param  Object message
	 * @return $message
	 */
	Confer.prototype.constructConversationMessage = function (message, use_timestamp)
	{

		var self = this;

		var use_timestamp = (typeof use_timestamp === 'undefined' ? false : use_timestamp);
		var user_is_sender = parseInt(message.sender.id) === parseInt(self.current_user) ? true : false;

		if (message['type'] === 'user_message')
		{
			var $message = $('<li></li>').addClass(user_is_sender ? 'confer-sent-message' : 'confer-received-message').attr('data-messageId', message.id),
				$avatar = $('<img>').addClass('confer-user-avatar').addClass(user_is_sender ? 'confer-sent-avatar' : 'confer-received-avatar').attr('src', self.options.avatar_dir + message.sender.avatar),
				$inner = $('<div></div>').addClass('confer-message-inner'),
				$sender = $('<span></span>').addClass('confer-message-sender').text(message.sender.name),
				$timestamp = $('<span></span>').addClass('confer-message-timestamp').text(use_timestamp ? message.created_at : 'Just now').attr('data-timestamp', message.created_at),
				$body = $('<span></span>').addClass('confer-message-body').html(message.body);

			$inner.append($sender).append($body).append($timestamp);
			return $message.append($avatar).append($inner);
		} else {
			var $message = $('<li></li>').addClass('confer-conversation-message').attr('data-messageId', message.id),
				$body = $('<span></span>').html(message.body),
				$timestamp = $('<span></span>').addClass('confer-message-timestamp').text(use_timestamp ? message.created_at : 'Just now').attr('data-timestamp', message.created_at);

			return $message.append($body).append($timestamp);
		}

	}

	/**
	 * Identify if the user is starting the incoming conversation request
	 * 
	 * @param  String initiator_id
	 * @return boolean
	 */
	Confer.prototype.userIsStartingConversation = function (initiator_id)
	{

		return parseInt(this.current_user) === parseInt(initiator_id);

	}

	/**
	 * Identify if the last viewed conversation was the global conversation
	 * 
	 * @return boolean
	 */
	Confer.prototype.userIsLookingAtGlobalConversation = function ()
	{

		return parseInt(this.open_conversation) === 1;

	}

	// Add to global namespace
	window.Confer = Confer;

})( window );