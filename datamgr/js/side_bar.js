//var events = require('events');
//var util = require('util');

//var fs = require('fs');
//eval(fs.readFileSync('../backend/api.js')+'');

// Our type
function SideBar(jquery_element) {
  //events.EventEmitter.call(this);
  this.element = jquery_element;
  this.favorites = $(jquery_element).children('#favorites');
  this.tags = $(jquery_element).children('#tags');
  this.filters = $(jquery_element).children('#filters');
  this.recent = $(jquery_element).children('#recent');
  
  //this.side_bar = sidebar;
  var self = this;
  
	/*
	// Click on blank
	this.element.parent().on('click', function() {
		self.element.children('.focus').removeClass('focus');
	});
	// Click on file
	this.element.delegate('.file', 'click', function(e) {
		self.element.children('.focus').removeClass('focus');
		$(this).addClass('focus');
		e.stopPropagation();
	});
	// Double click on file
	this.element.delegate('.file', 'dblclick', function() {
	  var file_json = self.find_json_by_path($(this).attr('data-path'));
	  var file_path = file_json.path;
	  //console.log('file_json:', file_json);
	  if(file_json){
      var children = self.side_bar.children('li');
      for(var i=0; i<children.length; i++){
        child = $(children[i]);
        //console.log('child length',child.attr('data-path'), file_path);      
        if(child.attr('data-path') == file_path){
          //console.log("match match");
          self.side_bar.children('.active').removeClass('active');
          self.side_bar.find('.icon-white').removeClass('icon-white');
          child.addClass('active');
          child.children('a').children('i').addClass('icon-white ');
          break;
        }
      }
		  self.emit('navigate', file_json);//mime.stat(file_path, file_type)
		}
	});
	*/
}

//util.inherits(SideBar, events.EventEmitter);

SideBar.prototype.set_tags = function(json){
  var self = this;
  var result = [];
  var labels = new Array();
  var count = 0;
  result.push('<li class="divider"></li>');
  result.push('<li class="nav-header">标签</li>');

  function get_tags(tags){
    console.log("callback was baclled")
    var oTags = tags.tags;
    for(var k=0;k<oTags.length;k++){
      result.push('<a id='+oTags[k]+' href="#">'+oTags[k]+'</a>'+'<br/>');
      self.recent.html(result.join('\n'));
    }
    self.tags.html(result.join('\n'));
  }

  if(!json[count]){
    self.tags.html(result.join('\n'));
  }else{
    var category = json[0]['props'].icon;
    if(category == "Contacts"){
      self.tags.html(result.join('\n'));
    }
    else if(category == 'none' || 
      category == 'ppt' || 
      category == 'pptx'|| 
      category == 'doc'|| 
      category == 'docx'|| 
      category == 'wps'|| 
      category == 'odt'|| 
      category == 'et'|| 
      category == 'txt'|| 
      category == 'xls'|| 
      category == 'xlsx' || 
      category == 'ods' || 
      category == 'zip' || 
      category == 'sh' || 
      category == 'gz' || 
      category == 'html' || 
      category == 'et' || 
      category == 'odt' || 
      category == 'pdf' || 
      category == 'powerpoint'){
      DataAPI.getAllTagsByCategory(get_tags,["Documents"]);
  }else{
    DataAPI.getAllTagsByCategory(get_tags,[category]);
  }
}
}

