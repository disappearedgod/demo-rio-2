/**
 * @Copyright:
 *
 * @Description: Music Handle.
 *
 * @author: Wangfeng Xiquan Yuanzhe
 *
 * @Data:2014.10.28
 *
 * @version:0.3.0
 **/

var http = require("http");
var url = require("url");
var sys = require('sys');
var pathModule = require('path');
var git = require("nodegit");
var fs = require('fs');
var fs_extra = require('fs-extra');
var os = require('os');
var config = require("../config");
var commonDAO = require("../commonHandle/CommonDAO");
var resourceRepo = require("../commonHandle/repo");
var util = require('util');
var utils = require('../utils');
var events = require('events');
var csvtojson = require('../csvTojson');
var uniqueID = require("../uniqueID");
var tagsHandle = require('../commonHandle/tagsHandle');
var commonHandle = require('../commonHandle/commonHandle');
var rdfHandle = require('../commonHandle/rdfHandle');
var dataDes = require('../commonHandle/desFilesHandle');



//@const
var CATEGORY_NAME = "music";
var DES_NAME = "musicDes";
var REAL_REPO_DIR = pathModule.join(config.RESOURCEPATH, CATEGORY_NAME);
var DES_REPO_DIR = pathModule.join(config.RESOURCEPATH, DES_NAME);
var REAL_DIR = pathModule.join(config.RESOURCEPATH, CATEGORY_NAME, 'data');



function getTagsFromString(str) {
  var tags={
    format:null,
    bit_rate:null,
    frequency:null,
    track:null,
    TDRC:null,
    APIC:null,
    TALB:null,
    TPE1:null,
    TIT2:null,
    TXXX:null,
    COMM:null
  };
  var line1 = str.split("\n");
  for (var index1 in line1) {
    if (line1[index1] == "") {
      line1.pop(line1[index1]);
    }
    else{
      if(line1[index1].lastIndexOf("- ")>=0){
        var line2 = str.split(",");
        for (var index2 in line2) {
          if(line2[index2].lastIndexOf("MPEG")>=0){
            tags.format=(line2[index2].substring(line2[index2].lastIndexOf("MPEG"),line2[index2].length)).replace(/(^\s*)|(\s*$)/g,'');
          }
          else if(line2[index2].lastIndexOf("bps")>=0){
            tags.bit_rate=(line2[index2].substring(0,line2[index2].lastIndexOf("bps"))).replace(/(^\s*)|(\s*$)/g,'');
          }
          else if(line2[index2].lastIndexOf("Hz")>=0){
            tags.frequency=(line2[index2].substring(0,line2[index2].lastIndexOf("Hz"))).replace(/(^\s*)|(\s*$)/g,'');
          }
          else if(line2[index2].lastIndexOf("seconds")>=0){
            tags.track=(line2[index2].substring(0,line2[index2].lastIndexOf("seconds"))).replace(/(^\s*)|(\s*$)/g,'');
          }
        }
      }
      else if(line1[index1].indexOf("TDRC=")>=0){
        tags.TDRC=(line1[index1].substring(line1[index1].indexOf("=")+1,line1[index1].length)).replace(/(^\s*)|(\s*$)/g,'');
      }
      else if(line1[index1].indexOf("APIC=")>=0){
        tags.APIC=(line1[index1].substring(line1[index1].indexOf("=")+1,line1[index1].length)).replace(/(^\s*)|(\s*$)/g,'');
      }
      else if(line1[index1].indexOf("TALB=")>=0){
        tags.TALB=(line1[index1].substring(line1[index1].indexOf("=")+1,line1[index1].length)).replace(/(^\s*)|(\s*$)/g,'');
      }
      else if(line1[index1].indexOf("TPE1=")>=0){
        tags.TPE1=(line1[index1].substring(line1[index1].indexOf("=")+1,line1[index1].length)).replace(/(^\s*)|(\s*$)/g,'');
      }
      else if(line1[index1].indexOf("TIT2=")>=0){
        tags.TIT2=(line1[index1].substring(line1[index1].indexOf("=")+1,line1[index1].length)).replace(/(^\s*)|(\s*$)/g,'');
      }
      else if(line1[index1].indexOf("TXXX=")>=0){
        tags.TXXX=(line1[index1].substring(line1[index1].indexOf("=")+1,line1[index1].length)).replace(/(^\s*)|(\s*$)/g,'');
      }
      else if(line1[index1].indexOf("COMM=")>=0){
        tags.COMM=(line1[index1].substring(line1[index1].indexOf("=")+1,line1[index1].length)).replace(/(^\s*)|(\s*$)/g,'');
      }
    }
  }
  return tags;
}

function readId3FromMp3(path, callback) {
  console.log(path);
  var cp = require('child_process');
  var cmd = 'mutagen-inspect ' + '"'+path+'"';
  console.log(cmd);
  cp.exec(cmd, function(error, stdout, stderr) {
    if(error){
      console.log(error);
      callback(error);
    }
    else{
      //console.log(stdout);
      callback(error,getTagsFromString(stdout));
    }
  });
}
exports.readId3FromMp3 = readId3FromMp3;

