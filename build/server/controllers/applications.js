// Generated by CoffeeScript 1.10.0
var Application, Manifest, NotificationsHelper, appHelpers, async, autostop, baseIdController, cozydb, exec, fs, icons, localizationManager, log, manager, market, request, sendError, slugify, startedApplications;

request = require('request-json');

fs = require('fs');

slugify = require('cozy-slug');

exec = require('child_process').exec;

async = require('async');

cozydb = require('cozydb');

log = require('printit')({
  date: true,
  prefix: "applications"
});

Application = require('../models/application');

NotificationsHelper = require('cozy-notifications-helper');

localizationManager = require('../helpers/localization_manager');

manager = require('../lib/paas').get();

Manifest = require('../lib/manifest').Manifest;

market = require('../lib/market');

autostop = require('../lib/autostop');

icons = require('../lib/icon');

appHelpers = require('../lib/applications');

startedApplications = {};

sendError = function(res, err, code) {
  var error;
  if (code == null) {
    code = 500;
  }
  if (err == null) {
    err = {
      stack: null,
      message: localizationManager.t("server error")
    };
  }
  log.info("Sending error to client :");
  log.error(err);
  error = {
    error: true,
    success: false,
    message: err.message || err,
    stack: err.stack
  };
  if (err.permissionChanges != null) {
    error.permissionChanges = err.permissionChanges;
  }
  return res.status(code).send(error);
};

baseIdController = new cozydb.SimpleController({
  model: Application,
  reqProp: 'application',
  reqParamID: 'id'
});

