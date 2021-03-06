/**
 * @Copyright:
 * 
 * @Description: Message transfer.
 *
 * @author: Yuanzhe
 *
 * @Data:2014.9.22
 *
 * @version:0.2.1
 **/

var im = require("../../lib/api/IM.js");
var config = require("../config");
var repo = require("../commonHandle/repo");
var fs = require("fs");
var cp = require("child_process");
var path = require("path");
var documents = require("../data/document");
var pictures = require("../data/picture");
var commonHandle = require('../commonHandle/commonHandle');
var utils = require('../utils');
var dataDes = require('../commonHandle/desFilesHandle');
var device = require("../data/device");


// @Enum sync state
var syncState = {
  SYNC_IDLE:0,
  SYNC_REQUEST:1,
  SYNC_RESPONSE:2,
  SYNC_START:3,
  SYNC_COMPLETE:4
};
// @Enum message type
var msgType = {
  TYPE_REQUEST:"syncRequest",
  TYPE_RESPONSE:"syncResponse",
  TYPE_START:"syncStart",
  TYPE_COMPLETE:"syncComplete",
  TYPE_ONLINE:"syncOnline",
  TYPE_REFUSED:"syncRefused"
};

// @Enum message type
var syncMethod = {
  METHOD_AUTO:"autoMethod",
  METHOD_ONLINE:"onlineMethod"
};

// @const
var SSH_DIR = ".ssh";
var PRI_KEY = "rio_rsa";
var PUB_KEY = "rio_rsa.pub";
var AUTHORIZED_KEYS = "authorized_keys";
var CONFIG_FILE = "config";
var RESOURCES_PATH = path.join(process.env["HOME"],".custard","resource");

var iCurrentState = syncState.SYNC_IDLE;
var syncList = new Array();

/**
 * @method initServer
 *    Message transfer server initialize.
 */
exports.initServer = function(){
  //imchat.initIMServerNoRSA(config.MSGPORT,recieveMsgCb);
  im.registerApp(recieveMsgCb, "app1");

  im.startIMService(function(state) {
    console.log(state);
  },"");
}

function recieveMsgCb(msgobj){
  var msg = msgobj['MsgObj'];
  var oMessage = JSON.parse(msg.message);
  switch(oMessage.type){
    case msgType.TYPE_REQUEST: {
      syncRequest(oMessage);
    }
    break;
    case msgType.TYPE_RESPONSE: {
      syncResponse(oMessage);
    }
    break;
    case msgType.TYPE_START: {
      syncStart(oMessage);
    }
    break;
    case msgType.TYPE_COMPLETE: {
      syncComplete(oMessage);
    }
    break;
    case msgType.TYPE_ONLINE: {
      syncOnline(oMessage);
    }
    break;
    case msgType.TYPE_REFUSED: {
      syncRefused(oMessage);
    }
    break;
    default: {
      console.log("this is in default switch on data");
    }
  }
}

/**
 * @method sendMsg
 *    Send msg to specific address.
 * @param device
 *    Remote device info.
 * @param msgObj
 *    Message object.
 */
function sendMsg(device,msgObj){
  var sMsgStr = JSON.stringify(msgObj);
  var imMsgObj = {
    IP: device.ip,
    UID: device.device_id,
    Account: device.account,
    Msg: sMsgStr,
    App: "app1"
  };
  //console.log("sendMsg To "+device.ip+"-------------------------"+sMsgStr);
  im.sendAppMsg(sendMsgCb,imMsgObj);
}
exports.sendMsg=sendMsg;

/**
 * @method sendMsgCb
 *    Received from remote when message arrived.
 * @param msg
 *    Message string.
 */
function sendMsgCb(msg){
  // TO-DO
  // Right now, this callback do nothing, may be set it null.
  //var msg = msgObj['MsgObj'];
  console.log("Send Msg Successful in sendAppMsg function, msg :::", msg);
}

/**
 * @method checkSyncList
 *    Check sync list and call specific function.
 */
function checkSyncList(){
  if(syncList.length > 0){
    var oDeviceItem = syncList.shift();
    switch(oDeviceItem.syncMethod){
      case syncMethod.METHOD_AUTO:{
        serviceUp(oDeviceItem);
      }
      break;
      case syncMethod.METHOD_ONLINE:{
        syncOnline(oDeviceItem);
      }
      break;
      default:{

      }
    }
  }
}

/**
 * @method checkPubKey
 *    Check if the specific key file exists.
 * @param callback
 *    The callback is passed one argument true/false, where pub key is/isn't exists.
 */
