var MainPicView = Class.extend({
  init:function(){
    this._picContainer = $('<div>',{
      'id': 'pic-container'
    });
    this._picData={
      'path': 'img/show.jpg',
      'text': 'heaven',
      'date': ' 2014-10-31' 
    }
    this.setPicture(this._picData);
  },

  attach:function($parent_){
    $parent_.append(this._picContainer);
  },

  setPicture:function(pic_){
    if (pic_) {
      var _picContent = $('<div>',{
        'class':'pic-content'
      });
      this._picContainer.append(_picContent);
      var _picImg = $('<img>',{
        'class':'pic-img',
        'draggable': false,
        'src': pic_.path
      });
      _picContent.append(_picImg);
      _picBtmContent = $('<div>',{
        'class': 'pic-btm-content'
      });
      _picContent.append(_picBtmContent);
      _picText = $('<span>',{
        'class': 'pic-text',
        'text': pic_.text
      });
      _picBtmContent.append(_picText);
      _picBtn = $('<a>',{
        'class': 'pic-btn icon-heart-empty'
      });
      _picBtmContent.append(_picBtn);
      _picBtn.click(function(){
        if (_picBtn.hasClass('selected')) {
          _picBtn.addClass('icon-heart-empty');
          _picBtn.removeClass('icon-heart');
          _picBtn.removeClass('selected');
        }else{
          _picBtn.addClass('selected');
          _picBtn.removeClass('icon-heart-empty');
          _picBtn.addClass('icon-heart');
        }
      })
      _picDate = $('<span>',{
        'class': 'pic-date',
        'text': pic_.date
      });
      _picBtmContent.append(_picDate);
    };
  },

  removePicture:function(index_){
    if (index_) {
      $(this._picContainer.children('div')[index_]).remove();
    }else{
      this._picContainer.children('div').remove();
    }
  },
  hide:function(){
    this._picContainer.hide();
  },
  show:function(){
    this._picContainer.show();
  }

});