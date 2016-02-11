path = require 'path'
fs = require 'fs'
Application = require '../models/application'

module.exports = (callback) ->
    Application.destroyAll ->
        createApp 'contacts', 9114, ->
            createApp 'emails', 9125, ->
                createApp 'files', 9121, ->
                    createApp 'calendar', 9113, ->
                        callback()


createApp = (name, port, callback) ->
    data =
        name: "#{name}"
        displayName: "#{name}"
        description: "#{name} description"
        slug: "#{name}"
        state: "installed"
        isStoppable: false
        icon: "img/apps/#{name}.svg"
        git: "https://github.com/cozy/cozy-#{name}.git"
        version: "2.1.7"
        comment: "official application"
        needsUpdate: false
        favorite: false
        iconType: "svg"
        port: port

    Application.create data, (err, app) ->
        iconPath = path.join(
            __dirname, '..', '..', 'client', 'public', 'img', 'apps', "#{name}.svg"
        )
        app.attachFile iconPath, name: 'icon.svg', (err) ->
            callback()

