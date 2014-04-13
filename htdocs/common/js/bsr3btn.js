(function(window){
	window.bsr3btn = {
		debug_mode : false ,
		url_startpage : null ,
		url_httpaccess : './common/httpaccess/index.php' ,
		display_mode : 'normal' ,
		httpReq : null ,
		elm : {
			wrapper       : $(document.createElement('div')) ,
			addressbar    : $('.base_addressbar') ,
			controller    : $(document.createElement('div')) ,
			display       : $(document.createElement('div')) ,
			display_cont  : $(document.createElement('div')) ,
			status        : $(document.createElement('div')) ,
			alert         : $(document.createElement('div')) ,
			debug_console : $(document.createElement('div')) ,
			debug_div     : $(document.createElement('div')) 
		} ,
		cont : {
			items : null
		} ,
		navi : {
			current_item : 0 ,
			current_x : 0 ,
			current_url : {}
		} ,
		init : function( url_startpage ){
			this.url_startpage = url_startpage;
			this.elm.display_cont.addClass('display');

			// アドレスバー生成
			this.elm.addressbar = $('.base_addressbar');
			// / アドレスバー生成

			// コントローラ生成
			this.elm.controller.append(
				'<ul class="ctrl3btn">'
				+'<li><button class="ctrl3btn_prev">＜＜</button></li>'
				+'<li><button class="ctrl3btn_enter">○</button></li>'
				+'<li><button class="ctrl3btn_next">＞＞</button></li>'
				+'</ul>')
			;
			$('.ctrl3btn_prev',this.elm.controller)
				.bind('mousedown' ,function(){ bsr3btn.set_auto_scroll('prev'); return false; })
				.bind('touchstart',function(){ bsr3btn.set_auto_scroll('prev'); return false; })
				.bind('mouseup' ,function(){ bsr3btn.clear_auto_scroll(); return false; })
				.bind('touchend',function(){ bsr3btn.clear_auto_scroll(); return false; })
			;
			$('.ctrl3btn_enter',this.elm.controller)
				.bind('click',function(){ bsr3btn.enter(); })
			;
			$('.ctrl3btn_next',this.elm.controller)
				.bind('mousedown' ,function(){ bsr3btn.set_auto_scroll('next'); return false; })
				.bind('touchstart',function(){ bsr3btn.set_auto_scroll('next'); return false; })
				.bind('mouseup' ,function(){ bsr3btn.clear_auto_scroll(); return false; })
				.bind('touchend',function(){ bsr3btn.clear_auto_scroll(); return false; })
				.bind('mouseout',function(){ bsr3btn.clear_auto_scroll(); return false; })
			;
			// / コントローラ生成

			this.elm.display
				.addClass('display_wapper')
			;

			this.elm.wrapper
				.css('width','auto')
				.append(this.elm.display)
			;
			this.elm.display.append(this.elm.display_cont);
			this.elm.display.append(this.elm.status);
			this.elm.status
				.css('position','absolute').css('top','2px').css('left','2px')
				.css('display','none')
				.css('font-size','13px')
				.css('color','#a8bfad')
				.css('background-color','#3f6748')
				.css('padding','2px')
				.text('')
			;
			this.elm.wrapper.append(this.elm.controller);
			if( this.debug_mode ){
				$('body').append(this.elm.debug_console);
				this.elm.debug_console
					.css('position','fixed')
					.css('bottom','90px')
					.css('left','0px')
					.css('width','96%')
					.css('color','#ffffff')
					.css('background-color','#dd0000')
					.css('margin','4em 10px 10px 10px')
					.css('padding','10px')
					.css('z-index','20000')
					.html('debug_mode ON')
				;
				$('body').append(this.elm.debug_div);
				this.elm.debug_div
					.css('position','absolute')
					.css('top','4em')
					.css('left','0px')
					.css('width','96%')
					.css('border','1px solid #990000')
					.css('margin','10px')
					.css('padding','10px')
					.css('z-index','20000')
					.html('<a href="javascript:bsr3btn.debug_preview_current_api();">preview API output</a>')
				;
			}
			$('body .content').append(this.elm.wrapper);

			//--------------------------------------
			//  アクセスキー設定
			$('body').keypress( function(e){
				//alert(e.keyCode);
				switch( e.srcElement.tagName.toLowerCase() ){
					case 'input':
					case 'textarea':
					case 'select':
					case 'option':
						return true;
				}
				switch( e.keyCode ){
					case 13://enter
					case 101://e
						bsr3btn.enter();
						return false;
						break;
					case 37://left
					case 38://up
					case 112://p
					case 117://u
						bsr3btn.prev();
						return false;
						break;
					case 39://right
					case 40://down
					case 100://d
					case 110://n
						bsr3btn.next();
						return false;
						break;
				}
			} );
			$('body input').keypress( function(){
				event.stopPropagation();
				return false;
			} );
			//  / アクセスキー設定
			//--------------------------------------

			this.go_remote_content( this.url_startpage );
		} ,
		submit_address_bar : function(formElm){
			var elm_input_url = $('input[name=url]',formElm);
			this.go_remote_content(elm_input_url[0].value);
		} ,

		status : function( msg ){
			if( msg ){
				this.elm.status
					.text(msg)
					.css('display','block')
				;
			}else{
				this.elm.status
					.text('')
					.css('display','none')
				;
			}
			return;
		} ,
		alert : function( msg ){
			this.elm.alert.remove();
			this.elm.alert = $(document.createElement('div'));
			this.elm.display.append(this.elm.alert);
			var alertInner = $(document.createElement('div'));
			alertInner
				.css('display','block')
				.css('padding','3px')
				.text('alert: '+msg)
			;
			this.elm.alert
				.css('display','block')
				.css('position','absolute').css('top','0px').css('left','0px')
				.css('width','100%')
				.css('height','100%')
				.css('color','#3f6748')
				.css('background-color','#a8bfad')
				.append(alertInner)
			;
			this.display_mode = 'alert';
		} ,
		alert_close : function(){
			this.elm.alert.remove();
			this.display_mode = 'normal';
		} ,

		parse_url : function( url ){
			var RTN = {url:url};
			if( url.match(new RegExp('^(.*)#(.*?)$')) ){
				RTN.url = RegExp.$1;
				RTN.fragment = RegExp.$2;
			}
			return RTN;
		} ,

		jump2fragment : function( fragmentId ){
			this.navi.current_item = 0;

			var targetLeft = 0;
			var targetElm = this.elm.display_cont.find('#'+fragmentId);
			if( targetElm[0] ){
				targetLeft = ( targetElm[0].offsetLeft - 4 );
			}
			this.elm.display_cont.scrollLeft( targetLeft );
			return;
		} ,

		go_remote_content : function( url ){
			if( !url.match(new RegExp('^https?\:\/\/','i')) ){
				this.alert('URLが不正です。');
				return;
			}

			var method = 'get';
			var self = this;
			var parsed_url = this.parse_url( url );

			$('input[name=url]',this.elm.addressbar)[0].value = url;
			if( parsed_url.url == self.navi.current_url.url ){
				if( parsed_url.fragment && parsed_url.fragment.length ){
					self.navi.current_url.fragment = parsed_url.fragment;
					self.jump2fragment(parsed_url.fragment);
					self.update_view();
					return;
				}
			}

			self.go_remote_content_abort();//前の通信を中断
			self.status('読み込んでいます...');

			self.httpReq = $.ajax({
				url: self.url_httpaccess ,
				data: {
					url:parsed_url.url ,
					method:method
				} ,
				dataType: 'xml' ,
				success: function( data , dataType ){
					self.status('表示しています...');
					var documentTitle = $('xmlroot>datas>title',data)[0].textContent;
					var httpStatus = $('xmlroot>datas>status',data)[0].textContent;
					if( httpStatus >= 400 ){
						var httpStatusMsg = $('xmlroot>datas>message',data)[0].textContent;
						self.alert(httpStatus+' '+httpStatusMsg);
						return;
					}
					document.title = documentTitle;
					var src = $('xmlroot>content',data)[0].textContent;
					var html_body = $(src);
					$('br',html_body).remove();
					$('hr',html_body).remove();
					$('script',html_body).remove();
					$('iframe',html_body).replaceWith(function(i, html) {
						return $('<span>(iframe removed)</span>');
					});
					$('style',html_body).remove();
					$('link',html_body).remove();
					var allElms = $('*',html_body);
					//属性値の一括調整
					for( var $i = 0; $i < allElms.size(); $i ++ ){
						var currentElm = $(allElms[$i]);
						var tagName = currentElm[0].tagName.toLowerCase();
						for( var $i2 = 0; $i2 < currentElm[0].attributes.length; $i2 ++ ){
							var attName  = currentElm[0].attributes[$i2].nodeName.toLowerCase();
							var attValue = currentElm[0].attributes[$i2].nodeValue;
							var isDelete = true;
							switch( attName ){
								case 'id':
								case 'name':
									isDelete = false;
									break;
								case 'href':
									switch( tagName ){
										case 'a':
										case 'area':
										case 'link':
											isDelete = false; break;
									}
									break;
								case 'src':
									switch( tagName ){
										case 'src':
											isDelete = false; break;
									}
									break;
								case 'action':
								case 'method':
									switch( tagName ){
										case 'form':
											isDelete = false; break;
									}
									break;
								case 'value':
									switch( tagName ){
										case 'input':
										case 'textarea':
										case 'option':
										case 'button':
											isDelete = false; break;
									}
									break;
								case 'type':
									switch( tagName ){
										case 'input':
											isDelete = false; break;
									}
									break;
							}
							if(isDelete){
								currentElm.removeAttr( currentElm[0].attributes[$i2].nodeName );
							}
						}
					}

					//アイテムに目印を追加
					var $tmpClassName = 'mark_of_focusable_items';
					$('a',html_body).addClass($tmpClassName);
					$('input',html_body).addClass($tmpClassName);
					$('input[type=hidden]',html_body).removeClass($tmpClassName);
					$('textarea',html_body).addClass($tmpClassName);
					$('select',html_body).addClass($tmpClassName);
					$('button',html_body).addClass($tmpClassName);
					$('form',html_body).submit(function(){
						self.alert('フォーム送信機能は開発中です。');
						return false;
					});

					self.elm.display_cont.html( html_body );//配置

					self.cont.items = $('.'+$tmpClassName,html_body);
					self.cont.items.removeClass($tmpClassName);
					self.cont.items.click(function(){
						if(!this.href){return true;}
						self.go_remote_content(this.href);return false;
					} );
					self.elm.display_cont.html();
					var elm_title = $(document.createElement('div'))
						.css('font-weight','bold !important')
						.css('border-right','1px dotted #000000 !important')
						.css('padding-right','10px !important')
						.css('margin-right','10px !important')
						.text('['+documentTitle+']')
					;
					self.elm.display_cont.prepend( elm_title );
					self.elm.display_cont.scrollLeft(0);
					self.navi.current_item = 0;
					if( parsed_url.fragment && parsed_url.fragment.length ){
						self.jump2fragment(parsed_url.fragment);
					}
					self.navi.current_url = parsed_url;
					self.update_view();
				} ,
				error : function( XMLHttpRequest, textStatus, errorThrown ){
					self.alert('エラーが発生しました。(status:'+(XMLHttpRequest.status)+'; '+(textStatus)+')');
				} ,
				complete : function(){
					self.status();
				}
			});
			return;
		} ,
		go_remote_content_abort : function(){
			if( this.httpReq && this.httpReq.abort ){
				this.httpReq.abort();
			}
			this.status();
		} ,

		judge_item_in_display : function( current_item ){
			//フォーカスしたアイテムが画面内に収まっているか調べる
			var displayLeft = this.elm.display_cont.scrollLeft();
			var displayWidth = this.elm.display_cont.width();
			var displayRight = (displayLeft+displayWidth);

			var item = $(this.cont.items[current_item]);
			var itemLeft = item[0].offsetLeft;
			var itemWidth = item.width();
			var itemRight = (itemLeft+itemWidth);

			if( itemLeft >= displayRight ){
				return 1;
			}
			if( itemRight <= displayLeft ){
				return -1;
			}
			return 0;
		} ,

		update_view : function(){
			var self = this;
			self.cont.items.removeClass('active');

			if( self.navi.current_item >= self.cont.items.size() ){ self.navi.current_item = self.cont.items.size()-1; }
			if( self.navi.current_item < 0 ){ self.navi.current_item = 0; }

			while( self.judge_item_in_display(self.navi.current_item) < 0 ){
				self.navi.current_item ++;
				if( self.navi.current_item >= self.cont.items.size() ){ self.navi.current_item = self.cont.items.size()-1; break; }
				if( self.navi.current_item < 0 ){ self.navi.current_item = 0; break; }
			}
			while( self.judge_item_in_display(self.navi.current_item) > 0 ){
				self.navi.current_item --;
				if( self.navi.current_item >= self.cont.items.size() ){ self.navi.current_item = self.cont.items.size()-1; break; }
				if( self.navi.current_item < 0 ){ self.navi.current_item = 0; break; }//←breakは無限ループ対策
			}

			$(self.cont.items[self.navi.current_item]).addClass('active');
		} ,

		prev : function(){
			if( this.display_mode == 'alert' ){
				return;
			}
			var now = this.elm.display_cont.scrollLeft();
			this.elm.display_cont.scrollLeft( now - 20 );
			this.navi.current_item --;
			this.update_view();
		} ,
		enter : function(){
			if( this.display_mode == 'alert' ){
				this.alert_close();
				return;
			}
			if( this.judge_item_in_display(this.navi.current_item) === 0 ){
				//画面の範囲内にアクティブなアイテムが入っていたら。
				var elmCurrentItem = this.cont.items[this.navi.current_item];
				if( elmCurrentItem.tagName.toLowerCase() == 'a' ){
					// <a>タグ
					this.go_remote_content( elmCurrentItem.href );
				}else if( elmCurrentItem.tagName.toLowerCase() == 'a' ){
					// <area>タグ (<a>タグの処理と同じ)
					this.go_remote_content( elmCurrentItem.href );
				}else if( elmCurrentItem.tagName.toLowerCase() == 'input' ){
					// <input>タグ
					if( !elmCurrentItem.type || elmCurrentItem.type.toLowerCase() == 'text' ){
						this.alert('フォーム入力欄 の編集機能は開発中です。');//UTODO
					}else if( elmCurrentItem.type.toLowerCase() == 'password' ){
						this.alert('パスワード入力欄 の編集機能は開発中です。');//UTODO
					}else if( elmCurrentItem.type.toLowerCase() == 'radio' ){
						this.alert('ラジオボタンの動作は開発中です。');//UTODO
					}else if( elmCurrentItem.type.toLowerCase() == 'checkbox' ){
						this.alert('チェックボックスの動作は開発中です。');//UTODO
					}else if( elmCurrentItem.type.toLowerCase() == 'submit' ){
						this.alert('送信ボタンの動作は開発中です。');//UTODO
					}else{
						this.console('[ERROR] Unknown INPUT Element. ['+elmCurrentItem.type+']');
					}
				}else if( elmCurrentItem.tagName.toLowerCase() == 'textarea' ){
					// <textarea>タグ
					this.alert('TEXTAREA の編集機能は開発中です。');//UTODO
				}else if( elmCurrentItem.tagName.toLowerCase() == 'select' ){
					// <select>タグ
					this.alert('セレクトボックス の選択機能は開発中です。');//UTODO
				}else if( elmCurrentItem.tagName.toLowerCase() == 'button' ){
					// <button>タグ
					this.console('BUTTON タグには対応していません。.');//UTODO
				}else{
					// その他のタグ
					this.console('[ERROR] Unknown Element. ['+elmCurrentItem.tagName+']');//UTODO
				}
			}else{
				this.console('no active item.');
			}
		} ,
		next : function(){
			if( this.display_mode == 'alert' ){
				return;
			}
			var now = this.elm.display_cont.scrollLeft();
			this.elm.display_cont.scrollLeft( now + 20 );
			this.navi.current_item ++;
			this.update_view();
		} ,

		auto_scroll_timer : null ,
		set_auto_scroll : function( vector ){
			var self = this;
			if( vector == 'prev' ){
				this.prev();
			}else{
				this.next();
			}
			this.clear_auto_scroll();
			var autoScroll = function(){
				self.auto_scroll_timer = setInterval(
					function(){
						if( vector == 'prev' ){self.prev();}
						else{self.next();}
					}
				,50);
			};
			this.auto_scroll_timer = setTimeout( autoScroll , 500);
		} ,
		clear_auto_scroll : function(){
			clearTimeout( this.auto_scroll_timer );
		} ,

		console : function( msg ){
			if( this.debug_mode ){
				this.elm.debug_console.text(msg);
			}
		} ,
		debug_preview_current_api : function(){
			if( this.debug_mode ){
				var url = $('input[name=url]',this.elm.addressbar)[0].value;
				window.open( this.url_httpaccess + '?url=' + encodeURIComponent(url) );
			}
		}
	};
})(window);
