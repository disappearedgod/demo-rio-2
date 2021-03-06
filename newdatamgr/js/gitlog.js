var GitLog = Class.extend({
  init:function(){
    this._gitLogContainer = $('<div>',{
      'id': 'gitlog-container'
    });
    this._gitselect = $('<div>',{
      'id':'gitselect-content'
    });
    this._select = $('<input>',{
     'class': 'gitselect',
     'value': 'contact',
     'readonly': 'readonly'
    });
    this._selectsearch = $('<input>',{
     'class': 'gitselectinput',
     'type':'text'
    });
    this._search_button = $('<button>',{
      'id':'search-button',
      'class':'icon-search'
    });
    this._selectList = $('<div>',{
      'class': 'gitlog-list'
    });
    this._ul = $('<ul>',{
      'class': 'gitlog-ul'
    })
    this._selectArrow = $('<div>',{
      'id': 'arrow'
    })
    this._gitcontent = $('<div>',{
     'class':'git-content'
    })
    this._category = ['contact', 'picture','video','document','music','other'];
    for (var i = 0; i <= this._category.length - 1; i++) {
      var _option = $('<li>',{
        'class':'gitlog-li',
        'text':this._category[i],
        'value': this._category[i]
      });
      this._ul.append(_option);
    };
    this._selectList.append(this._selectArrow);
    this._selectList.append(this._ul);
    this._gitLogContainer.append(this._gitselect);
    this._gitselect.append(this._select);
    this._gitselect.append(this._selectsearch);
    this._gitselect.append(this._search_button);
    this._gitselect.append(this._selectList);
    this._gitLogContainer.append(this._gitcontent);
    this.bindEvent();
  },
  bindEvent:function(){
    var _this = this;
    this._search_button.click(function(ev){
      _this.bindSearchEvent($('.gitselect').val(),$('.gitselectinput').val());
    });
    this._selectsearch.keyup(function(ev){
      var sKey = $('.gitselectinput').val();
      if(sKey === ""){
        _this.getLogShow($('.gitselect').val());
      }else{
        _this.bindSearchEvent($('.gitselect').val(),$('.gitselectinput').val());
      }
    });
    this._select.click(function(ev){
      _this._selectList.slideToggle("normal");
    });
    this._ul.children('li').click(function(ev){
      _this._gitcontent.children().remove();
      _this.setContent($(this).html());
      _this._select.val($(this).html()); 
      _this._selectList.hide(); 

    });
    _this._select.blur(function(){ 
    _this._selectList.slideToggle("normal");
    });         
  },

  getTimeDiff:function(date_){
    var _date = new Date(date_);
    var _now = new Date();
    var _diff = _now.getTime() - _date.getTime();
    var _days = Math.floor(_diff/(24*3600*1000));
    var _text = '';
    switch(true){
      case _days === 0:
        _text = 'Today';
        break;
      case _days ===1:
        _text = 'Yesterday';
        break;
      case _days <= 7 :
        _text = 'Previous ' + _days + ' Days';
        break;
      case ((_days > 7)&&(_days <= 30)) :
         _text = 'Within 1 Month';
        break;
      case ((_days > 30)&&(_days <= 90)) :
        _text = 'Within 3 months';
        break;
      case ((_days > 90)&&(_days <= 180)) :
        _text = 'Within half a year';
        break;
      case ((_days > 180)&&(_days <= 365)) :
        _text = 'Within 1 year';
        break;
      default:
         _text = 'Earlier';
    }
    return _text;
  },
  showContent: function(category_, data_) {
    var _this = this;
    var _revertedCommitIDs = {};
    var content_json = {};
    _this._gitresults = data_;
    var j = 0;
    var _oldText = '';
    for (var _commitID in _this._gitresults) {
      if (_this._gitresults[_commitID]['content']['op'] === 'revert') {
        _revertedCommitIDs[_this._gitresults[_commitID]['content']['revertedCommitID']] = true;
        continue;
      }
      if (_revertedCommitIDs[_commitID]) {
        continue;
      }
      ++j;
      var _date = _this._gitresults[_commitID]['Date'];
      var _dateObj = new Date(_date);
      var arys = _date.split(' ');
      var _text = _this.getTimeDiff(_date);
      content_json[_date] = _this._gitresults[_commitID]['content'];
      if (j % 2 != 0) {
        var _li = $('<li>', {
          'id': 'gitcontent-list1'
        });
      } else {
        var _li = $('<li>', {
          'id': 'gitcontent-list2'
        });
      }
      _this._gitcontent.append(_li);
      var _date_info = $('<span>', {
        'id': 'date-info',
        'text': arys[3] + ' ' + arys[4] + ' ' + arys[5]
      });
      _li.append(_date_info);
      var _time_info = $('<span>', {
        'id': 'time-info',
        'text': arys[6]
      });
      _li.append(_time_info);
      if (_text !== _oldText) {
        var _date_dis = $('<span>', {
          'id': 'date-dis',
          'text': _text
        });
        _li.append(_date_dis);
        _oldText = _text;
      }
      var _photo = $('<a>', {
        'id': 'photo'
      });
      _li.append(_photo);
      var _op = $('<span>', {
        'id': '_op',
        'text': (_this._gitresults[_commitID]['content']['op'] === 'ch') ? 'change' : _this._gitresults[_commitID]['content']['op']
      });
      _li.append(_op);
      var _device = $('<span>', {
        'id': 'device',
        'text': _this._gitresults[_commitID]['content']['device']
      });
      _li.append(_device);
      var _file_select = $('<select>', {
        'class': 'gitselect',
      });
      _li.append(_file_select);
      var _recover_button = $('<button>', {
        'id': 'recover-button',
        'text': 'Confirm Recover'
      });
      _li.append(_recover_button);
      var _num = 0;
      for (var key in _this._gitresults[_commitID]['content']['file']) {
        var _names = _this._gitresults[_commitID]['content']['file'][key].split('/');
        var _name = _names[_names.length - 1];
        var _file_option = $('<option>', {
          'class': 'select-option',
          'text': _name,
          'value': _this._gitresults[_commitID]['content']['file'][key],
          'data-path': _this._gitresults[_commitID]['content']['file'][key]
        });
        _file_select.append(_file_option);
        _num++;
      };
      if (_num > 1) {
        var _file_option = $('<option>', {
          'class': 'select-option',
          'text': 'select all',
          'value': 'all'
        });
        _file_select.append(_file_option);
      }
      _this.bindRecoverEvent(_recover_button, category_, _commitID);
    }
  },
  setContent:function(category_){
    var _this = this;
    var _revertedCommitIDs = {};
    DataAPI.getGitLog(function(err,result){
      if (err||!result) {
        console.log(err);
        return 0;
      };
      _this.showContent(category_,result);
    },category_);
  },
  bindRecoverEvent:function($button_,category_, commitID_){
    $button_.click(function(ev){
      DataAPI.repoReset(function(err_,result_){
        if (err_) {
          console.log(err_);
          return 0;
        }
        var _select = $button_.parent('li').children('select');
        var _path = _select.find("option:selected").attr('data-path');
        $button_.parent().remove();
        switch(category_){
          case 'contact':
            contact.refresh();
            break ;
          default :
            showfiles.refreshByPath(_path);
            break;
        }
      },category_,commitID_);
    });
  },
  attach:function($parent_){
    $parent_.append(this._gitLogContainer);
  },
  getLogShow:function(category_){
    if(!category_){
      var category_ = 'contact';
    }
    this._gitcontent.children('li').remove();
    this.setContent(category_);
    this._gitLogContainer.show();
  },    
  hide:function(){
    this._gitLogContainer.hide();
  },
  bindSearchEvent: function(category_, sKey_) {
    var _this = this;
    var _revertedCommitIDs = {};
    this._gitcontent.children('li').remove();
    DataAPI.repoSearch(function(err_, result_) {
      if (err_) {
        console.log(err_);
        return 0;
      }
      _this.showContent(category_,result_);
      _this._gitLogContainer.show();
    }, category_, sKey_);
  }
});