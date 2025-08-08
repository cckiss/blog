const pageCnbType = 2;
const pageCnbSubType = 1;
includeCSS('https://cdn.jsdelivr.net/gh/cckiss/blog/css/guide1.css');

class Guide {
	constructor(option) {
		const _ = this;
		if (!option) return;
		_.option = option;
		_.global = (_.option.global) ? _.option.global : window;
	}

	init(obj) {
		const _ = this;

		if (isDefined(_.option.wrap) && _.option.wrap.length) _.setInstance();
		return _;
	}

	setInstance() {
		const _ = this;

		let tmpl = _.option.data.map( (item, index) => {
			return `<header>` +
              			`<h2>${item.title} </h2><i class="icon-helper on"></i>` +
              			`<div class="wrap-helper"><div class="guide_content">${item.desc}</div></div>` +
			`</header>`;
		}).join('');
		_.option.wrap.empty().append(tmpl);
		_.addEvent();
	}

	addEvent() {
		$('.icon-helper').on('click', function(e){
            		if ($(this).hasClass('on')) {
                			$(this).removeClass('on');
                  			$(this).parent('header').find('.wrap-helper').fadeOut();
			} else {
                			$(this).addClass('on');
                  			$(this).parent('header').find('.wrap-helper').fadeIn();
			}
		});
	}
}


(function ($, global) {
	"use strict";
	
	let guide = null

	namespace('nc.lineage');

	nc.lineage.guide = function (guide_data) {
		if (isNotDefined(guide_data)) throw new Error('nc.lineage.guide require data object');

		const tpl = `<div class="guide_area">` +
			`<div class="guide_content">` +
				`<div class="wrap-section-beginner class-0">` +
					`<div class="wrap-section-top">` +
						`<section class="section-top">` +
							`<header>` +
								`<p class="copy__subtitle">${guide_data.server_name} 입문자를 위한 필독 지침서</p>` +
								`<span class="copy__x"></span>` +
								`<h1 class="copy__title">${guide_data.server_name} 용사 가이드</h1>` +
								`<p class="copy__menulist">화폐 ㆍ 사냥터 ㆍ 제작</p>` +
							`</header>` +
						`</section>` +
					`</div>` +
					`<div class="wrap-section-item">` +
						`<section class="section-item"></section>` +
					`</div>` + 
				`</div>` +
			`</div>` +
		`</div>`;
		$('#container .post-body.entry-content').prepend(tpl);

		guide = new Guide({
			wrap : $('.wrap-section-item .section-item'),
			data : guide_data
		}).init();
	};

	
}(jQuery, window));