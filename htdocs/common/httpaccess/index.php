<?php
set_time_limit(60);

/* エラーハンドラ */
function my_shutdown_handler(){
	if( !headers_sent() ){
		header('Content-type: application/xml; charset=UTF-8');
		print '<'.'?xml version="1.0" encoding="UTF-8" ?'.'>'."\n";
		print '<xmlroot>';
		print '<datas>';
		print '<status>500</status>';
		print '<message>Timeout</message>';
		print '<content_type>text/html</content_type>';
		print '<url>'.htmlspecialchars( $_GET['url'] ).'</url>';
		print '<title>API Error!</title>';
		print '</datas>';
		$body = 'FatalError. It mayby "Timeout".';
		print '<content>';
		print '<![CDATA[<div>'.htmlspecialchars( $body ).'</div>]]>';
		print '</content>';
		print '</xmlroot>';
	}
}
register_shutdown_function( 'my_shutdown_handler' );
error_reporting(0);
/* / エラーハンドラ */


class httpaccess{
	var $baseUrl = null;
	var $path_current_dir = null;
	var $method = 'get';

	var $pattern_html = '(?:[a-z0-9A-Z_-]+\:)?[a-zA-Z][a-z0-9A-Z_-]*';
	var $pattern_attribute = '(?:[a-z0-9A-Z_-]+\:)?[a-z0-9A-Z_-]+';

	#--------------------------------------
	#	コンストラクタ
	function httpaccess(){
		$this->baseUrl = $_GET['url'];
		$this->method = $_GET['method'];
		if( !strlen( $this->method ) ){
			$this->method = 'get';
		}
		$parsed_baseurl = parse_url( $this->baseUrl );
		$this->path_current_dir = '';
		$this->path_current_dir .= $parsed_baseurl['scheme'].'://'.$parsed_baseurl['host'];
		if( strlen( $parsed_baseurl['port'] ) ){
			$this->path_current_dir .= ':'.$parsed_baseurl['port'];
		}
		$this->path_current_dir .= dirname($parsed_baseurl['path']);
	}

	#--------------------------------------
	#	実処理
	function execute(){

		//リモートコンテンツを取得して標準出力
		mb_internal_encoding('UTF-8');

		require_once( './PxHTTPAccess.php' );
		$httpaccess = new PxHTTPAccess();
		$httpaccess->clear_request_header();//初期化
		$httpaccess->set_url( $this->baseUrl );//ダウンロードするURL
		$httpaccess->set_method( 'GET' );//メソッド

//		$httpaccess->set_http_referer( $_SERVER['HTTP_REFERER'] );//refererを設定
		$httpaccess->set_user_agent( $_SERVER['HTTP_USER_AGENT'] );//userAgentを設定

		$html = $httpaccess->get_http_contents();//ダウンロードを実行する


		require_once( './PxXMLDomParser.php' );
		$parser = new PxXMLDomParser( $html , 'bin' );

		$found = $parser->find('head > title');
		$title = $found[0]['innerHTML'];

		$found = $parser->find('body');
		$found[0]['outerHTML'] = preg_replace( '/\<\!\-\-.*?\-\-\>/s' , '' , $found[0]['outerHTML'] );//HTMLコメントを削除
		$found[0]['outerHTML'] = preg_replace( '/\t+/s' , ' ' , $found[0]['outerHTML'] );//タブを削除
		$found[0]['outerHTML'] = preg_replace( '/(?:\r\n|\r|\n)+/s' , ' ' , $found[0]['outerHTML'] );//改行コードを半角スペースにする
		$found[0]['outerHTML'] = preg_replace( '/ +/s' , ' ' , $found[0]['outerHTML'] );//半角スペースをひとつにまとめる
		$parser = new PxXMLDomParser( $found[0]['outerHTML'] , 'bin' );

		$body = $parser->get_src();
		$body = $this->optimize_attributes('area|a|img|form',$body);

//		header('Content-type: text/plain; charset=UTF-8');
		header('Status: 200 OK');
		header('Content-type: application/xml; charset=UTF-8');
//		header('Content-type: text/html; charset=UTF-8');
		print '<'.'?xml version="1.0" encoding="UTF-8" ?'.'>'."\n";
		print '<xmlroot>';
		print '<datas>';
//		print '<status>499</status>';//←テスト
		print '<status>'.htmlspecialchars( $httpaccess->get_status_cd() ).'</status>';
		print '<message>'.htmlspecialchars( $httpaccess->get_status_msg() ).'</message>';
		print '<content_type>'.htmlspecialchars( $httpaccess->get_content_type() ).'</content_type>';
		print '<url>'.htmlspecialchars( $_GET['url'] ).'</url>';
		print '<title>'.( $title ).'</title>';
		print '</datas>';
		$body = preg_replace('/'.preg_quote('<![CDATA[').'/','<![CD]]><![CDATA[ATA[',$body);
		$body = preg_replace('/'.preg_quote(']]>').'/',']]]]><![CDATA[>',$body);
		print '<content>';
		print '<![CDATA[<div>'.$body.'</div>]]>';
		print '</content>';
		print '</xmlroot>';

		exit;
	}// execute()
	#	/ 実処理
	#--------------------------------------


