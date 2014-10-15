var commonDAO = require("../../backend/DAO/CommonDAO");
var filesHandle = require("../../backend/filesHandle");
var utils = require("../../backend/utils");
var contacts = require("../../backend/contacts");
var devices = require("../../backend/devices");
var tagsHandle = require("../../backend/tagsHandle");
var desktopConf = require("../../backend/Desktop/desktopConf")
var fs = require('fs');
var config = require('../../backend/config');
var cp = require('child_process');
var path = require('path');
//var utils = require('util');
//var io=require('../../node_modules/socket.io/node_modules/socket.io-client/socket.io.js');
/**
 * @method loadResources
 *   读取某个资源文件夹到数据库
 *
 * @param1 loadResourcesCb
 *   回调函数
 *   @result
 *      string，success代表成功，其他代表失败原因
 *
 * @param2 path
 *   string，要加载资源的路径
 */
function loadResources(loadResourcesCb, path) {
  console.log("Request handler 'loadResources' was called.");
  filesHandle.initData(loadResourcesCb, path);
}
exports.loadResources = loadResources;

/**
 * @method loadContacts
 *   读取某个contact文件夹到数据库
 *
 * @param1 loadResourcesCb
 *   回调函数
 *   @result
 *      string，success代表成功，其他代表失败原因
 *
 * @param2 path
 *   string，要加载资源的路径
 */
function loadContacts(loadContactCb, path) {
  console.log("Request handler 'loadContacts' was called.");
  contacts.initContacts(loadContactCb, path);
}
exports.loadContacts = loadContacts;

/**
 * @method getAllCate
 *   查询所有基本分类
 *
 * @param1 getAllCateCb
 *   回调函数
 *   @result
 *     array[cate]: 分类数组
 *        cate{
 *           id;
 *           type;
 *           path;
 *        }
 */
function getAllCate(getAllCateCb) {
  console.log("Request handler 'getAllCate' was called.");
  filesHandle.getAllCate(getAllCateCb)
}
exports.getAllCate = getAllCate;

/**
 * @method getAllDataByCate
 *   查询某基本分类下的所有数据
 *
 * @param1 getAllDataByCateCb
 *   回调函数
 *   @result
 *     array[cate]: 数据数组
 *        如果是联系人，则返回数据如下：
 *        cate{
 *           URI;
 *           version;
 *           name;
 *           photPath;
 *        }
 *        如果是其他类型，则返回数据如下：
 *        cate{
 *           URI;
 *           version;
 *           filename;
 *           postfix;
 *           path;
 *        }
 */
function getAllDataByCate(getAllDataByCateCb, cate) {
  console.log("Request handler 'getAllDataByCate' was called.");
  if (cate == 'Contacts' || cate == 'contacts') {
    contacts.getAllContacts(getAllDataByCateCb);
  } else {
    filesHandle.getAllDataByCate(getAllDataByCateCb, cate)
  }
}
exports.getAllDataByCate = getAllDataByCate;

/**
 * @method getAllContacts
 *   获得所有联系人数组
 *
 * @param1 getAllContactsCb
 *   回调函数
 *   @result
 *     array[cate]: 联系人数组
 *        cate数据如下：
 *        cate{
 *           URI;
 *           version;
 *           name;
 *           photPath;
 *        }
 */
function getAllContacts(getAllContactsCb) {
  contacts.getAllContacts(getAllContactsCb);
}
exports.getAllContacts = getAllContacts;

//API rmDataById:通过id删除数据
//返回字符串：
//成功返回success;
//失败返回失败原因
function rmDataByUri(rmDataByUriCb, uri) {
  console.log("Request handler 'rmDataById' was called.");
  filesHandle.rmDataByUri(rmDataByUriCb, uri);
}
exports.rmDataByUri = rmDataByUri;

//API getDataByUri:通过Uri查看数据所有信息
//返回具体数据类型对象
function getDataByUri(getDataByUriCb, uri) {
  filesHandle.getDataByUri(getDataByUriCb, uri);
}
exports.getDataByUri = getDataByUri;

/**
 * @method openDataByUri
 *   打开URI对应的数据
 *
 * @param1 openDataByUriCb
 *   回调函数
 *   @result
 *     object: 显示数据或结果
 *        结构如下：
 *        {
 *            openmethod: 'html',
 *            format:     'audio',
 *            title:      '文件浏览',
 *            content:    item.path
 *        }
 *        其中具体说明如下：
 *        openmethod: 打开方式，支持 html, alert两种
 *          如果是alert，则只有content属性，为alert需要输出的结果
 *          如果是html则具有format, title, content三种属性
 *        title: 是返回结果的标题，如果显示则可以用这个为标题
 *        format和content: 分别表示结果的格式和内容。
 *          format:audio 音频格式，content是具体的音频引用路径
 *          format:div   表示结果是一个div封装的字符串，可以直接显示在界面中
 *          format:txtfile 表示结果是一个txt文件，可以通过load进行加载
 *          format:other  其他结果都默认是一个div或html格式的字符串，可直接显示
 *
 * @param2 uri
 *   string，要打开数据的URI
 */