function checkPubKey(callback){
  //Get env HOME path
  var sHomePath = process.env['HOME'];
  var sSshDir = path.join(sHomePath,SSH_DIR);
  var sPriKeyPath = path.join(sSshDir,PRI_KEY);
  var sPubKeyPath = path.join(sSshDir,PUB_KEY);

  fs.exists(sSshDir,function(isDirExists){
    if(!isDirExists){
      callback(false);
      return;
    }
    //ssh以私钥为准，当私钥存在公钥不存在时，再次创建会提示重写信息；当私钥不存在时，不提示重写信息。
    fs.exists(sPriKeyPath,function(isPriFileExists){
      if(!isPriFileExists){
        callback(false);
        return;
      }
      fs.exists(sPubKeyPath,function(isPubFileExists){
        if(!isPubFileExists){
          //remove private key file
          fs.unlink(sPriKeyPath,function(err){
            if(err)
              console.log(err);
            callback(false);
          });
          return;
        }
        callback(true);
      });
    });
  });
}

/**
 * @method readPubKeyFile
 *    Read pub key file, get pub key string.
 * @param callback
 *    This callback is passed one argument: ssh pubkey string.
 */
function readPubKeyFile(callback){
  var sPubKeyPath = path.join(process.env['HOME'],SSH_DIR,PUB_KEY);
  fs.readFile(sPubKeyPath,function(err,data){
    if(err)
      console.log(err);
    callback(data.toString());
  });
}

/**
 * @method setConfig
 *    Config SSH to ignore known_hosts checking.
 * @param callback
 *    Callback will be called when add set configuration successed.
 */
function setConfig(callback){
  var sSSHConifgPath = path.join(process.env['HOME'],SSH_DIR,CONFIG_FILE);
  //解决known_hosts列表问题，添加用户SSH个人config，忽略此检查
  //配置文件不存在则直接添加，存在则需进行充分判断
  fs.exists(sSSHConifgPath,function(isConfigExists){
    if(!isConfigExists){
      var sConfigStr = "StrictHostKeyChecking no\n \
      UserKnownHostsFile /dev/null\n";
      fs.appendFile(sSSHConifgPath,sConfigStr,function(err){
        if(err){
          console.log(err);
        }
        readPubKeyFile(callback);
        return;        
      });
    }else{
      //Todo 配置文件存在，需检查是否按要求进行了配置
      readPubKeyFile(callback);
    }
  });
}

/**
 * @method setPubKey
 *    Add pub key into authorized_keys file.
 *    If the file is not exists, generate it.
 * @param pubKey
 *    SSH pub key from other side.
 * @param callback
 *    Callback will be called when add pub key successed.
 */
function setPubKey(pubKey,callback){
  var sAuthorizedKeysPath = path.join(process.env['HOME'],SSH_DIR,AUTHORIZED_KEYS);
  fs.exists(sAuthorizedKeysPath,function(isAkFileExists){
    if(!isAkFileExists){
      // Create authorized_keys file first
      fs.appendFile(sAuthorizedKeysPath,pubKey,function(err){
        if(err)
          console.log(err);
        //Todo if save in db,update pubkey in db
        callback();
      });
      return;   
    }
    //Todo-如果需要替换文件中pubkey，则需将pubkey写入数据库
    //     先比较数据库中pubkey，再查找文件中Pubkey
    fs.appendFile(sAuthorizedKeysPath,pubKey,function(err){
      if(err)
        console.log(err);
      //Todo if save in db,update pubkey in db
      callback();
    });
  });
}

/**
 * @method getPubKey
 *    Check pub key and get pub key string.
 *    If the ssh key is not exists, generate it.
 * @param callback
 *    This callback is passed one argument: ssh pubkey string.
 */
function getPubKey(callback){
  //If ssh pub key is not exist, run ssh-keygen to generate first.
  checkPubKey(function(isPubKeyExist){
    if(!isPubKeyExist){
      var sPriKeyPath = path.join(process.env['HOME'],SSH_DIR,PRI_KEY);
      var sCommandStr = "ssh-keygen -t rsa -P '' -f '" + sPriKeyPath + "' && ssh-add " + sPriKeyPath;
      cp.exec(sCommandStr,function(err,stdout,stderr){
        if(err)
          console.log(err);
        setConfig(callback);
      });
      return;
    }
    setConfig(callback);
  });
}

/**
 * @method serviceUp
 *    Service up.
 * @param device
 *    Device object,include device id,name,ip and so on.
 */
