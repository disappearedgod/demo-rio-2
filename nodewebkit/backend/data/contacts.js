/**
 * @Copyright:
 *
 * @Description: Documents Handle.
 *
 * @author: Wangfeng Xiquan Yuanzhe
 *
 * @Data:2014.10.28
 *
 * @version:0.3.0
 **/

var commonDAO = require("../commonHandle/CommonDAO");
var dataDes = require("../commonHandle/desFilesHandle");
var commonHandle = require("../commonHandle/commonHandle");
var pathModule = require('path');
var fs = require('fs');
var fs_extra = require('fs-extra');
var config = require('../config');
var csvtojson = require('../csvTojson');
var uniqueID = require("../uniqueID");
var util = require('util');
var utils = require("../utils");
var tagsHandle = require('../commonHandle/tagsHandle');

var CATEGORY_NAME = "contact";
var DES_NAME = "contactDes";
var REAL_DIR = pathModule.join(config.RESOURCEPATH, CATEGORY_NAME, 'data');
var DES_DIR = pathModule.join(config.RESOURCEPATH, DES_NAME, 'data');



function createData(item, callback) {
  if (item == [] || item == '') {
    console.log('no contact info ...');
    return callback('no contact info ...', null);
  }
  var condition = ["name = '" + item.name + "'"];
  commonDAO.findItems(null, CATEGORY_NAME, condition, null, function(err, result) {
    if (err) {
      return callback(err, null);
    } else if (result != '' && result != null) {
      var _err = 'contact exists: '+ item.name + ' ...';
      return callback(_err, null)
    }
    uniqueID.getFileUid(function(uri) {
      var currentTime = (new Date());
      var oNewItem = {
        URI: uri + "#" + CATEGORY_NAME,
        category: CATEGORY_NAME,
        name: item.name || '',
        phone: item.phone || '',
        phone2: item.phone2 || '',
        phone3: item.phone3 || '',
        phone4: item.phone4 || '',
        phone5: item.phone5 || '',
        sex: item.sex || '',
        age: item.age || '',
        email: item.email || '',
        email2: item.email2 || '',
        id: "",
        photoPath: item.photoPath || '',
        createTime: currentTime,
        lastModifyTime: currentTime,
        lastAccessTime: currentTime,
        createDev: config.uniqueID,
        lastModifyDev: config.uniqueID,
        lastAccessDev: config.uniqueID,
        others: item.others || ''
      }
      dataDes.createItem(oNewItem, DES_DIR, function() {
        commonDAO.createItem(oNewItem, function(err) {
          if (err) {
            return callback(err, null);
          }
          if (item.others != '' && item.others != null) {
            var oTags = item.others.split(',');
            tagsHandle.addInTAGS(oTags, uri, function(err) {
              if (err) {
                return callback(err, null);
              }
              callback(null, 'success');
            });
          } else {
            callback(null, 'success');
          }
        });
      });
    });
  });
}
exports.createData = createData;

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
function getAllContacts(getAllCb) {
  console.log("Request handler 'getAllContacts' was called.");

  function getAllByCaterotyCb(err, data) {
    if (err) {
      console.log(err);
      return;
    }
    var contacts = [];
    data.forEach(function(each) {
      if (each != '' && each != null) {
        var tmp = {
          URI: each.URI,
          name: each.name,
          sex: each.sex,
          age: each.age,
          photoPath: each.photoPath,
          phone: each.phone,
          email: each.email,
          others: each.others
        }
        for (var i = 2; i < 6; i++) {
          if (each['phone' + String(i)] != null && each['phone' + String(i)] != '') {
            tmp['phone' + String(i)] = each['phone' + String(i)];
          }
        }
        if (each.email2 != null && each.email2 != '') {
          tmp.email2 = each.email2;
        }
        contacts.push(tmp);
      }
    });
    getAllCb(contacts);
  }
  commonDAO.findItems(null, [CATEGORY_NAME], null, null, getAllByCaterotyCb);
}
exports.getAllContacts = getAllContacts;

/*
CONTENT in contacts info:
URI, lastAccessTime, id
createTime, createDev lastModifyTime, lastModifyDev lastAccessTime, lastAccessDev,
name, phone, sex, age, email, photoPath
*/
/**
 * @method addContact
 *   add contact info in to db and des files
 *
 * @param1 Item
 *   obdject, the item needs to be added into des file
 *
 * @param2 sItemDesPath
 *   string, the des file path for item
 *
 * @param3 isContactEnd
 *   bool, is true when get all contacts done otherwise false
 *
 * @param4 callback
 *   回调函数, call back when get all data
 *
 *
 */
