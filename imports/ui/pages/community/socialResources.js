import './socialResources.html'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { Template } from 'meteor/templating'
import { socialResources } from '/imports/api/socialResources/socialResources'
import { deleteSocialResource} from '/imports/api/socialResources/methods'

import swal from 'sweetalert2'

const CHUNK_SIZE = 3

Template.socialResourcesTemp.onCreated(function () {
    this.sort = new ReactiveVar('date-desc')
    this.searchFilter = new ReactiveVar(undefined);

    this.autorun(() => {
        this.subscribe('socialResources')
    })
})

Template.socialResourcesTemp.helpers({
    chunkSize () {
        return CHUNK_SIZE + 1
    },
    socialResources: () => {
      let Resources = []
      let searchText = Template.instance().searchFilter.get()

      if (searchText != undefined && searchText != '') {
        Resources = socialResources.find({
          $or: [{
              description: new RegExp(searchText.replace(/ /g, '|'), 'ig')
          }, {
              Name: new RegExp(searchText.replace(/ /g, '|'), 'ig')
          }]
        })
      } else {
        Resources = socialResources.find({})
      }
      return Resources
    },
    socialResourcesCount: () => {
      let Resources = 0
      let searchText = Template.instance().searchFilter.get()

      if (searchText != undefined && searchText != '') {
        Resources = socialResources.find({
          $or: [{
              description: new RegExp(searchText.replace(/ /g, '|'), 'ig')
          }, {
              Name: new RegExp(searchText.replace(/ /g, '|'), 'ig')
          }]
        }).count()
      } else {
        Resources = socialResources.find({}).count()
      }
      return Resources
    },
    canEdit () {
      return this.createdBy === Meteor.userId()
    },
    resourceUrlClass(resourceUrlType) {
      switch(resourceUrlType) {
          case 'TELEGRAM':
            return 'fab fa-telegram';
          case 'FACEBOOK':
            return 'fab fa-facebook';
          case 'TWITTER':
            return 'fab fa-twitter';
          case 'DISCORD':
            return 'fab fa-discord';
          case 'SLACK':
            return 'fab fa-slack';
          case 'GITTER':
            return 'fab fa-gitter';
          default:
            return 'fas fa-external-link-alt';
      }
    },
})


Template.socialResourcesTemp.events({
  'click #add-Resource': (event, _) => {
      event.preventDefault()
      FlowRouter.go('/community/new')
  },
  'keyup #searchBox': function (event, templateInstance) {
    event.preventDefault();

    templateInstance.searchFilter.set($('#searchBox').val())
  },
  'click #js-remove': function (event, _) {
      event.preventDefault()

      swal({
          text: `Are you sure you want to remove this Project? This action is not reversible.`,
          type: 'warning',
          showCancelButton: true
      }).then(confirmed => {
          if (confirmed.value) {
              deleteSocialResource.call({
                  projectId: this._id
              }, (err, data) => {
                  if (err) {
                      notify(err.reason || err.message, 'error')
                  }
              })
          }
      })
    }
})