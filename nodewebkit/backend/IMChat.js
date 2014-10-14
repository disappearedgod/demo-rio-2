var net = require('net');
var hashtable = require('hashtable');
var crypto = require('crypto');
var dboper = require('./DAO/IMChatDao.js');
var fs = require('fs');
var ursa = require('./newUrsa');
var ursaED = require('./ursaED');
var account = require('./account');

var keySizeBits = 1024;
var size = 65537;


var LOCALACCOUNT = 'fyf';
var LOCALACCOUNTKEY = 'fyf';
var LOCALUUID = 'Linux Mint';
var LOCALPRIKEY = './key/priKey.pem';
var KEYSERVERPUB = './key/serverKey.pem';
var LOCALPUBKEY = './key/pubKey.pem';

/*
 * @method MD5
 *  计算某个字符串的MD5值
 * @param str
 *  待计算的字符串
 * @param encoding
 *  编码方式，默认为hex，该参数可省略
 * @return md5
 *  返回md5校验值
 */
function MD5(str, encoding) {
  return crypto.createHash('md5').update(str).digest(encoding || 'hex');
}

/*
* @method initIMServer
*  初始化本地消息接收Server，该Server负责所有的通信接收，存储，回复ACK等操作
* @param ReceivedMsgCallback
*   当成功接收到客户端发来的消息时，调用该回调函数
*    @msg 
*     string 回调函数参数，表示成功接收到的消息
* @return null
*  没有返回值
*/
function initIMServer(ReceivedMsgCallback) {
  /*
  we should load the keyPair first, in order to encrypt messages with RSA
  */
  var keyPair = ursaED.loadPriKeySync(LOCALPRIKEY);
  var pubKey = ursaED.loadPubKeySync(LOCALPRIKEY);
  var keySizeBits = 1024;

  var server = net.createServer(function(c) {
    console.log('Remote ' + c.remoteAddress + ' : ' + c.remotePort + ' connected!');
    var remoteAD = c.remoteAddress;
    var remotePT = c.remotePort;

    c.on('data', function(msgStri) {
      console.log('data from :' + remoteAD + ': ' + remotePT + ' ' + msgStri);
      /*
    keyPair to be intergrated by Account Server
    keyPair should be loaded by local account
    */
      var msgStr = JSON.parse(msgStri);
      try {
        var decrypteds = ursaED.decrypt(keyPair, msgStr[0].content.toString('utf-8'), keySizeBits / 8);
        console.log('解密：' + decrypteds);
        var msgObj = JSON.parse(decrypteds);
        console.log(msgObj);
        console.log('MSG type:' + msgObj.type);
      } catch (err) {
        console.log(err);
        console.log("sender pubkey error, change pubkey and try again");
        return;
      }
      switch (msgObj.type) {
        case 'SentEnFirst':
          {
            console.log(msgObj.message);
            var msgtime = new Date();
            msgtime.setTime(msgObj.time);
            console.log(msgtime);
            //console.log("=========================================");
            //output message and save to database
            //return success
            //dboper.dbrecvInsert(msgObj.from, msgObj.to, msgObj.message, msgObj.type, msgObj.time, function() {
            // console.log("insert into db success!");} );
            setTimeout(ReceivedMsgCallback(msgObj.message),0);


            //console.log("pubkey is "+pubKey);

            isExist(msgObj.uuid, function() {
              var tmpkey = ursaED.loadPubKeySync('./key/users/' + msgObj.uuid + '.pem');
              var tp = encapsuMSG(MD5(msgObj.message), "Reply", LOCALACCOUNT, LOCALUUID, msgObj.from);
              var tmpsmsg = encryptSentMSG(tp, tmpkey)
              c.write(tmpsmsg);
            }, function() {
              requestPubKey(msgObj.uuid, msgObj.from, keyPair, function() {
                var tmpkey = ursaED.loadPubKeySync('./key/users/' + msgObj.uuid + '.pem');
                var tp = encapsuMSG(MD5(msgObj.message), "Reply", LOCALACCOUNT, LOCALUUID, msgObj.from);
                var tmpsmsg = encryptSentMSG(tp, tmpkey)
                c.write(tmpsmsg);
              });
            });
          }
          break;
        case 'Reply':
          {
            //console.log("=========================================");
            //sender received message, sesson end
          }
          break;
        default:
          {
            console.log("this is in default switch on data");
            //console.log(data);
          }
      }
    });

    c.on('close', function() {
      console.log('Remote ' + remoteAD + ' : ' + remotePT + ' disconnected!');
    });


    c.on('error', function() {
      console.log('Unexpected Error!');
    });

  });

  server.on('error', function(err) {
    console.log("Error: " + err.code + " on " + err.syscall);
  });

  server.listen(8892, function() {
    console.log('IMServer Binded! ' + 8892);
  });
}