function serviceUp(device){
  if(device.device_id.localeCompare(config.uniqueID) <= 0){
    return;
  }
  //console.log("###########################################");
  if(device.syncMethod == undefined){
    device.syncMethod = syncMethod.METHOD_AUTO;
  }
  switch(iCurrentState){
    case syncState.SYNC_IDLE:{
      iCurrentState = syncState.SYNC_REQUEST;
      getPubKey(function(pubKeyStr){
        syncList.unshift(device);
        var requestMsg = {
          type:msgType.TYPE_REQUEST,
          ip:config.SERVERIP,
          path:RESOURCES_PATH,
          account:config.ACCOUNT,
          deviceId:config.uniqueID,
          pubKey:pubKeyStr
        };
        sendMsg(device,requestMsg);
      });
    }
    break;
    case syncState.SYNC_REQUEST:{
      syncList.push(device);
    }
    break;
    case syncState.SYNC_RESPONSE:{
      syncList.push(device);
    }
    break;
    case syncState.SYNC_START:{
      syncList.push(device);
    }
    break;
    case syncState.SYNC_COMPLETE:{
      syncList.push(device);
    }
    break;
    default:{
      console.log("This is default.");
    }
  }
}
exports.serviceUp = serviceUp;

/**
 * @method syncRefused
 *    Sync refused.
 * @param msgObj
 *    Message object.
 */
function syncRefused(msgObj){
  switch(iCurrentState){
    case syncState.SYNC_IDLE:{
      //Todo send error msg to reset remote state
      console.log("SYNC ERROR: current state is not request!" + iCurrentState);
    }
    break;
    case syncState.SYNC_REQUEST:{
      var syncDevice = syncList.shift();
      syncList.push(syncDevice);
      iCurrentState = syncState.SYNC_IDLE;
      setTimeout(function(){
        serviceUp(syncList[0]);
      },10000);
 //     console.log("SYNC Refused: sync refused by " + msgObj.deviceId + " from " + msgObj.ip);
    }
    break;
    case syncState.SYNC_RESPONSE:{
      console.log("SYNC ERROR: current state is not request!" + iCurrentState);
    }
    break;
    case syncState.SYNC_START:{
      console.log("SYNC ERROR: current state is not request!" + iCurrentState);
    }
    break;
    case syncState.SYNC_COMPLETE:{
      console.log("SYNC ERROR: current state is not request!" + iCurrentState);
    }
    break;
    default:{
      console.log("This is default.");
    }
  }
}

/**
 * @method syncRequest
 *    Sync request.
 * @param msgObj
 *    Message object.
 */
function syncRequest(msgObj){
  var device = {
    device_id:msgObj.deviceId,
    ip:msgObj.ip,
    account:msgObj.account
  };
  switch(iCurrentState){
    case syncState.SYNC_IDLE:{
      //First is to get pub key, because of this step will create ssh directory.
      iCurrentState = syncState.SYNC_RESPONSE;
      getPubKey(function(pubKeyStr){
        setPubKey(msgObj.pubKey,function(){
          repo.getReposStatus(function(repoArr){
            syncList.unshift(device);
            var responseMsg = {
              type:msgType.TYPE_RESPONSE,
              ip:config.SERVERIP,
              resourcePath:RESOURCES_PATH,
              account:config.ACCOUNT,
              deviceId:config.uniqueID,
              pubKey:pubKeyStr,
              repositories:repoArr
            };
            sendMsg(device,responseMsg);
          });
        });
      });
    }
    break;
    case syncState.SYNC_REQUEST:{
      var refusedMsg = {
        type:msgType.TYPE_REFUSED,
        ip:config.SERVERIP,
        deviceId:config.uniqueID
      };
      sendMsg(device,refusedMsg);
    }
    break;
    case syncState.SYNC_RESPONSE:{
      var refusedMsg = {
        type:msgType.TYPE_REFUSED,
        ip:config.SERVERIP,
        deviceId:config.uniqueID
      };
      sendMsg(device,refusedMsg);
    }
    break;
    case syncState.SYNC_START:{
      var refusedMsg = {
        type:msgType.TYPE_REFUSED,
        ip:config.SERVERIP,
        deviceId:config.uniqueID
      };
      sendMsg(device,refusedMsg);
    }
    break;
    case syncState.SYNC_COMPLETE:{
      var refusedMsg = {
        type:msgType.TYPE_REFUSED,
        ip:config.SERVERIP,
        deviceId:config.uniqueID
      };
      sendMsg(device,refusedMsg);
    }
    break;
    default:{
      console.log("This is default.");
    }
  }
}