/*
SideBar.prototype.set_tags = function(json){
  var self = this;
  var result = [];
  var labels = new Array();
  result.push('<li class="divider"></li>');
  result.push('<li class="nav-header">标签</li>');
  //console.log("json =======: ", json);
  var count = 0;
  if(!json[count]){
  self.tags.html(result.join('\n'));
  }else {
  function get_labels(record){
    if(record.others != null){
    var one_record_labels = (JSON.stringify(record.others)).replace(/\"/g, '');
    var tmp_labels = one_record_labels.split(",");
    for(var k=0; k<tmp_labels.length; k++){
      var label = tmp_labels[k];
      for(var j=0; j<labels.length; j++){
      if(labels[j] == label){
        break;
      }
      }
      if(j == labels.length){
      labels.push(label);
      result.push('<a id='+label+' href="#">'+label+'</a>');
      }
    } 
    }
    count ++;
    if(count == json.length){
    self.tags.html(result.join('\n'));
    var children = self.tags.children('a');
    for(var i=0; i<children.length; i++){
      self.tags.delegate("#"+$(children[i]).attr('URI'), "click", function(){
//      self.emit('do_filter', json, $(this).attr('id'));
      self.do_filter(json, $(this).attr('URI'));
      });
    }
    }else{
    DataAPI.getDataByUri(get_labels, json[count].URI);    
    }
  }
  DataAPI.getDataByUri(get_labels, json[count].URI);
  }
}
*/
SideBar.prototype.set_filters = function(json){
  var self = this;
  var result = [];

  result.push('<li class="divider"></li>');
  result.push('<li class="nav-header">数据过滤</li>');
	 if(json.length){
		switch(json[0]['props'].icon)
		{
		  case 'folder':
//		    result.push('<input type="button" id="filter_contact" value="联系"/>');
//		    result.push('<input type="button" id="filter_picture" value="图片"/>');
//		    result.push('<input type="button" id="filter_music" value="音乐"/>');
//		    result.push('<input type="button" id="filter_document" value="文档"/>');
		    break;
		  case 'Contacts':
		    result.push('<input type="button" id="filter_135" value="345开头"/>');
        self.filters.delegate("#filter_135", "click", function(){
          var keyword = "345";
//          self.emit('do_filter', keyword, json);
          self.do_filter(json, keyword);
        });
		    break;
		  case 'Pictures':
		    result.push('<input type="button" id="filter_group" value="版本组"/>');
        self.filters.delegate("#filter_group", "click", function(){
          var keyword = "版本组";
//          self.emit('do_filter', json, keyword);
          self.do_filter(json, keyword);
        });
		    break;
		  case 'Music':
		    result.push('<input type="button" id="filter_jay" value="东风破"/>');
        self.filters.delegate("#filter_jay", "click", function(){
          var keyword = "东风破";
//          self.emit('do_filter', json, keyword);
          self.do_filter(json, keyword);
        });
		    break;
		  case 'Documents':
		    result.push('<input type="button" id="filter_hgj" value="COS Desktop"/>');
        self.filters.delegate("#filter_hgj", "click", function(){
          var keyword = "COS Desktop";
//          self.emit('do_filter', json, keyword);
          self.do_filter(json, keyword);
        });
		    break;
      default:
        break;
		}    
	}
  self.filters.html(result.join('\n'));
}


SideBar.prototype.do_filter = function(json, keyword){
  var self = this;
  var filter_result = new Array();
  switch(keyword)
  {
    case '345':
      var count = 0;
      for (var i=0; i<json.length; i++) {
        function get_filter_result(result){
          if(result){
            var phone = JSON.stringify(result.phone);
            if(phone.match('^'+keyword) != null){
              filter_result.push({
                uri:result.URI,
                name:result.name,
                photoPath:result.photoPath,
              });
            }
            count ++;
            if(count == json.length){
              self.emit('show_filter_result', filter_result);
            }
          }else{
            console.log("full information is null.");
            count ++;
          }
        }
        DataAPI.getDataByUri(get_filter_result, json[i].URI);
      }
      break;
    case '版本组':
      var team_members = ['jianmin', 'wangfeng', 'wangyu', 'xifei', 'wuxiang', 'yuanzhe', 'wangtan'];
      for(var i=0; i<json.length; i++){
        var record_str = JSON.stringify(json[i].filename);
        for(var j=0; j<team_members.length; j++){
          if(record_str.match(team_members[j]) != null){
            filter_result.push({
              uri:json[i].URI,
              filename:json[i].filename,
              postfix:json[i].postfix,
              path:json[i].path,
            });
          }
        }
      }
      self.emit('show_filter_result', filter_result);
      break;
    case '东风破':
      for(var i=0; i<json.length; i++){
        var record_str = JSON.stringify(json[i]);
        if(record_str.match(keyword) != null){
          filter_result.push({
            uri:json[i].URI,
            filename:json[i].filename,
            postfix:json[i].postfix,
            path:json[i].path,
          });
        }
      }
      self.emit('show_filter_result', filter_result);
      break;
    case 'COS Desktop':
      for(var i=0; i<json.length; i++){
        var record_str = JSON.stringify(json[i]);
        if(record_str.match(keyword) != null){
          filter_result.push({
            uri:json[i].URI,
            filename:json[i].filename,
            postfix:json[i].postfix,
            path:json[i].path,
          });
        }
      }
      self.emit('show_filter_result', filter_result);
      break;
    default:
      var count = 0;
      console.log("keyword =====: ", keyword);
      for(var i=0; i<json.length; i++){
         function get_result(result){
          if(result){
            var record_str = JSON.stringify(result);
            if(record_str.match(keyword) != null){
            console.log("filter result record string======: ", record_str);
              filter_result.push({
                uri:result.URI,
                filename:result.filename,
                postfix:result.postfix,
                path:result.path,
              });
            }
            count ++;
            if(count == json.length){
              console.log("filter result: ", filter_result);
              self.emit('show_filter_result', filter_result);
            }
          }else{
            console.log("full information is null.");
            count ++;
          }
        }
        DataAPI.getDataByUri(get_result, json[i].URI);
      }
      break;
  }
}

