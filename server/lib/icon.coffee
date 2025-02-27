fs = require 'fs'
path = require 'path'
log = require('printit')
    prefix: 'icons'

module.exports = icons = {}
market = require './market'


###
Get right icon path depending on app configuration:
* returns root folder + path mentioned in the manifest file if path is in the
  manifest.
* returns svg path if svg icon exists in the app folder.
* returns png path if png icon exists in the app folder.
* returns null otherwise
###
icons.getPath = (root, appli) ->
    marketApp = market.getApp appli.slug
    iconPath = null

    # try to retrieve icon path from manifest, if developer set it.
    if marketApp?
        homeBasePath = path.join process.cwd(), 'client/app/assets'
        iconPath = path.join homeBasePath, marketApp.icon
        iconPath = null unless fs.existsSync(iconPath)

    else if appli.iconPath? and fs.existsSync(path.join root, appli.iconPath)
        iconPath = path.join root, appli.iconPath

    # if it has not been set, or if it doesn't exist, try to guess the icon path
    # first check for svg icon, then for png.
    unless iconPath?
        basePath = path.join root, "client", "app", "assets", "icons"
        svgPath = path.join basePath, "main_icon.svg"
        pngPath = path.join basePath, "main_icon.png"

        if fs.existsSync(svgPath)
            iconPath = svgPath
        else if fs.existsSync(pngPath)
            iconPath = pngPath
        else
            iconPath = null

    # the icon's file couldn't be retrieved
    unless iconPath?
        return null

    # the file name changes based on image type
    else
        extension = if iconPath.indexOf('.png') isnt -1 then 'png' else 'svg'
        result =
            path: iconPath
            extension: extension
        return result


# Retrieves icon information
icons.getIconInfos = (appli) ->
    if appli?
        repoName = (appli.git.split('/')[4]).replace /\.git$/, ''
        name = appli.name.toLowerCase()
        slug = appli.slug or name
        basePath = '/' + path.join 'usr', 'local', 'cozy', 'apps'

        # This path matches the old controller paths.
        # It's required for backward compatibilities.
        root = path.join basePath, name, name, repoName

        # Else it checks the new controller paths.
        unless fs.existsSync(root)
            root = path.join basePath, slug

        iconInfos = icons.getPath root, appli

        if iconInfos?
            return iconInfos
        else
            throw new Error "Icon not found"

    else
        throw new Error 'Appli cannot be reached'


# Save app's icon into the data system. The home displays this icon.
icons.save = (appli, iconInfos, callback = ->) ->

    if iconInfos?
        iconStr = JSON.stringify iconInfos
        log.debug "Icon to save for app #{appli.slug}: #{iconStr}"
        name = "icon.#{iconInfos.extension}"
        appli.attachFile iconInfos.path, name: name, (err) ->
            return callback err if err
            appli.updateAttributes iconType: iconInfos.extension, (err) ->
                callback err, iconInfos

    else
        callback new Error('icon information not found')

