
/* ----------------------------------------------------------------------------
	Pickles Debugger JS
	Last Update : 10:52 2008/08/06
---------------------------------------------------------------------------- */
window.PxDebug = {
	target : "body" ,
	maxLayerNum : 0 ,
	maxBufferSize : ( 5 * 1000 ) ,
	bufferSize : 0 ,
	maxPreviewableStrlen : 100 ,

	//--------------------------------------
	//	テキストをHTMLに変換する
	htmlspecialchars : function( TEXT ){
		TEXT = TEXT.replace( /&/gi , '&amp;' );
		TEXT = TEXT.replace( /</gi , '&lt;' );
		TEXT = TEXT.replace( />/gi , '&gt;' );
		TEXT = TEXT.replace( /\"/gi , '&quot;' );
		return	TEXT;
	} ,

	//--------------------------------------
	//	値を詳細に調べる
	var_dump : function( value , option , is_return , previewElement ){
		if( !is_return ){
			window.PxDebug.bufferSize = 0;
			is_return = 0;
		}
		if( previewElement != undefined ){
			window.PxDebug.bufferSize = 0;
		}
		var $parentBufferSizeMEMO = window.PxDebug.bufferSize;//一つ前のプロセスのバッファサイズ

		//======================================
		//	設定項目を反映
		if( typeof( option ) != 'object' ){
			option = {};
		}

		var target = null;
		if( !document.getElementsByTagName('body')[0] ){
			target = 'alert';
		}else if( option && option.target ){
			target = option.target;
		}else if( window.PxDebug.target ){
			target = window.PxDebug.target;
		}
		if( !target ){
			target = 'body';
		}
		//	/ 設定項目を反映
		//======================================

		var $FIN = '';
		if( value === null ){
			//typeof() が取れない null というのがある？？
			if( target == 'body' ){
				$FIN += '<span style="color:#0000ff;">null</span>';
			}else{
				$FIN += 'null';
			}
		}else{
			switch( typeof( value ) ){
				case 'string'://文字列
					$FIN += typeof( value ) + '(' + value.length + ')' + ' ';
					var $tmpValue = '';
					var $is_cut = false;
					if( !is_return ){
						// フル
						$tmpValue = value;
					}else{
						// 詰める
						if( value.length < window.PxDebug.maxPreviewableStrlen ){
							// 短ければソノママ
							$tmpValue = value;
						}else{
							$tmpValue = value.substr( 0 , window.PxDebug.maxPreviewableStrlen - 3 );
							$is_cut = true;
						}
					}
					if( target == 'body' ){
						$FIN += '<span style="color:#ff6666;">' + window.PxDebug.htmlspecialchars( '"' + $tmpValue + '"' ) + '</span>';
					}else{
						$FIN += '"' + value + '"';
					}
					if( $is_cut ){
						$FIN += '...';
					}
					break;
				case 'number'://数値型
					$FIN += typeof( value ) + '(' + value + ')';
					break;
				case 'boolean'://真偽型
					$FIN += typeof( value ) + '';
					if( value ){
						if( target == 'body' ){
							$FIN += '(<span style="color:#0000ff;">true</span>)';
						}else{
							$FIN += '(true)';
						}
					}else{
						if( target == 'body' ){
							$FIN += '(<span style="color:#0000ff;">false</span>)';
						}else{
							$FIN += '(false)';
						}
					}
					break;
				case 'undefined'://未定義値
					if( target == 'body' ){
						$FIN += '<span style="color:#dd9999;">'+typeof( value )+'</span>';
					}else{
						$FIN += typeof( value );
					}
					break;
				case 'function'://関数
					if( target == 'body' ){
						$FIN += '<span style="color:#0000ff;">' + typeof( value ) + '()</span>';
						if( !is_return ){
							$FIN += '<span style="color:#0000ff;">' + window.PxDebug.htmlspecialchars( '{ ' + value + ' }' ) + '</span>';
						}
					}else{
						$FIN += typeof( value ) + '()';
						if( !is_return ){
							$FIN += window.PxDebug.htmlspecialchars( '{ ' + value + ' }' );
						}
					}
					break;
				case 'object'://オブジェクト
					if( value === null ){
						if( target == 'body' ){
							$FIN += '<span style="color:#0000ff;">null</span>';
						}else{
							$FIN += 'null';
						}
					}else{
						var $INDENT = '';
						if( target != 'body' ){
							for( var $i = 0; $i < is_return; $i++ ){
								$INDENT += '    ';
							}
						}
						if( target == 'body' ){
							//Firefox では、メモリに沢山溜めて置けないっぽいので、
							//どんどん出力するようにしちゃいます。
							var $parentElement = previewElement;
							if( !$parentElement ){
								$parentElement = document.getElementsByTagName('body')[0];
							}
							var elmHr = document.createElement('hr');
							var elmPre = document.createElement('pre');
							elmPre.style.textAlign = 'left';
							var elmDiv = document.createElement('div');
							elmDiv.style.paddingLeft = '20px';

							if( !is_return ){
								$parentElement.appendChild( elmHr );
								$parentElement.appendChild( elmPre );
								$parentElement = elmPre;
							}

							$parentElement.innerHTML = typeof( value ) + "<br />";
							$parentElement.appendChild( elmDiv );
							$parentElement = elmDiv;
						}else{
							$FIN += typeof( value ) + "\n";
						}
						for( var $line in value ){
							if( window.PxDebug.maxBufferSize <= ( window.PxDebug.bufferSize + $FIN.length) ){
								//メモリサイズを超えたら中止
								if( target == 'body' ){
									var $element = document.createElement( 'strong' );
									$element.innerHTML = 'Memory Buffer size OVER!';
									$element.style.color = '#ff0000';
									$parentElement.appendChild( $element );
									$parentElement.innerHTML += "<br />";
								}else{
									$FIN += $INDENT + 'Memory Buffer size OVER!' + "\n";
								}
								break;
							}

							var $type = typeof( value[$line] );

							var $element = document.createElement( 'span' );
							$element.innerHTML = $line + ' => ';
							$parentElement.appendChild( $element );

							if( value[$line] === null ){
								//typeof() が取れない null というのがある？？
								if( target == 'body' ){
									this.var_dump( value[$line] , option , is_return+1 , $parentElement );
									$parentElement.innerHTML += "<br />";
								}else{
									$FIN += $INDENT + $line + ' => ' + 'null' + "\n";
								}
							}else if( $type == 'string' || $type == 'number' || $type == 'function' || $type == 'undefined' || $type == 'boolean' ){
								if( target == 'body' ){
									this.var_dump( value[$line] , option , is_return+1 , $parentElement );
									$parentElement.innerHTML += "<br />";
								}else{
									$FIN += $INDENT + $line + ' => ' + this.var_dump( value[$line] , option , is_return+1 , $parentElement ) + "\n";
								}
							}else if( $type == 'object' ){
								if( value[$line] === null ){
									//nullはそのまま表示する
									if( target == 'body' ){
										this.var_dump( value[$line] , option , is_return+1 , $parentElement );
										$parentElement.innerHTML += "<br />";
									}else{
										$FIN += $INDENT + $line + ' => ' + this.var_dump( value[$line] , option , is_return+1 , $parentElement ) + "\n";
									}
									continue;
								}
								if( ( window.PxDebug.maxBufferSize * 0.8 ) <= window.PxDebug.bufferSize ){
									//メモリがいっぱいな場合はスキップして、
									//省略表示する。
								}else if( is_return < window.PxDebug.maxLayerNum ){
									//配列やオブジェクトの場合でも、
									//階層が浅かった場合はそのまま表示する。
									//深さは、設定 maxLayerNum に従うこと。
									window.PxDebug.bufferSize = ( $parentBufferSizeMEMO + $FIN.length );
									if( target == 'body' ){
										this.var_dump( value[$line] , option , is_return+1 , $parentElement );
										$parentElement.innerHTML += "<br />";
									}else{
										$FIN += $INDENT + $line + ' => ' + this.var_dump( value[$line] , option , is_return+1 , $parentElement ) + "\n";
									}
									continue;
								}
								if( target == 'body' ){
									var $element = document.createElement( 'span' );
									$element.innerHTML = window.PxDebug.htmlspecialchars( '<Object>' );
									$element.style.color = '#009900';
									$parentElement.appendChild( $element );
									$parentElement.innerHTML += "<br />";
								}else{
									$FIN += $INDENT + $line + ' => ' + '<Object>' + "\n";
								}
							}else{
								if( target == 'body' ){
									this.var_dump( value[$line] , option , is_return+1 , $parentElement );
									$parentElement.innerHTML += "<br />";
								}else{
									$FIN += $INDENT + $line + ' => ' + this.var_dump( value[$line] , option , is_return+1 , $parentElement ) + "\n";
								}
							}
						}
						if( target == 'body' ){
//							$FIN += '</div>';
						}else{
							$FIN += "\n";
						}
					}
					if( target == 'body' ){
						return null;
					}
					break;
				default:
					$FIN += typeof( value );
					break;
			}
		}

		window.PxDebug.bufferSize = $parentBufferSizeMEMO;

		if( target == 'body' && document.getElementsByTagName('body')[0] ){
			var $parentElement = previewElement;
			if( !$parentElement ){
				$parentElement = document.getElementsByTagName('body')[0];
			}
			if( !is_return ){
				var elmHr = document.createElement('hr');
				var elmPre = document.createElement('pre');
				elmPre.style.textAlign = 'left';
				$parentElement.appendChild( elmHr );
				$parentElement.appendChild( elmPre );
				$parentElement = elmPre;
			}
			$parentElement.innerHTML += $FIN;
		}else{
			if( is_return ){
				return	$FIN;
			}else{
				alert( $FIN );
			}
		}
	} ,

	//	キーの一覧を得る。
	array_keys : function( $object ){
		var $type = typeof( $object );
	}

}

// var_dump() をグローバルスコープへ登録
window.var_dump = window.PxDebug.var_dump;