SideBar.prototype.set_recent = function(json){
  var self = this;
  var result = [];
  result.push('<li class="divider"></li>');
  result.push('<li class="nav-header">最近访问</li>');
  var count = 0;
  function get_recent(recent_result){
    for(var i=0; i<recent_result.length; i++){
      var filename;
      if(recent_result[i].hasOwnProperty("filename")){
        filename = (JSON.stringify(recent_result[i].filename)).replace(/\"/g, '');
      }else if(recent_result[i].hasOwnProperty("name")){
        filename = (JSON.stringify(recent_result[i].name)).replace(/\"/g, '');
      }
      result.push('<li><a href="#">'+filename+'</a></li>');
      count ++;
      if(count == recent_result.length){
        self.recent.html(result.join('\n'));
      }
    }
  }
  DataAPI.getRecentAccessData(get_recent, 10);
}

SideBar.prototype.set_favorites = function(favorites_json){
  var self = this;
  var result = [];
  result.push('<li class="nav-header">快捷菜单</li>');
  //result.push('<li data-path="root" class="active"><a href="index.html"><i class="icon-white icon-home"></i> Home</a></li>');
  result.push('<li data-path="root" class="active"><a href="index.html"><i class="glyphicon glyphicon-home" style="color:white"></i> Home</a></li>');
  for(var i=0; i< favorites_json.length; i++){
    var str='<li data-path="'+favorites_json[i]['props'].path+'"><a href="#"><i class="';
    switch(favorites_json[i]['props'].name)
    {
      case 'Contacts':
        //str+='icon-user';
        str+='glyphicon glyphicon-user';
        break;
      case 'Pictures':
        //str+='icon-picture';
        str+='glyphicon glyphicon-picture';
        break;
      case 'Videos':
        //str+='icon-film';
        str+='glyphicon glyphicon-film';
        break;
      case 'Documents':
        //str+='icon-book';
        str+='glyphicon glyphicon-book';
        break;
      case 'Music':
        //str+='icon-music';
        str+='glyphicon glyphicon-music';
        break;
      default:
        str+='glyphicon glyphicon-book';
        break;
    }
    str+='"></i> '+favorites_json[i]['props'].name+'</a></li>';
    result.push(str);
  }
  self.favorites.html(result.join('\n'));
  self.favorites.delegate('a', 'click', function() {
    self.favorites.children('.active').removeAttr('class');//removeClass('active');
    $(this).parent().addClass('active');
    self.favorites.find('[style="color:white"]').removeAttr('style');
    $(this).children('i').attr('style', 'color:white');
    //self.favorites.find('.icon-white').removeClass('icon-white');
    //$(this).children('i').addClass('icon-white ');
    var file_path = $(this).parent().attr('data-path');
	  //var file_json = global_self.find_json_by_path(file_path);
	  //console.log('click on side_bar', file_json);
	  //if(file_json){
		  //global_self.emit('navigate', file_json);
		//}
    if('about' == file_path){
	  window.alert('in developing...^_^');
    }
    else if('root' == file_path){
    //return to homepage
    }
    else{
      //self.open(file_path);
      self.emit('open_favorite', file_path);
    }
  });
}
SideBar.prototype.set_favorites_focus = function(full_path){
  self = this;
  var file_path = full_path;
  var children = self.favorites.children('li');
  for(var i=0; i<children.length; i++){
    child = $(children[i]);
    //console.log('child length',child.attr('data-path'), file_path);  
    if(child.attr('data-path') == file_path){
      //console.log("match match");
      self.favorites.children('.active').removeAttr('class');//removeClass('active');      
      self.favorites.find('[style="color:white"]').removeAttr('style');
      child.children('a').children('i').attr('style', 'color:white');
      //self.favorites.find('.icon-white').removeClass('icon-white');
      //child.children('a').children('i').addClass('icon-white ');
      child.addClass('active');
      break;
    }
  }
}
SideBar.prototype.find_json_by_path = function(filepath){
  var all = file_arch_json[global_dir];
  //console.log('global_dir', global_dir);
  //console.log('filepath', filepath);
  //console.log('file_arch_json[global_dir]', file_arch_json[global_dir]);
  var file = false;
  for(var i=0; i<all.length; i++){
    if(all[i].path == filepath){
      file = all[i];
      break;
    }
  }
  return file;
}

$.extend(SideBar.prototype, $.eventEmitter);
//exports.SideBar = SideBar;
