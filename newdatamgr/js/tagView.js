var TagView = Class.extend({
  init:function(options_){
    this._options = {
      direction: 'down',
      position: 'random',  //listView
      background_color: 'rgb(255,0,0)',
      opacity: 0.9,
      opacity_step:0.2,
      color: 'rgb(255,255,255)',
      max: 6,
      animate: true,
      random_positions: [{left:25,top:20},{left:60,top:60},{left:20,top:50},{left:18,top:130},{left:70,top:30},{left:65,top:90}],
      positions: {top:10,step:30}
    }
    if (options_) {
      for(var key in options_){
        this._options[key] = options_[key];
      }
    };
    var _this = this;
    this._tagList = [];
    this._tagTextList = [];
    this._parent = undefined;
    if (this._options.position === 'random') {
      this._positionIndex = Math.ceil(Math.random()*_this._options.max);
    };
    this._index = 0;
  },
  /**
   * [newTag new create a div of tag]
   * @param  {[type]} tag_ [tag text]
   * @return {[type]}      [div of tag]
   */
  newTag:function(tag_){
    var _tagContainer = $('<div>',{
      'class':'tag-container',
      'draggable':true
    })
    var _tagBackground = $('<div>',{
      'class':'tag-background'
    });
    var _tagSpan = $('<div>',{
      'class': 'tag-text',
      'opacity': 1,
      'text': tag_
    })
    var _tagTriangle = $('<div>',{
      'class':'tag-triangle'
    })
    _tagContainer.append(_tagBackground);
    _tagContainer.append(_tagSpan);
    _tagContainer.append(_tagTriangle);
    return _tagContainer;
  },
  /**
   * [setColorOpacity set color and opacity]
   * @param {[type]} $target_ [a jquery target object]
   * @param {[type]} index_   [index of tags]
   */
  setColorOpacity:function($target_, index_){
    $target_.children('.tag-background').css({
      'background-color': this._options.background_color,
      'opacity': this._options.opacity - index_*this._options.opacity_step
    });
    $target_.children('.tag-text').css({
      'color': this._options.color,
    });
    $target_.children('.tag-triangle').css({
      'background-color': this._options.background_color,
      'opacity': this._options.opacity - index_*this._options.opacity_step
    });
  },
  /**
   * [addTag add a tag]
   * @type {[0]}
   */
  addTag:function(tag_){
    if(!tag_){
      return 0;
    }
    this._tagTextList.push(tag_);
    if(this._index === this._options.max){
      return 0;
    }
    var _tagContainer = this.newTag(tag_);
    this.setColorOpacity(_tagContainer, this._index);
    if (this._parent) {
      this._parent.append(_tagContainer);
    };
    this.setPosition(_tagContainer, this._index);
    this._tagList.push(_tagContainer);
    this.bindDrag(_tagContainer[0]);
    this._index += 1;
  },
  /**
   * [addPreTag description]
   * @param {[type]} tag_ [description]
   */
  addPreTag:function(tag_){
    for (var i = 0; i < this._tagTextList.length; i++) {
      if(this._tagTextList[i] === tag_ ){
        if(i < this._options.max){   //tag is in the show
          var _tag = this._tagList.splice(i,1)[0];
          this._tagList.unshift(_tag);
          var _tagText = this._tagTextList.splice(i,1);
          this._tagTextList.unshift(_tagText[0]);
          for (var j = 0; j < this._tagList.length; j++) {
            this.setColorOpacity(this._tagList[j],j);
          };
          this.showTags();
        }else{    //has the tag but not in the show
          var _tag = this._tagList.splice((this._options.max-1),1)[0];
          _tag.children('.tag-text')[0].text = tag_;
          this._tagList.unshift(_tag);
          var _tagText = this._tagTextList.splice(i,1);
          this._tagTextList.unshift(_tagText);
          for (var j = 0; j < this._tagList.length; j++) {
            this.setColorOpacity(this._tagList[j],j);
          };
          this.showTags();
        }
        return 0;
      }
    };
    this._tagTextList.unshift(tag_);
    var _tagContainer = this.newTag(tag_);
    this._tagList.unshift(_tagContainer);
    for (var i = 0; i < this._tagList.length; i++) {
      this.setColorOpacity((this._tagList[i]),i);
    };
    if (this._parent) {
      this._parent.prepend(_tagContainer);
    };
    this.setPosition(_tagContainer, 0);
    this.bindDrag(_tagContainer[0]);
    if (this._index < this._options.max) {
      this._index++;
    }else{
      this._tagList.pop().remove();
    }
    this.showTags();
  },
  /**
   * [hideTags description]
   * @callback_ {[call back function when finish animate]}
   */
  removeTags:function(callback_){
    var _this = this;
    var _tags = this._parent.children('.tag-container');
    if (!this._options.animate) {
      _tags.remove();
      if (callback_) {
        callback_();
      };
      return ;
    };
    var _tagLeng = _tags.length;
      if (this._options.direction === 'down') {
        _tags.animate({top:_this._options.positions.top},500,function(){
          _tags.remove();
          _tagLeng--;
          if (callback_&&_tagLeng === 0) {
            callback_();
          };
        })
      }else {
        _tags.animate({bottom:_this._options.positions.bottom},500,function(){
          _tags.remove();
          _tagLeng--;
          if (callback_&&_tagLeng === 0) {
            callback_();
          };
        })
      }
  },
  /**
   * [showTags show Tags]
   * @type {[type]}
   */
  showTags:function(){
    var _this = this;
    if (this._options.position === 'random') {
      return 0;
    };
    for (var i = this._tagList.length - 1; i >= 0; i--) {
      if (this._options.direction === 'down') {
        this._tagList[i].animate({top:_this._options.positions.top+ i*_this._options.positions.step},500);
      }else {
        this._tagList[i].animate({bottom:_this._options.positions.bottom+i*_this._options.positions.step},500);
      }
    };
  },
  /**
   * [addTags add mul-tags by addTag function]
   * @type {[type]}
   */
  addTags:function(arrTags_, callback_){
    for (var i = 0; i < arrTags_.length; i++) {
      this.addTag(arrTags_[i]);
    };
    if(this._options.animate){
      this.showTags(callback_);
    }
  },
  /**
   * [removeTagByText remove a tag by tag content]
   * @type {[type]}
   */
  removeTagByText:function(tag_){
    for (var i = 0; i < this._tagList.length; i++) {
      if(this._tagList[i][0].textContent === tag_){
        this._tagList[i].remove();
        this._tagList[i].splice(i,1);
      }
    };
  },
  /**
   * [setParent set element witch would be tagged]
   * @type {[type]}
   */
  setParent:function($parent_){
    this._parent = $parent_;
  },
  /**
   * [refreshPosition refresh position of tag]
   * @type {[type]}
   */
  refreshPosition:function(){
    var _this = this;
    if (this._options.position !== 'random') {
      return 0;
    };
    this._positionIndex = this._positionIndex + 1;
    if (this._positionIndex === this._options.max) {
      this._positionIndex = 0;
    };
    if (this._parent && this._options.position === 'random') {
      for (var i = 0; i < this._tagList.length; i++) {
        var _index = this._positionIndex + i;
        _index = (_index > this._options.max -1) ?  _index - this._options.max : _index; 
        var _position = this._options.random_positions[_index];
        $(this._tagList[i]).animate({
          left: _position.left +'%',
          top: _position.top +'px'
        },{
          duration: 2,  
          easing: 'cubic-bezier(1,0.22,0,0.84)' // 'ease-in'  
        },function(){
          var _triangle = this._tagList[i].children('.tag-triangle');
          if (this._position.left < 50 && 
              _triangle.hasClass('right-triangle')) {
            _triangle.removeClass('right-triangle');
            _triangle.addClass('left-triangle');
          }else if(this._position.left > 50 && 
              _triangle.hasClass('left-triangle')){
            _triangle.removeClass('left-triangle');
            _triangle.removeClass('right-triangle');
          }
        });
      };
    };
  },
  /**
   * [refresh refresh init taglist and index]
   * @type {[type]}
   */
  refresh:function(callback_){
    var _this = this;
    this.removeTags(function(){
      _this._index = 0;
      _this._tagList = [];
      _this._tagTextList = [];
      callback_();
    });
    _this._index = 0;
    if (this._options.position === 'random') {
      this._positionIndex = Math.ceil(Math.random()*_this._options.max);
    };
  },
  /**
   * [setPosition set tag position]
   * @type {[type]}
   */
  setPosition:function($obj_){
    var _position = undefined;
    if (this._options.position === 'random') {
      var _index = this._positionIndex + this._index;
      _index = (_index > this._options.max -1) ?  _index - this._options.max : _index;
      _position = this._options.random_positions[_index];     
      if (_position.left > 50) {
        $obj_.children('div').addClass('left-triangle');
      }else{
        $obj_.children('div').addClass('right-triangle');
      }
      $obj_.css({
        left: _position.left + '%',
        top: _position.top + 'px'
      });
    } else {
      _position = {}
      _position['right'] = this._options.positions.right;
      if (this._options.direction === 'down') {
        if (this._options.animate) {
          _position['top'] = this._options.positions.top;
        }else{
          _position['top'] = this._options.positions.top + this._index * this._options.positions.step;
        };
        $obj_.css({
          top: _position.top + 'px'
        });
      } else if (this._options.direction === 'up'){
        if (this._options.animate) {
        _position['bottom'] = this._options.positions.bottom;
        }else{
          _position['bottom'] = this._options.positions.bottom + this._index * this._options.positions.step;
        }
        $obj_.css({
          bottom: _position.bottom + 'px'
        });
      }
      $obj_.children('div').addClass('left-triangle');
      $obj_.addClass('rotate');
    }
  },
  bindDrag:function(tag_){
    var _this = 
    tag_.ondragstart = this.drag;
    tag_.ondragend = this.dragEnd;
  },
  drag:function(ev){
    $(ev.currentTarget).addClass('no-rotate');
    var _tagText = $(ev.currentTarget).children('.tag-text')[0].textContent;
    console.log(_tagText);
    ev.dataTransfer.setData("tag", _tagText);
  },
  dragEnd:function(ev){
    $(ev.currentTarget).removeClass('no-rotate');
  }
});