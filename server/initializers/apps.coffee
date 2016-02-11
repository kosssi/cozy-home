Application = require '../models/application'

module.exports = (callback) ->
    Application.destroyAll ->
        data =
            name: "contacts"
            displayName: "Contacts"
            description: "contacts description"
            slug: "contacts"
            state: "installed"
            isStoppable: false
            icon: "img/apps/contacts.svg"
            git: "https://github.com/cozy/cozy-contacts.git"
            version: "2.1.7"
            comment: "official application"
            needsUpdate: false
            favorite: false
            iconType: "svg"
            port: 9114

        Application.create data, callback