/**
 * @method syncResponse
 *    Sync response.
 * @param msgObj
 *    Message object.
 */
function syncResponse(msgObj){
  var device = {
    device_id:msgObj.deviceId,
    ip:msgObj.ip,
    account:msgObj.account
  };
  switch(iCurrentState){
    case syncState.SYNC_IDLE:{
      //Todo send error msg to reset remote state
      console.log("SYNC ERROR: current state is not request!" + iCurrentState);
    }
    break;
    case syncState.SYNC_REQUEST:{
      if(syncList[0].device_id != msgObj.deviceId){
      console.log("SYNC ERROR: current sync device is wrong!" + iCurrentState)
      }
      else{
        iCurrentState = syncState.SYNC_RESPONSE;
        setPubKey(msgObj.pubKey,function(){
          repo.getReposStatus(function(repoArr){
            var responseMsg = {
              type:msgType.TYPE_START,
              ip:config.SERVERIP,
              resourcePath:RESOURCES_PATH,
              account:config.ACCOUNT,
              deviceId:config.uniqueID,
              repositories:repoArr
            };
            sendMsg(device,responseMsg);
            syncStart(msgObj);
          });
        });
      }
    }
    break;
    case syncState.SYNC_RESPONSE:{
      console.log("SYNC ERROR: current state is not request!" + iCurrentState);
    }
    break;
    case syncState.SYNC_START:{
      console.log("SYNC ERROR: current state is not request!" + iCurrentState);
    }
    break;
    case syncState.SYNC_COMPLETE:{
      console.log("SYNC ERROR: current state is not request!" + iCurrentState);
    }
    break;
    default:{
      console.log("This is default.");
    }
  }
}

/**
 * @method syncStart
 *    Sync start.
 * @param msgObj
 *    Message object.
 */
function syncStart(msgObj){
  var device = {
    device_id:msgObj.deviceId,
    ip:msgObj.ip,
    account:msgObj.account
  };
  switch(iCurrentState){
    case syncState.SYNC_IDLE:{
      //Todo send error msg to reset remote state
      console.log("SYNC ERROR: current state is not response!" + iCurrentState);
    }
    break;
    case syncState.SYNC_REQUEST:{
      console.log("SYNC ERROR: current state is not response!" + iCurrentState);
    }
    break;
    case syncState.SYNC_RESPONSE:{
      var sPriKeyPath = path.join(process.env['HOME'],SSH_DIR,PRI_KEY);
      var sCommandStr = "ssh-add " + sPriKeyPath;
      cp.exec(sCommandStr,function(err,stdout,stderr){
        if(err)
          console.log(err);
        console.log("############################" + stdout);
        //Start to sync
        iCurrentState = syncState.SYNC_START;
        var aHotRepos = msgObj.repositories;
        var iRepoNum = 0;
        console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@:"+aHotRepos.length);
        if(aHotRepos.length > 0){
          aHotRepos.forEach(function(hotRepo){
            utils.getCategoryObjectByDes(hotRepo).pullRequest(msgObj.deviceId,msgObj.ip,msgObj.account,msgObj.resourcePath,function(){
              iRepoNum++;
              if(iRepoNum == aHotRepos.length){
                mergeComplete(msgObj.deviceId,msgObj.ip,msgObj.account);
              }
            });
          });
        }else{
          mergeComplete(msgObj.deviceId,msgObj.ip,msgObj.account);
        }
      });
      
    }
    break;
    case syncState.SYNC_START:{
      console.log("SYNC ERROR: current state is not response!" + iCurrentState);
    }
    break;
    case syncState.SYNC_COMPLETE:{
      console.log("SYNC ERROR: current state is not response!" + iCurrentState);
    }
    break;
    default:{
      console.log("This is default.");
    }
  }
}

/**
 * @method mergeComplete
 *    Called when git merge completed.
 * @param deviceId
 *    Remote device id.
 * @param deviceAccount
 *    Remote device account.
 * @param deviceIp
 *    Remote device ip.
 */
function mergeComplete(deviceId,deviceIp,deviceAccount){
  var device = {
    device_id:deviceId,
    ip:deviceIp,
    account:deviceAccount
  };
  var completeMsg = {
    type:msgType.TYPE_COMPLETE,
    ip:config.SERVERIP,
    account:config.ACCOUNT,
    deviceId:config.uniqueID
  };
  iCurrentState = syncState.SYNC_COMPLETE;
  sendMsg(device,completeMsg);
}