/*
 * @method sendMSG
 *  根据IP和端口号来发送封装好的数据，若发送成功，则把成功发送的消息存至本地数据库中。若发送失败，则重新发送（循环5次）
 * @param IP
 *  目的方的IP地址
 * @param PORT
 *  接收方帐号
 * @param MSG
 *  用encapsuMSG包装过的待发送消息
 * @param PORT
 *  消息接收方的通信端口
 *@param KEYPAIR
 *发送方的pubkey生成的keypair
 *@param SentCallBack
 *发送方发送数据成功后的callback函数
*     @msg 
*     string 回调函数参数，表示发送成功的消息
 * @return null
 *  没有返回值
 */
function sendIMMsg(IP, PORT, SENDMSG, KEYPAIR, SentCallBack) {
  var count = 0;
  var id = 0;
  var tmpenmsg = encryptSentMSG(SENDMSG, KEYPAIR);
  var MSG = JSON.parse(SENDMSG);
  //  var nnnss = JSON.stringify(SENDMSG);
  var dec = MSG[0].content;
  var pat = JSON.parse(dec);

  if (!net.isIP(IP)) {
    console.log('Input IP Format Error!');
    return;
  };
  var client = new net.Socket();
  client.setTimeout(6000, function() {
    console.log("connect time out");
    client.end();
  });

  function innerrply() {
    id = setInterval(function(C, tmpenmsg) {
      var innermsg = encryptSentMSG(SENDMSG, KEYPAIR);
      if (count < 5) {
        console.log("this is in resent " + innermsg);
        client.write(innermsg);
        count++;
      } else {
        clearInterval(id);
        console.log("Send message error: no reply ");
      };

    }, 1000, client, MSG);
  }
  switch (MSG[0].type) {
    case 'SentEnFirst':
      {
        console.log("ttt" + tmpenmsg);
        client.connect(PORT, IP, function() {
          client.write(tmpenmsg, function() {});
        });
      }
      break;
    default:
      {
        client.connect(PORT, IP, function() {
          client.write(tmpenmsg, function() {});
        });
      }
  }

  client.on('connect', innerrply);

  client.on('data', function(REPLY) {
    console.log("remote data arrived! " + client.remoteAddress + " : " + client.remotePort);
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////this part should be replaced by local prikey//////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var RPLY = JSON.parse(REPLY);
    var keyPair = ursaED.loadPriKeySync(LOCALPRIKEY);
    var decrply = ursaED.decrypt(keyPair, RPLY[0].content.toString('utf-8'), keySizeBits / 8);
    console.log("decry message:" + decrply);
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var msg = JSON.parse(decrply);
    switch (msg.type) {
      case 'Reply':
        {
          if (msg.message == MD5(pat.message)) {
            var msgtp = pat;
            console.log('msg rply received: ' + msg.message);
            //  dboper.dbsentInsert(msgtp.from, msgtp.to, msgtp.message, msgtp.type, msgtp.time, function() {
            // console.log("sent message insert into db success!");        });
            setTimeout(SentCallBack(msgtp.message),0);
            clearInterval(id);
            client.end();
          };
        }
        break;
    }
  });
  //client.end();

  client.on('error', function(err) {
    console.log("Error: " + err.code + " on " + err.syscall + " !  IP : " + IP);
    clearInterval(id);
    client.end();
  });
}