	#--------------------------------------
	#	相対パスを絶対パスに書き換える
	function convert2realpath( $url , $relativepath ){
		if( preg_match( '/^\//' , $relativepath ) ){
			#	スラッシュから始まっていたら、
			#	変換の必要はない。
			return	$relativepath;
		}

		if( !preg_match( '/^([a-zA-Z]+)\:\/\/(.+?(?:\:[0-9]+)?)(\/.*)/i' , $url ) ){
			return	false;
		}

		$urlinfo = parse_url( trim( $url ) );
		$PROTOCOL = strtolower( $urlinfo['scheme'] );
		$DOMAIN = strtolower( $urlinfo['host'] );
		if( strlen( $urlinfo['port'] ) ){
			$DOMAIN .= ':'.strtolower( $urlinfo['port'] );
		}
		$INNER_PATH = $urlinfo['path'];

		$RTN = dirname( $INNER_PATH );
		if( $RTN == '/' || $RTN == '\\' ){
			$RTN = '';
		}

		$path_layers = explode( '/' , $relativepath );
		foreach( $path_layers as $layer_name ){
			if( $layer_name == '..' ){
				$RTN = dirname( $RTN );
				if( $RTN == '/' ){
					$RTN = '';
				}
			}elseif( $layer_name == '.' ){
				$RTN = $RTN;
			}else{
				$RTN .= '/'.$layer_name;
			}

		}

		return	$RTN;
	}