/**
 * @method syncComplete
 *    Sync complete.
 * @param msgObj
 *    Message object.
 * @param remoteAddress
 *    Remote device ip.
 */
function syncComplete(msgObj){
  switch(iCurrentState){
    case syncState.SYNC_IDLE:{
      console.log("SYNC completed!");
    }
    break;
    case syncState.SYNC_REQUEST:{
      console.log("SYNC ERROR: current sync device is start/complete!" + iCurrentState)
    }
    break;
    case syncState.SYNC_START:{
      console.log("Remote device sync completed...wait for us" + iCurrentState);
    }
    break;
    case syncState.SYNC_COMPLETE:{
      var device = {
        device_id:msgObj.deviceId,
        ip:msgObj.ip,
        account:msgObj.deviceAccount
      };
      var completeMsg = {
        type:msgType.TYPE_COMPLETE,
        ip:config.SERVERIP,
        account:config.ACCOUNT,
        deviceId:config.uniqueID
      };
      sendMsg(device,completeMsg);
      //Todo check the first element in array.
      syncList.shift();
      //Todo check sync list, if length>0, do sync.
      //if syncList.length>0, get device info ,and call serviceup
      iCurrentState = syncState.SYNC_IDLE;
      checkSyncList();
    }
    break;
    default:{
      console.log("This is default.");
    }
  }
}

/**
 * @method syncOnlineReq
 *    Send sync online request.
 * @param repoPath
 *    Repository path.
 */
function syncOnlineReq(repoPath) {
  var tempPath = null;
  var sBaseName = path.basename(repoPath);
  if (sBaseName == "data") {
    tempPath = path.dirname(repoPath);
  }else{
    tempPath = repoPath;
  }
  //console.log("99999999999999999999999999999999999999999"+tempPath);
  var sBaseName = path.basename(tempPath);
  //console.log("99999999999999999999999999999999999999999"+sBaseName);
  var sCateName = sBaseName.split("Des");
  if(sCateName.length < 2){
    return;
  }
  var msgObj = {
    type: "syncOnline",
    ip: config.SERVERIP,
    path: tempPath,
    account: config.ACCOUNT,
    device_id: config.uniqueID,
    category: sCateName[0]
  };
  device.getDeviceList(function(deviceList){
    for(var index in deviceList){
      if(deviceList[index].address != config.SERVERIP){
        var deviceObj = {
          ip:deviceList[index].address,
          device_id:deviceList[index].txt[2],
          account:deviceList[index].txt[1]
        };
        //console.log("000000000000000000000"+deviceObj);
        sendMsg(deviceObj, msgObj);
      }
    }
  });
}
exports.syncOnlineReq = syncOnlineReq;

/**
 * @method syncOnline
 *    Sync online.
 * @param msgObj
 *    Message object.
 */
function syncOnline(msgObj) {
  //console.log("receive message:::::::::::::::::::::::::::::::::::::::::::::::::::::::");
  //console.log(msgObj);
  //console.log("::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::");
  var device = {
    device_id:msgObj.device_id,
    ip:msgObj.ip,
    account:msgObj.account,
    path:msgObj.path,
    syncMethod:syncMethod.METHOD_ONLINE,
    category:msgObj.category
  };
  if(iCurrentState == syncState.SYNC_IDLE){
    iCurrentState = syncState.SYNC_START;
    syncList.unshift(device);
    repo.haveBranch(msgObj.path,msgObj.device_id,function(isHaveBranch){
      if(isHaveBranch == false){
        console.log("Unknown device!!!!!!!!!!!");
        iCurrentState = syncState.SYNC_IDLE;
        syncList.shift();
        return;
      }
      repo.pullFromOtherRepo(msgObj.path,msgObj.device_id, function(desFileNames){
        var aFilePaths = new Array();
        var sDesPath = utils.getDesRepoDir(msgObj.category);
        desFileNames.forEach(function(desFileName) {
          aFilePaths.push(path.join(sDesPath, desFileName));
        });
        console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% des file paths: " + aFilePaths);
        //TODO base on files, modify data in db
        dataDes.readDesFiles(msgObj.category,aFilePaths, function(desObjs) {
          dataDes.writeDesObjs2Db(desObjs, function(status) {
            //callback(msgObj.device_id,msgObj.ip,msgObj.account);
            console.log("Sync online success!" + status);
            iCurrentState = syncState.SYNC_IDLE;
            syncList.shift();
            checkSyncList();
          });
        });
      });
    });
  }else{
    syncList.push(device);
  }
}