/*
 * @method sendMSGbyAccount
 *  根据账户来发送消息，该函数从对应表中获取某一帐号所对应的所有IP地址集合，然后遍历该集合，把消息推送到该帐号的所有IP地址
 * @param TABLE
 *  用来存储ACCOUNT和IP对应关系的对应表，若对应表为空，说明该机器不在局域网内，将该消息推送到服务器端
 * @param ACCOUNT
 *  接收方帐号
 * @param MSG
 *  待发送消息
 * @param PORT
 *  消息接收方的通信端口
 * @return null
 *  没有返回值
 */
function sendMSGbyAccount(TABLE, ACCOUNT, MSG, PORT) {
  var ipset = TABLE.get(ACCOUNT);

  if (typeof ipset == "undefined") {
    console.log("destination account not in local lan!");
    /*
    here are some server msg send functions!
    */
  };

  var localkeyPair = ursaED.loadPriKeySync(LOCALPRIKEY);
  //var localkeyPair =  ursaED.initSelfRSAKeys('./key/priKey.pem','./key/pubKey.pem');
  /*
  MSG already be capsuled by encapsuMSG function
  */
  for (var i = 0; i < ipset.length; i++) {
    console.log("sending " + ipset[i].UID + " in account " + ACCOUNT);
    existsPubkeyPem(ipset[i], ACCOUNT, MSG, PORT, localkeyPair, function(msg) {
      console.log("msg sent successful:::" + msg);
    });
  };

  console.log("send " + ipset.length + " IPs in " + ACCOUNT);
}

function sendMSGbyUID(UUID, ACCOUNT, MSG, PORT, SENTCALLBACK) {
  if (typeof UUID == "undefined") {
    console.log("destination account not in local lan!");
    /*
    here are some server msg send functions!
    */
  };
  var localkeyPair = ursaED.loadPriKeySync(LOCALPRIKEY);
  existsPubkeyPem(UUID, ACCOUNT, MSG, PORT, localkeyPair, SENTCALLBACK);
}

function existsPubkeyPem(IPSET, ACCOUNT, MSG, PORT, LOCALPAIR, SENTCALLBACK) {
  function insendfunc() {
    var tmppubkey = ursaED.loadPubKeySync('./key/users/' + IPSET.UID + '.pem');
    /************************************************************
        A should be replaced by the local account
        ********************************************************/
    var tmpmsg = encapsuMSG(MSG, "SentEnFirst", LOCALACCOUNT, LOCALUUID, ACCOUNT);
    console.log(tmpmsg);
    sendIMMsg(IPSET.IP, PORT, tmpmsg, tmppubkey, SENTCALLBACK);
  }

  function rqstpubkey() {
    console.log("nonexist");
    requestPubKey(IPSET.UID, ACCOUNT, LOCALPAIR, insendfunc);
  }
  isExist(IPSET.UID, insendfunc, rqstpubkey);
}

function isExist(UUID, existfunc, noexistfunc) {
  fs.exists('./key/users/' + UUID + '.pem', function(exists) {
    if (exists) {
      existfunc();
    } else {
      noexistfunc();
    };
  });
}

/*
 * @method requestPubKey
 *  去公钥服务器上获取指定的公钥
 * @param UUID
 *  待获取的pubkey所属机器的UUID编号
 * @param ACCOUNT
 *  待获取的pubkey所属UUID所属的帐号名称
 * @param LOCALPAIR
 *  本地KeyPair对
 * @param INSENTFUNC
 *  获取的pubkey成功保存到本地后的回调函数
 * @return null
 */