function openDataByUri(openDataByUriCb, uri) {
  console.log("Request handler 'openDataByUri' was called.");
  filesHandle.openDataByUri(openDataByUriCb, uri);
}
exports.openDataByUri = openDataByUri;

//API updateItemValue:修改数据某一个属性
//返回类型：
//成功返回success;
//失败返回失败原因
function updateDataValue(updateDataValueCb, item) {
  console.log("Request handler 'updateDataValue' was called.");
  filesHandle.updateDataValue(updateDataValueCb, item);
}
exports.updateDataValue = updateDataValue;

//API getRecentAccessData:获得最近访问数据的信息
//返回类型：
//返回具体数据类型对象数组
function getRecentAccessData(getRecentAccessDataCb, num) {
  console.log("Request handler 'getRecentAccessData' was called.");
  filesHandle.getRecentAccessData(getRecentAccessDataCb, num);
}
exports.getRecentAccessData = getRecentAccessData;

//API getServerAddress:获得最近访问数据的信息
//返回类型：
//返回具体数据类型对象数组

function getServerAddress(getServerAddressCb) {
  console.log("Request handler 'getServerAddress' was called.");
  devices.getServerAddress(getServerAddressCb);
}
exports.getServerAddress = getServerAddress;

//API getDeviceDiscoveryService:使用设备发现服务
//参数分别为设备发现和设备离开的回调函数
var SOCKETIOPORT = 8891;

function getDeviceDiscoveryService(getDeviceDiscoveryServiceCb) {
  console.log("Request handler 'getDeviceDiscoveryService' was called.");

  function getServerAddressCb(result) {
    var add = 'ws://' + result.ip + ':' + SOCKETIOPORT + '/';
    var socket = require('socket.io-client')(add);
    socket.on('mdnsUp', function(data) { //接收来自服务器的 名字叫server的数据
      getDeviceDiscoveryServiceCb('mdnsUp', data);
    });
    socket.on('mdnsDown', function(data) { //接收来自服务器的 名字叫server的数据
      getDeviceDiscoveryServiceCb('mdnsDown', data);
    });
  }
  getServerAddress(getServerAddressCb);
}
exports.getDeviceDiscoveryService = getDeviceDiscoveryService;

function pullFromOtherRepo() {
  console.log("Request handler 'pullFromOtherRepo' was called.");
  filesHandle.firstSync();
}
exports.pullFromOtherRepo = pullFromOtherRepo;

//API pasteFile:粘贴一个数据文件
//参数：要添加的数据的json描述和目的路径
//返回类型：成功返回success;失败返回失败原因
function pasteFile(pasteFileCb, sourcePath, desPath) {
  console.log("Request handler 'pasteFile' was called.");
  var filename = path.basename(sourcePath);
  var postfix = path.extname(filename);
  if (sourcePath.indexOf(desPath) != -1) {
    filename = path.basename(sourcePath, postfix);
    desPath = utils.parsePath(desPath + '/' + filename + '_copy' + postfix);
  } else {
    desPath = utils.parsePath(desPath + '/' + filename);
  }
  var sourcePathNew = utils.parsePath(sourcePath);
  cp.exec("cp " + sourcePathNew + " " + desPath, function(error, stdout, stderr) {
    if (error !== null) {
      console.log('exec error: ' + error);
      pasteFileCb(false);
    }
    //    filesHandle.addFile(desPath, pasteFileCb(true));
    pasteFileCb(true);
  });
}
exports.pasteFile = pasteFile;

//API createFile:新建一个文档
//参数：新建文档的类型，以及新建文档的路径
//返回类型：成功返回success;失败返回失败原因
function createFile(creatFileCb, filePostfix, desPath) {
  console.log("Request handler 'createFile' was called.");
  var data = new Date();
  desPath = utils.parsePath(desPath + '/NewFile_' + data.toLocaleString().replace(' ', '_') + '.' + filePostfix);
  cp.exec("touch " + desPath, function(error, stdout, stderr) {
    if (error !== null) {
      console.log('exec error: ' + error);
      creatFileCb(false);
    } else {
      creatFileCb(true);
    }
  });
}
exports.createFile = createFile;

//API getResourceDataDir:获得resource数据路径
//返回类型：
//返回resource数据路径3
function getResourceDataDir(getResourceDataDirCb) {
  console.log("Request handler 'getResourceDataDir' was called.");
  cp.exec('echo $USER', function(error, stdout, stderr) {
    var usrname = stdout.replace("\n", "");
    var data = require('/home/' + usrname + '/.demo-rio/config');
    getResourceDataDirCb(data.dataDir);
  });
}
exports.getResourceDataDir = getResourceDataDir;


