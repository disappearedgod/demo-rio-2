var http = require("http");
var url = require("url");
var sys = require('sys');
var pathModule = require('path');
var git = require("nodegit");
var fs = require('fs');
var os = require('os');
var config = require("../config");
var commonDAO = require("./CommonDAO");
var dataDes = require("./desFilesHandle");
var repo = require("./repo");

//API openDataByUri:通过Uri获取数据资源地址
//返回类型：
//result{
//  openmethod;//三个值：'direct'表示直接通过http访问;'remote'表示通过VNC远程访问;'local'表示直接在本地打开
//  content;//如果openmethod是'direct'或者'local'，则表示路径; 如果openmethod是'remote'，则表示端口号
//}
function openDataByUri(openDataByUriCb,uri){
  function getItemByUriCb(err,items){
    if(err){
      console.log(err);
      return;
    }    
    var item = items[0];
    if(item==null){
      config.riolog("read data : "+ item);
      openDataByUriCb('undefined');
    }
    else{
      config.riolog("read data : "+ item.path);
      var source;
      if(item.postfix==null){
        source={
          openmethod: 'alert',
          content:    item.path + ' can not be recognized.'
        };
      } else {
        switch(item.postfix){
          case 'jpg':
            source={
              openmethod: 'html',
              format:     'div',
              title:      '文件浏览',
              content:    '<img src=' + item.path + ' />'
            }
            break;
          case 'png':
            source={
              openmethod: 'html',
              format:     'div',
              title:      '文件浏览',
              content:    '<img src=' + item.path + ' />'
            }
            break;
          case 'txt':
            source={
              openmethod: 'html',
              format:     'txtfile',
              title:      '文件浏览',
              content:    item.path
            }
            break;
          case 'html5ppt':
            source={
              openmethod: 'html',
              format:     'html5ppt',
              title:      '文件浏览',
              content:    item.path.substring(0, item.path.lastIndexOf('.'))+'/index.html'
            }
            break;
          case 'ogg':
            source={
              openmethod: 'html',
              format:     'audio',
              title:      '文件浏览',
              content:    item.path
            }
            break;
          case 'none':
            source={
              openmethod: 'alert',
              content:    item.path + ' can not be recognized.'
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

            source={
              openmethod: 'html',
              format:     'txt',
              title:      '文件浏览',
              content:    "成功打开文件" + item.path
            }

            var exec = require('child_process').exec;
            var s_command;
            var supportedKeySent=false;
            var s_windowname;//表示打开文件的窗口名称，由于无法直接获得，因此一般设置成文件名，既可以查找到对应的窗口
            switch(item.postfix){
              case 'ppt':
                s_command  = "wpp \"" + item.path + "\"";
                supportedKeySent=true;
                var h=item.path.lastIndexOf('/');
                s_windowname=item.path.substring(h<0?0:h+1, item.path.length);
                break;
              case 'pptx':
                s_command  = "wpp \"" + item.path + "\"";
                supportedKeySent=true;
                var h=item.path.lastIndexOf('/');
                s_windowname=item.path.substring(h<0?0:h+1, item.path.length);
                break;
              case 'doc':
                s_command  = "wps \"" + item.path + "\"";
                break;
              case 'docx':
                s_command  = "wps \"" + item.path + "\"";
                break;
              case 'xls':
                s_command  = "et \"" + item.path + "\"";
                break;
              case 'xlsx':
                s_command  = "et \"" + item.path + "\"";
                break;
              default:
                s_command  = "xdg-open \"" + item.path + "\"";
                break;
            }
            var child = exec(s_command, function(error,stdout,stderr){
              var currentTime = (new Date());
              var updateItem = item;
              updateItem.lastAccessTime = currentTime;
              updateItem.lastAccessDev = config.uniqueID;
              var item_uri = item.URI;
              var sTableName = getCategoryByUri(item_uri);
              updateItem.category = sTableName;
              var nameindex=item.path.lastIndexOf('/');
              var addPath=item.path.substring(config.RESOURCEPATH.length+1,nameindex);
              var itemDesPath=[config.RESOURCEPATH+"/.des/"+addPath];
              dataDes.updateItems(item.path,{lastAccessTime:currentTime},itemDesPath,function(){
                repo.repoChsCommit(config.RESOURCEPATH,null,itemDesPath,function(){
                  console.log("success");
                });
              });
            });
            if (supportedKeySent===true){
              source.windowname=s_windowname;
            }
            break;
        }
      }

      openDataByUriCb(source);


    }
  }
  var sTableName = getCategoryByUri(uri);
  commonDAO.findItems(null,sTableName,["URI = "+"'"+uri+"'"],null,getItemByUriCb);
}
exports.openDataByUri = openDataByUri;
