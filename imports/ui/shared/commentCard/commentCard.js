import './commentCard.html'
import './commentCard.scss';

import { Template } from 'meteor/templating'

import { Comments } from '/imports/api/comments/comments'

import { removeComment, flagComment } from '/imports/api/comments/methods'

import { notify } from '/imports/modules/notifier'

import { loggedInSWAL } from '../../helpers/loggedInSWAL';

Template.commentCard.onCreated(function() {
	this.edits = new ReactiveDict()
	this.replies = new ReactiveDict()

	this.message = new ReactiveVar('')

	this.showReplies = new ReactiveVar(false);
})

Template.commentCard.helpers({
	user: () => Meteor.users.findOne({ _id: Template.currentData().createdBy}),
    canEditComment: function() {
    	return this.createdBy === Meteor.userId()
    },
    editMode: function() {
    	return Template.instance().edits.get(this._id)
    },
    replyMode: function() {
    	return Template.instance().replies.get(this._id)
    },
	commentInvalidMessage: () => Template.instance().message.get(),
	newIdent: () => Template.instance().data.ident + 10,
	formIdent: () => (Template.instance().data.ident - 5) > 0 ? (Template.instance().data.ident - 5) : 0,
	ident: () => Template.instance().data.ident,
	childComments: function() {
		return Comments.find({
			parentId: this._id
		}, {
			sort: {
				createdAt: -1
			}
		})
	},
	childCommentCount: function() {
		return Comments.find({
			parentId: this._id
		}, {
			sort: {
				createdAt: -1
			}
		}).count();
	},
	showReplies: () => Template.instance().showReplies.get(),
	subCommentArgs: (comment) => {
		const data = Template.instance().data;

		return {
			ident: 15, // data.ident + 10
			comment: comment,
			_id: comment._id,
			type: data.type,
			onReplySuccess: data.onReplySuccess,
			onEditSuccess: data.onEditSuccess,
		};
	},
	replySuccess: () => {
		const templateInstance = Template.instance();

		return () => {
			notify(TAPi18n.__('comments.success'), 'success');
			templateInstance.showReplies.set(true);
			templateInstance.replies.set(templateInstance.data._id, false);

			if (templateInstance.data.onReplySuccess)
				templateInstance.data.onReplySuccess();
		}
	},
	replyCancel: () => {
		const templateInstance = Template.instance();
		const data = Template.currentData();
		return () => {
			templateInstance.replies.set(data._id, false);
		}
	},
	editSuccess: () => {
		const templateInstance = Template.instance();

		return () => {
			notify(TAPi18n.__('comments.success_edit'), 'success');
			templateInstance.edits.set(templateInstance.data._id, false);

			if (templateInstance.data.onEditSuccess)
				templateInstance.data.onEditSuccess();
		}
	},
	editCancel: () => {
		const templateInstance = Template.instance();
		const data = Template.currentData();

		return () => templateInstance.edits.set(data._id, false);
	},
})

Template.commentCard.events({
	'click .flag-comment': function(event, templateInstance) {
		event.preventDefault()
		event.stopImmediatePropagation()

		loggedInSWAL({
			action: 'shared.loginModal.action.flag',
		  	title: TAPi18n.__('comments.flag_reason'),
		  	input: 'text',
		  	showCancelButton: true,
		  	inputValidator: (value) => {
		    	return !value && TAPi18n.__('comments.invalid_reason')
		  	}
		}).then(data => {
			if (data.value) {
				flagComment.call({
					commentId: this._id,
					reason: data.value
				}, (err, data) => {
					if (err) {
						notify(TAPi18n.__(err.reason || err.message), 'error')
					} else {
						notify(TAPi18n.__('comments.success_flag'), 'success')
					}
				})
			}
		})
	},
	'click .reply': function(event, templateInstance) {
		event.preventDefault()
		event.stopImmediatePropagation()

		if (templateInstance.data.comment._id === event.target.getAttribute('data-id')) {
			templateInstance.showReplies.set(true);
			templateInstance.replies.set(this._id, true);
		}
	},
	'click .edit-mode': function(event, templateInstance) {
		event.preventDefault()
		event.stopImmediatePropagation()

		templateInstance.edits.set(this._id, true)
	},
	'click .delete-comment': function(event, templateInstance) {
		event.preventDefault()
		event.stopImmediatePropagation()

		loggedInSWAL({
			action: 'shared.loginModal.action.delete',
			text: TAPi18n.__('comments.remove_question'),
			type: 'warning',
			showCancelButton: true
		}).then(confirmed => {
			if (confirmed.value) {
				removeComment.call({
					commentId: this._id
				}, (err, data) => {
					if (err) {
						notify(TAPi18n.__(err.reason || err.message), 'error')
					}
				})
			}
		})
	},
	'click .showReplies': (event, templateInstance) => {
		event.preventDefault();

		// Check if the button was clicked for this comment and not in a child
		if (templateInstance.data.comment._id === event.target.getAttribute('data-id'))
			templateInstance.showReplies.set(true);
	},
	'click .hideReplies': (event, templateInstance) => {
		event.preventDefault();

		// Check if the button was clicked for this comment and not in a child
		if (templateInstance.data.comment._id === event.target.getAttribute('data-id'))
			templateInstance.showReplies.set(false);
	},
})