function requestPubKey(UUID, ACCOUNT, LOCALPAIR, INSENTFUNC) {
  console.log("Pubkey of device: " + UUID + " in " + ACCOUNT + " doesn't exist , request from server!");
  var serverKeyPair = ursaED.loadServerKey(KEYSERVERPUB);
  var tmppubkey = ursaED.loadPubKeySync(LOCALPUBKEY);
  account.login(LOCALACCOUNT, LOCALACCOUNTKEY, LOCALUUID, tmppubkey, LOCALPAIR, serverKeyPair, function(msg) {
    console.log("Login successful: +++" + JSON.stringify(msg));
  });
  account.getPubKeysByName(LOCALACCOUNT, LOCALUUID, ACCOUNT, LOCALPAIR, serverKeyPair, function(msg) {
    console.log(ursaED.getPubKeyPem(LOCALPAIR));
    console.log(JSON.stringify(msg.data.detail));
    msg.data.detail.forEach(function(row) {
      if (row.UUID == UUID) {
        //console.log("UUUUUUIIIIIIIDDDDDD:  "+row.UUID);
        savePubkey('./key/users/' + row.UUID + '.pem', row.pubKey, INSENTFUNC);
        //console.log(row.pubKey);
      };
    });
  });
}

function savePubkey(SAVEPATH, PUBKEY, CALLBACK) {
  fs.appendFile(SAVEPATH, PUBKEY, 'utf8', function(err) {
    if (err) {
      console.log("savepriKey Error: " + err);
    } else {
      console.log("savepriKey successful");
      CALLBACK();
    }
  });
}

/*
 * @method encapsuMSG
 *  将待发送的消息封装成JSON格式，并将JSON数据序列化
 * @param MSG
 *  消息内容，如可以是聊天内容，上下线通知等
 * @param TYPE
 *  消息类型，可以是Chat，Reply等
 * @param FROM
 *  消息的发送方标识，可以是Account帐号
 * @param FROMUUID
 *  消息的发送方的UUID
 * @param TO
 *  消息的接收方标识，可以是Account帐号
 * @return rply
 *  封装好，并且已经序列化的消息字符串
 */
function encapsuMSG(MSG, TYPE, FROM, FROMUUID, TO) {
  var MESSAGE = [];
  var tmp = {};
  var restmp = {};
  var now = new Date();
  restmp['type'] = TYPE;
  restmp['content'] = '';

  switch (TYPE) {
    case 'Chat':
      {
        tmp["from"] = FROM;
        tmp["uuid"] = FROMUUID;
        tmp["to"] = TO;
        tmp["message"] = MSG;
        tmp['type'] = TYPE;
        tmp['time'] = now.getTime();
        var content = JSON.stringify(tmp);
        restmp['content'] = content;
      }
      break;
    case 'Reply':
      {
        tmp["from"] = FROM;
        tmp["to"] = TO;
        tmp["message"] = MSG;
        tmp["type"] = TYPE;
        tmp['time'] = now.getTime();
        var content = JSON.stringify(tmp);
        restmp['content'] = content;
      }
      break;
    case 'RegetPubkey':
      {
        //sender got wrong pubkey, notify sender to update pubkey.
      }
      break;
    case 'SentEnFirst':
      {
        tmp["from"] = FROM;
        tmp["uuid"] = FROMUUID;
        tmp["to"] = TO;
        tmp["message"] = MSG;
        tmp['type'] = TYPE;
        tmp['time'] = now.getTime();
        var content = JSON.stringify(tmp);
        restmp['content'] = content;
      }
      break;
    default:
      {
        console.log("encapsuMSG : Please take a proper Type.");
      }
  }

  MESSAGE.push(restmp);
  var send = JSON.stringify(MESSAGE);
  return send;
}

function encryptSentMSG(SENTMSG, PUBKEY) {
  var msg = JSON.parse(SENTMSG);
  var dec = msg[0].content;
  var pubkeyPair = ursa.createKey(PUBKEY);
  var encon = ursaED.encrypt(pubkeyPair, dec, keySizeBits / 8);
  msg[0].content = encon;
  var sent = JSON.stringify(msg);
  return sent;
}

/*
 * @method createAccountTable
 *  创建用户账户->IP的映射表
 * @param null
 *
 * @return accounttable
 *  返回新创建的映射表
 */
function createAccountTable() {
  var accounttable = new hashtable();
  return accounttable;
}

