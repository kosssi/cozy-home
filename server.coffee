process.on 'uncaughtException', (err) ->
    console.error err
    console.error err.stack


application = module.exports = (callback) ->
    americano = require 'americano'
    request = require 'request-json'
    localization = require './server/helpers/localization_manager'
    initProxy = require './server/initializers/proxy'
    setupRealtime = require './server/initializers/realtime'
    versionChecking = require './server/initializers/updates'
    autoStop = require './server/lib/autostop'
    urlHelper = require 'cozy-url-sdk'

    options =
        name: 'Cozy Home'
        port: process.env.PORT or urlHelper.home.port()
        host: process.env.HOST or urlHelper.home.host()
        root: __dirname

    americano.start options, (err, app, server) ->
        app.server = server

        if process.env.NODE_ENV isnt "test"
            initProxy()

        localization.initialize ->
            setupRealtime app, ->
                versionChecking()
                autoStop.init()
                callback app, server if callback?

if not module.parent
    application()

