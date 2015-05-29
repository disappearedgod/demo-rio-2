var fs = require('fs');
var BACKENDPATH = require('../config').BACKENDPATH;
var pathModule = require('path');
var config = require('../config.js');
var Q = require('q');

function getDefinedTypeProperty(dir) {
  var Q_read_dir = Q.nfbind(fs.readdir);
  var Q_write_file = Q.nfbind(fs.writeFile);

  function resolveProperty(fileList) {
    var _property = {};
    var _category = {};
    for (var i = 0, l = fileList.length; i < l; i++) {
      var _name = pathModule.basename(fileList[i], '.type');
      var _file_path = pathModule.join(dir, fileList[i]);
      var _raw_content = fs.readFileSync(_file_path, 'utf8');
      var _content = JSON.stringify(_raw_content);
      _property[_name] = JSON.parse(_content);
      _category[_name] = _file_path;
    }
    var _path_type_define = pathModule.join(BACKENDPATH, '/data/default/typeDefine.conf');
    var _content_type_define = JSON.stringify(_category, null, 4);
    fs.writeFileSync(_path_type_define, _content_type_define);
    return _property;
  }
  return Q_read_dir(dir)
    .then(resolveProperty);
}
exports.getDefinedTypeProperty = getDefinedTypeProperty;