function addContact(Item, sItemDesPath, isContactEnd, callback) {
  function getFileUidCb(uri) {
    var category = CATEGORY_NAME;
    console.log(JSON.stringify(Item));
    var currentTime = (new Date());
    var phone2 = Item["商务电话"] == undefined ? "" : Item["商务电话"];
    var phone3 = Item["商务电话 2"] == undefined ? "" : Item["商务电话 2"];
    var phone4 = Item["住宅电话"] == undefined ? "" : Item["住宅电话"];
    var phone5 = Item["住宅电话 2"] == undefined ? "" : Item["住宅电话 2"];
    var email2 = Item["电子邮件 2 地址"] == undefined ? "" : Item["电子邮件 2 地址"];
    var oNewItem = {
      id: null,
      URI: uri + "#" + category,
      category: category,
      name: Item["姓"] + Item["名"],
      phone: Item["移动电话"],
      phone2: phone2,
      phone3: phone3,
      phone4: phone4,
      phone5: phone5,
      sex: Item["性别"],
      age: "",
      email: Item["电子邮件地址"],
      email2: email2,
      id: "",
      photoPath: "",
      createTime: currentTime,
      lastModifyTime: currentTime,
      lastAccessTime: currentTime,
      createDev: config.uniqueID,
      lastModifyDev: config.uniqueID,
      lastAccessDev: config.uniqueID,
      others: ""
    }

    function createItemCb() {
      callback(isContactEnd, oNewItem);
    }
    dataDes.createItem(oNewItem, sItemDesPath, createItemCb);
  }
  uniqueID.getFileUid(getFileUidCb);
}

/**
 * @method removeDocumentByUri
 *    Remove document by uri.
 * @param uri
 *    The document's URI.
 * @param callback
 *    Callback
 */
function removeByUri(uri, callback) {
  getByUri(uri, function(items) {
    //Remove des file
    var sDesFullPath = utils.getDesPath(CATEGORY_NAME, items[0].name);
    fs.unlink(sDesFullPath, function(err) {
      if (err) {
        console.log(err);
        callback("err");
      } else {
        //Delete from db
        commonHandle.deleteItemByUri(CATEGORY_NAME, uri, function(isSuccess) {
          if (isSuccess == "rollback") {
            callback("error");
            return;
          }
          callback(null,'success');
        });
      }
    });
  });
}
exports.removeByUri = removeByUri;

/**
 * @method getByUri
 *    Get document info in db.
 * @param uri
 *    The document's URI.
 * @param callback
 *    Callback
 */
function getByUri(uri, callback) {
  commonHandle.getItemByUri(CATEGORY_NAME, uri, callback);
}
exports.getByUri = getByUri;

/**
 * @method initContacts
 *   init contacts info in to db and des files
 *
 * @param1 loadContactsCb
 *   回调函数, call back when load ends
 *
 * @param2 sItemPath
 *   string, the resource path + csvFilename
 */
function initContacts(loadContactsCb, sItemPath) {

  function csvTojsonCb(json) {
    var oJson = JSON.parse(json);
    var oContacts = [];
    var oDesFiles = [];
    var contactsPath = config.RESOURCEPATH + '/' + CATEGORY_NAME + "Des";
    var dataDesPath = contactsPath + "/data";
    for (var k in oJson) {
      if (oJson[k].hasOwnProperty("\u59D3")) {
        oContacts.push(oJson[k]);
      }
    }

    function isEndCallback(_oDesFiles) {
      callback(null,'success');
    }
    for (var k = 0; k < oContacts.length; k++) {
      var isContactEnd = (k == (oContacts.length - 1));
      addContact(oContacts[k], dataDesPath, isContactEnd, function(isContactEnd, oContact) {
        var contactName = oContact.name;
        var contactPath = dataDesPath + '/' + contactName + '.md';
        oDesFiles.push(contactPath);
        commonDAO.createItem(oContact, function() {
          if (isContactEnd) {
            isEndCallback(oDesFiles);
            console.log("succcess");
            console.log("initContacts is end!!!");
          }
        })
      })
    }
  }
  csvtojson.csvTojson(sItemPath, csvTojsonCb);
}
exports.initContacts = initContacts;

function updateDataValue(item, callback) {
  console.log('update value : ', item)
  var desFilePath = pathModule.join(DES_DIR, item.name + '.md');
  dataDes.updateItem(desFilePath, item, function(result) {
    if (result === "success") {
      commonDAO.updateItem(item, function(err) {
        if (err) {
          console.log(err);
          var _err = {
            "contact": err
          };
          callback(_err);
        } else {
          console.log('update contact success!');
          callback('success');
        }
      });
    }
  });
}
exports.updateDataValue = updateDataValue;

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

function getRecentAccessData(num, getRecentAccessDataCb) {
  console.log('getRecentAccessData in ' + CATEGORY_NAME + 'was called!');
  commonHandle.getRecentAccessData(CATEGORY_NAME, getRecentAccessDataCb, num);
}
exports.getRecentAccessData = getRecentAccessData;