/**
 * @method : getAllTagsByCategory
 *
 * @param1 : getAllTagsByCategoryCb 回调函数
 *   @result : string
 *
 * @param2 : category, array
 */
function getAllTagsByCategory(getAllTagsByCategoryCb, category) {
  console.log("Request handler 'getAllTagsByCategory' was called.");
  tagsHandle.getAllTagsByCategory(getAllTagsByCategoryCb, category);
}
exports.getAllTagsByCategory = getAllTagsByCategory;

/**
 * @method getTagsByUri
 *   get tags with specifc uri
 *
 * @param1 getTagsByUriCb
 *    all result in array
 *
 * @param2 sUri
 *    string, uri
 *
 */
function getTagsByUri(getTagsByUriCb, sUri) {
  console.log("Request handler 'getAllTagsByCategory' was called.");
  tagsHandle.getTagsByUri(getTagsByUriCb, sUri);
}
exports.getTagsByUri = getTagsByUri;

/**
 * @method : setTagByUri
 *
 * @param1 : setTagByUriCb 回调函数
 *   @result : string
 *
 * @param2 : oTags, array
 *
 * @param3 : oUri, array
 */
function setTagByUri(setTagByUriCb, oTags, oUri) {
  console.log("Request handler 'setTagByUri' was called.");
  tagsHandle.setTagByUri(setTagByUriCb, oTags, oUri);
}
exports.setTagByUri = setTagByUri;

/**
 * @method getFilesByTag
 *   get all files with specific tags
 *
 * @param1 callback
 *    all result in array
 *
 * @param2 oTags
 *    array, an array of tags
 *
 */
function getFilesByTags(getFilesByTagsCb, oTags) {
  console.log("Request handler 'setTagByUri' was called.");
  tagsHandle.getFilesByTags(getFilesByTagsCb, oTags);
}
exports.getFilesByTags = getFilesByTags;


/**
 * @method rmTagsAll
 *   remove tags from all data base and des files
 *
 * @param1 callback
 *    return success if successed
 *
 * @param2 oTags
 *    array, an array of tags to be removed
 *
 *
 */
function rmTagsAll(rmTagsAllCb, oTags) {
  console.log("Request handler 'rmTagsAll' was called.");
  tagsHandle.rmTagsAll(rmTagsAllCb, oTags);
}
exports.rmTagsAll = rmTagsAll;

/**
 * @method rmTagsByUri
 *   remove a tag from some files with specific uri
 *
 * @param1 callback
 *    return commit if successed
 *
 * @param2 oTags
 *    array, an array of tags to be removed
 *
 *
 */
function rmTagsByUri(rmTagsByUriCb, sTag, oUri) {
  console.log("Request handler 'rmTagsByUri' was called.");
  tagsHandle.rmTagsByUri(rmTagsByUriCb, sTag, oUri);
}
exports.rmTagsByUri = rmTagsByUri;

/** 
 * @Method: readThemeConf
 *    read file Theme.conf
 *
 * @param: callback
 *    result as a json object
 **/
function readThemeConf(callback) {
  console.log("Request handler 'readThemeConf' was called.");
  desktopConf.readThemeConf(readThemeConfCb);
}
exports.readThemeConf = readThemeConf;

/** 
 * @Method: writeThemeConf
 *    modify file Theme.conf
 *
 * @param: callback
 *    Retrive "success" when success
 *
 * @param: oTheme
 *    json object, modified content of Theme.conf
 *
 **/
function writeThemeConf(callback, oTheme) {
  console.log("Request handler 'writeThemeConf' was called.");
  desktopConf.writeThemeConf(writeThemeConfCb,oTheme);
}
exports.writeThemeConf = writeThemeConf;

/** 
 * @Method: readWidgetConf
 *    read file Widget.conf
 *
 * @param: callback
 *    result as a json object
 **/
function readWidgetConf(callback) {
  console.log("Request handler 'readWidgetConf' was called.");
  desktopConf.readWidgetConf(readWidgetConfCb);
}
exports.readWidgetConf = readWidgetConf;

/** 
 * @Method: writeThemeConf
 *    modify file Theme.conf
 *
 * @param: callback
 *    Retrive "success" when success
 *
 * @param: oTheme
 *    json object, modified content of Widget.conf
 *
 **/
function writeWidgetConf(callback, oWidget) {
  console.log("Request handler 'writeWidgetConf' was called.");
  desktopConf.writeWidgetConf(writeWidgetConfCb,oWidget);
}
exports.writeWidgetConf = writeWidgetConf;

/** 
 * @Method: readDesktopEntries
 *    read file Widget.conf
 *
 * @param1: callback
 *    result as a json object
 *
 * @param2: fileName
 *    name of target file
 *
 **/
function readDesktopEntries(callback,sFileName){
  console.log("Request handler 'readDesktopEntries' was called.");
  desktopConf.readDesktopEntries(readDesktopEntriesCb,sFileName);

}
exports.readDesktopEntries = readDesktopEntries;
