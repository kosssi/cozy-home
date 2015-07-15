// Generated by CoffeeScript 1.9.0
var ControllerClient, exec, freeMemCmd, fs, os;

os = require('os');

fs = require('fs');

exec = require('child_process').exec;

ControllerClient = require("cozy-clients").ControllerClient;

freeMemCmd = "LC_ALL=C free | grep /cache | cut -d':' -f2 | sed -e 's/^ *[0-9]* *//'";

exports.MemoryManager = (function() {
  function MemoryManager() {
    this.controllerClient = new ControllerClient({
      token: this._getAuthController()
    });
  }

  MemoryManager.prototype._getAuthController = function() {
    var err, token;
    if (process.env.NODE_ENV === 'production') {
      try {
        token = process.env.TOKEN;
        return token;
      } catch (_error) {
        err = _error;
        console.log(err.message);
        console.log(err.stack);
        return null;
      }
    } else {
      return "";
    }
  };

  MemoryManager.prototype._extractDataFromDfResult = function(resp) {
    var data, freeSpace, line, lineData, lines, totalSpace, unit, usedSpace, _i, _len;
    data = {};
    lines = resp.split('\n');
    for (_i = 0, _len = lines.length; _i < _len; _i++) {
      line = lines[_i];
      line = line.replace(/[\s]+/g, ' ');
      lineData = line.split(' ');
      if (lineData.length > 5 && lineData[5] === '/') {
        freeSpace = lineData[3].substring(0, lineData[3].length - 1);
        totalSpace = lineData[1].substring(0, lineData[1].length - 1);
        usedSpace = lineData[2].substring(0, lineData[2].length - 1);
        unit = lineData[1].slice(-1);
        data.totalDiskSpace = totalSpace;
        data.freeDiskSpace = freeSpace;
        data.usedDiskSpace = usedSpace;
        data.unit = unit;
      }
    }
    return data;
  };

  MemoryManager.prototype.getMemoryInfos = function(callback) {
    var data;
    data = {
      totalMem: os.totalmem() / 1024.
    };
    return exec('which free', function(err, res) {
      if (err) {
        data.freeMem = Math.floor(os.freemem() / 1000);
        return callback(null, data);
      } else {
        return exec(freeMemCmd, function(err, resp) {
          var line, lines;
          if (err) {
            return callback(err);
          } else {
            lines = resp.split('\n');
            line = lines[0];
            data.freeMem = line;
            return callback(null, data);
          }
        });
      }
    });
  };

  MemoryManager.prototype.getDiskInfos = function(callback) {
    return this.controllerClient.client.get('diskinfo', (function(_this) {
      return function(err, res, body) {
        if (err || res.statusCode !== 200) {
          return exec('df -h', function(err, resp) {
            if (err) {
              return callback(err);
            } else {
              return callback(null, _this._extractDataFromDfResult(resp));
            }
          });
        } else {
          return callback(null, body);
        }
      };
    })(this));
  };

  MemoryManager.prototype.isEnoughMemory = function(callback) {
    return this.getMemoryInfos(function(err, data) {
      if (err) {
        return callback(err);
      } else {
        return callback(null, data.freeMem > (60 * 1024));
      }
    });
  };

  return MemoryManager;

})();
