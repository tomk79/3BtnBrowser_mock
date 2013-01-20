window.appealance = {
	"skinList" : {
		"default" : {
		}
	} ,
	"change_skin" : function( newSkinId ){
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
	}
};
