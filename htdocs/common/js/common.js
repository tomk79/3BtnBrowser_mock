window.common = {
	"skinList" : {
		"default" : {
		}
	} ,
	"change_skin" : function( newSkinId ){
		$('.base_situationmenu a').removeClass('active');
		$('.base_situationmenu .base_situationmenu_'+newSkinId+' a').addClass('active');
		var elmBlind = $('.base_blind');
		elmBlind.show().animate(
			{opacity:1},
			function(){
				$('body')
					.removeClass()
					.addClass('base_skin_'+newSkinId)
				;
				elmBlind.animate(
					{opacity:0} ,
					function(){
						elmBlind.hide();
					}
				);
			}
		);
	} ,
	open_page : function(url){
		var elmBlind = $('.base_pcontent_blind');
		$.ajax({
			url : url ,
			dataType: 'xml' ,
			success : function( data ){
				elmBlind.show().animate(
					{opacity:0.9},
					function(){
						$('.base_pcontent_wrapper .base_pcontent')
							.html( $('.base_pcontent',data).html() )
						;
						$('.base_pcontent_wrapper')
							.show()
						;
					}
				);
			} ,
			error : function(){
				alert('error');
			} ,
			complete : function(){
			}
		});
	} ,
	close_page : function(){
		var elmBlind = $('.base_pcontent_blind');

		$('.base_pcontent_wrapper')
			.hide()
		;
		$('.base_pcontent_wrapper .base_pcontent')
			.html('')
		;

		elmBlind.animate(
			{opacity:0},
			function(){
				elmBlind.hide();
			}
		);
	}
};