	#--------------------------------------
	#	属性を調整する
	function optimize_attributes( $tagName , $bin ){
		$pattern_html = $this->get_pattern_html( $tagName );//←全部のエレメントが調査対象

		$str_prev = '';
		$str_next = $bin;
		while( strlen( $str_next ) ){

			$is_hit = 0;
			$str_nextMemo = '';
			while( 1 ){
				#	PxFW 0.6.6 : ヒットしなかった場合にリトライするようにした。
				#	PxFW 0.6.7 : リトライのロジックを見直した。
				#	(http://www.pxt.jp/ja/diary/article/218/index.html この問題への対応)
				$tmp_start = strpos( $str_next , '<' );
				if( !is_int( $tmp_start ) || $tmp_start < 0 ){
					#	[<]記号 が見つからなかったら、
					#	本当にヒットしなかったものとみなせる。
					$str_next    = $str_nextMemo.$str_next;
					break;
				}
				$str_nextMemo .= substr( $str_next , 0 , $tmp_start );
				$str_next = substr( $str_next , $tmp_start );
				$is_hit = preg_match( $pattern_html , $str_next , $results );
				if( $is_hit ){
					#	ヒットしたらここでbreak;
					$results[1] = $str_nextMemo.$results[1];
					$str_next    = $str_nextMemo.$str_next;
					break;
				}
				//今回先頭にあるはずの[<]記号を $str_nextMemo に移してリトライ
				$str_nextMemo .= substr( $str_next , 0 , 1 );
				$str_next = substr( $str_next , 1 );
			}
			unset( $str_nextMemo );
			unset( $tmp_start );

			if( !$is_hit ){
				return $str_prev.$str_next;
			}
			if( !is_null( $results[0] ) ){
				$MEMO = array();
				$preg_number = 0;
				$preg_number ++;
				$MEMO['str_prev']			= $results[$preg_number++];
				$MEMO['start_tag']			= $results[$preg_number++];
				$MEMO['commentout']			= $results[$preg_number++];
				$MEMO['cdata']				= $results[$preg_number++];
				$MEMO['php_script']			= $results[$preg_number++];
				$MEMO['close_tag_mark']		= $results[$preg_number++];
				$MEMO['tag']				= $results[$preg_number++];
				$MEMO['tagOriginal']		= $MEMO['tag'];
				$MEMO['attribute_str']		= $results[$preg_number++];
				$MEMO['att_quot']			= $results[$preg_number++];
				$MEMO['self_closed_flg']	= $results[$preg_number++];
				$MEMO['str_next']			= $results[$preg_number++];
				unset( $preg_number );

				$MEMO['attributes'] = $this->html_attribute_parse( $MEMO['attribute_str'] );

				$str_prev .= $MEMO['str_prev'];
				$str_next = $MEMO['str_next'];
				if( strlen( $MEMO['close_tag_mark'] ) ){
					$str_prev .= '</'.$MEMO['tagOriginal'].'>';
					continue;
				}
				if( strlen( $MEMO['commentout'] ) || strlen( $MEMO['php_script'] ) ){
					$str_prev .= $MEMO['start_tag'];
					continue;
				}

				switch( strtolower($MEMO['tag']) ){
					case 'a':
					case 'area':
						$MEMO['start_tag'] = $this->att_a( $MEMO );
						break;
					case 'img':
						$MEMO['start_tag'] = $this->att_img( $MEMO );
						break;
					default:
						break;
				}
				$str_prev .= $MEMO['start_tag'];
				unset( $searched_closetag );

			}
			unset( $MEMO );
		}

		return $str_prev.$str_next;
	}//optimize_attributes();
	#	/ 属性を調整する
	#--------------------------------------

	function att_a( $dom ){
		$href = $dom['attributes']['href'];
		$parsed_baseurl = parse_url( $this->baseUrl );
		$parsed_url = parse_url( $href );

		//URL要素補完
		if( !strlen( $parsed_url['path'] ) ){
			$parsed_url['path'] = $parsed_baseurl['path'];
		}
		if( !strlen( $parsed_url['host'] ) ){
			$parsed_url['host'] = $parsed_baseurl['host'];
			$parsed_url['port'] = $parsed_baseurl['port'];
		}
		if( !strlen( $parsed_url['scheme'] ) ){
			$parsed_url['scheme'] = $parsed_baseurl['scheme'];
		}

		//再組成
		$hrefFin = $parsed_url['scheme'].'://'.$parsed_url['host'];
		if( strlen( $parsed_url['port'] ) ){
			$hrefFin .= ':'.$parsed_url['port'];
		}
		if( preg_match( '/^\//' , $parsed_url['path'] ) ){
			//絶対パス
			$hrefFin .= $parsed_url['path'];
		}else{
			//相対パス
			$hrefFin .= $this->convert2realpath( $this->baseUrl , $parsed_url['path'] );
		}
		if( strlen( $parsed_url['query'] ) ){
			$hrefFin .= '?'.$parsed_url['query'];
		}
		if( strlen( $parsed_url['fragment'] ) ){
			$hrefFin .= '#'.$parsed_url['fragment'];
		}

		$RTN = '<a href="'.( $hrefFin ).'"';
		if( $dom['self_closed_flg'] ){
			$RTN .= ' '.$dom['self_closed_flg'];
		}
		$RTN .= '>';
		return $RTN;
	}
	function att_img( $dom ){
		return '[image:'.$dom['attributes']['alt'].']';
	}
	function att_form( $dom ){
		$action = $dom['attributes']['action'];
		$parsed_baseurl = parse_url( $this->baseUrl );
		$parsed_url = parse_url( $action );

		if( !strlen( $action ) ){
			$actionFin = $this->baseUrl;
		}elseif( preg_match( '/^\/\//' , $action ) ){
			$actionFin = $parsed_baseurl['scheme'].$action;
		}elseif( preg_match( '/^\//' , $action ) ){
			$actionFin = '';
			$actionFin .= $parsed_baseurl['scheme'].'://'.$parsed_baseurl['host'];
			if( strlen( $parsed_baseurl['port'] ) ){
				$actionFin .= ':'.$parsed_baseurl['port'];
			}
			$actionFin .= $action;
		}else{
			$actionFin = $this->path_current_dir.'/'.$action;
		}
		$RTN = '<form action="'.( $actionFin ).'" method="'.( $dom['attributes']['method'] ).'"';
		if( $dom['self_closed_flg'] ){
			$RTN .= ' '.$dom['self_closed_flg'];
		}
		$RTN .= '>';
		return $RTN;
	}