/**
 * @method createData
 *    To create des file, dataBase resocrd and git commit for all data input. T-
 *    -his is only for array or string data input. The proccess would be copy f-
 *    -rst, then create the des file, after all des file done, then write into
 *    data base, final step is commit git.
 *
 * @param1: items
 *    object, an array or string of data full path.
 *    examplt:
 *    var items = '/home/xiquan/resource/documents/test.txt', or
 *    var items = ['/home/xiquan/resource/documents/test1.txt',
 *                 '/home/xiquan/resource/documents/test2.txt'
 *                 '/home/xiquan/resource/documents/test3.txt'].
 *
 * @param2: callback
 *    @result
 *    string, retrieve 'success' when success
 *
 */
function createData(items, callback) {
  commonHandle.dataStore(items, extraInfo, function(err) {
    if (err) {
      return callback(err);
    }
    callback();
  })
}
exports.createData = createData;

function extraInfo(item, callback) {
  readId3FromMp3(item, function(err, tags) {
    if (err) {
      return callback(err);
    }
    var _extra = {
      format: tags.format,
      bit_rate: tags.bit_rate,
      frequency: tags.frequency,
      track: tags.track,
      TDRC: tags.TDRC,
      APIC: tags.APIC,
      TALB: tags.TALB,
      TPE1: tags.TPE1,
      TIT2: tags.TIT2,
      TXXX: tags.TXXX,
      COMM: tags.COMM
    }
    callback(null, _extra);
  })
}


//API openDataByUri:通过Uri获取数据资源地址
//返回类型：
//result{
//  openmethod;//三个值：'direct'表示直接通过http访问;'remote'表示通过VNC远程访问;'local'表示直接在本地打开
//  content;//如果openmethod是'direct'或者'local'，则表示路径; 如果openmethod是'remote'，则表示端口号
//}
function openDataByUri(openDataByUriCb, uri) {
  function getItemByUriCb(items) {
    var item = items[0];
    if (item == null) {
      config.riolog("read data : " + item);
      openDataByUriCb('undefined');
    } else {
      config.riolog("read data : " + item.path);
      var source;
      if (item.postfix == null) {
        source = {
          openmethod: 'alert',
          content: item.path + ' can not be recognized.'
        };
      } else {
        switch (item.postfix) {
          case 'ogg':
          case 'OGG':
            source = {
              openmethod: 'html',
              format: 'audio',
              title: '文件浏览',
              content: item.path
            }
            break;
          case 'mp3':
          case 'MP3':
            source = {
              openmethod: 'html',
              format: 'audio',
              title: '文件浏览',
              content: item.path
            }
            break;
          case 'none':
            source = {
              openmethod: 'alert',
              content: item.path + ' can not be recognized.'
            };
            break;
          default:
            /*
             * TODO: The opening DOC/PPT/XLS files way need to be supported by noVNC.
             * var host = window.location.host.split(':')[0];       //localhost run
             * console.log(host);
             * var password = "demo123";
             * function turnToVNC()
             * {
             *   window.open("../backend/vnc/noVNC/vnc.html?host="+host+"&port="+content+"&password="+password+"&autoconnect=true");
             * }
             * setTimeout(turnToVNC,1000);
             **/

            source = {
              openmethod: 'html',
              format: 'txt',
              title: '文件浏览',
              content: "成功打开文件" + item.path
            }

            var exec = require('child_process').exec;
            var s_command;
            var supportedKeySent = false;
            var s_windowname; //表示打开文件的窗口名称，由于无法直接获得，因此一般设置成文件名，既可以查找到对应的窗口
            switch (item.postfix) {
              default:
                s_command = "xdg-open \"" + item.path + "\"";
                break;
            }
            var child = exec(s_command, function(error, stdout, stderr) {});
            if (supportedKeySent === true) {
              source.windowname = s_windowname;
            }
            break;
        }
      }
      var currentTime = (new Date());
      var updateItem = item;
      updateItem.lastAccessTime = currentTime;
      updateItem.lastAccessDev = config.uniqueID;
          updateItem.category = CATEGORY_NAME;
          var updateItems = new Array();
          var condition = [];
          condition.push("URI='" + item.URI + "'");
          updateItems.conditions = condition;
          updateItems.push(updateItem);
          readId3FromMp3(item.path,function(err,tags){
                  console.log("read mp3 "+item);
                  console.log(err);
                  console.log(tags);
                });

            openDataByUriCb(source);

    }
  }
  getByUri(uri, getItemByUriCb);
}
exports.openDataByUri = openDataByUri;

function getRecentAccessData(num, getRecentAccessDataCb) {
  console.log('getRecentAccessData in ' + CATEGORY_NAME + 'was called!')
  commonHandle.getRecentAccessData(CATEGORY_NAME, getRecentAccessDataCb, num);
}
exports.getRecentAccessData = getRecentAccessData;

/**
 * @method pullRequest
 *    Fetch from remote and merge.
 * @param deviceId
 *    Remote device id.
 * @param deviceIp
 *    Remote device ip.
 * @param deviceAccount
 *    Remote device account.
 * @param resourcesPath
 *    Repository path.
 * @param callback
 *    Callback.
 */