module.exports = {
  loadApplicationById: baseIdController.find,
  loadApplication: function(req, res, next, slug) {
    return Application.all({
      key: req.params.slug
    }, function(err, apps) {
      if (err) {
        return next(err);
      } else if (apps === null || apps.length === 0) {
        return res.status(404).send({
          error: localizationManager.t('app not found')
        });
      } else {
        req.application = apps[0];
        return next();
      }
    });
  },
  applications: function(req, res, next) {
    return Application.all(function(err, apps) {
      if (err) {
        return next(err);
      } else {
        return res.send({
          rows: apps
        });
      }
    });
  },
  getPermissions: function(req, res, next) {
    var manifest;
    manifest = new Manifest();
    return manifest.download(req.body, function(err) {
      var app;
      if (err) {
        return next(err);
      }
      app = {
        permissions: manifest.getPermissions()
      };
      return res.send({
        success: true,
        app: app
      });
    });
  },
  getDescription: function(req, res, next) {
    var manifest;
    manifest = new Manifest();
    return manifest.download(req.body, function(err) {
      var app;
      if (err) {
        return next(err);
      }
      app = {
        description: manifest.getDescription()
      };
      return res.send({
        success: true,
        app: app
      });
    });
  },
  getMetaData: function(req, res, next) {
    var manifest;
    manifest = new Manifest();
    return manifest.download(req.body, function(err) {
      var metaData;
      if (err) {
        return next(err);
      }
      metaData = manifest.getMetaData();
      return res.status(200).send({
        success: true,
        app: metaData
      });
    });
  },
  read: function(req, res, next) {
    return Application.find(req.params.id, function(err, app) {
      if (err) {
        return sendError(res, err);
      } else if (app === null) {
        err = new Error(localizationManager.t('app not found'));
        return sendError(res, err, 404);
      } else {
        return res.send(app);
      }
    });
  },
  icon: function(req, res, next) {
    var iconPath, ref, ref1, ref2, ref3, stream;
    if ((ref = req.application) != null ? (ref1 = ref._attachments) != null ? ref1['icon.svg'] : void 0 : void 0) {
      stream = req.application.getFile('icon.svg', function() {});
      stream.pipefilter = function(res, dest) {
        return dest.set('Content-Type', 'image/svg+xml');
      };
      return stream.pipe(res);
    } else if ((ref2 = req.application) != null ? (ref3 = ref2._attachments) != null ? ref3['icon.png'] : void 0 : void 0) {
      res.type('png');
      stream = req.application.getFile('icon.png', function() {});
      return stream.pipe(res);
    } else {
      iconPath = './client/app/assets/img/default.svg';
      stream = fs.createReadStream(iconPath);
      stream.pipefilter = function(res, dest) {
        return dest.set('Content-Type', 'image/svg+xml');
      };
      return stream.pipe(res);
    }
  },
  updateData: function(req, res, next) {
    var Stoppable, app, changes;
    app = req.application;
    if ((req.body.isStoppable != null) && req.body.isStoppable !== app.isStoppable) {
      Stoppable = req.body.isStoppable;
      Stoppable = Stoppable != null ? Stoppable : app.isStoppable;
      changes = {
        homeposition: req.body.homeposition || app.homeposition,
        isStoppable: Stoppable
      };
      return app.updateAttributes(changes, function(err, app) {
        autostop.restartTimeout(app.name);
        if (err) {
          return sendError(res, err);
        }
        return res.send(app);
      });
    } else if ((req.body.favorite != null) && req.body.favorite !== app.favorite) {
      changes = {
        favorite: req.body.favorite
      };
      return app.updateAttributes(changes, function(err, app) {
        if (err) {
          return next(err);
        }
        return res.send(app);
      });
    } else {
      return res.send(app);
    }
  },
  install: function(req, res, next) {
    var access;
    req.body.slug = req.body.slug || slugify(req.body.name);
    req.body.state = "installing";
    access = {
      password: appHelpers.newAccessToken()
    };
    return Application.all({
      key: req.body.slug
    }, function(err, apps) {
      var manifest;
      if (err) {
        return sendError(res, err);
      }
      if (apps.length > 0 || req.body.slug === "proxy" || req.body.slug === "home" || req.body.slug === "data-system") {
        err = new Error(localizationManager.t("similarly named app"));
        return sendError(res, err, 400);
      }
      manifest = new Manifest();
      return manifest.download(req.body, function(err) {
        if (err) {
          return sendError(res, err);
        }
        access.permissions = manifest.getPermissions();
        access.slug = req.body.slug;
        req.body.widget = manifest.getWidget();
        req.body.version = manifest.getVersion();
        req.body.color = manifest.getColor();
        req.body.state = 'installing';
        req.body.type = manifest.getType();
        return Application.create(req.body, function(err, appli) {
          if (err) {
            return sendError(res, err);
          }
          access.app = appli.id;
          return Application.createAccess(access, function(err, app) {
            if (err) {
              return sendError(res, err);
            }
            res.status(201).send({
              success: true,
              app: appli
            });
            return appHelpers.install(appli, manifest, access);
          });
        });
      });
    });
  },
  uninstall: function(req, res, next) {
    var removeMetadata;
    req.body.slug = req.params.slug;
    removeMetadata = function(result) {
      return req.application.destroyAccess(function(err) {
        if (err) {
          log.warn(err);
        }
        return req.application.destroy(function(err) {
          if (err) {
            return sendError(res, err);
          }
          manager.resetProxy(function(err) {
            if (err) {
              return sendError(res, err);
            }
          });
          return res.send({
            success: true,
            msg: localizationManager.t('successfuly uninstalled')
          });
        });
      });
    };
    return manager.uninstallApp(req.application, function(err, result) {
      if (err) {
        return manager.uninstallApp(req.application, function(err, result) {
          return removeMetadata(result);
        });
      } else {
        return removeMetadata(result);
      }
    });
  },
  update: function(req, res, next) {
    return appHelpers.update(req.application, function(err) {
      if (err != null) {
        return appHelpers.markBroken(req.application, err);
      }
      return res.send({
        success: true,
        msg: localizationManager.t('successfuly updated')
      });
    });
  },
  updateAll: function(req, res, next) {
    log.info('Starting updating all apps...');
    return Application.all(function(err, apps) {
      var permissionChanges, updateFailures;
      if (err) {
        return sendError(err);
      }
      updateFailures = {};
      permissionChanges = {};
      return async.forEachSeries(apps, function(app, done) {
        log.info("Check if update is required for " + app.name + ".");
        return appHelpers.isUpdateNeeded(app, function(err, result) {
          if (err) {
            updateFailures[app.name] = err;
            log.error("Check update failed for " + app.name + ".");
            log.raw(err);
            return done();
          } else if (result.isPermissionsChanged) {
            log.info("Permissions changed for " + app.name + ".");
            log.info("No update performed for " + app.name + ".");
            permissionChanges[app.name] = true;
            return done();
          } else if (result.isUpdateNeeded) {
            log.info("Updating " + app.name + " (" + app.state + ")...");
            return appHelpers.update(app, function(err) {
              log.info("Update done for " + app.name + ".");
              if (err) {
                updateFailures[app.name] = err;
                log.error("Update failed for " + app.name + ".");
                log.raw(err);
              } else {
                log.info("Update done for " + app.name + ".");
              }
              return done();
            });
          } else {
            log.info("No update required for " + app.name + ".");
            return done();
          }
        });
      }, function() {
        log.info('Updating all apps operation is done.');
        if (JSON.stringify(updateFailures).length > 2) {
          log.error('Errors occured for following apps:');
          log.raw(JSON.stringify(updateFailures, null, 2));
          return sendError(res, {
            message: updateFailures,
            permissionChanges: permissionChanges
          });
        } else {
          log.info('All updates succeeded.');
          return res.send({
            success: true,
            permissionChanges: permissionChanges,
            msg: localizationManager.t('successfuly updated')
          });
        }
      });
    });
  },
  start: function(req, res, next) {
    var data;
    setTimeout(function() {
      if (startedApplications[req.application.id] != null) {
        delete startedApplications[req.application.id];
        return appHelpers.markBroken(req.application, {
          stack: "Installation timeout",
          message: "Installation timeout"
        });
      }
    }, 45 * 1000);
    if (startedApplications[req.application.id] == null) {
      startedApplications[req.application.id] = true;
      req.application.password = appHelpers.newAccessToken();
      data = {
        password: req.application.password
      };
      return req.application.updateAccess(data, function(err) {
        return manager.start(req.application, function(err, result) {
          if (err && err !== localizationManager.t("not enough memory")) {
            delete startedApplications[req.application.id];
            appHelpers.markBroken(req.application, err);
            return res.status(500).send({
              app: req.application,
              error: true,
              message: err.message,
              stack: err.stack
            });
          } else if (err) {
            delete startedApplications[req.application.id];
            data = {
              errormsg: err,
              state: 'stopped'
            };
            return req.application.updateAttributes(data, function(saveErr) {
              if (saveErr) {
                return sendError(res, saveErr);
              }
              return res.status(500).send({
                app: req.application,
                error: true,
                success: false,
                message: err.message,
                stack: err.stack
              });
            });
          } else {
            data = {
              state: 'installed',
              port: result.drone.port
            };
            return req.application.updateAttributes(data, function(err) {
              if (err) {
                delete startedApplications[req.application.id];
                appHelpers.markBroken(req.application, err);
                res.status(500).send({
                  app: req.application,
                  error: true,
                  message: err.message,
                  stack: err.stack
                });
                return;
              }
              return manager.resetProxy(function(err) {
                delete startedApplications[req.application.id];
                if (err) {
                  appHelpers.markBroken(req.application, err);
                  return res.status(500).send({
                    app: req.application,
                    error: true,
                    message: err.message,
                    stack: err.stack
                  });
                } else {
                  return res.send({
                    success: true,
                    msg: localizationManager.t('running'),
                    app: req.application
                  });
                }
              });
            });
          }
        });
      });
    } else {
      return res.send({
        error: true,
        msg: localizationManager.t('application is already starting'),
        app: req.application
      });
    }
  },
  stop: function(req, res, next) {
    return manager.stop(req.application, function(err, result) {
      var data;
      if (err) {
        return appHelpers.markBroken(req.application, err);
      }
      data = {
        state: 'stopped',
        port: 0
      };
      return req.application.updateAttributes(data, function(err) {
        if (err) {
          return sendError(res, err);
        }
        return manager.resetProxy(function(err) {
          if (err) {
            return appHelpers.markBroken(req.application, err);
          }
          return res.send({
            success: true,
            msg: localizationManager.t('application stopped'),
            app: req.application
          });
        });
      });
    });
  },
  changeBranch: function(req, res, next) {
    var app, branch, err, manifest;
    branch = req.params.branch;
    manifest = new Manifest();
    app = req.application;
    if (app.branch === branch) {
      err = new Error("This application is already on branch " + branch);
      return sendError(res, err);
    }
    app.branch = branch;
    return manifest.download(app, (function(_this) {
      return function(err) {
        var access, data, error1, iconInfos, infos;
        if (err != null) {
          return callback(err);
        } else {
          app.password = app.helpers.newAccessToken();
          access = {
            permissions: manifest.getPermissions(),
            slug: app.slug,
            password: app.password
          };
          data = {
            widget: manifest.getWidget(),
            version: manifest.getVersion(),
            iconPath: manifest.getIconPath(),
            color: manifest.getColor(),
            needsUpdate: false
          };
          try {
            infos = {
              git: app.git,
              name: app.name,
              icon: app.icon,
              iconPath: data.iconPath,
              slug: app.slug
            };
            iconInfos = icons.getIconInfos(infos);
          } catch (error1) {
            err = error1;
            iconInfos = null;
          }
          data.iconType = (iconInfos != null ? iconInfos.extension : void 0) || null;
          return app.updateAccess(access, function(err) {
            if (err != null) {
              return callback(err);
            }
            return manager.changeBranch(app, branch, function(err, result) {
              if (err) {
                return sendError(res, err);
              }
              data.branch = branch;
              return app.updateAttributes(data, function(err) {
                return icons.save(app, iconInfos, function(err) {
                  if (err) {
                    log.error(err);
                  } else {
                    log.info('icon attached');
                  }
                  return manager.resetProxy(function() {
                    return res.send({
                      success: true,
                      msg: 'Branch succesfuly changed'
                    });
                  });
                });
              });
            });
          });
        }
      };
    })(this));
  },
  fetchMarket: function(req, res, next) {
    return market.getApps(function(err, data) {
      if (err != null) {
        return res.status(500).send({
          error: true,
          success: false,
          message: err
        });
      } else {
        return res.status(200).send(data);
      }
    });
  },
  getToken: function(req, res, next) {
    return Application.all({
      key: req.params.name
    }, function(err, apps) {
      if (err) {
        return sendError(res, err);
      }
      return Application.getToken(apps[0]._id, function(err, access) {
        if (err != null) {
          return res.status(500).send({
            error: true,
            success: false,
            message: err
          });
        } else {
          return res.status(200).send({
            success: true,
            token: access.token
          });
        }
      });
    });
  }
};