	#----------------------------------------------------------------------------
	#	HTML属性の解析
	function html_attribute_parse( $strings ){
		preg_match_all( $this->get_pattern_attribute() , $strings , $results );
		for( $i = 0; !is_null($results[0][$i]); $i++ ){
			if( !strlen($results[3][$i]) ){
				$results[4][$i] = null;
			}
			if( $results[2][$i] ){
				$RTN[strtolower( $results[1][$i] )] = $results[2][$i];
			}else{
				$RTN[strtolower( $results[1][$i] )] = $results[4][$i];
			}
		}
		return	$RTN;
	}//html_attribute_parse();
	#	/ HTML属性の解析
	#----------------------------------------------------------------------------

	#--------------------------------------
	#	HTMLタグを検出するPREGパターンを生成して返す。
	#	(base_resources_htmlparser からの移植->改造)
	function get_pattern_html( $tagName = null ){
		#	タグの種類
		$tag = $this->pattern_html;
		if( strlen( $tagName ) ){
			$tag = $tagName;
		}
		$att = $this->pattern_attribute;

		$rnsp = '(?:\r\n|\r|\n| |\t)';

		#	属性のパターン
		#	属性の中にタグがあってはならない
		$atteribute = ''.$rnsp.'*(?:'.$rnsp.'*(?:'.$att.')(?:'.$rnsp.'*\='.$rnsp.'*(?:(?:[^"\' ]+)|([\'"]?).*?\9))?'.$rnsp.'*)*'.$rnsp.'*';

		#	コメントタグのパターン
		$commentout = '(?:<\!--((?:(?!-->).)*)(?:-->)?)';
		$cdata      = '(?:<\!\[CDATA\[(.*?)\]\]>)';
		$php_script = '(?:<\?(?:php)?((?:(?!\?'.'>).)*)(?:\?'.'>)?)';

		$pregstring = '/(.*?)('.$commentout.'|'.$cdata.'|'.$php_script.'|(?:<(\/?)('.$tag.')(?:'.$rnsp.'+('.$atteribute.'))?(\\/?)>))(.*)/s';

		return	$pregstring;
	}//get_pattern_html();
	#	/ HTMLタグを検出するPREGパターンを生成して返す。
	#--------------------------------------

	#--------------------------------------
	#	タグの属性情報を検出するPREGパターンを生成して返す。
	#	(base_resources_htmlparser からの移植)
	function get_pattern_attribute(){
		#	属性の種類
		$rnsp = '(?:\r\n|\r|\n| |\t)';
		$prop = $this->pattern_attribute;
		$typeA = '([\'"]?)(.*?)\3';	#	ダブルクオートあり
		$typeB = '[^"\' ]+';		#	ダブルクオートなし

		#	属性指定の式
		$prop_exists = '/'.$rnsp.'*('.$prop.')(?:\=(?:('.$typeB.')|'.$typeA.'))?'.$rnsp.'*/s';

		return	$prop_exists;
	}//get_pattern_attribute();
	#	/ タグの属性情報を検出するPREGパターンを生成して返す。
	#--------------------------------------

}

$obj = new httpaccess();
$obj->execute();
?>