/*
 * @method insertAccount
 *  在当前账户中插入新的IP地址（包括同一账户多个用户在线情况），若帐号不存在，则创建新的帐号
 * @param TABLE
 *  用createAccountTable函数创建的映射表
 * @param ACCOUNT
 *  待插入IP的帐号
 * @param IP
 *  新增的IP地址
 * @param UID
 *  新增的IP的对应机器UID
 * @return TABLE
 *  返回新插入IP的映射表
 */
function insertAccount(TABLE, ACCOUNT, IP, UID) {

  if (!net.isIP(IP)) {
    console.log('Input IP Format Error!');
    return;
  };

  var ipset = TABLE.get(ACCOUNT);
  var IPtmp = {};
  IPtmp["IP"] = IP;
  IPtmp["UID"] = UID;

  if (typeof ipset == "undefined") {
    var tmp = [];
    tmp.push(IPtmp);
    TABLE.put(ACCOUNT, tmp);
  } else {
    ipset.push(IPtmp);
    TABLE.remove(ACCOUNT);
    TABLE.put(ACCOUNT, ipset);
  }

  return TABLE;
}

/*
 * @method removeAccountIP
 *  在当前账户中删除某一下线的IP，若当前IP为帐号对应的唯一IP，则删除该帐号
 * @param TABLE
 *  用createAccountTable函数创建的映射表
 * @param ACCOUNT
 *  待删除IP的帐号
 * @param IP
 *  要删除的IP地址
 * @return TABLE
 *  返回删除IP的映射表
 */
function removeAccountIP(TABLE, ACCOUNT, IP) {
  if (!net.isIP(IP)) {
    console.log('Input IP Format Error!');
    return;
  };

  var ipset = TABLE.get(ACCOUNT);

  if (typeof ipset == "undefined") {
    console.log("Input Account Error or Empty Account!");
    return;
  };

  TABLE.remove(ACCOUNT);

  if (ipset.length == 1) {
    return TABLE;
  };

  var orilength = ipset.length;
  for (var i = 0; i < ipset.length; i++) {
    if (ipset[i].IP == IP) {
      ipset.splice(i, 1);
      break;
    }
  };

  if (ipset.length == orilength) {
    console.log("No IP" + IP + "in Account " + Account);
  };

  TABLE.put(ACCOUNT, ipset);

  return TABLE;
}

/*
 * @method getIP
 *  返回某一账户下对应的所有IP，该返回值是一个包含一个或多个IP的字符串数组
 * @param TABLE
 *  用createAccountTable函数创建的映射表 ，该映射表包含N个账户
 * @param ACCOUNT
 *  想获得IP组的指定帐号
 * @return ip
 *  返回ACCOUNT账户下所对应的全部IP地址
 */
function getIP(TABLE, ACCOUNT) {
  var ip = TABLE.get(ACCOUNT);
  if (typeof ip == "undefined") {
    console.log('Get Account IP Error')
    return;
  };
  return ip;
}

/*
 * @method clearTable
 *  清空某一个映射表下的全部映射关系
 * @param TABLE
 *  用createAccountTable函数创建的映射表 ，待清空的表名
 * @return null
 *  返回清空了的映射表（为空）
 */
function clearTable(TABLE) {
  return TABLE.clear();
}

/*
 * @method removeAccount
 *  清空某一个映射表下的某个账户映射关系
 * @param TABLE
 *  用createAccountTable函数创建的映射表 ，待删除ACCOUNT的表名
 * @param ACCOUNT
 *  待删除的ACCOUNT名称
 * @return TABLE
 *  返回删除了ACCOUNT对应关系的映射表
 */
function removeAccount(TABLE, ACCOUNT) {
  return TABLE.remove(ACCOUNT);
}

exports.initIMServer = initIMServer;
exports.sendIMMsg = sendIMMsg;
exports.encapsuMSG = encapsuMSG;
exports.createAccountTable = createAccountTable;
exports.insertAccount = insertAccount;
exports.getIP = getIP;
exports.clearTable = clearTable;
exports.removeAccount = removeAccount;
exports.removeAccountIP = removeAccountIP;
exports.sendMSGbyAccount = sendMSGbyAccount;
exports.encryptSentMSG = encryptSentMSG;
exports.sendMSGbyUID = sendMSGbyUID;