function pullRequest(deviceId,address,account,resourcesPath,callback){
  var sRepoPath = pathModule.join(resourcesPath,CATEGORY_NAME);
  var sDesRepoPath = pathModule.join(resourcesPath,DES_NAME);
  commonHandle.pullRequest(CATEGORY_NAME,deviceId,address,account,sRepoPath,sDesRepoPath,callback);
}
exports.pullRequest = pullRequest;

/** 
 * @Method: getGitLog
 *    To get git log in a specific git repo
 *
 * @param1: callback
 *    @result, (_err,result)
 *
 *    @param1: _err,
 *        string, contain specific error
 *
 *    @param2: result,
 *        array, result of git log
 *
 **/
function getGitLog(callback) {
  console.log('getGitLog in ' + CATEGORY_NAME + 'was called!')
  resourceRepo.getGitLog(DES_REPO_DIR, callback);
}
exports.getGitLog = getGitLog;


/** 
 * @Method: repoReset
 *    To reset git repo to a history commit version. This action would also res-
 *    -des file repo
 *
 * @param1: repoResetCb
 *    @result, (_err,result)
 *
 *    @param1: _err,
 *        string, contain specific error
 *
 *    @param2: result,
 *        string, retieve 'success' when success
 *
 * @param2: category
 *    string, a category name, as 'document'
 *
 * @param3: commitID
 *    string, a history commit id, as '9a67fd92557d84e2f657122e54c190b83cc6e185'
 *
 **/
function repoReset(commitID, callback) {
  getGitLog(function(err, oGitLog) {
    if (err) {
      callback(err, null);
    } else {
      var dataCommitID = oGitLog[commitID].content.relateCommit;
      if (dataCommitID!="null") {
        resourceRepo.repoReset(REAL_REPO_DIR,dataCommitID ,null, function(err, result) {
          if (err) {
            console.log(err);
            callback({
              'document': err
            }, null);
          } 
          else {
            resourceRepo.getLatestCommit(REAL_REPO_DIR, function(relateCommitID) {
              resourceRepo.repoReset(DES_REPO_DIR, commitID,relateCommitID, function(err, result) {
                if (err) {
                  console.log(err);
                  callback({
                    'document': err
                  }, null);
                } 
                else {
                  console.log('reset success!')
                  callback(null, result)
                }
              });
            });
          }
        })
      } 
      else {
        resourceRepo.repoReset(DES_REPO_DIR, commitID,null, function(err, result) {
          if (err) {
            console.log(err);
            callback({
              'document': err
            }, null);
          } 
          else {
            console.log('reset success!')
            callback(null, result)
          }
        });
      }
    }
  });
}
exports.repoReset = repoReset;

function rename(sUri, sNewName, callback) {
  commonHandle.renameDataByUri(CATEGORY_NAME, sUri, sNewName, function(err, result) {
    if (err) {
      return callback(err, null);
    }
    callback(null, result);
  })
}
exports.rename = rename;

/** 
 * @Method: getFilesByTag
 *    To get files with specific tag.
 *
 * @param2: sTag
 *    string, a tag name, as 'document'.
 *
 * @param1: callback
 *    @result, (_err,result)
 *
 *    @param1: _err,
 *        string, contain specific error
 *
 *    @param2: result,
 *        string, file info object in array
 *
 **/
function getFilesByTag(sTag, callback) {
  function getFilesCb(err, result) {
    if (err) {
      return callback(err, null);
    }
    callback(null, result);
  }
  tagsHandle.getFilesByTagsInCategory(getFilesCb, CATEGORY_NAME, sTag);
}
exports.getFilesByTag = getFilesByTag;

function getMusicPicData(filePath, callback) {
  var ID3 = require('id3v2-parser');
  var stream = require('fs').createReadStream(filePath);
  var parser = stream.pipe(new ID3());
  var picData = false;

  function backupIcon(callback_) {
    var option = {
      encoding: 'base64'
    }
    var backup_icon = pathModule.join(config.PROJECTPATH, '/app/demo-rio/newdatamgr/icons/music_180_180.png');
    fs.readFile(backup_icon, option, function(err, buffer_base64) {
      if (err) {
        return callback_(err, null);
      }
      return callback_(null, buffer_base64);
    })
  }
  parser.on('error', function() {
    //if error, then read a backup icon in local.
    return backupIcon(callback);
  });
  parser.on('data', function(tag) {
    if (tag.type == 'APIC') {
      picData = (tag.value.data).toString('base64');
    }
  });
  stream.on('close', function() {
    if (picData) {
      return callback(null, picData);
    }else{
      //if no music thumbnail found, then read a backup icon in local.
      return backupIcon(callback);
    }
  });
}
exports.getMusicPicData = getMusicPicData;


function repoSearch(repoSearchCb, sKey) {
  resourceRepo.repoSearch(CATEGORY_NAME, sKey, repoSearchCb);
}
exports.repoSearch = repoSearch;
